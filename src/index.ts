import logger from './lib/logger';
import config from './lib/config';
import database from './lib/database';
import { OccurenceRate } from '@prisma/client';
import nats from './lib/nats';

(async () => {
  logger.info('Setting up NATS subscription');
  await require('./lib/nats');
  logger.info('Finished building NATS subscriptions');

  logger.info(`Setting up scheduling interval`);
  setInterval(async () => {
    logger.debug(`Beginning scheduled task execution at: ${new Date()}`);

    //once tasks
    logger.debug(`Beginning once tasks at: ${new Date()}`);
    const onceTasks = await database.task.findMany({where: {finished: false, occurenceRate: OccurenceRate.Once, OR: [{nextScheduledExecutionDate: {lte: new Date()},}, {nextScheduledExecutionDate: undefined}, {nextScheduledExecutionDate: null}]}, include: {frequency: true}});
    logger.info(`Found ${onceTasks.length} once tasks in the schedule to be executed this round`);
    onceTasks.forEach(async task => {
      logger.trace(`Executing publishing for [taskId=${task.id}]`);
      await (await nats).publish(task.eventType, Buffer.from(JSON.stringify(task.payload)));
      logger.trace(`Completed execution for [taskId=${task.id}]`);
      return await database.task.update({where: {id: task.id}, data: {lastExecutionDate: new Date(), finished: true}});
    });
    logger.debug(`Ending once tasks at: ${new Date()}`)

    //recurring
    logger.debug(`Beginning recurring tasks at: ${new Date()}`);
    const executionTime = new Date();
    const recurringTasks = await database.task.findMany({where: {finished: false, occurenceRate: OccurenceRate.Recurring, OR: [{nextScheduledExecutionDate: {lte: new Date()},}, {nextScheduledExecutionDate: undefined}, {nextScheduledExecutionDate: null}]}, include: {frequency: true}});
    logger.info(`Found ${recurringTasks.length} recurring tasks in the schedule to be executed this round`);
    recurringTasks.forEach(async task => {
      await (await nats).publish(task.eventType, Buffer.from(JSON.stringify(task.payload)));
      const frequency = task.frequency;
      if(!frequency?.minutes){
        logger.warn(`Task [taskId=${task.id}]/[frequencyId=${frequency?.id}] is missing milliseconds setting but is recurrent`);
        return await database.task.update({where: {id: frequency?.id}, data: {finished: true}});
      }
      let nextScheduledExecutionDate = new Date();
      nextScheduledExecutionDate.setMinutes(new Date().getMinutes() + frequency.minutes);
      logger.trace(`Task [taskId=${task.id}] is a recurring task and is scheduled to execute again at ${nextScheduledExecutionDate}`);
      return await database.task.update({where: {id: task.id}, data: {nextScheduledExecutionDate, lastExecutionDate: executionTime}});
    });
    logger.debug(`Ending recurring tasks at: ${new Date()}`);

    logger.debug(`Completed scheduled task execution at: ${new Date()}`);
  }, config.intervalTime);
  logger.info(`Scheduled interval configured`);
})();