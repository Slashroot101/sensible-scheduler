import logger from "./logger";
import { createClient, RedisClientType } from 'redis';
import config from './config';



export default (async function(): Promise<ReturnType<typeof createClient>> {
  logger.info(`Connecting to Redis`);
  console.log(config.redisUrl)
  const client = createClient({url: config.redisUrl, });
  logger.info(`Redis connection completed`);
  await client.connect();
  return client;
})();