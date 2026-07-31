/*
  # Create job_search_preferences table

  1. New Tables
    - `job_search_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, unique) - one preferences row per user
      - `target_titles` (text array) - e.g. "Product Manager", "Platform Engineering PM"
      - `seniority_level` (text) - e.g. mid, senior, director
      - `remote_preference` (text) - remote, hybrid, onsite, any
      - `must_have_keywords` (text array)
      - `exclude_keywords` (text array)
      - `additional_context` (text) - free text, e.g. background and candidacy notes
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `job_search_preferences` table
    - Users can CRUD their own preferences
*/

CREATE TABLE IF NOT EXISTS job_search_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  target_titles text[] DEFAULT '{}',
  seniority_level text,
  remote_preference text DEFAULT 'any',
  must_have_keywords text[] DEFAULT '{}',
  exclude_keywords text[] DEFAULT '{}',
  additional_context text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE job_search_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own job search preferences"
  ON job_search_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job search preferences"
  ON job_search_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job search preferences"
  ON job_search_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own job search preferences"
  ON job_search_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
