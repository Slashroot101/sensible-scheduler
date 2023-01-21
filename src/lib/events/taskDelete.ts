import { Msg, NatsError } from "nats";
import { TaskDelete } from "../../types/Task";
import database from "../database";
import logger from "../logger";
import nats from '../nats';

export default async (err: NatsError | null, msg: Msg): Promise<void> => {
  logger.info(`Received delete task request`);
  const parsedMessage = JSON.parse(msg.data.toString()) as TaskDelete;

  logger.debug(`Updating correlationId=${parsedMessage.correlationId} to be finished=true and publishing task delete`)
  const task = await database.task.update({where: {correlationId: parsedMessage.correlationId}, data: {finished: true}});

  await (await nats).publish('TaskDelete', Buffer.from(JSON.stringify({task})));
}