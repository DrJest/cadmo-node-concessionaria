import { join } from "node:path";
import fs from "node:fs/promises";
import { Brand } from "../routes/brand.route.js";

const FILE = join(import.meta.dirname, "..", "db", "brands.json");

// returns { data: Brand[], total: number, page: number, pageSize: number, totalPages: number }
export async function getAll(page, pageSize, order) {
  // tutti i brand, eventualmente paginati
  if (!page) page = 1;
  if (!pageSize) pageSize = 10;
  if (pageSize <= 0) {
    throw new Error("pageSize non può essere minore di 1");
  }

  const contentBuf = await fs.readFile(FILE);
  const content = contentBuf.toString("utf-8");
  try {
    const brands = JSON.parse(content);
    if (!Array.isArray(brands)) {
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 1,
      };
    }
    let filteredBrands = [...brands];
    if (order) {
      // i valori consentiti sono le proprietà di "Brand"
      // con un - davanti si intende in ordine inverso
      // es: "id" -> ID crescente, "-name" -> nome decrescente
      const property = order.replace(/^-/, "");
      const direction = order[0] === "-" ? -1 : 1;
      const validProperty = property in Brand.shape;
      if (!validProperty) {
        throw new Error("order deve essere una proprietà di Brand");
      }
      filteredBrands.sort((a, b) => {
        let isString = typeof a[property] === "string";
        if (isString) return a[property].localeCompare(b[property]) * direction;
        return (a[property] - b[property]) * direction;
      });
    }

    if (pageSize === -1) {
      return {
        data: filteredBrands,
        total: filteredBrands.length,
        page: 1,
        pageSize: filteredBrands.length,
        totalPages: 1,
      }; // può essere pericoloso se il DB è grande
    }
    return {
      data: filteredBrands.slice((page - 1) * pageSize, page * pageSize),
      total: filteredBrands.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredBrands.length / pageSize),
    };
  } catch (e) {
    console.error(e);
    return {
      data: [],
      page,
      pageSize,
      total: 0,
      totalPages: 1,
    };
  }
}

export default {
  getAll,
};
