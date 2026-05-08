import pino from "pino";
import { isDevelopment } from "@/utilities/environment";

const logger = pino({
    level: process.env.LOG_LEVEL ?? (isDevelopment() ? "debug" : "info"),
    redact: ["req.headers.authorization", "req.headers.cookie"],
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(isDevelopment()
        ? { transport: { target: "pino-pretty", options: { colorize: true } } }
        : {}),
});

export { logger };
