import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { addCheckInProcedure } from "./routes/checkins/add/route";
import { getCheckInsProcedure } from "./routes/checkins/get/route";
import { addJournalEntryProcedure } from "./routes/journal/add/route";
import { getJournalEntriesProcedure } from "./routes/journal/get/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  checkins: createTRPCRouter({
    add: addCheckInProcedure,
    get: getCheckInsProcedure,
  }),
  journal: createTRPCRouter({
    add: addJournalEntryProcedure,
    get: getJournalEntriesProcedure,
  }),
});

export type AppRouter = typeof appRouter;