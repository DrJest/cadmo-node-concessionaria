import { z } from "zod";
import { countries } from "countries-list";
import { Router } from "express";
import { getAll } from "../services/brand.service.js";

export const Brand = z.object({
  id: z.int().gt(0),
  name: z.string().min(1).max(20),
  logo: z.url(),
  country: z.enum(countries),
  foundation_year: z.int().gt(1800).lte(new Date().getFullYear()),
  luxury: z.boolean(),
});

export const router = Router();

router.get("/", async (req, res) => {
  const { page, pageSize, order } = req.query;
  try {
    const data = await getAll(page, pageSize, order);
    res.json(data);
  }
  catch(e) {
    res.status(400).json({
      error: e.getMessage()
    })
  }
});

export default router;
