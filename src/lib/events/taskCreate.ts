import { Msg, NatsConnection, NatsError } from "nats";
import { TaskCreate } from "../../types/Task";
import database from "../database";
import logger from "../logger";

export default async (err: NatsError | null, msg: Msg): Promise<void> => {
  logger.info(`Received create task request`);
  const parsedMessage = JSON.parse(msg.data.toString()) as TaskCreate;
  const task = await database.task.create({ data: { occurenceRate: parsedMessage.occurenceRate, payload: JSON.stringify(parsedMessage.payload), eventType: parsedMessage.eventType, lastExecutionDate: null, nextScheduledExecutionDate: null, finished: false, frequency: { create: { minutes: parsedMessage.minutes, } } } });
  logger.info(`Completed task create request for [taskId=${task.id}]`);
}