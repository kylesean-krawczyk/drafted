/*
  # Create jobs table

  1. New Tables
    - `jobs`
      - `id` (uuid, primary key)
      - `title` (text) - job title
      - `company` (text) - company name
      - `company_logo_url` (text)
      - `location` (text)
      - `work_type` (text) - remote, hybrid, onsite
      - `employment_type` (text) - full-time, part-time, contract
      - `salary_min` (integer)
      - `salary_max` (integer)
      - `description` (text)
      - `requirements` (text array)
      - `benefits` (text array)
      - `category` (text) - engineering, design, marketing, etc.
      - `posted_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `is_active` (boolean)
      - `external_url` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `jobs` table
    - Authenticated users can read all active jobs
*/

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  company_logo_url text DEFAULT '',
  location text DEFAULT '',
  work_type text DEFAULT 'remote',
  employment_type text DEFAULT 'full-time',
  salary_min integer DEFAULT 0,
  salary_max integer DEFAULT 0,
  description text DEFAULT '',
  requirements text[] DEFAULT '{}',
  benefits text[] DEFAULT '{}',
  category text DEFAULT '',
  posted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  external_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (is_active = true);
