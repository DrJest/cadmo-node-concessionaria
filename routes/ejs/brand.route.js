import { countries } from "countries-list";
import { Router } from "express";
import { login } from "../../services/auth.service.js";
import brandService from "../../services/brand.service.js";

const checkLogin = async (req, res, next) => {
  if (req.header("authorization")) {
    res.locals.loggedIn = true;
  }
  next();
};

const requireLogin = async (req, res, next) => {
  if (!req.header("authorization")) {
    res.setHeader("WWW-authenticate", 'Basic realm="Area Riservata"');
    return res.status(401).render("forbidden");
  }

  const b64c = req.header("authorization").split(" ")[1];
  const credentials = Buffer.from(b64c, "base64").toString("utf-8");
  const [username, password] = credentials.split(":");
  try {
    await login(username, password);
    return next();
  } catch (err) {
    res.setHeader("WWW-authenticate", 'Basic realm="Area Riservata"');
    return res.status(401).render("forbidden");
  }
};

const router = Router();

router.use(checkLogin);

router.get("/new", async (req, res) => {
  res.render("new-brand", {
    countries: Object.values(countries),
  });
});
router.post("/new", requireLogin, async (req, res) => {
  const newBrand = await brandService.create({
    ...req.body,
    foundation_year: req.body.foundation_year
      ? Number(req.body.foundation_year)
      : undefined,
    luxury: req.body.luxury === "on",
  });
  res.redirect("/brands/" + newBrand.id);
});
router.get("/", async (req, res) => {
  const { page, pageSize, order, name } = req.query;
  const q = {};
  if (name) {
    q.name = name;
  }
  const data = await brandService.find(
    page,
    pageSize,
    order,
    JSON.stringify(q),
  );
  res.render("brands", data);
});
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const brand = await brandService.get(id);
  res.render("single-brand", { brand });
});
router.get("/:id/edit", requireLogin, async (req, res) => {
  const { id } = req.params;
  const brand = await brandService.get(id);
  res.render("edit-brand", { brand, countries: Object.values(countries) });
});
router.post("/:id/edit", requireLogin, async (req, res) => {
  const { id } = req.params;
  const updated = await brandService.edit(id, {
    ...req.body,
    foundation_year: req.body.foundation_year
      ? Number(req.body.foundation_year)
      : undefined,
    luxury: req.body.luxury === "on",
  });
  res.redirect("/brands/" + id);
});

export default router;
