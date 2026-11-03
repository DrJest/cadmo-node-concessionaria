import { config } from "dotenv";
import express from "express";
import path, { join } from "node:path";

import { HttpError } from "./lib/http-error.js";
import authRoute from "./routes/auth.route.js";
import brandRoute from "./routes/brand.route.js";
import { router as modelRoute } from "./routes/model.route.js";
import saleRoute from "./routes/sale.route.js";

const __dirname = import.meta.dirname;

config({
  path: join(__dirname, ".env"),
  quiet: true,
});
const app = express();

app.use(express.static(path.join(__dirname, "static")));

app.use("/api/", express.json());

app.get("/api/v1/status", (_req, res) => {
  res.json({ status: "API is running" });
});
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/brands", brandRoute);
app.use("/api/v1/models", modelRoute);
app.use("/api/v1/sales", saleRoute);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }
  res.status(500).json({
    error: err.message,
  });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
