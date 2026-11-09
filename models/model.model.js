import { EntitySchema } from "typeorm";
export const Model = new EntitySchema({
  name: "Model",
  tableName: "models",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, nullable: false },
    available_colors: { type: String, nullable: false },
    year: { type: Number, nullable: false },
    price: { type: "float", nullable: false },
  },
  relations: {
    brand: {
      type: "many-to-one",
      target: "Brand",
      joinColumn: "brand_id",
      nullable: false,
      eager: true,
    },
  },
});
