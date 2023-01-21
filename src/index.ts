import logger from './lib/logger';
import config from './lib/config';
import database from './lib/database';
import { OccurenceRate } from '@prisma/client';
import nats from './lib/nats';

(async () => {
  logger.info('Setting up NATS subscription');
  await require('./lib/nats');
  logger.info('Finished building NATS subscriptions');

  await require('./lib/redis');

  logger.info(`Setting up scheduling interval`);
  setInterval(async () => {
    logger.debug(`Beginning scheduled task execution at: ${new Date()}`);

    //once tasks
    logger.debug(`Beginning tasks execution at: ${new Date()}`);
    const onceTasks = await database.task.findMany({where: {finished: false, OR: [{nextScheduledExecutionDate: {lte: new Date()},}, {nextScheduledExecutionDate: undefined}, {nextScheduledExecutionDate: null}]}, include: {frequency: true}});
    logger.info(`Found ${onceTasks.length} tasks in the schedule to be executed this round`);
    onceTasks.forEach(async task => {
      logger.trace(`Executing publishing for [taskId=${task.id}]`);
      await (await nats).publish('TaskExecute', Buffer.from(JSON.stringify({taskId: task.id})));
      logger.trace(`Completed publishing for [taskId=${task.id}]`);
    });
    logger.debug(`Ending tasks at: ${new Date()}`)

    logger.debug(`Completed scheduled task execution at: ${new Date()}`);
  }, config.intervalTime);
  logger.info(`Scheduled interval configured`);
})();