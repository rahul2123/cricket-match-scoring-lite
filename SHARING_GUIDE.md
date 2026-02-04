# Real-Time Score Sharing - User Guide

## Overview

You can now share your cricket match in real-time with spectators! They can view live score updates on their own devices as you score.

## Setup Required

Before using this feature, you need to set up Supabase (free tier available):

1. **Follow the setup guide**: See `SUPABASE_SETUP.md` for detailed instructions
2. **Create a `.env` file** with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
3. **Restart the dev server** after adding credentials

## How to Share a Match

### As a Scorer:

1. Start scoring your match as usual
2. Click the **"Share Match"** button (below the action buttons)
3. Click **"Start Sharing"** in the dialog
4. You'll get a **6-character match code** (e.g., "ABC123")
5. Share this code with spectators via:
   - **Match Code**: They can enter it manually
   - **Share URL**: Copy and send the full URL

### While Sharing:

- The button will show **"✓ Sharing Match"** (green)
- Footer will show **"Sharing: ABC123"**
- Continue scoring normally - all updates sync in real-time
- Click **"Share Match"** again to view/copy the code
- Click **"Stop Sharing"** to end the session

## How to View a Match

### As a Spectator:

**Option 1: Using the URL**
1. Open the share URL sent by the scorer
2. The match will load automatically

**Option 2: Using the Match Code**
1. Open the app
2. A "Join Match" dialog will appear (or you can manually enter a URL like `?match=ABC123`)
3. Enter the 6-character code
4. Click **"Join Match"**

### While Viewing:

- All scoring buttons are **disabled** (read-only mode)
- You'll see **"👁️ Viewing Mode - Read Only"** indicator
- Footer shows **"Viewing: ABC123"**
- Scores update in **real-time** (within 1-2 seconds)
- Click **"New Match"** to exit viewing mode

## Features

✅ **Real-time sync** - Updates appear instantly  
✅ **Multiple viewers** - Unlimited spectators can watch  
✅ **Offline fallback** - Local scoring still works without sharing  
✅ **Auto-save** - Match state persists in localStorage  
✅ **Secure** - Only the creator can update the match  

## Troubleshooting

**"Failed to share match"**
- Check that your `.env` file has correct Supabase credentials
- Verify Supabase project is set up correctly (see `SUPABASE_SETUP.md`)
- Check browser console for errors

**"Match not found"**
- Verify the match code is correct (6 characters)
- The scorer may have stopped sharing
- The match may have expired

**Updates not appearing**
- Check your internet connection
- Verify Realtime is enabled in Supabase dashboard
- Try refreshing the page

## Privacy & Security

- Matches are **publicly viewable** by anyone with the code
- Only the **creator** can update/delete the match
- Match codes are **randomly generated** and unique
- No personal information is collected

## Tips

- Share the URL for easiest access (one-click join)
- Match codes are case-insensitive
- Stopping sharing deletes the match from the server
- Starting a new match automatically stops sharing

Enjoy sharing your cricket matches! 🏏
