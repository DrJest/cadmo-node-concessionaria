import { join } from "node:path";
import { z } from "zod";
import { openDb, saveDb } from "../lib/db.js";
import { HttpError } from "../lib/http-error.js";
import { Brand } from "../routes/brand.route.js";

const FILE = join(import.meta.dirname, "..", "db", "brands.json");

// returns { data: Brand[], total: number, page: number, pageSize: number, totalPages: number }
export async function getAll(page, pageSize, order) {
  page = Number(page);
  pageSize = Number(pageSize);
  if (!page || Number.isNaN(page)) page = 1;
  if (!pageSize || Number.isNaN(pageSize)) pageSize = 10;
  if (pageSize <= 0) {
    throw new HttpError(400, "pageSize non può essere minore di 1");
  }

  const brands = await openDb(FILE);

  let filteredBrands = [...brands];
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
  const brands = await openDb(FILE);
  const brand = brands.find((el) => el.id === id);
  return brand ?? null;
}

// body: Partial<Brand>
// return Brand | throws HttpError
export async function create(body) {
  const brands = await openDb(FILE);
  const maxId = brands.map((el) => el.id).toSorted((a, b) => b - a)[0];
  const nextId = maxId + 1;
  const payload = {
    ...body,
    id: nextId,
  };
  const validation = await z.validateAsync(Brand, payload);

  if (!validation) {
    throw new HttpError(400, "body non valido");
  }

  brands.push(payload);

  await saveDb(FILE, brands);

  return payload;
}

export default {
  version: "v1",
  get,
  getAll,
};
