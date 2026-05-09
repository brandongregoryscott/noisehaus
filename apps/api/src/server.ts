import { app } from "@/app";
import { PORT } from "@/config";
import { logger } from "@/utilities/logger";

app.listen(PORT, () => {
    logger.info({ port: PORT }, "server started");
});
