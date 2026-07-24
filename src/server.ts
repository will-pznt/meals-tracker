import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import * as dotenv from 'dotenv';

dotenv.config();

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = join(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

const apiKey = process.env['USDA_API_KEY'] as string;
if (!apiKey) throw new Error('USDA_API_KEY not set in .env');

/** In-memory cache of USDA food details, keyed by FDC id. Food data doesn't change, so no TTL is needed. */
const foodDetailCache = new Map<string, unknown>();

/**
 * USDA API proxy: search foods.
 */
app.get('/api/foods/search', async (req, res) => {
  const query = req.query['q'] as string;
  if (!query) {
    res.status(400).json({ error: 'Missing query' });
    return;
  }
  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(
        query,
      )}&dataType=Foundation,SR Legacy&pageSize=10`,
    );
    res.json(await response.json());
  } catch {
    res.status(500).json({ error: 'Failed to fetch USDA data' });
  }
});

/**
 * USDA API proxy: food details by FDC id. Cached in-memory since meal loads
 * re-request the same items repeatedly (e.g. revisiting a date).
 */
app.get('/api/foods/:fdcId', async (req, res) => {
  const { fdcId } = req.params;
  const cached = foodDetailCache.get(fdcId);
  if (cached) {
    res.json(cached);
    return;
  }
  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}&dataType=Foundation,SR Legacy`,
    );
    const data = await response.json();
    foodDetailCache.set(fdcId, data);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch USDA data' });
  }
});

/**
 * Serve static files from /browser.
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * The request handler used by the Angular CLI (during dev-server and build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
