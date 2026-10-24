import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT ?? 3434;
const METRICS_HOST = process.env.METRICS_HOST ?? "127.0.0.1";
const METRICS_PORT = Number(process.env.METRICS_PORT ?? 9464);
if (METRICS_HOST.trim() === "") {
    throw new Error("Invalid METRICS_HOST.");
}
if (
    !Number.isInteger(METRICS_PORT) ||
    METRICS_PORT < 1 ||
    METRICS_PORT > 65535
) {
    throw new Error("Invalid METRICS_PORT.");
}
const POCKETBASE_URL = process.env.POCKETBASE_URL ?? "http://127.0.0.1:3435";
const POCKETBASE_SUPERUSER_EMAIL = process.env.POCKETBASE_SUPERUSER_EMAIL ?? "";
const POCKETBASE_SUPERUSER_PASSWORD =
    process.env.POCKETBASE_SUPERUSER_PASSWORD ?? "";

export {
    METRICS_HOST,
    METRICS_PORT,
    POCKETBASE_SUPERUSER_EMAIL,
    POCKETBASE_SUPERUSER_PASSWORD,
    POCKETBASE_URL,
    PORT,
};
