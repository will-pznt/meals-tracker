import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fetch from 'node-fetch';

import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';

import bootstrap from './main.server';
import * as dotenv from 'dotenv';

dotenv.config();

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();
const commonEngine = new CommonEngine();

const apiKey = process.env['USDA_API_KEY'] as string;
if (!apiKey) throw new Error('USDA_API_KEY not set in .env');

/**
 * Serve static files from /browser
 */
app.get(
  '**',
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }),
);
// USDA API proxy
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

/** Proxy USDA API requests for food details
 */

app.get('/api/foods/:fdcId', async (req, res) => {
  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/food/${req.params.fdcId}?api_key=${apiKey}&dataType=Foundation,SR Legacy`,
    );
    res.json(await response.json());
  } catch {
    res.status(500).json({ error: 'Failed to fetch USDA data' });
  }
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
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
