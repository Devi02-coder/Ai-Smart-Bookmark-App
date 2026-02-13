# 🚀 Quick Setup Guide

## Prerequisites Checklist

Before starting, make sure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] MySQL 8.0+ installed and running
- [ ] npm or yarn installed
- [ ] Supabase account (free tier)
- [ ] Google Cloud Console account (free)
- [ ] Code editor (VS Code recommended)

---

## 5-Minute Local Setup

### Step 1: Install Dependencies (1 min)
```bash
npm install
```

### Step 2: Database Setup (2 min)
```bash
# Start MySQL
mysql -u root -p

# Run in MySQL console:
source schema.sql

# Or manually:
CREATE DATABASE bookmark_app;
USE bookmark_app;
# ... paste schema from schema.sql
```

### Step 3: Environment Variables (1 min)
```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local with your values
# (See detailed instructions below)
```

### Step 4: Start Development Server (1 min)
```bash
npm run dev
```

**Done!** Open http://localhost:3000

---

## Detailed Environment Setup

### 1. Supabase Configuration

#### Create Project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Name: `smart-bookmarks`
4. Database password: [choose strong password]
5. Region: [nearest to you]
6. Click "Create project"

#### Get API Keys
1. Go to Project Settings → API
2. Copy these values to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

#### Enable Google OAuth
1. Go to Authentication → Providers
2. Enable Google
3. **Don't fill Client ID yet** (we'll get it from Google first)

---

### 2. Google OAuth Setup

#### Create OAuth Credentials
1. Go to https://console.cloud.google.com
2. Create new project: `Smart Bookmarks`
3. Go to APIs & Services → Credentials
4. Click "Create Credentials" → "OAuth Client ID"
5. Configure consent screen:
   - User Type: External
   - App name: Smart Bookmark Manager
   - User support email: [your email]
   - Developer contact: [your email]
   - Save and continue
6. Create OAuth Client ID:
   - Application type: Web application
   - Name: Smart Bookmark App
   - Authorized redirect URIs:
     ```
     https://wvroarvlipfmavoiayje.supabase.co/auth/v1/callback
     
     http://localhost:3000/auth/callback
     ```
   - Create

#### Save Credentials
1. Copy Client ID
2. Copy Client Secret
3. Go back to Supabase → Authentication → Providers → Google
4. Paste Client ID and Client Secret
5. Save

---

### 3. MySQL Configuration

Your `.env.local` should have:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=2003
MYSQL_DATABASE=bookmark_app
```

**Verify Connection:**
```bash
mysql -u root -p -e "USE bookmark_app; SHOW TABLES;"
```

You should see:
```
+--------------------------+
| Tables_in_bookmark_app   |
+--------------------------+
| bookmarks                |
+--------------------------+
```

---

### 4. Site URL Configuration

For local development:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production (after deploying to Vercel):
```env
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

---

## Complete .env.local Example

```env
# ---------- SUPABASE ----------
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjE2MTYxNiwiZXhwIjoxOTMxNzM3NjE2fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MTYxNjE2LCJleHAiOjE5MzE3Mzc2MTZ9.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy

# ---------- DATABASE (MySQL) ----------
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=2003
MYSQL_DATABASE=bookmark_app

# ---------- AUTH ----------
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Testing Your Setup

### 1. Start the App
```bash
npm run dev
```

### 2. Test Features

#### ✅ Home Page
- Visit http://localhost:3000
- Should see landing page
- "Sign in with Google" button visible

#### ✅ Google Login
- Click "Sign in with Google"
- Should redirect to Google
- Choose your account
- Should redirect back to /dashboard

#### ✅ Add Bookmark
- Fill in title: "Test Bookmark"
- Fill in URL: "https://example.com"
- Click "Add Bookmark"
- Should appear in list below

#### ✅ AI Features
- Check if bookmark has tags (auto-generated)
- Check if bookmark has summary

#### ✅ Real-time Sync
- Keep one tab open
- Open http://localhost:3000/dashboard in new tab
- Add bookmark in first tab
- Should appear instantly in second tab

#### ✅ Search
- Type in search box
- Results should filter in real-time

#### ✅ Tag Filter
- Select a tag from dropdown
- Only bookmarks with that tag should show

#### ✅ Delete
- Click delete icon on a bookmark
- Should disappear from both tabs instantly

---

## Troubleshooting

### "Failed to connect to MySQL"
```bash
# Check if MySQL is running
sudo systemctl status mysql
# or
brew services list | grep mysql

# Start MySQL if not running
sudo systemctl start mysql
# or
brew services start mysql
```

### "Redirect URI mismatch"
1. Check Google Console redirect URI exactly matches:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```
2. No trailing slash
3. Use the correct Supabase project ID

### "Invalid API key"
1. Double-check you copied the entire key
2. Make sure you're using `anon` key for NEXT_PUBLIC_SUPABASE_ANON_KEY
3. Make sure you're using `service_role` key for SUPABASE_SERVICE_ROLE_KEY

### "Cannot find module"
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Port 3000 already in use"
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

---

## Development Workflow

### Making Changes
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# Test locally

# Commit
git add .
git commit -m "Add new feature"

# Push
git push origin feature/new-feature

# Create pull request on GitHub
```

### Running Production Build Locally
```bash
npm run build
npm start
```

---

## Next Steps

After successful local setup:

1. ✅ Test all features thoroughly
2. 📝 Read DEPLOYMENT.md for production deployment
3. 🚀 Deploy to Vercel
4. 🎨 Customize styling and branding
5. 🤖 Replace mock AI with real AI API (optional)
6. 📊 Add analytics (optional)

---

## Getting Help

### Resources
- README.md - Full documentation
- DEPLOYMENT.md - Production deployment guide
- schema.sql - Database structure
- .env.example - Environment template

### Common Commands
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run linter
npm run lint
```

### Support
- Check GitHub issues
- Review Next.js docs
- Check Supabase docs
- Review MySQL docs

---

## Congratulations! 🎉

You're all set up and ready to develop!

**Happy coding!** 🚀
