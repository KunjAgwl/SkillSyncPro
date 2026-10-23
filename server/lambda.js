import serverless from 'serverless-http';
import app from './app.js';
import { ensureSchema } from './config/db.js';
import { bootstrapJobs } from './services/bootstrapService.js';

const expressHandler = serverless(app);

// Runs once per cold start, before the first request is served
let ready;
const init = () => (ready ??= ensureSchema().catch((err) => {
  ready = undefined;
  throw err;
}));

export const handler = async (event, context) => {
  await init();

  // One-off data load: invoke the function from the Lambda console with {"action":"bootstrap"}.
  // Function URL events always carry requestContext, so web callers can never trigger this.
  if (event && event.action === 'bootstrap' && !event.requestContext) {
    await bootstrapJobs();
    return { ok: true, message: 'Bootstrap finished (see CloudWatch logs for details).' };
  }

  return expressHandler(event, context);
};
