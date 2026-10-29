import { countries } from "countries-list";
import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { create, get, getAll } from "../services/brand.service.js";

export const Brand = z.object({
  id: z.int().gt(0),
  name: z.string().min(1).max(20),
  logo: z.url(),
  country: z.enum(Object.values(countries).map((m) => m.name)),
  foundation_year: z.int().gt(1800).lte(new Date().getFullYear()),
  luxury: z.boolean().optional(),
});

export const router = Router();

router.get("/", async (req, res) => {
  const { page, pageSize, order } = req.query;
  const data = await getAll(page, pageSize, order);
  res.json(data);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const brand = await get(id);
  if (!brand) {
    throw new HttpError(404, "not found");
  }
  res.json(brand);
});

router.post("/", async (req, res) => {
  const body = req.body;
  const newBrand = await create(body);
  res.setHeader("Location", req.originalUrl + newBrand.id);
  res.status(201).json(newBrand);
});

router.use((err, req, res, next) => {
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

export default router;
