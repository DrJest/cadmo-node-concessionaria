import { join } from "node:path";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { JsonDbService } from "../lib/json-db.js";
import modelService, { Model } from "./model.service.js";

export const Sale = z.object({
  id: z.int().gt(0),
  customer: z.string().min(1),
  model: Model,
  date: z.date().default(new Date()),
  price: z.number(),
});

export const CreateSaleSchema = Sale.omit({ id: true })
  .extend({
    model: Model.pick({ id: true }),
  })
  .strict();

export const UpdateSaleSchema = Sale.omit({ id: true })
  .extend({
    model: Model.pick({ id: true }),
  })
  .partial()
  .strict();

const FILE = join(import.meta.dirname, "..", "db", "sales.json");
const dbService = new JsonDbService(FILE);

// returns { data: Sale[], total: number, page: number, pageSize: number, totalPages: number }
export async function find(page, pageSize, order, q) {
  page = Number(page);
  pageSize = Number(pageSize);
  if (!page || Number.isNaN(page)) page = 1;
  if (!pageSize || Number.isNaN(pageSize)) pageSize = 10;
  if (pageSize <= 0) {
    throw new HttpError(400, "pageSize non può essere minore di 1");
  }

  const sales = await dbService.find();
  let filteredSales = [...sales];
  try {
    q = JSON.parse(q);
  } catch (e) {
    q = null;
  }
  if (q && q.customer) {
    filteredSales = filteredSales.filter((el) =>
      el.customer.toLowerCase().includes(q.customer.toLowerCase()),
    );
  }
  if (q && q.date) {
    filteredSales = filteredSales.filter((el) => el.date === q.date);
  }
  if (q && q.model && q.model.id) {
    filteredSales = filteredSales.filter((el) => el.model.id === q.model.id);
  }
  if (order) {
    // i valori consentiti sono le proprietà di "Sale"
    // con un - davanti si intende in ordine inverso
    // es: "id" -> ID crescente, "-name" -> nome decrescente
    const property = order.replace(/^-/, "");
    const direction = order[0] === "-" ? -1 : 1;
    const validProperty = property in Sale.shape;
    if (!validProperty) {
      throw new HttpError(400, "order deve essere una proprietà di Sale");
    }
    filteredSales.sort((a, b) => {
      let isString = typeof a[property] === "string";
      if (isString) return a[property].localeCompare(b[property]) * direction;
      return ((a[property] || 0) - (b[property] || 0)) * direction;
    });
  }

  for (let sale of filteredSales) {
    if (sale.model && sale.model.id) {
      let b = await modelService.get(sale.model.id);
      sale.model = b;
    }
  }

  return {
    data: filteredSales.slice((page - 1) * pageSize, page * pageSize),
    total: filteredSales.length,
    page,
    pageSize,
    totalPages: Math.ceil(filteredSales.length / pageSize),
  };
}

// returns Sale | null
export async function get(id) {
  id = Number(id);
  if (Number.isNaN(id)) throw new HttpError(400, "id deve essere un numero");
  const el = await dbService.findOne(id);
  return el;
}

// body: Partial<Sale>
// return Sale | throws HttpError
export async function create(body) {
  if (body.date && typeof body.date === "string") {
    body.date = new Date(body.date);
  }
  const validation = await z.validateAsync(CreateSaleSchema, body);
  if (!validation) {
    throw new HttpError(400, "body non valido");
  }
  const payload = await dbService.create(body);
  return payload;
}

// id: number, body: Partial<Sale>
// return Sale | throws HttpError
export async function edit(id, body) {
  id = Number(id);
  if (Number.isNaN(id) || id < 0) {
    throw new HttpError(400, "ID non valido");
  }
  const el = await dbService.findOne(id);
  if (!el) {
    throw new HttpError(404, "Sale non trovato");
  }
  if (body.date && typeof body.date === "string") {
    body.date = new Date(body.date);
  }
  const validation = await z.validateAsync(UpdateSaleSchema, body);
  if (!validation) {
    throw new HttpError(400, "body non valido");
  }
  if (body.id) delete body.id;
  const updated = await dbService.update(id, body);
  return updated;
}

export async function del(id) {
  id = Number(id);
  if (Number.isNaN(id) || id < 0) {
    throw new HttpError(400, "ID non valido");
  }
  const el = await dbService.findOne(id);
  if (!el) {
    throw new HttpError(404, "Sale non trovato");
  }
  await dbService.delete(id);
}

export default {
  version: "v1",
  get,
  create,
  find,
  edit,
  delete: del,
};
