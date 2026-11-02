import { Router } from "express";
import { HttpError } from "../lib/http-error.js";
import { create, del, edit, find, get } from "../services/brand.service.js";

import modelService from "../services/model.service.js";

export const router = Router();

router.get("/", async (req, res) => {
  const { page, pageSize, order, q } = req.query;
  const data = await find(page, pageSize, order, q);
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

router.get("/:id/models", async (req, res) => {
  const { id } = req.params;
  const brand = await get(id);
  if (!brand) {
    throw new HttpError(404, "not found");
  }
  const models = await modelService.find(1, 1000, "id", { brand: id });
  res.status(200).json({
    ...brand,
    models: models.data,
  });
});

router.post("/", async (req, res) => {
  const body = req.body;
  const newBrand = await create(body);
  res.setHeader("Location", req.originalUrl + newBrand.id);
  res.status(201).json(newBrand);
});

router.patch("/:id", async (req, res) => {
  const body = req.body;
  const { id } = req.params;
  const editedBrand = await edit(id, body);
  res.status(200).json(editedBrand);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await del(id);
  res.status(204).send();
});

export default router;
