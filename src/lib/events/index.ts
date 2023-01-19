import taskCreate from "./taskCreate";

export default {
  events: [
    {name: 'TaskCreate', handler: taskCreate},
  ],
};