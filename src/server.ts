import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import compression from 'compression';
import * as dotenv from 'dotenv';
import express, { Response } from 'express';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = join(serverDistFolder, '../browser');

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const USDA_DATA_TYPES = 'Foundation,SR Legacy';
const MAX_QUERY_LENGTH = 100;
const MAX_CACHE_ENTRIES = 2000;
const UPSTREAM_TIMEOUT_MS = 10_000;

const apiKey = process.env['USDA_API_KEY'];
if (!apiKey) throw new Error('USDA_API_KEY not set in .env');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(compression());

class BoundedCache<T> {
  private readonly entries = new Map<string, T>();

  constructor(private readonly maxEntries: number) {}

  get(key: string): T | undefined {
    const value = this.entries.get(key);
    if (value !== undefined) {
      this.entries.delete(key);
      this.entries.set(key, value);
    }
    return value;
  }

  set(key: string, value: T): void {
    this.entries.delete(key);
    this.entries.set(key, value);
    if (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
  }
}

const foodDetailCache = new BoundedCache<unknown>(MAX_CACHE_ENTRIES);
const searchCache = new BoundedCache<unknown>(MAX_CACHE_ENTRIES);

const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api', apiLimiter);

async function fetchUsda(url: URL, res: Response): Promise<unknown | undefined> {
  url.searchParams.set('api_key', apiKey!);
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
    if (response.status === 404) {
      res.status(404).json({ error: 'Food not found' });
      return undefined;
    }
    if (!response.ok) {
      console.error(`[USDA ${response.status}] ${url.pathname}`);
      res.status(502).json({ error: 'Food data service unavailable' });
      return undefined;
    }
    return await response.json();
  } catch (err) {
    console.error('[USDA fetch failed]', err);
    res.status(502).json({ error: 'Food data service unavailable' });
    return undefined;
  }
}

app.get('/api/foods/search', async (req, res) => {
  const raw = req.query['q'];
  const query = typeof raw === 'string' ? raw.trim() : '';
  if (!query || query.length > MAX_QUERY_LENGTH) {
    res.status(400).json({ error: `Query must be 1-${MAX_QUERY_LENGTH} characters` });
    return;
  }

  const cacheKey = query.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const url = new URL(`${USDA_BASE_URL}/foods/search`);
  url.searchParams.set('query', query);
  url.searchParams.set('dataType', USDA_DATA_TYPES);
  url.searchParams.set('pageSize', '10');

  const data = await fetchUsda(url, res);
  if (data === undefined) return;
  searchCache.set(cacheKey, data);
  res.json(data);
});

app.get('/api/foods/:fdcId', async (req, res) => {
  const { fdcId } = req.params;
  if (!/^\d{1,10}$/.test(fdcId)) {
    res.status(400).json({ error: 'Invalid food id' });
    return;
  }

  const cached = foodDetailCache.get(fdcId);
  if (cached) {
    res.json(cached);
    return;
  }

  const data = await fetchUsda(new URL(`${USDA_BASE_URL}/food/${fdcId}`), res);
  if (data === undefined) return;
  foodDetailCache.set(fdcId, data);
  res.json(data);
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
