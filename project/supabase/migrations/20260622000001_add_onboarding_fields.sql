ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS background_story text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_text text DEFAULT '';
