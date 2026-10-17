import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT ?? 3434;
const POCKETBASE_URL = process.env.POCKETBASE_URL ?? "http://127.0.0.1:3435";
const POCKETBASE_SUPERUSER_EMAIL = process.env.POCKETBASE_SUPERUSER_EMAIL ?? "";
const POCKETBASE_SUPERUSER_PASSWORD =
    process.env.POCKETBASE_SUPERUSER_PASSWORD ?? "";

export {
    POCKETBASE_SUPERUSER_EMAIL,
    POCKETBASE_SUPERUSER_PASSWORD,
    POCKETBASE_URL,
    PORT,
};
