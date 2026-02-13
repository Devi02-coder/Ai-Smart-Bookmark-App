# ⚡ Quick Start Guide

Get your Smart Bookmark App running in **5 minutes**!

---

## 📦 What You'll Need

- Node.js 18+ ([Download](https://nodejs.org))
- MySQL 8.0+ ([Download](https://dev.mysql.com/downloads/))
- Supabase Account ([Sign Up Free](https://supabase.com))
- Google Cloud Account ([Sign Up Free](https://console.cloud.google.com))

---

## 🚀 5-Minute Setup

### Step 1: Install Dependencies (1 min)

```bash
npm install
```

### Step 2: Database Setup (1 min)

```bash
# Login to MySQL
mysql -u root -p

# Run schema
source schema.sql

# Verify
SHOW TABLES;
```

Expected output:
```
+--------------------------+
| Tables_in_bookmark_app   |
+--------------------------+
| bookmarks                |
+--------------------------+
```

### Step 3: Supabase Setup (1 min)

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create new project: "smart-bookmarks"
3. Go to Settings → API
4. Copy your keys

### Step 4: Google OAuth (1 min)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → APIs & Services → Credentials
3. OAuth Client ID → Web Application
4. Add redirect URI: `https://supabase.com/dashboard/project/wvroarvlipfmavoiayje`
5. Copy Client ID and Secret
6. Paste in Supabase → Authentication → Providers → Google

### Step 5: Environment Variables (30 sec)

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=2003
MYSQL_DATABASE=bookmark_app

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 6: Start Development Server (30 sec)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## ✅ Verify It Works

1. **See landing page** with "Sign in with Google" button
2. **Click sign in** → redirects to Google
3. **Choose account** → redirects to dashboard
4. **Add bookmark** → appears in list
5. **Open new tab** → bookmark syncs instantly!

---

## 🐛 Troubleshooting

### "Cannot connect to MySQL"
```bash
# Start MySQL
sudo systemctl start mysql
# or
brew services start mysql
```

### "Redirect URI mismatch"
Double-check Google OAuth redirect exactly matches:
```
https://wvroarvlipfmavoiayje.supabase.co/auth/v1/callback

```

### "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Next Steps

- **Test features**: Add, delete, search bookmarks
- **Open multiple tabs**: Test real-time sync
- **Read [README.md](README.md)**: Full documentation
- **Deploy to Vercel**: See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🎯 Key Features to Test

| Feature | Test |
|---------|------|
| **Add Bookmark** | Fill form, click add |
| **AI Tags** | Check auto-generated tags |
| **Real-time** | Open 2 tabs, add in one |
| **Search** | Type in search box |
| **Filter** | Select tag from dropdown |
| **Delete** | Click delete icon |
| **Privacy** | Login with 2 accounts |

---

## 📞 Need Help?

- **Setup Issues**: Check [SETUP.md](SETUP.md)
- **Architecture**: Read [ARCHITECTURE.md](ARCHITECTURE.md)
- **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Testing**: Review [TESTING.md](TESTING.md)

---

## 🎓 Learning Path

1. ✅ Get it running locally
2. ✅ Understand the architecture
3. ✅ Test all features
4. ✅ Deploy to production
5. ✅ Share with users
6. ✅ Iterate and improve

---

**Happy coding!** 🚀

You're now running a production-ready AI bookmark manager!
