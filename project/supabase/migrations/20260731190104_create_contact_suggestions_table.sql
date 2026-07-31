/*
  # Create contact_suggestions table

  1. New Tables
    - `contact_suggestions`
      - `id` (uuid, primary key)
      - `job_posting_id` (uuid, references job_postings)
      - `name` (text) - suggested contact's name
      - `role_title` (text) - suggested contact's role at the company
      - `source_url` (text) - the public page where this person/role was found
      - `rationale` (text) - why the agent thinks this person is a relevant contact
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `contact_suggestions` table
    - Users can read contact suggestions for postings that belong to their own
      tracked companies
    - No insert/update/delete policies for authenticated users - this table is
      written only by the backend service role
*/

CREATE TABLE IF NOT EXISTS contact_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  name text NOT NULL,
  role_title text,
  source_url text NOT NULL,
  rationale text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read contact suggestions for own tracked companies"
  ON contact_suggestions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_postings
      JOIN tracked_companies ON tracked_companies.id = job_postings.tracked_company_id
      WHERE job_postings.id = contact_suggestions.job_posting_id
      AND tracked_companies.user_id = auth.uid()
    )
  );
