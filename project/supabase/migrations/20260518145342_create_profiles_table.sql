/*
  # Create profiles table

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `headline` (text) - professional headline
      - `summary` (text) - brief professional summary
      - `location` (text)
      - `desired_role` (text)
      - `desired_salary_min` (integer)
      - `desired_salary_max` (integer)
      - `work_type` (text) - remote, hybrid, onsite
      - `experience_years` (integer)
      - `skills` (text array)
      - `resume_url` (text)
      - `linkedin_url` (text)
      - `portfolio_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `profiles` table
    - Users can read and update their own profile
    - Users can insert their own profile
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  headline text DEFAULT '',
  summary text DEFAULT '',
  location text DEFAULT '',
  desired_role text DEFAULT '',
  desired_salary_min integer DEFAULT 0,
  desired_salary_max integer DEFAULT 0,
  work_type text DEFAULT 'remote',
  experience_years integer DEFAULT 0,
  skills text[] DEFAULT '{}',
  resume_url text DEFAULT '',
  linkedin_url text DEFAULT '',
  portfolio_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
