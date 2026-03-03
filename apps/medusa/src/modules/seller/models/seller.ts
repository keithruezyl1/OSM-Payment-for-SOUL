import { model } from "@medusajs/framework/utils";

const Seller = model.define("seller", {
  id: model.id({ prefix: "sel" }).primaryKey(),
  name: model.text().searchable(),
  handle: model.text().unique(),
  rating: model.float().default(4.6),
  review_count: model.number().default(0),
  city: model.text(),
  state: model.text(),
  zip: model.text(),
  country_code: model.text().default("US"),
  logo_url: model.text().nullable(),
  banner_url: model.text().nullable(),
});

export default Seller;
