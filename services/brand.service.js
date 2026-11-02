import { countries } from "countries-list";
import { join } from "node:path";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { JsonDbService } from "../lib/json-db.js";

export const Brand = z.object({
  id: z.int().gt(0),
  name: z.string().min(1).max(20),
  logo: z.url(),
  country: z.enum(Object.values(countries).map((m) => m.name)),
  foundation_year: z.int().gt(1800).lte(new Date().getFullYear()),
  luxury: z.boolean().optional(),
});

export const CreateBrandSchema = Brand.omit({ id: true }).strict();

export const UpdateBrandSchema = Brand.omit({ id: true }).partial().strict();

const FILE = join(import.meta.dirname, "..", "db", "brands.json");
const dbService = new JsonDbService(FILE);
//const FILE = join(import.meta.dirname, "..", "db", "brands.csv");
//const dbService = new CsvDbService(FILE);

// returns { data: Brand[], total: number, page: number, pageSize: number, totalPages: number }
export async function find(page, pageSize, order, q) {
  page = Number(page);
  pageSize = Number(pageSize);
  if (!page || Number.isNaN(page)) page = 1;
  if (!pageSize || Number.isNaN(pageSize)) pageSize = 10;
  if (pageSize <= 0) {
    throw new HttpError(400, "pageSize non può essere minore di 1");
  }

  const brands = await dbService.find();
  let filteredBrands = [...brands];
  try {
    q = JSON.parse(q);
  } catch (e) {
    q = null;
  }
  if (q && q.name) {
    filteredBrands = filteredBrands.filter((el) =>
      el.name.toLowerCase().includes(q.name.toLowerCase()),
    );
  }
  if (q && q.year) {
    filteredBrands = filteredBrands.filter(
      (el) => el.foundation_year === Number(q.year),
    );
  }
  if (order) {
    // i valori consentiti sono le proprietà di "Brand"
    // con un - davanti si intende in ordine inverso
    // es: "id" -> ID crescente, "-name" -> nome decrescente
    const property = order.replace(/^-/, "");
    const direction = order[0] === "-" ? -1 : 1;
    const validProperty = property in Brand.shape;
    if (!validProperty) {
      throw new HttpError(400, "order deve essere una proprietà di Brand");
    }
    filteredBrands.sort((a, b) => {
      let isString = typeof a[property] === "string";
      if (isString) return a[property].localeCompare(b[property]) * direction;
      return ((a[property] || 0) - (b[property] || 0)) * direction;
    });
  }

  return {
    data: filteredBrands.slice((page - 1) * pageSize, page * pageSize),
    total: filteredBrands.length,
    page,
    pageSize,
    totalPages: Math.ceil(filteredBrands.length / pageSize),
  };
}

// returns Brand | null
export async function get(id) {
  id = Number(id);
  if (Number.isNaN(id)) throw new HttpError(400, "id deve essere un numero");
  const brand = await dbService.findOne(id);
  return brand;
}

// body: Partial<Brand>
// return Brand | throws HttpError
export async function create(body) {
  const validation = await z.validateAsync(CreateBrandSchema, body);
  if (!validation) {
    throw new HttpError(400, "body non valido");
  }
  const payload = await dbService.create(body);
  return payload;
}

// id: number, body: Partial<Brand>
// return Brand | throws HttpError
export async function edit(id, body) {
  id = Number(id);
  if (Number.isNaN(id) || id < 0) {
    throw new HttpError(400, "ID non valido");
  }
  const brand = await dbService.findOne(id);
  if (!brand) {
    throw new HttpError(404, "Brand non trovato");
  }
  const validation = await z.validateAsync(UpdateBrandSchema, body);
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
  const brand = await dbService.findOne(id);
  if (!brand) {
    throw new HttpError(404, "Brand non trovato");
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
