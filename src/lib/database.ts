import { PrismaClient } from "@prisma/client";
import logger from "./logger";

logger.info(`Connecting to database`);
const database = new PrismaClient();
logger.info('Completed database connection');
export default database;