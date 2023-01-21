import { OccurenceRate } from "@prisma/client";
import { Msg, NatsError } from "nats";
import { TaskExecution } from "../../types/Task";
import database from "../database";
import logger from "../logger";
import nats from '../nats';
import redis from "../redis";

export default async function (err: NatsError | null, msg: Msg) {
  const parsedMessage = JSON.parse(msg.data.toString()) as TaskExecution;
  logger.debug(`Executing task [taskId=${parsedMessage.taskId}]`);

  // const exists = await (await redis).exists(parsedMessage.taskId.toString());

  logger.debug(`Adding task [taskId=${parsedMessage.taskId}] to cache`);
  const cache = await (await redis).setNX(parsedMessage.taskId.toString(), '');
  if(!cache){
    return logger.warn(`Task [taskId=${parsedMessage.taskId}] already exists in cache, skipping`);
  }
  await (await redis).expire(parsedMessage.taskId.toString(), 60*5);

  //todo: create cache entry locking field
  const task = await database.task.findFirst({where: {id: parsedMessage.taskId}, include: {frequency: true}});

  if(!task){
    return logger.warn(`Task was sent for execution but did not exist [taskId=${parsedMessage.taskId}]`);
  }

  let nextScheduledExecutionDate = new Date();
  if(task?.frequency){
    logger.info(`Adding recurring date with minutes=${task.frequency.minutes}`);
    nextScheduledExecutionDate.setMinutes(new Date().getMinutes() + task.frequency.minutes);
  }

  logger.info(`Updating task [taskId=${parsedMessage.taskId}] for task execution`);
  await database.task.update({where: {id: parsedMessage.taskId}, data: {nextScheduledExecutionDate, lastExecutionDate: new Date(), finished: task.occurenceRate === OccurenceRate.Once}});

  logger.info(`Emitting task for [taskId=${parsedMessage.taskId}]`);
  await (await nats).publish(task.eventType, Buffer.from(JSON.stringify(task.payload)));
}