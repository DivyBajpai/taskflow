# 🚀 cPanel Deployment - Ready!

Your TaskFlow application has been configured for cPanel deployment with **two deployment options**!

## Deployment Options

### 🎯 Option 1: Git Deployment (Recommended) ⭐

**Best for:** Professional deployments, team collaboration, easy updates

Deploy via Git version control with automated builds on every push.

**Quick Start:** [GIT_DEPLOYMENT_QUICKSTART.md](GIT_DEPLOYMENT_QUICKSTART.md)  
**Full Guide:** [GIT_DEPLOYMENT_CPANEL.md](GIT_DEPLOYMENT_CPANEL.md)

**Pros:**
- ✅ **Push to deploy** - No manual file uploads
- ✅ **Automatic builds** - Runs on every push
- ✅ **Version control** - Track all changes
- ✅ **Easy rollback** - Revert with one click
- ✅ **Team friendly** - Multiple developers
- ✅ **Professional** - Industry standard

**Setup:** 5 minutes | **Deploy time:** 30 seconds

### 📦 Option 2: Manual Upload

**Best for:** Quick one-time deployments, limited cPanel features

Build locally and upload via FTP/File Manager.

**Quick Start:** [QUICK_START_CPANEL.md](QUICK_START_CPANEL.md)  
**Full Guide:** [CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md)

**Pros:**
- ✅ Works on any cPanel hosting
- ✅ No Git knowledge required
- ✅ Full control over files

**Setup:** 10 minutes | **Deploy time:** 10 minutes

---

## What's Been Done

### 1. **Server Configuration**
- ✅ Backend now serves frontend static files from `backend/public/`
- ✅ CORS configured to accept your production domain via `CLIENT_URL` env variable
- ✅ Socket.IO updated to work with production domains
- ✅ Client-side routing fully supported (React Router)

### 2. **Frontend Fixes**
- ✅ Removed hardcoded localhost URLs from `WorkspaceContext.jsx`
- ✅ All API calls now use environment variables (`VITE_API_URL`)
- ✅ Created `.env.production` for production configuration
- ✅ Created `.env.development` for development

### 3. **Deployment Files Created**
- ✅ `CPANEL_DEPLOYMENT_GUIDE.md` - Complete comprehensive guide
- ✅ `QUICK_START_CPANEL.md` - Fast-track 5-step deployment
- ✅ `deploy-cpanel.ps1` - Windows build script
- ✅ `deploy-cpanel.sh` - Linux/Mac build script
- ✅ `.cpanel.yml` - Automated Git deployment configuration

### Quick Git Setup

1. **Update [.cpanel.yml](.cpanel.yml)** with your cPanel path (line 11)
2. **Set up Git repository** in cPanel → Git Version Control
3. **Configure Node.js app** in cPanel → Setup Node.js App
4. **Push to deploy:**
   ```bash
   git add .
   git commit -m "Deploy to cPanel"
   git push origin main
   ```
5. **Deploy** in cPanel Git interface → Deploy HEAD Commit

**See:** [GIT_DEPLOYMENT_QUICKSTART.md](GIT_DEPLOYMENT_QUICKSTART.md)

---

## 📦 Alternative: Manual Deployment

### Manual Upload Steps

If your cPanel doesn't support Git:

1. **Update your domain in environment files:**
   - Edit `frontend/.env.production` → Set `VITE_SOCKET_URL`
   - Edit `backend/.env` → Set `CLIENT_URL`

2. **Run the build script:**
   ```powershell
   .\deploy-cpanel.ps1    # Windows
   ./deploy-cpanel.sh     # Linux/Mac
   ```

3. **Upload via FTP/File Manager:**
   - Upload `backend/` folder (including `public/`)
   - Upload `backend/.env` (with your settings)

## ⚙️ Critical Configuration

### Backend Environment Variables (cPanel)
```env
PORT=5000
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-secret
REFRESH_SECRET=your-refresh-secret
CLIENT_URL=https://yourdomain.com     ← UPDATE THIS!
NODE_ENV=production
BREVO_API_KEY=your-brevo-key
EMAIL_USER=your-email
```

### MongoDB Atlas Whitelist
1. Go to MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (allows cPanel servers)
3. Confirm

## 🧪 Test Your Deployment

After deploying:

1. **Homepage:** `https://yourdomain.com` → Login screen
2. **Health Check:** `https://yourdomain.com/api/health` → `{"status":"OK"}`
3. **Upload via FTP/File Manager:**
   - Upload `backend/` folder (including `public/`)
   - Upload `backend/.env` (with your settings)

4. **Configure in cPanel:**
   - Setup Node.js App → Set startup file to `backend/server.js`
   - Add environment variables
   - Run NPM Install → Start App

**See:** [QUICK_START_CPANEL.md](QUICK_START_CPANEL.md)

---

## 📖 Documentation Overview

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[GIT_DEPLOYMENT_QUICKSTART.md](GIT_DEPLOYMENT_QUICKSTART.md)** | Quick Git setup (5 steps) | First-time Git deployment |
| **[GIT_DEPLOYMENT_CPANEL.md](GIT_DEPLOYMENT_CPANEL.md)** | Complete Git guide | Detailed Git deployment |
| **[QUICK_START_CPANEL.md](QUICK_START_CPANEL.md)** | Quick manual setup (5 steps) | First-time manual deployment |
| **[CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md)** | Complete manual guide | Detailed manual deployment |
| **[.cpanel.yml](.cpanel.yml)** | Deployment script | Git deployments only |
| **[backend/.env.example](backend/.env.example)** | Environment template | Setting up .env file |

---

## ⚙️ Configuration Files

### For Git Deployment

**[.cpanel.yml](.cpanel.yml)** - Automated deployment script
```yaml
# Update line 11 with your path:
- export DEPLOYPATH=/home/your-username/public_html/taskflow
```

**[.gitignore](.gitignore)** - Already configured
- Excludes `.env` files (secrets)
- Excludes `node_modules/` (dependencies)
- Excludes `backend/public/` (built files)
- Includes `.env.example` (templates)

### For All Deployments and test features
4. **Real-time:** Test notifications/updates (Socket.IO)

## 📖 Documentation

| File | Purpose |
|------|---------|
| `QUICK_START_CPANEL.md` | 5-step fast deployment |
| `CPANEL_DEPLOYMENT_GUIDE.md` | Comprehensive deployment guide |
| `deploy-cpanel.ps1` | Windows build script |
| `deploy-cpanel.sh` | Linux/Mac build script |
| `.cpanel.yml` | Git deployment automation |

## 🔧 Common Issues

### "Application won't start"
→ Check Node.js version in cPanel (need 18+)  
→ Verify all environment variables are set  
→ Check logs in cPanel Node.js App interface  

### "Blank page"
→ Ensure `public/` folder has frontend files  
→ Run build script before uploading  
→ Clear browser cache  

### "API errors"
→ Update `CLIENT_URL` in backend `.env`  
→ Check CORS configuration  
→ Verify MongoDB connection  

### "MongoDB connection failed"
→ Whitelist 0.0.0.0/0 in MongoDB Atlas  
→ Check connection string format  
→ Test connection from cPanel terminal  

## 💡 Pro Tips

1. **Git Deployment:** If your cPanel supports Git, use `.cpanel.yml` for automated deployments
2. **SSL Certificate:** Ensure SSL is installed for https:// access
3. **Monitoring:** Set up uptime monitoring (UptimeRobot, etc.)
4. **Backups:** Regular backups of MongoDB and application files
5. **Updates:** Keep dependencies updated for security

## 🆘 Need Help?

1. Check the troubleshooting sections in the guides
2. Review cPanel error logs
3. Check MongoDB Atlas connection
4. Verify environment variables are correct
5. Contact your hosting provider for cPanel-specific issues

---

**Ready to deploy?** Start with `QUICK_START_CPANEL.md` for the fastest path to production! 🚀

**Good luck with your deployment!** 🎉
