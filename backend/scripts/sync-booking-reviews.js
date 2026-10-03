import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pool } from '../src/database.js';
import { classifyTopics } from '../src/topics.js';

const endpoint = 'https://supply-xml.booking.com/review-api';
const propertyMap = (process.env.BOOKING_REVIEW_PROPERTY_IDS || '').split(',').map((part) => part.trim()).filter(Boolean).map((part) => {
  const [property, id] = part.split(':').map((value) => value?.trim());
  if (!['olympic', 'potts', 'central', 'darling'].includes(property) || !/^\d+$/.test(id || '')) throw new Error(`Invalid BOOKING_REVIEW_PROPERTY_IDS entry: ${part}. Use property-code:numeric-id.`);
  return { property, id };
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function getJson(url, token, attempt = 0) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  if ((response.status === 429 || response.status >= 500) && attempt < 4) {
    const retryAfter = Number(response.headers.get('retry-after'));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 30000) : 1000 * 2 ** attempt);
    return getJson(url, token, attempt + 1);
  }
  if (!response.ok) throw new Error(`Booking.com Review API returned HTTP ${response.status}; check permission, token and property ID.`);
  return response.json();
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in backend/.env.');
  if (!process.env.BOOKING_API_TOKEN) throw new Error('Set BOOKING_API_TOKEN to a valid JWT from an authorized Booking.com machine account.');
  if (!propertyMap.length) throw new Error('Set BOOKING_REVIEW_PROPERTY_IDS after Booking.com grants API access, e.g. olympic:123,potts:456,central:789,darling:234.');
  await pool.query(await readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8'));
  const token = process.env.BOOKING_API_TOKEN;
  const fromDate = process.env.BOOKING_REVIEW_FROM_DATE || '2000-01-01';
  let total = 0;
  for (const { property, id } of propertyMap) {
    let url = `${endpoint}/properties/${id}/reviews?from_date=${encodeURIComponent(fromDate)}&limit=100`;
    const visited = new Set(); let pages = 0;
    while (url && pages < 1000 && !visited.has(url)) {
      visited.add(url); pages += 1;
      const payload = await getJson(url, token);
      for (const review of payload.data?.reviews || []) {
        const rating = Number(review.scoring?.review_score);
        const date = review.created_timestamp?.slice(0, 10);
        const positive = review.content?.positive?.trim() || '';
        const negative = review.content?.negative?.trim() || '';
        const text = [positive && `Liked: ${positive}`, negative && `Disliked: ${negative}`].filter(Boolean).join('\n');
        if (!review.review_id || !Number.isFinite(rating) || rating < 0 || rating > 10 || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !text) continue;
        const reviewerCountry = review.reviewer?.country_code || '';
        const title = review.content?.headline || '';
        const idKey = `${property}:${review.review_id}` || createHash('sha256').update([property, date, rating, title, text].join('\0')).digest('hex');
        const topics = classifyTopics(`${title} ${text}`);
        await pool.query(`INSERT INTO reviews (id, property, rating, review_date, title, text, traveller, country, source, topics)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT (id) DO UPDATE SET rating=EXCLUDED.rating, review_date=EXCLUDED.review_date, title=EXCLUDED.title,
          text=EXCLUDED.text, country=EXCLUDED.country, source=EXCLUDED.source, topics=EXCLUDED.topics, imported_at=NOW()`,
        [idKey, property, rating, date, title, text, 'Guest', reviewerCountry, 'booking_guest_review_api', topics]);
        total += 1;
      }
      const nextPage = payload.meta?.next_page;
      if (!nextPage || !(payload.data?.reviews || []).length) break;
      const parsed = new URL(nextPage);
      if (parsed.hostname !== 'supply-xml.booking.com') throw new Error('Refusing unexpected pagination host from API response.');
      url = nextPage;
      await sleep(300);
    }
    if (pages >= 1000) console.warn(`Stopped ${property} at the safety limit of 1000 pages.`);
    console.log(`${property}: checked ${pages} review page(s).`);
  }
  console.log(`Review API sync complete: ${total} review record(s) saved or updated.`);
}

main().catch((error) => { console.error(`Sync failed: ${error.message}`); process.exitCode = 1; }).finally(() => pool.end());
