import { reset,seed } from "drizzle-seed";
import * as schemas from "./schema.js";
import { db } from "../config/db.js";

// await reset(db,Schemaa);
const USER_ID = 6;

await reset(db, {
  shortLinksTable: schemas.shortLinksTable,
});

await seed(
  db,
  {
    shortLinksTable: schemas.shortLinksTable,
  },
  { count: 100 }
).refine((f) => ({
  shortLinksTable: {
    columns: {
      userId: f.default({ defaultValue: USER_ID }),
      url: f.default({
        defaultValue: "https://thapatechnical.shop/",
      }),
    },
  },
}));

process.exit(0);