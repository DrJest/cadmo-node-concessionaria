import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const __dirname = import.meta.dirname;

const FILE = join(__dirname, "..", "db", "db.sqlite");
const SEED = join(__dirname, "..", "seeds", "sqlite.sql");

const db = new DatabaseSync(FILE);

export const SqliteDbService = function (table) {
  this.seed = async function () {
    db.exec(readFileSync(SEED, "utf8"));
    const brands = JSON.parse(
      readFileSync(join(__dirname, "..", "seeds", "json", "brands.json")),
    );
    const stmt = db.prepare("SELECT count(*) as cnt FROM brands");
    const data = stmt.get();
    if (data.cnt === 0) {
      for (let b of brands) {
        b.country = b.country ?? "";
        b.foundation_year = b.foundation_year ?? 0;
        await this.create(b);
      }
    }
  };

  this.find = async (page = 1, pageSize = -1, order = null, q = null) => {
    await this.seed();
    const limit = pageSize;
    const offset = (page - 1) * pageSize;

    let query = `SELECT * FROM ${table}`;
    let countQuery = `SELECT COUNT(*) as cnt FROM ${table}`;
    if (q) {
      query += " WHERE 1 = 1";
      countQuery += " WHERE 1 = 1";
      for (let prop in q) {
        query += ` AND ${prop} = :${prop}`;
        countQuery += ` AND ${prop} = :${prop}`;
      }
    }

    if (order) {
      query += ` ORDER BY ${order.property} ${order.direction > 0 ? "ASC" : "DESC"}`;
    }

    if (pageSize > 0) {
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const stmt = db.prepare(query);
    const data = stmt.all(q);

    const countStmt = db.prepare(countQuery);
    const countData = countStmt.get(q);

    return {
      data,
      total: countData.cnt,
      page,
      pageSize,
      totalPages: Math.ceil(countData.cnt / pageSize),
    };
  };

  this.findOne = async (id) => {
    const q = `SELECT * FROM ${table} WHERE id = :id`;
    const stmt = db.prepare(q);
    const el = stmt.get({ id });
    return el;
  };

  this.create = async (body) => {
    const props = [];
    const values = [];
    for (let prop in body) {
      props.push(prop);
      values.push(body[prop]);
    }
    let query = `INSERT INTO ${table} (${props.join(",")}) VALUES (${props.map((e) => ":" + e).join(",")})`;
    const stmt = db.prepare(query);
    const data = stmt.run(body);
    const el = await this.findOne(data.lastInsertRowid);
    return el;
  };

  this.update = async (id, body) => {
    let query = `UPDATE ${table} SET `;

    if (body.id) delete body.id;

    const updates = [];
    for (let prop in body) {
      updates.push(`${prop} = :${prop}`);
    }

    query += updates.join(",");

    query += ` WHERE id = :id`;

    const stmt = db.prepare(query);
    const data = stmt.run({
      ...body,
      id,
    });
    const el = await this.findOne(id);
    return el;
  };

  this.delete = async (id) => {
    const q = `DELETE FROM ${table} WHERE id = :id`;
    const stmt = db.prepare(q);
    const data = stmt.run({ id });
  };
};
