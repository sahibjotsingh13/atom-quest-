import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

console.log("DATABASE_URL:", process.env.DATABASE_URL);

import { Pool } from "@neondatabase/serverless";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.connect().then(() => {
  console.log("Connected to Neon pool successfully!");
  process.exit(0);
}).catch(err => {
  console.error("Connection failed:", err);
  process.exit(1);
});
