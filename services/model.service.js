import { join } from "node:path";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { JsonDbService } from "../lib/json-db.js";
import { Brand } from "./brand.service.js";

export const Model = z.object({
  id: z.int().gt(0),
  name: z.string().min(1),
  available_colors: z.array(
    z.enum(["white", "black", "red", "green", "blue", "militare"]),
  ),
  year: z.int().gt(1800).lte(new Date().getFullYear()),
  price: z.number(),
  brand: Brand,
});

export const CreateModelSchema = Model.omit({ id: true })
  .extend({
    brand: Brand.pick({ id: true }),
  })
  .strict();

export const UpdateModelSchema = Model.omit({ id: true })
  .extend({
    brand: Brand.pick({ id: true }),
  })
  .partial()
  .strict();

const FILE = join(import.meta.dirname, "..", "db", "models.json");
const dbService = new JsonDbService(FILE);

// returns { data: Model[], total: number, page: number, pageSize: number, totalPages: number }
export async function find(page, pageSize, order, q) {
  page = Number(page);
  pageSize = Number(pageSize);
  if (!page || Number.isNaN(page)) page = 1;
  if (!pageSize || Number.isNaN(pageSize)) pageSize = 10;
  if (pageSize <= 0) {
    throw new HttpError(400, "pageSize non può essere minore di 1");
  }

  const models = await dbService.find();
  let filteredModels = [...models];
  try {
    q = JSON.parse(q);
  } catch (e) {
    q = null;
  }
  if (q && q.name) {
    filteredModels = filteredModels.filter((el) =>
      el.name.toLowerCase().includes(q.name.toLowerCase()),
    );
  }
  if (q && q.year) {
    filteredModels = filteredModels.filter((el) => el.year === Number(q.year));
  }
  if (q && q.brand) {
    filteredModels = filteredModels.filter(
      (el) => el.brand?.id === Number(q.brand),
    );
  }
  if (order) {
    // i valori consentiti sono le proprietà di "Model"
    // con un - davanti si intende in ordine inverso
    // es: "id" -> ID crescente, "-name" -> nome decrescente
    const property = order.replace(/^-/, "");
    const direction = order[0] === "-" ? -1 : 1;
    const validProperty = property in Model.shape;
    if (!validProperty) {
      throw new HttpError(400, "order deve essere una proprietà di Model");
    }
    filteredModels.sort((a, b) => {
      let isString = typeof a[property] === "string";
      if (isString) return a[property].localeCompare(b[property]) * direction;
      return ((a[property] || 0) - (b[property] || 0)) * direction;
    });
  }

  return {
    data: filteredModels.slice((page - 1) * pageSize, page * pageSize),
    total: filteredModels.length,
    page,
    pageSize,
    totalPages: Math.ceil(filteredModels.length / pageSize),
  };
}

// returns Model | null
export async function get(id) {
  id = Number(id);
  if (Number.isNaN(id)) throw new HttpError(400, "id deve essere un numero");
  const el = await dbService.findOne(id);
  return el;
}

// body: Partial<Model>
// return Model | throws HttpError
export async function create(body) {
  const validation = await z.validateAsync(CreateModelSchema, body);
  if (!validation) {
    throw new HttpError(400, "body non valido");
  }
  const payload = await dbService.create(body);
  return payload;
}

// id: number, body: Partial<Model>
// return Model | throws HttpError
export async function edit(id, body) {
  id = Number(id);
  if (Number.isNaN(id) || id < 0) {
    throw new HttpError(400, "ID non valido");
  }
  const el = await dbService.findOne(id);
  if (!el) {
    throw new HttpError(404, "Model non trovato");
  }
  const validation = await z.validateAsync(UpdateModelSchema, body);
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
    throw new HttpError(404, "Model non trovato");
  }
  await dbService.delete(id);
}

export async function getWithSales(id, page, pageSize, order) {
  id = Number(id);
  if (Number.isNaN(id) || id < 0) {
    throw new HttpError(400, "ID non valido");
  }
  const el = await dbService.findOne(id);
  if (!el) {
    throw new HttpError(404, "Model not found");
  }
  const saleService = await import("./sale.service.js");
  const sales = await saleService.find(page, pageSize, order, {
    model: { id },
  });
  return {
    ...el,
    sales,
  };
}

export default {
  version: "v1",
  get,
  create,
  find,
  edit,
  delete: del,
  getWithSales,
};
