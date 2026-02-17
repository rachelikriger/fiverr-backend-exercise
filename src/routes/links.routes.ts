import { Router } from 'express';
import type { LinksController } from '../controllers/links.controller.js';

export function createLinksRoutes(linksController: LinksController) {
  const router = Router();
  router.post('/links', (req, res, next) =>
    linksController.createLink(req, res).catch(next)
  );
  router.get('/l/:shortCode', (req, res, next) =>
    linksController.redirect(req, res).catch(next)
  );
  return router;
}
