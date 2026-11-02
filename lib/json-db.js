import fs from "node:fs/promises";
import { HttpError } from "./http-error.js";

export const JsonDbService = function (file) {
  this.find = async () => {
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

  this.findOne = async (id) => {
    const elements = await this.find();
    const element = elements.find((el) => el.id === id);
    return element ?? null;
  };

  this.create = async (body) => {
    const elements = await this.find();
    const maxId = elements.map((el) => el.id).toSorted((a, b) => b - a)[0] ?? 0;
    const nextId = maxId + 1;
    const payload = {
      ...body,
      id: nextId,
    };
    elements.push(payload);
    await _save(elements);
    return payload;
  };

  this.update = async (id, body) => {
    const elements = await this.find();
    const index = elements.findIndex((el) => el.id === id);
    elements[index] = {
      ...elements[index],
      ...body,
    };
    await _save(elements);
    return elements[index];
  };

  this.delete = async (id) => {
    const elements = await this.find();
    const index = elements.findIndex((el) => el.id === id);
    elements.splice(index, 1);
    await _save(elements);
  };

  const _save = async (value) => {
    try {
      await fs.writeFile(file, JSON.stringify(value, null, 2), {
        encoding: "utf-8",
      });
    } catch (err) {
      console.error(err);
      throw new HttpError(500, "impossibile scrivere sul db");
    }
  };
};
