import { countries } from "countries-list";
import { join } from "node:path";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { JsonDbService } from "../lib/json-db.js";
import { SqliteDbService } from "../lib/sqlite-db.js";

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

const dbService = new SqliteDbService("brands");
//const FILE = join(import.meta.dirname, "..", "db", "brands.json");
//const dbService = new JsonDbService(FILE);

// returns { data: Brand[], total: number, page: number, pageSize: number, totalPages: number }
export async function find(page, pageSize, order, q) {
  page = Number(page);
  pageSize = Number(pageSize);
  if (!page || Number.isNaN(page)) page = 1;
  if (!pageSize || Number.isNaN(pageSize)) pageSize = 10;
  if (pageSize <= 0) {
    throw new HttpError(400, "pageSize non può essere minore di 1");
  }

  if (order) {
    const property = order.replace(/^-/, "");
    const direction = order[0] === "-" ? -1 : 1;
    const validProperty = property in Brand.shape;
    if (!validProperty) {
      throw new HttpError(400, "order deve essere una proprietà di Brand");
    }
    order = { property, direction };
  } else {
    order = { property: "id", direction: 1 };
  }

  try {
    q = JSON.parse(q);
  } catch (e) {
    q = {};
  }

  for (let prop in q) {
    if (!(prop in Brand.shape)) {
      throw new HttpError(
        400,
        "i parametri di ricerca devono essere proprietà di Brand",
      );
    }
  }

  const brands = await dbService.find(page, pageSize, order, q);

  return brands;
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
  const modelService = await import("./model.service.js");

  const models = await modelService.find(1, 1, "id", { brand: id });
  if (models.length) {
    throw new HttpError(
      409,
      "Non è possibile eliminare un Brand con modelli esistenti",
    );
  }
  await dbService.delete(id);
}

export async function getWithModels(id) {
  id = Number(id);
  if (Number.isNaN(id) || id < 0) {
    throw new HttpError(400, "ID non valido");
  }
  const brand = await dbService.findOne(id);
  if (!brand) {
    throw new HttpError(404, "Brand not found");
  }
  const modelService = await import("./model.service.js");
  const models = await modelService.find(1, 1000, "id", { brand: id });
  return {
    ...brand,
    models,
  };
}

export default {
  version: "v1",
  get,
  create,
  find,
  edit,
  delete: del,
  getWithModels,
};
