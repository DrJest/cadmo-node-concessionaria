import jsonwebtoken from "jsonwebtoken";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { JsonDbService } from "../lib/json-db.js";

const FILE = join(import.meta.dirname, "..", "db", "users.json");
const dbService = new JsonDbService(FILE);

const NameSchema = z.string().nonempty();
const UsernameSchema = z.string().min(3).max(10);
const PasswordSchema = z.string().min(8);

const UserSchema = z.object({
  name: NameSchema,
  username: UsernameSchema,
  password: PasswordSchema,
  registrationDate: z.date().default(new Date()),
});

export const login = async (username, password) => {
  const validateUsername = z.validate(UsernameSchema, username);
  if (!validateUsername) throw new HttpError(401, "Username not valid");
  const users = await dbService.find();
  let user = users.find((u) => u.username === username);
  if (!user) throw new HttpError(401, "user not found");
  const p = createHash("sha256").update(password).digest("base64");
  if (user.password !== p) throw new HttpError(401, "password wrong");
  const token = jsonwebtoken.sign(
    {
      id: user.id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: 3600,
    },
  );
  return token;
};

export const register = async (username, password, name) => {
  const user = {
    name,
    username,
    password,
    registrationDate: new Date(),
  };
  const validateUser = z.validate(UserSchema, user);
  if (!validateUser) {
    throw new HttpError(400, "body non valido");
  }
  const users = await dbService.find();
  let exists = users.find((u) => u.username === username);
  if (exists) {
    throw new HttpError(409, "nome utente già in uso");
  }
  if (
    !/[A-Z]/.test(user.password) ||
    !/[a-z]/.test(user.password) ||
    !/[0-9]/.test(user.password) ||
    !/[!?=@]/.test(user.password)
  )
    throw new HttpError(
      400,
      "la password deve contenere almeno una maiuscola, una minuscola, un numero e un carattere speciale",
    );
  user.password = createHash("sha256").update(user.password).digest("base64");
  await dbService.create(user);
};

export const checkToken = async (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) throw new HttpError(401, "token not found");
  let payload;
  try {
    payload = jsonwebtoken.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new HttpError(401, "token non valido");
  }
  console.log(payload);
  const user = await dbService.findOne(payload.id);
  req.user = user;
  delete req.user.password;
  next();
};
