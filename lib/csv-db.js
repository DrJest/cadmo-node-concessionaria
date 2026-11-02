import fs from "node:fs/promises";
import { HttpError } from "./http-error.js";

export const CsvDbService = function (file) {
  this.find = async () => {
    try {
      const contentBuf = await fs.readFile(file);
      const content = contentBuf.toString("utf-8");
      const lines = content.split(/\r?\n/);
      const intestazione = lines.shift().split(",");
      const elements = [];
      for (let line of lines) {
        line = line.split(",");
        let el = {};
        for (let i = 0; i < intestazione.length; i++) {
          el[intestazione[i]] = line[i];
        }
        elements.push(el);
      }
      return elements;
    } catch (err) {
      console.error(err);
      throw new HttpError(500, "impossibile leggere il CSV");
    }
  };
  this.findOne = async (id) => {};
  this.create = async (body) => {
    const elements = await this.find();
    const maxId = elements.map((el) => el.id).toSorted((a, b) => b - a)[0];
    const nextId = Number(maxId) + 1;

    const values = Object.values(body);
    const line = nextId + "," + values.join(",") + "\n";
    await fs.appendFile(file, line);
    return {
      ...body,
      id: nextId,
    };
  };
  this.update = async (id, body) => {};
  this.delete = async (id) => {};
  const _save = async (data) => {};
};
