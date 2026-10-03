import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './database.js';
import demoReviews from '../data/demo-reviews.json' with { type: 'json' };

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  if (!process.env.DATABASE_URL) return res.json({ status: 'ok', database: 'not-configured', mode: 'demo' });
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); }
  catch { res.status(503).json({ status: 'error', database: 'unavailable', message: 'Could not connect to PostgreSQL' }); }
});

app.get('/api/reviews', async (_req, res) => {
  if (process.env.DATABASE_URL) {
    try {
      const { rows } = await pool.query('SELECT id, property, rating, review_date AS date, title, text, traveller, country, source, topics FROM reviews ORDER BY review_date DESC, id LIMIT 5000');
      return res.json({ mode: 'database', reviews: rows });
    } catch (error) {
      console.error('Review database query failed:', error.message);
      return res.status(503).json({ error: 'Review database is configured but unavailable. Check DATABASE_URL and run the schema.' });
    }
  }
  res.json({ mode: 'demo', reviews: demoReviews });
});

app.get('/api/properties', (_req, res) => res.json({ properties: [
  { id: 'olympic', name: 'Olympic Hotel Paddington', url: 'https://www.booking.com/hotel/au/olympic-paddington.html' },
  { id: 'potts', name: 'Potts Point', url: 'https://www.booking.com/hotel/au/venus-potts-point-sydney.html' },
  { id: 'central', name: 'Central Sydney', url: 'https://www.booking.com/hotel/au/venus-surry-hills.html' },
  { id: 'darling', name: 'Darling Harbour', url: 'https://www.booking.com/hotel/au/chateau-de-venus.html' },
] }));

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`API running at http://localhost:${port}`));
