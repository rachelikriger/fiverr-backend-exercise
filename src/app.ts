import express from 'express';
import { pool } from './config/db.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { simulateFraudValidation } from './services/fraud.service.js';
import { createLinksService } from './services/links.service.js';
import { createStatsService } from './services/stats.service.js';
import { createLinksController } from './controllers/links.controller.js';
import { createStatsController } from './controllers/stats.controller.js';
import { createLinksRoutes } from './routes/links.routes.js';
import { createStatsRoutes } from './routes/stats.routes.js';

export type FraudValidator = () => Promise<boolean>;

export function createApp(fraudValidator?: FraudValidator) {
  const app = express();
  app.use(express.json());

  const validator = fraudValidator ?? simulateFraudValidation;
  const linksService = createLinksService(pool, validator);
  const statsService = createStatsService(pool);
  const linksController = createLinksController(linksService);
  const statsController = createStatsController(statsService);

  app.use(createLinksRoutes(linksController));
  app.use(createStatsRoutes(statsController));

  app.use(errorHandler);

  return app;
}

export default createApp();
