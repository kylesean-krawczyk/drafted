/*
  # Create job_postings table

  1. New Tables
    - `job_postings`
      - `id` (uuid, primary key)
      - `tracked_company_id` (uuid, references tracked_companies)
      - `title` (text) - job title as scraped from the career page
      - `url` (text) - direct link to the posting
      - `location` (text)
      - `description_snippet` (text) - short excerpt of the posting description
      - `posting_hash` (text) - stable hash of title+url used for de-duping across scans
      - `first_seen_at` (timestamptz) - when this posting was first discovered
      - `is_new` (boolean) - flips to false once the user has been notified
      - `relevance_score` (integer) - 0-100, set by the relevance filter
      - `relevance_reasoning` (text) - short explanation of the relevance score
      - `is_relevant` (boolean) - final pass/fail after scoring

  2. Security
    - Enable RLS on `job_postings` table
    - Users can read job postings that belong to their own tracked companies
    - No insert/update/delete policies for authenticated users - this table is
      written only by the backend service role
*/

CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_company_id uuid NOT NULL REFERENCES tracked_companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  location text,
  description_snippet text,
  posting_hash text NOT NULL,
  first_seen_at timestamptz DEFAULT now(),
  is_new boolean DEFAULT true,
  relevance_score integer,
  relevance_reasoning text,
  is_relevant boolean,
  UNIQUE(tracked_company_id, posting_hash)
);

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read job postings for own tracked companies"
  ON job_postings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tracked_companies
      WHERE tracked_companies.id = job_postings.tracked_company_id
      AND tracked_companies.user_id = auth.uid()
    )
  );
