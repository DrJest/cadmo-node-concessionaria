import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
//import { JsonDbService } from "../lib/json-db.js";
import { TypeOrmDbService } from "../lib/typeorm-db.js";
import brandService, { BrandSchema } from "./brand.service.js";

export const ModelSchema = z.object({
  id: z.int().gt(0),
  name: z.string().min(1),
  available_colors: z.array(
    z.enum(["white", "black", "red", "green", "blue", "militare"]),
  ),
  year: z.int().gt(1800).lte(new Date().getFullYear()),
  price: z.number(),
  brand: BrandSchema,
});

export const CreateModelSchema = ModelSchema.omit({ id: true })
  .extend({
    brand: BrandSchema.pick({ id: true }),
  })
  .strict();

export const UpdateModelSchema = ModelSchema.omit({ id: true })
  .extend({
    brand: BrandSchema.pick({ id: true }),
  })
  .partial()
  .strict();

//const FILE = join(import.meta.dirname, "..", "db", "models.json");
//const dbService = new JsonDbService(FILE);
const dbService = new TypeOrmDbService("Model");

// returns { data: Model[], total: number, page: number, pageSize: number, totalPages: number }
export async function find(page, pageSize, order, q) {
  page = Number(page);
  pageSize = Number(pageSize);
  if (!page || Number.isNaN(page)) page = 1;
  if (!pageSize || Number.isNaN(pageSize)) pageSize = 10;
  if (pageSize <= 0) {
    throw new HttpError(400, "pageSize non può essere minore di 1");
  }

  if (order) {
    // i valori consentiti sono le proprietà di "Model"
    // con un - davanti si intende in ordine inverso
    // es: "id" -> ID crescente, "-name" -> nome decrescente
    const property = order.replace(/^-/, "");
    const direction = order[0] === "-" ? -1 : 1;
    const validProperty = property in ModelSchema.shape;
    if (!validProperty) {
      throw new HttpError(400, "order deve essere una proprietà di Model");
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
    if (!(prop in BrandSchema.shape)) {
      throw new HttpError(
        400,
        "i parametri di ricerca devono essere proprietà di Brand",
      );
    }
  }

  const models = await dbService.find(page, pageSize, order, q);

  /*
  for (let model of models.data) {
    if (model.brand && model.brand.id) {
      let b = await brandService.get(model.brand.id);
      model.brand = b;
    }
  }
    */

  return models;
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
