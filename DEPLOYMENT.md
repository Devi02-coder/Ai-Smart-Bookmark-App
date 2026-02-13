# 🚀 Deployment Guide

## Step-by-Step Deployment to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Production MySQL database
- Supabase project configured

---

## 1. Prepare Your Code

### Push to GitHub
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Production-ready smart bookmark app"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/smart-bookmark-app.git
git branch -M main
git push -u origin main
```

---

## 2. Set Up Production Database

### Option A: PlanetScale (Recommended)

1. Go to [PlanetScale](https://planetscale.com/)
2. Sign up for free account
3. Create new database: `bookmark_app`
4. Go to "Console" tab
5. Run the schema:
```sql
CREATE TABLE IF NOT EXISTS bookmarks (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  summary TEXT,
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```
6. Get connection details:
   - Host
   - Username
   - Password

### Option B: Railway

1. Go to [Railway](https://railway.app/)
2. Create new project
3. Add MySQL database
4. Copy connection URL
5. Connect and run schema

### Option C: AWS RDS

1. Create MySQL 8.0 instance
2. Configure security groups
3. Connect and run schema
4. Note connection details

---

## 3. Deploy to Vercel

### Import Project

1. Go to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### Configure Environment Variables

In Vercel project settings, add these:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# MySQL Production
MYSQL_HOST=your-production-host.com
MYSQL_PORT=3306
MYSQL_USER=your_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=bookmark_app

# Site URL (will be your Vercel URL)
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

### Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Copy your deployment URL

---

## 4. Update OAuth Redirect

### Update Supabase
1. Go to Supabase Dashboard
2. Authentication → URL Configuration
3. Add Site URL: `https://your-app.vercel.app`
4. Add Redirect URLs: `https://your-app.vercel.app/**`

### Update Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Edit your OAuth Client
4. Add to Authorized Redirect URIs:
   ```
   https://<your-project>.supabase.co/auth/v1/callback
   https://your-app.vercel.app/auth/callback
   ```
5. Save

---

## 5. Test Production Deployment

### Checklist
- [ ] Visit your Vercel URL
- [ ] Click "Sign in with Google"
- [ ] Verify redirect works
- [ ] Add a bookmark
- [ ] Check MySQL database (bookmark should be there)
- [ ] Open second tab
- [ ] Verify real-time sync works
- [ ] Test search functionality
- [ ] Test tag filtering
- [ ] Delete a bookmark
- [ ] Verify deletion syncs

---

## 6. Custom Domain (Optional)

### Add Custom Domain in Vercel
1. Go to Project Settings → Domains
2. Add your domain: `bookmarks.yourdomain.com`
3. Follow DNS configuration instructions
4. Wait for DNS propagation

### Update Environment Variable
```env
NEXT_PUBLIC_SITE_URL=https://bookmarks.yourdomain.com
```

### Update OAuth Redirects
Add your custom domain to:
- Supabase URL Configuration
- Google OAuth Authorized Redirect URIs

---

## 7. Monitoring & Analytics

### Vercel Analytics
1. Enable in Project Settings
2. View real-time usage
3. Monitor performance

### Database Monitoring
- PlanetScale: Built-in insights
- Railway: Metrics tab
- AWS RDS: CloudWatch

---

## 8. Continuous Deployment

### Automatic Deployments
- Push to `main` branch → Auto-deploy to production
- Pull requests → Preview deployments
- Branches → Preview URLs

### Workflow
```bash
# Make changes
git add .
git commit -m "Add new feature"
git push

# Vercel automatically deploys
# Visit deployment in Vercel dashboard
```

---

## Troubleshooting

### Build Fails

**Check:**
- Environment variables are set
- No TypeScript errors locally
- Dependencies are correct

**Solution:**
```bash
# Test build locally
npm run build

# Check logs in Vercel dashboard
```

### Database Connection Fails

**Check:**
- MySQL host is accessible from Vercel
- Username/password are correct
- Database name matches
- Firewall allows connections

**Solution:**
- Whitelist Vercel IPs (0.0.0.0/0 for serverless)
- Use connection pooling
- Check MySQL error logs

### OAuth Not Working

**Check:**
- Redirect URIs match exactly
- No trailing slashes
- HTTPS (not HTTP)
- NEXT_PUBLIC_SITE_URL is correct

**Solution:**
- Re-verify all OAuth settings
- Clear browser cache
- Test in incognito mode

### Realtime Not Syncing

**Check:**
- SUPABASE_SERVICE_ROLE_KEY is set
- User channels are correct
- Broadcasts are triggered after MySQL write

**Solution:**
- Check Vercel function logs
- Verify Supabase API logs
- Test locally first

---

## Performance Optimization

### Database Indexes
Already included in schema:
- `idx_user_id` for fast user queries
- `idx_created_at` for sorting

### Vercel Edge Config (Advanced)
```javascript
// next.config.js
module.exports = {
  experimental: {
    runtime: 'edge', // For API routes
  }
}
```

### CDN Caching
Static assets automatically cached by Vercel

---

## Security Checklist

- [x] Environment variables in Vercel (not in code)
- [x] Service role key server-side only
- [x] MySQL credentials secure
- [x] HTTPS enforced
- [x] OAuth redirect URIs validated
- [x] SQL injection protection (parameterized queries)
- [x] User isolation enforced

---

## Cost Estimates

### Free Tier (Suitable for Demo)
- **Vercel**: Free (Hobby plan)
- **Supabase**: Free (500MB database, 2GB bandwidth)
- **PlanetScale**: Free (5GB storage, 1 billion row reads)

### Production (10,000+ users)
- **Vercel**: Pro ($20/month)
- **Supabase**: Pro ($25/month)
- **PlanetScale**: Scaler ($39/month)
- **Total**: ~$84/month

---

## Backup Strategy

### Database Backups
- **PlanetScale**: Automatic daily backups
- **Railway**: Manual backup via CLI
- **AWS RDS**: Automatic snapshots

### Code Backups
- GitHub (automatic)
- Vercel keeps deployment history

---

## Scaling Considerations

### Database
- Add read replicas for heavy traffic
- Implement caching layer (Redis)
- Partition by user_id for massive scale

### API
- Vercel auto-scales
- Consider rate limiting
- Implement request caching

### Realtime
- Supabase handles scaling
- Consider dedicated realtime server for 100k+ users

---

## Post-Deployment

### Share Your App
```
Live URL: https://your-app.vercel.app
Source Code: https://github.com/yourusername/smart-bookmark-app
```

### Monitor Usage
- Check Vercel analytics daily
- Review error logs weekly
- Monitor database performance

### Collect Feedback
- Add user feedback form
- Monitor user behavior
- Iterate based on insights

---

## Success! 🎉

Your Smart Bookmark App is now live and production-ready!

**Next Steps:**
1. Share with friends and colleagues
2. Add to your portfolio
3. Monitor performance
4. Collect user feedback
5. Iterate and improve

**Need Help?**
- Check Vercel documentation
- Review Supabase guides
- Open GitHub issue
- Contact support channels
