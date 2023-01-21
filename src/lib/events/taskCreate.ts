import { OccurenceRate } from "@prisma/client";
import { Msg, NatsConnection, NatsError } from "nats";
import { TaskCreate } from "../../types/Task";
import database from "../database";
import logger from "../logger";

export default async (err: NatsError | null, msg: Msg): Promise<void> => {
  logger.info(`Received create task request`);
  const parsedMessage = JSON.parse(msg.data.toString()) as TaskCreate;
  const executionDate = new Date();
  executionDate.setMinutes(new Date().getMinutes() + parsedMessage.minutes);
  if(parsedMessage.occurenceRate === OccurenceRate.Once) {
    const task = await database.task.create({ data: { correlationId: parsedMessage.correlationId, occurenceRate: parsedMessage.occurenceRate, payload: parsedMessage.payload, eventType: parsedMessage.eventType, lastExecutionDate: null, nextScheduledExecutionDate: executionDate, finished: false} });
    logger.info(`Completed task create request for [taskId=${task.id}]`);
  }
  if(parsedMessage.occurenceRate === OccurenceRate.Recurring){
    const task = await database.task.create({ data: { correlationId: parsedMessage.correlationId, occurenceRate: parsedMessage.occurenceRate, payload: parsedMessage.payload, eventType: parsedMessage.eventType, lastExecutionDate: null, nextScheduledExecutionDate: executionDate, finished: false, frequency: { create: { minutes: parsedMessage.minutes, } } } });
    logger.info(`Completed task create request for [taskId=${task.id}]`);
  }
}