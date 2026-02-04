# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Name: `cricket-scorer` (or your preferred name)
   - Database Password: (generate a strong password)
   - Region: Choose closest to your location
5. Wait for project to be created (~2 minutes)

## 2. Create the Database Table

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New Query"
3. Paste the following SQL and click "Run":

```sql
-- Create matches table
CREATE TABLE matches (
  id BIGSERIAL PRIMARY KEY,
  match_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL,
  match_state JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on match_code for faster lookups
CREATE INDEX idx_matches_match_code ON matches(match_code);

-- Create index on created_by for user's matches
CREATE INDEX idx_matches_created_by ON matches(created_by);

-- Enable Row Level Security
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view matches (for spectators)
CREATE POLICY "Anyone can view matches"
ON matches FOR SELECT
USING (true);

-- Policy: Authenticated users can create matches
CREATE POLICY "Authenticated users can create matches"
ON matches FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Policy: Only creator can update their match
CREATE POLICY "Only creator can update match"
ON matches FOR UPDATE
USING (auth.uid() = created_by);

-- Policy: Only creator can delete their match
CREATE POLICY "Only creator can delete match"
ON matches FOR DELETE
USING (auth.uid() = created_by);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function
CREATE TRIGGER update_matches_updated_at
BEFORE UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

## 3. Enable Realtime

1. Go to **Database** → **Replication** in your Supabase dashboard
2. Find the `matches` table
3. Toggle **Enable Realtime** to ON

## 4. Enable Anonymous Authentication

1. Go to **Authentication** → **Providers**
2. Find **Anonymous Sign-ins**
3. Toggle it to **Enabled**
4. Click **Save**

## 5. Get Your API Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## 6. Add Credentials to Your App

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace the placeholder values with your actual credentials from step 5.

## 7. Install Dependencies

Run in your terminal:

```bash
npm install @supabase/supabase-js
```

## 8. Test the Connection

After completing all steps, restart your dev server:

```bash
npm run dev
```

The app should now be able to connect to Supabase!

## Security Notes

- The anonymous authentication allows anyone to create matches without signing up
- Row-level security ensures only the match creator can update/delete their match
- Anyone can view matches (needed for spectators)
- Match codes are unique and randomly generated
- Realtime subscriptions are automatically authenticated

## Troubleshooting

**Issue: "User not authenticated" error**
- Make sure Anonymous Sign-ins are enabled in Authentication settings
- Check that your API keys are correct in the `.env` file

**Issue: "Permission denied" when creating match**
- Verify Row Level Security policies are created correctly
- Check that Anonymous authentication is enabled

**Issue: Real-time updates not working**
- Ensure Realtime is enabled for the `matches` table
- Check browser console for WebSocket connection errors
