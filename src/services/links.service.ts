import type { Pool } from 'pg';
import { randomBytes } from 'node:crypto';
import { createLinksRepository } from '../db/links.repository.js';
import { createClicksRepository } from '../db/clicks.repository.js';

const SHORT_CODE_LENGTH = 8;
const BASE_URL = process.env.BASE_URL ?? 'https://localhost:3000';

export type FraudValidator = () => Promise<boolean>;

export interface CreateLinkInput {
  sellerId: string;
  targetUrl: string;
}

export interface CreateLinkResult {
  shortUrl: string;
  shortCode: string;
}

export function createLinksService(
  pool: Pool,
  fraudValidator: FraudValidator
) {
  const linksRepo = createLinksRepository(pool);
  const clicksRepo = createClicksRepository(pool);

  function generateShortCode(): string {
    return randomBytes(SHORT_CODE_LENGTH)
      .toString('base64url')
      .slice(0, SHORT_CODE_LENGTH);
  }

  async function createLink(input: CreateLinkInput): Promise<CreateLinkResult> {
    const existing = await linksRepo.findBySellerAndTarget(
      input.sellerId,
      input.targetUrl
    );
    if (existing) {
      return {
        shortUrl: `${BASE_URL}/l/${existing.short_code}`,
        shortCode: existing.short_code,
      };
    }

    let shortCode = generateShortCode();
    let attempts = 0;
    const maxAttempts = 10;
    while (await linksRepo.findByShortCode(shortCode)) {
      shortCode = generateShortCode();
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique short code');
      }
    }

    await linksRepo.create({
      sellerId: input.sellerId,
      targetUrl: input.targetUrl,
      shortCode,
    });

    return {
      shortUrl: `${BASE_URL}/l/${shortCode}`,
      shortCode,
    };
  }

  async function resolveAndRecordClick(shortCode: string): Promise<string | null> {
    const link = await linksRepo.findByShortCode(shortCode);
    if (!link) return null;

    const isValid = await fraudValidator();
    await clicksRepo.insert(link.id, isValid);

    return link.target_url;
  }

  return { createLink, resolveAndRecordClick };
}

export type LinksService = ReturnType<typeof createLinksService>;
