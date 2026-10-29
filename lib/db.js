import fs from "node:fs/promises";
import { HttpError } from "./http-error.js";

export const openDb = async (file) => {
  try {
    const contentBuf = await fs.readFile(file);
    const content = contentBuf.toString("utf-8");
    const data = JSON.parse(content);
    if (!Array.isArray(data)) {
      return [];
    }
    return data;
  } catch (err) {
    console.error(err);
    throw new HttpError(500, "impossibile leggere il db");
  }
};

export const saveDb = async (file, value) => {
  try {
    await fs.writeFile(file, JSON.stringify(value, null, 2), {
      encoding: "utf-8",
    });
  } catch (err) {
    console.error(err);
    throw new HttpError(500, "impossibile scrivere sul db");
  }
};
