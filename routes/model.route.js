import { Router } from "express";
import { HttpError } from "../lib/http-error.js";
import { create, del, edit, find, get } from "../services/model.service.js";

export const router = Router();

router.get("/", async (req, res) => {
  const { page, pageSize, order, q } = req.query;
  const data = await find(page, pageSize, order, q);
  res.json(data);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const element = await get(id);
  if (!element) {
    throw new HttpError(404, "not found");
  }
  res.json(element);
});

router.post("/", async (req, res) => {
  const body = req.body;
  const newelement = await create(body);
  res.setHeader("Location", req.originalUrl + newelement.id);
  res.status(201).json(newelement);
});

router.patch("/:id", async (req, res) => {
  const body = req.body;
  const { id } = req.params;
  const editedelement = await edit(id, body);
  res.status(200).json(editedelement);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await del(id);
  res.status(204).send();
});

export default router;
