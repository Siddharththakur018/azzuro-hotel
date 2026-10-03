# Azzuro Guest Review Insights

A local review dashboard for the four Azzuro Hotels properties. The interface includes weekly rating KPIs, property comparisons, review activity, positive/negative sentiment, topic summaries, and a searchable review feed.

> **Data honesty:** this repository ships with illustrative sample reviews so the interface works immediately. They are not Booking.com reviews and must not be presented as collected guest feedback. To load real reviews, use the approved Booking.com Guest Review API integration (when the property account has access) or import a review export that you are authorized to use.

## Run locally

Requirements: Node.js 20 or later.

In one terminal:

```sh
cd backend
npm install
npm run dev
```

In another terminal:

```sh
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (usually <http://localhost:5173>). You do not need Python, PostgreSQL, a Supabase account, or credentials to preview the dashboard. The API serves the demo fixture if `DATABASE_URL` is unset; the frontend also has a demo fallback if the API is stopped.

## Add a hosted PostgreSQL database (optional)

Supabase is a convenient hosted PostgreSQL option; a regular PostgreSQL server works too.

1. Create a Supabase project and copy its PostgreSQL connection string from the project’s database settings.
2. Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL` to that connection string. Keep this file private; it is ignored by Git in a normal project setup. Never paste the connection string into chat or commit it.
3. Initialize the schema:

   ```sh
   cd backend
   npm run db:init
   ```

4. Restart the API. The dashboard reads stored reviews from PostgreSQL once `DATABASE_URL` is configured.

The schema is in `backend/sql/schema.sql`. Review IDs are unique and imports use upserts, so repeat imports update an existing review rather than creating a duplicate.

## Collecting reviews: permissions and options

The task describes Booking.com API access as unavailable. Booking.com’s current terms say automated scraping/crawling requires prior express written permission. The Guest Review API exists, but is an internal property API and requires a machine account with the `review-api` permission. For those reasons, this project does **not** scrape public property pages, automate a browser, evade bot checks, or claim the fixture is live data.

### Option A: official Guest Review API (preferred when access is granted)

The Node sync command is ready for an authorized machine account. Ask the property’s Booking.com account representative/Connectivity Support whether the account can be granted Guest Review API access, and obtain each numeric property ID and a valid JWT through the approved account process. The page slugs are not property IDs.

Set these values in the private `backend/.env`:

```dotenv
DATABASE_URL=postgresql://...
BOOKING_API_TOKEN=your_machine_account_jwt
BOOKING_REVIEW_PROPERTY_IDS=olympic:123456,potts:234567,central:345678,darling:456789
BOOKING_REVIEW_FROM_DATE=2000-01-01
```

Then run:

```sh
cd backend
npm run sync:booking
```

The sync reads each property’s review pages, follows Booking.com’s `next_page` cursor, retries rate-limit and server failures with backoff, validates responses, and upserts by property plus Booking.com review ID. It avoids saving guest names and reservation IDs. The default date is a full-history backfill; after the initial import, set a suitable overlap date for subsequent runs so edits/new reviews are picked up while IDs remain deduplicated. Schedule the command with your normal trusted job scheduler only after API access is approved. The script has a 1,000-page safety limit per property.

### Option B: permitted CSV import

If the property team can lawfully provide a CSV export from Booking.com or another approved system, save it locally and run:

```sh
cd backend
npm run import:csv -- /path/to/authorized-reviews.csv
```

Required columns (headers are case-insensitive): `property`, `rating`, `date`, and `text`. Optional columns: `review_id`, `title`, `traveller`/`traveller_type`, `country`, `source`. `property` can be one of `olympic`, `potts`, `central`, `darling`, or the matching property name. Dates should use `YYYY-MM-DD`; ratings must be between 0 and 10. The importer skips invalid rows and reports the count. It hashes property/date/rating/title/text if the export has no review ID, and derives topic tags with the same keyword rules used for analysis.

## Architecture

- `frontend/src/Dashboard.jsx`: page composition and dashboard state.
- `frontend/src/components/`: separate metric, property, trend, topic, and review-feed components.
- `frontend/src/data/` and `frontend/src/lib/`: property/topic definitions, the demo fixture, and date/sentiment calculations.
- `frontend/src/style.css`: small responsive stylesheet; the UI uses the project’s existing React/JavaScript stack.
- `backend/src/server.js`: Express API; serves the demo fixture without a database or reads PostgreSQL when configured.
- `backend/scripts/sync-booking-reviews.js`: authorized Review API sync, pagination, bounded retries and idempotent writes.
- `backend/scripts/import-csv.js`: CSV parser and validated database upsert path.
- `backend/src/topics.js`: shared deterministic topic classification rules.
- `backend/sql/schema.sql`: PostgreSQL schema and property/date indexes.

The four internal property codes map as follows:

| Code | Property |
| --- | --- |
| `olympic` | Olympic Hotel Paddington |
| `potts` | Potts Point |
| `central` | Central Sydney |
| `darling` | Darling Harbour |

## KPI and insight definitions

- **This week:** Monday through today, using the computer’s local timezone; compared with the preceding Monday–Sunday week. Average is the arithmetic mean of the review scores in the selected property scope.
- **Positive:** score 8–10; **mixed:** score 7; **negative / needs attention:** score 0–6. These are dashboard groupings, not Booking.com’s own sentiment classification.
- **Topic tags:** a review can have multiple topics. Small transparent keyword lists match mentions for cleanliness, check-in, staff/service, noise, facilities, location, room condition, and value for money. The insight percentage divides low-rated reviews mentioning a topic by all low-rated reviews in the selected period. It is an indicator for human review, not an ML conclusion.
- Filters cover property, trailing 7/30/90 days, topic, and text search. Review comparisons and topic summaries follow the same scope.

## Limitations and assumptions

- There are no live Booking.com reviews in the checked-in sample. The demo records are invented examples, individually marked `SAMPLE` in the feed and flagged by a page banner.
- The official API integration cannot run until Booking.com grants credentials and property IDs. This application cannot grant that permission.
- CSV import assumes an authorized source and a 0–10 score scale. Convert scores to that scale before importing if your source uses a different range.
- Booking.com’s review API can return missing text or score fields; incomplete records are skipped. Some records may be updated after publication; use an overlapping backfill window on repeat syncs.
- Keyword matching can miss synonyms, negation, sarcasm, and non-English feedback. Reviews may match several topics. Staff should validate emerging patterns before acting.
- Guest-written text may contain personal information. Keep the database private, limit access to operations staff, and follow the property group’s retention policy.
- The current app is a local prototype. It does not yet include user authentication, role permissions, scheduled sync hosting, alerting, or production backup/retention controls.

## References

- [Booking.com Terms and Conditions](https://www.booking.com/content/terms.html) — automated scraping requires prior express written permission.
- [Guest Review API overview](https://developers.booking.com/connectivity/docs/review-api) — internal use by properties; requires a machine account with permission.
- [Retrieve reviews API reference](https://developers.booking.com/connectivity/docs/review-api/retrieve-reviews) — property ID, JWT auth, review fields and cursor pagination.
