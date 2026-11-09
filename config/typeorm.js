import { DataSource } from "typeorm";
import { Brand } from "../models/brand.model.js";
import { Model } from "../models/model.model.js";
import { Sale } from "../models/sale.model.js";
import { User } from "../models/user.model.js";

const AppDataSource = new DataSource({
  type: "better-sqlite3", // TypeORM 1.x: SQLite si usa così
  database: "db/typeorm.sqlite",
  entities: [Brand, Model, Sale, User], // le entità (prossima slide)
  synchronize: false, // crea le tabelle all'avvio (solo in sviluppo!)
  logging: ["query", "error"], // stampa l'SQL che TypeORM esegue
});

export default AppDataSource;
