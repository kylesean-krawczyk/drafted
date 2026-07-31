CREATE TABLE IF NOT EXISTS target_orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  career_page_url text DEFAULT '',
  reason text DEFAULT '',
  status text DEFAULT 'researching',
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE target_orgs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own target orgs"
  ON target_orgs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
