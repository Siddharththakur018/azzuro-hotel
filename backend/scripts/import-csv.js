import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pool } from '../src/database.js';
import { classifyTopics } from '../src/topics.js';

const PROPERTY_ALIASES = new Map([
  ['olympic', 'olympic'], ['olympic hotel paddington', 'olympic'], ['olympic paddington', 'olympic'],
  ['potts', 'potts'], ['potts point', 'potts'], ['venus potts point sydney', 'potts'],
  ['central', 'central'], ['central sydney', 'central'], ['venus surry hills', 'central'],
  ['darling', 'darling'], ['darling harbour', 'darling'], ['chateau de venus', 'darling'],
]);

function parseCsv(input) {
  const records = [];
  let record = [], value = '', quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { value += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"' && value.length === 0) quoted = true;
    else if (char === ',') { record.push(value); value = ''; }
    else if (char === '\n') { record.push(value.replace(/\r$/, '')); records.push(record); record = []; value = ''; }
    else value += char;
  }
  if (value.length || record.length) { record.push(value.replace(/\r$/, '')); records.push(record); }
  const [header = [], ...rows] = records;
  const keys = header.map((key) => key.trim().toLowerCase().replace(/[\s-]+/g, '_'));
  return rows.filter((row) => row.some((cell) => cell.trim())).map((row) => Object.fromEntries(keys.map((key, i) => [key, row[i]?.trim() ?? ''])));
}

const pick = (record, ...keys) => keys.map((key) => record[key]).find((value) => value !== undefined && value !== '');
function isoDate(input) {
  if (!input) return '';
  const direct = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (direct) return `${direct[1]}-${direct[2].padStart(2, '0')}-${direct[3].padStart(2, '0')}`;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) throw new Error('Usage: npm run import:csv -- path/to/authorized-reviews.csv');
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in backend/.env to your PostgreSQL or Supabase connection string.');
  const sql = await readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8');
  await pool.query(sql);
  const rows = parseCsv(await readFile(resolve(csvPath), 'utf8').then((text) => text.replace(/^\uFEFF/, '')));
  let imported = 0, skipped = 0;
  for (const row of rows) {
    const rawProperty = (pick(row, 'property', 'property_name', 'hotel') || '').toLowerCase().trim();
    const property = PROPERTY_ALIASES.get(rawProperty);
    const rating = Number(pick(row, 'rating', 'score', 'review_score'));
    const date = isoDate(pick(row, 'date', 'review_date', 'published_date'));
    const text = pick(row, 'text', 'review_text', 'comment', 'comments', 'review') || '';
    if (!property || !Number.isFinite(rating) || rating < 0 || rating > 10 || !date || !text.trim()) { skipped += 1; continue; }
    const title = pick(row, 'title', 'review_title', 'headline') || '';
    const traveller = pick(row, 'traveller', 'traveler', 'traveller_type', 'guest_type') || 'Guest';
    const country = pick(row, 'country', 'reviewer_country', 'nationality') || '';
    const externalId = pick(row, 'review_id', 'id');
    const id = externalId ? `${property}:${externalId}` : createHash('sha256').update([property, date, rating, title, text].join('\0')).digest('hex');
    const source = pick(row, 'source') || 'authorized_csv_import';
    const topics = classifyTopics(`${title} ${text}`);
    await pool.query(`INSERT INTO reviews (id, property, rating, review_date, title, text, traveller, country, source, topics)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (id) DO UPDATE SET rating=EXCLUDED.rating, review_date=EXCLUDED.review_date, title=EXCLUDED.title,
      text=EXCLUDED.text, traveller=EXCLUDED.traveller, country=EXCLUDED.country, source=EXCLUDED.source, topics=EXCLUDED.topics, imported_at=NOW()`,
    [id, property, rating, date, title, text, traveller, country, source, topics]);
    imported += 1;
  }
  console.log(`Import finished: ${imported} saved or updated, ${skipped} invalid row(s) skipped.`);
}

main().catch((error) => { console.error(`Import failed: ${error.message}`); process.exitCode = 1; }).finally(() => pool.end());
