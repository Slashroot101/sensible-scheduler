import { OccurenceRate } from "@prisma/client";

export type TaskCreate = {
  eventType: string;
  payload: string;
  minutes: number;
  occurenceRate: OccurenceRate;
}