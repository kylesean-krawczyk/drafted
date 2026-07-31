/*
  # Create tracked_companies table

  1. New Tables
    - `tracked_companies`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `company_name` (text) - name of the company being tracked
      - `career_page_url` (text) - url of the company's careers page to scan
      - `scan_frequency` (text) - daily, weekly
      - `is_active` (boolean) - whether scanning is currently enabled
      - `last_scanned_at` (timestamptz) - last time a scan completed for this company
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `tracked_companies` table
    - Users can CRUD their own tracked companies
*/

CREATE TABLE IF NOT EXISTS tracked_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  career_page_url text NOT NULL,
  scan_frequency text DEFAULT 'daily',
  is_active boolean DEFAULT true,
  last_scanned_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tracked_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tracked companies"
  ON tracked_companies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracked companies"
  ON tracked_companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracked companies"
  ON tracked_companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracked companies"
  ON tracked_companies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
