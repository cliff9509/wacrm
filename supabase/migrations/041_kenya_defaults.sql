-- Migration 041: New-account defaults only. Existing stored values are never converted.
ALTER TABLE accounts ALTER COLUMN default_currency SET DEFAULT 'KES';
ALTER TABLE deals ALTER COLUMN currency SET DEFAULT 'KES';
