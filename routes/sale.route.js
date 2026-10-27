import { z } from "zod";
import { Router } from "express";
import { Model } from "./model.route.js";

export const Sale = z.object({
  id: z.int().gt(0),
  customer: z.string().min(1),
  model: Model,
  date: z.date(),
  price: z.number()
});

export const router = Router();

router.get("/", (req, res) => {
  res.send([]);
});

export default router;
