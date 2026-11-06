import { copyFileSync, existsSync } from "node:fs";
import fs from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { HttpError } from "./http-error.js";

const __dirname = import.meta.dirname;

const SEED_DIR = join(__dirname, "..", "seeds", "json");

export const JsonDbService = function (file) {
  this.seed = async () => {
    if (!existsSync(file)) {
      const dest = dirname(file);
      const fileName = basename(file);
      copyFileSync(join(SEED_DIR, fileName), join(dest, fileName));
    }
  };

  // page: number, pageSize: number,
  // order: { property: string, direction: 1 | -1 }
  // q: { [string]: string | number }
  // returns
  // { data: [], total: number, page: number, pageSize: number, totalPages: number }
  this.find = async (page = 1, pageSize = Infinity, order = {}, q = {}) => {
    await this.seed();
    try {
      const contentBuf = await fs.readFile(file);
      const content = contentBuf.toString("utf-8");
      const data = JSON.parse(content);
      if (!Array.isArray(data)) {
        return [];
      }
      let filtered = [...data];
      for (let prop in q) {
        filtered = filtered.filter((el) => {
          const val = q[prop];
          if (typeof val === "string") {
            return (el[prop] || "")
              .toLowerCase()
              .includes((val || "").toLowerCase());
          }
          return el[prop] === val;
        });
      }

      const total = filtered.length;

      const { property, direction } = order;
      filtered.sort((a, b) => {
        let isString = typeof a[property] === "string";
        if (isString) return a[property].localeCompare(b[property]) * direction;
        return ((a[property] || 0) - (b[property] || 0)) * direction;
      });

      return {
        data: filtered.slice((page - 1) * pageSize, page * pageSize),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (err) {
      console.error(err);
      throw new HttpError(500, "impossibile leggere il db");
    }
  };

  this.findOne = async (id) => {
    const elements = await this.find();
    const element = elements.data.find((el) => el.id === id);
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
