import { config } from "dotenv";
import express from "express";
import { join } from "node:path";

import { HttpError } from "./lib/http-error.js";

import ejsBrandRoute from "./routes/ejs/brand.route.js";

import AppDataSource from "./config/typeorm.js";
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

app.use(express.static(join(__dirname, "static")));
app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.set("views", join(__dirname, "views"));
app.set("view engine", "ejs");

app.locals.name = "Global";

app.use("/brands", ejsBrandRoute);

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

try {
  await AppDataSource.initialize();
} catch (err) {
  console.error(err);
  process.exit(1);
}

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
