/*
  # Create scan_logs table

  1. New Tables
    - `scan_logs`
      - `id` (uuid, primary key)
      - `tracked_company_id` (uuid, references tracked_companies)
      - `scanned_at` (timestamptz)
      - `status` (text) - success, error, no_change
      - `postings_found` (integer) - total postings found during the scan
      - `new_postings_found` (integer) - postings not previously seen
      - `relevant_postings_found` (integer) - postings that passed the relevance filter
      - `error_message` (text) - populated when status is error

  2. Security
    - Enable RLS on `scan_logs` table
    - Users can read scan logs that belong to their own tracked companies
    - No insert/update/delete policies for authenticated users - this table is
      written only by the backend service role
*/

CREATE TABLE IF NOT EXISTS scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_company_id uuid NOT NULL REFERENCES tracked_companies(id) ON DELETE CASCADE,
  scanned_at timestamptz DEFAULT now(),
  status text NOT NULL,
  postings_found integer DEFAULT 0,
  new_postings_found integer DEFAULT 0,
  relevant_postings_found integer DEFAULT 0,
  error_message text
);

ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read scan logs for own tracked companies"
  ON scan_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tracked_companies
      WHERE tracked_companies.id = scan_logs.tracked_company_id
      AND tracked_companies.user_id = auth.uid()
    )
  );
