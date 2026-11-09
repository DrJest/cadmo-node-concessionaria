import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ILike } from "typeorm";
import AppDataSource from "../config/typeorm.js";

const __dirname = import.meta.dirname;

export const TypeOrmDbService = function (table) {
  this._repository = AppDataSource.getRepository(table);

  this.seed = async () => {
    if (this.table !== "Brand") return;
    const brands = JSON.parse(
      readFileSync(join(__dirname, "..", "seeds", "json", "brands.json")),
    );

    const cnt = await this._repository.count();
    if (cnt !== 0) return;
    for (const b of brands) {
      b.country = b.country ?? "";
      b.foundation_year = b.foundation_year ?? 0;
      let el = this._repository.create(b);
      await this._repository.save(el);
    }
  };

  this.find = async (page = 1, pageSize = -1, order = null, q = null) => {
    await this.seed();

    if (q && q.name) {
      q.name = ILike("%" + q.name + "%");
    }

    const [data, total] = await this._repository.findAndCount({
      order: order
        ? {
            [order.property]: order.direction,
          }
        : undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: q,
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPage: Math.ceil(total / pageSize),
    };
  };

  this.findOne = async (id) => {
    return this._repository.findOne({ where: { id } });
  };

  this.create = async (body) => {
    const el = this._repository.create(body);
    const created = await this._repository.save(el);
    return created;
  };

  this.update = async (id, body) => {
    const el = await this._repository.findOne({ where: { id } });
    for (let prop in body) {
      el[prop] = body[prop];
    }
    const updated = await this._repository.save(el);
    return updated;
  };

  this.delete = async (id) => {
    await this._repository.delete({ id });
  };
};
