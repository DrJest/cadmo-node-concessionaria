import { Router } from "express";
import { checkToken, login, register } from "../services/auth.service.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const token = await login(username, password);
  res.json({ token });
});

router.post("/register", async (req, res) => {
  await register(req.body.username, req.body.password, req.body.name);
  res.sendStatus(201);
});

router.get("/me", checkToken, async (req, res) => {
  res.json(req.user);
});

export default router;
