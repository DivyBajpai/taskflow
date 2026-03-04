# Git Deployment Quick Reference

## ✅ Yes! You can deploy to cPanel using Git!

Your project is **fully configured** for Git deployment to cPanel. See **[GIT_DEPLOYMENT_CPANEL.md](GIT_DEPLOYMENT_CPANEL.md)** for the complete guide.

## Quick Setup (5 Steps)

### 1. Check Git Support
- Log into cPanel
- Search for **"Git Version Control"**
- If available, you're ready! ✅

### 2. Update .cpanel.yml
Edit [.cpanel.yml](.cpanel.yml) line 11:
```yaml
- export DEPLOYPATH=/home/your-username/public_html/taskflow
```
Change to your actual cPanel path!

### 3. Create Git Repository in cPanel
1. cPanel → **Git Version Control** → **Create**
2. **Clone URL**: Your GitHub/GitLab repo URL
3. **Repository Path**: `/home/username/repositories/taskflow`
4. **Deployment Path**: `/home/username/public_html/taskflow`
5. Click **Create**

### 4. Set Up Node.js App
1. cPanel → **Setup Node.js App** → **Create Application**
2. **Application root**: `/home/username/public_html/taskflow/backend`
3. **Application startup file**: `server.js`
4. **Node.js version**: 18.x+
5. Add environment variables (see [backend/.env.example](backend/.env.example))
6. Click **Create**

### 5. Deploy!
```bash
# On your computer
git add .
git commit -m "Deploy to cPanel"
git push origin main

# In cPanel
# Go to Git Version Control → Manage → Deploy HEAD Commit
```

The `.cpanel.yml` automatically:
- ✅ Builds frontend
- ✅ Copies to backend/public/
- ✅ Installs dependencies
- ✅ Restarts your app

## Auto-Deploy with Webhooks (Optional)

Connect GitHub/GitLab webhook for automatic deployment on every push!

1. Get webhook URL from cPanel Git interface
2. Add to GitHub: **Settings** → **Webhooks** → **Add webhook**
3. Push to deploy automatically! 🎉

## What's Configured

| File | Purpose |
|------|---------|
| [.cpanel.yml](.cpanel.yml) | Automated deployment script |
| [.gitignore](.gitignore) | Ignores .env and build files |
| [backend/.env.example](backend/.env.example) | Template for environment variables |
| [GIT_DEPLOYMENT_CPANEL.md](GIT_DEPLOYMENT_CPANEL.md) | Complete Git deployment guide |

## Workflow

```
Your Computer       GitHub/GitLab       cPanel
─────────────       ─────────────       ──────

1. git commit
2. git push ──────▶ Stores code ──────▶ 3. Webhook triggers
                                        4. Pulls latest
                                        5. Runs .cpanel.yml
                                        6. App restarts
                                        7. ✅ Live!
```

## Important Notes

⚠️ **Never commit these files:**
- `backend/.env` (contains secrets)
- `frontend/dist/` (built files)
- `backend/public/` (generated during deployment)
- `node_modules/` (dependencies)

✅ **Always commit:**
- Source code
- Package.json files
- `.cpanel.yml` (deployment script)
- `.env.example` (templates)

## Benefits of Git Deployment

| Feature | Manual | Git |
|---------|--------|-----|
| **Speed** | 15 min | 30 sec |
| **Rollback** | ❌ | ✅ |
| **Version History** | ❌ | ✅ |
| **Team Collab** | ❌ | ✅ |
| **Automated** | ❌ | ✅ |

## Need Help?

- **Complete Guide**: [GIT_DEPLOYMENT_CPANEL.md](GIT_DEPLOYMENT_CPANEL.md)
- **Manual Deployment**: [QUICK_START_CPANEL.md](QUICK_START_CPANEL.md)
- **Detailed Info**: [CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md)

---

**Ready to deploy? Check out [GIT_DEPLOYMENT_CPANEL.md](GIT_DEPLOYMENT_CPANEL.md)!** 🚀
