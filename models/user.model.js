import { EntitySchema } from "typeorm";
export const User = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    username: { type: String, nullable: false, primary: true },
    name: { type: String, nullable: false },
    password: { type: String, nullable: false },
    registrationDate: { type: Date, nullable: false },
  },
});
