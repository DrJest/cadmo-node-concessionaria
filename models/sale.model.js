import { EntitySchema } from "typeorm";

export const Sale = new EntitySchema({
  name: "Sale",
  tableName: "sales",
  columns: {
    id: { type: Number, primary: true, generated: true },
    customer: { type: String, nullable: false },
    date: { type: Date, nullable: false },
    price: { type: "float", nullable: false },
  },
  relations: {
    model: {
      type: "many-to-one",
      target: "Model",
      joinColumn: "model_id",
      nullable: false,
    },
  },
});
