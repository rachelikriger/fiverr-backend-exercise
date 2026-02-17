import type { Request, Response } from 'express';
import type { LinksService } from '../services/links.service.js';

export interface CreateLinkBody {
  sellerId?: string;
  targetUrl?: string;
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function createLinksController(linksService: LinksService) {
  return {
    async createLink(req: Request, res: Response): Promise<void> {
      const body = req.body as CreateLinkBody;
      const sellerId = typeof body.sellerId === 'string' ? body.sellerId.trim() : '';
      const targetUrl = typeof body.targetUrl === 'string' ? body.targetUrl.trim() : '';

      if (!sellerId) {
        res.status(400).json({ error: 'sellerId is required and must be non-empty' });
        return;
      }
      if (!targetUrl) {
        res.status(400).json({ error: 'targetUrl is required and must be non-empty' });
        return;
      }
      if (!isValidUrl(targetUrl)) {
        res.status(400).json({ error: 'targetUrl must be a valid http or https URL' });
        return;
      }

      const result = await linksService.createLink({ sellerId, targetUrl });
      res.status(201).json({ shortUrl: result.shortUrl });
    },

    async redirect(req: Request, res: Response): Promise<void> {
      const shortCode = req.params.shortCode as string;
      const targetUrl = await linksService.resolveAndRecordClick(shortCode);

      if (!targetUrl) {
        res.status(404).json({ error: 'Link not found' });
        return;
      }

      res.redirect(302, targetUrl);
    },
  };
}

export type LinksController = ReturnType<typeof createLinksController>;
