import taskCreate from "./taskCreate";
import taskExecute from "./taskExecute";

export default {
  events: [
    {name: 'TaskCreate', handler: taskCreate},
    {name: 'TaskExecute', handler: taskExecute},
  ],
};