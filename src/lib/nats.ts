import logger from "./logger";
import {connect, NatsConnection} from 'nats';
import config from "./config";
import events from "./events";

export default (async function(): Promise<NatsConnection> {
  logger.info('Connecting to NATS');
	const nats = await connect({
		servers: config.natsUrl,
	});
  events.events.forEach(async e => {
    logger.info(`Subscribing to ${e.name} queue`);
    nats.subscribe(e.name, {callback: e.handler});
  });
  logger.info('NATS connection complete');

  return nats;
})();