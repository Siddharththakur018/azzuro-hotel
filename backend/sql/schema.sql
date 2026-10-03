CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  property TEXT NOT NULL CHECK (property IN ('olympic', 'potts', 'central', 'darling')),
  rating NUMERIC(3,1) NOT NULL CHECK (rating >= 0 AND rating <= 10),
  review_date DATE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL,
  traveller TEXT NOT NULL DEFAULT 'Guest',
  country TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'authorized_import',
  topics TEXT[] NOT NULL DEFAULT '{}',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reviews_property_date_idx ON reviews (property, review_date DESC);
CREATE INDEX IF NOT EXISTS reviews_date_idx ON reviews (review_date DESC);
