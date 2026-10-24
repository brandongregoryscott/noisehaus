import { app, metrics } from "@/app";
import { METRICS_HOST, METRICS_PORT, PORT } from "@/config";
import { logger } from "@/utilities/logger";

const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, "server started");
});
const metricsServer = metrics.app.listen(METRICS_PORT, METRICS_HOST, () => {
    logger.info(
        { host: METRICS_HOST, port: METRICS_PORT },
        "metrics server started"
    );
});

for (const listener of [server, metricsServer]) {
    listener.on("error", (error: Error) => {
        logger.error({ err: error }, "API or metrics listener failed");
        process.exit(1);
    });
}

for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
        let remaining = 2;
        for (const listener of [server, metricsServer]) {
            listener.close(() => {
                remaining -= 1;
                if (remaining === 0) {
                    process.exit(0);
                }
            });
        }
        setTimeout(() => process.exit(1), 10_000).unref();
    });
}
