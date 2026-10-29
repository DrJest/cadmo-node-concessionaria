import express from "express";
import { config } from "dotenv";
import { join } from "node:path";

import brandRoute from "./routes/brand.route.js";
import { router as modelRoute } from "./routes/model.route.js";

const __dirname = import.meta.dirname;

config({
  path: join(__dirname, ".env"),
  quiet: true,
});
const app = express();

app.get("/status", (_req, res) => {
  res.json({ status: "API is running" });
});

app.use("/api/v1/brands", brandRoute);
app.use("/api/v1/models", modelRoute);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
