import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT ?? 3434;
const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export { PORT, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL };
