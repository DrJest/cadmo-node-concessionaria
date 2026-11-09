import { EntitySchema } from "typeorm";

export const Brand = new EntitySchema({
  name: "Brand",
  tableName: "brands",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, nullable: false },
    logo: { type: String, nullable: false },
    country: { type: String, nullable: false },
    foundation_year: { type: Number, nullable: false },
    luxury: { type: Boolean, default: false },
    flies: { type: Boolean, default: false },
  },
  relations: {
    models: {
      type: "one-to-many",
      target: "Model",
      inverseJoinColumn: "brand_id",
      nullable: false,
    },
  },
});
