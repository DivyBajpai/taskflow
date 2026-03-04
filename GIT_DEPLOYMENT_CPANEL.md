# Git Deployment to cPanel - Complete Guide

## Overview

Git deployment is the **best way** to deploy your TaskFlow application to cPanel. It provides:
- ✅ **Version control** - Track all changes
- ✅ **Easy updates** - Just push to deploy
- ✅ **Automated builds** - Builds run automatically
- ✅ **Rollback capability** - Revert to previous versions easily
- ✅ **No manual file uploads** - Everything happens via Git

## Prerequisites

### Check if Your cPanel Supports Git

1. Log into your cPanel
2. Search for **"Git Version Control"** in the search bar
3. If you see it, you're good to go! ✅
4. If not, check with your hosting provider

> **Note:** Most modern cPanel hosting (CloudLinux with cPanel 11.90+) supports Git deployments.

## Deployment Method Options

### Method 1: Direct Git Repository (Recommended)
Use cPanel's built-in Git Version Control feature.

### Method 2: GitHub/GitLab Auto-Deploy
Connect your GitHub/GitLab repo for automatic deployments.

---

## Method 1: Direct Git Repository in cPanel

### Step 1: Set Up Git Repository

#### Option A: Clone Existing Repository (If on GitHub/GitLab)

1. Go to cPanel → **Git Version Control**
2. Click **"Create"**
3. Configure:
   - **Clone URL**: Your repository URL
     ```
     https://github.com/yourusername/taskflow.git
     ```
   - **Repository Path**: `/home/username/repositories/taskflow`
   - **Repository Name**: `taskflow`
4. If private repo, add:
   - SSH Key (generated in cPanel)
   - Or use: `https://username:token@github.com/yourusername/taskflow.git`
5. Click **"Create"**

#### Option B: Create New Repository in cPanel

1. Create empty repository in cPanel Git Version Control
2. Clone to your local machine:
   ```bash
   git clone ssh://username@yourdomain.com/home/username/repositories/taskflow.git
   ```
3. Push your code:
   ```bash
   cd taskflow
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

### Step 2: Set Up Deployment Path

1. In cPanel → **Git Version Control**
2. Click **"Manage"** on your repository
3. Set **Deployment Path**:
   ```
   /home/username/public_html/taskflow
   ```
   Or wherever your Node.js app root is
4. Click **"Update"**

### Step 3: Configure .cpanel.yml (Already Created!)

The `.cpanel.yml` file I created tells cPanel how to build your app after each push:

```yaml
---
deployment:
  tasks:
    # Install frontend dependencies and build
    - export DEPLOYPATH=/home/your-username/public_html/taskflow
    - cd $DEPLOYPATH/frontend
    - npm install
    - npm run build
    
    # Copy built frontend to backend public folder
    - mkdir -p $DEPLOYPATH/backend/public
    - cp -r $DEPLOYPATH/frontend/dist/* $DEPLOYPATH/backend/public/
    
    # Install backend dependencies
    - cd $DEPLOYPATH/backend
    - npm install --production
    
    # Restart Node.js application
    - /usr/bin/cloudlinux-selector restart-webapp --json --interpreter nodejs --app-root $DEPLOYPATH/backend
```

**Important:** Update `/home/your-username/public_html/taskflow` with your actual path!

### Step 4: Set Up Node.js Application in cPanel

Before deploying, configure the Node.js app:

1. Go to cPanel → **Setup Node.js App**
2. Click **"Create Application"**
3. Configure:
   - **Node.js version**: 18.x or higher
   - **Application mode**: Production
   - **Application root**: `/home/username/public_html/taskflow/backend`
   - **Application URL**: Your domain/subdomain
   - **Application startup file**: `server.js`
4. Add **Environment Variables**:
   ```
   PORT=5000
   MONGODB_URI=your-mongodb-uri
   JWT_SECRET=your-jwt-secret
   REFRESH_SECRET=your-refresh-secret
   CLIENT_URL=https://yourdomain.com
   NODE_ENV=production
   BREVO_API_KEY=your-brevo-key
   EMAIL_USER=your-email
   ```
5. Click **"Create"**

### Step 5: Deploy via Git

1. Make changes to your code locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. In cPanel → **Git Version Control** → **Manage**
4. Click **"Pull or Deploy"** → **"Deploy HEAD Commit"**
5. The `.cpanel.yml` script runs automatically:
   - Builds frontend
   - Copies to backend/public
   - Installs dependencies
   - Restarts Node.js app

### Step 6: Verify Deployment

- Visit: `https://yourdomain.com`
- Test: `https://yourdomain.com/api/health`
- Check logs in Node.js App interface

---

## Method 2: GitHub/GitLab Auto-Deploy Webhook

For automatic deployments on every push to GitHub/GitLab:

### Step 1: Set Up Git in cPanel (Same as Method 1, Step 1)

### Step 2: Get Deployment URL

1. In cPanel → **Git Version Control** → **Manage**
2. Find the **"Deployment URL"** or **"Webhook URL"**
3. Copy it (looks like):
   ```
   https://yourdomain.com:2083/cpsess###/execute/VersionControl/deploy?repository_root=...
   ```

### Step 3: Configure GitHub Webhook

1. Go to your GitHub repository
2. **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: Paste the cPanel deployment URL
   - **Content type**: `application/json`
   - **Secret**: (optional, for security)
   - **Events**: Just the push event
4. Click **"Add webhook"**

### Step 4: Configure GitLab Webhook (Alternative)

1. Go to your GitLab repository
2. **Settings** → **Webhooks**
3. Configure:
   - **URL**: Paste the cPanel deployment URL
   - **Trigger**: Push events
   - **SSL verification**: Enable
4. Click **"Add webhook"**

### Step 5: Test Auto-Deploy

1. Make a change locally
2. Push to GitHub/GitLab:
   ```bash
   git push origin main
   ```
3. Watch it automatically deploy to cPanel! 🎉

---

## Detailed Workflow

```
Your Computer              GitHub/GitLab              cPanel Server
──────────────             ─────────────              ─────────────

1. Make changes
2. git commit
3. git push origin main ──────────────▶ Receives push ──────────▶ Webhook triggers
                                        Stores code               4. Pulls latest code
                                                                  5. Runs .cpanel.yml:
                                                                     - npm install
                                                                     - npm run build
                                                                     - Copy files
                                                                     - Restart app
                                                                  6. ✅ Live!
```

---

## Important Configuration Files

### 1. .cpanel.yml (Root of repository)

Already created! Update the path:

```yaml
---
deployment:
  tasks:
    - export DEPLOYPATH=/home/your-username/public_html/taskflow  # ← CHANGE THIS
    - cd $DEPLOYPATH/frontend
    - npm install
    - npm run build
    - mkdir -p $DEPLOYPATH/backend/public
    - cp -r $DEPLOYPATH/frontend/dist/* $DEPLOYPATH/backend/public/
    - cd $DEPLOYPATH/backend
    - npm install --production
    - /usr/bin/cloudlinux-selector restart-webapp --json --interpreter nodejs --app-root $DEPLOYPATH/backend
```

### 2. .gitignore

Make sure you're **NOT** committing sensitive files:

```gitignore
# Dependencies
node_modules/
frontend/node_modules/
backend/node_modules/

# Environment files
.env
.env.local
.env.production
.env.development

# Build outputs
frontend/dist/
frontend/build/
backend/public/

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db
```

### 3. Environment Files

**Never commit .env files with secrets!**

Instead, set environment variables in **cPanel → Node.js App → Environment Variables**.

For Git repo, you can include template files:

**.env.example:**
```env
PORT=5000
MONGODB_URI=your-mongodb-uri-here
JWT_SECRET=your-jwt-secret-here
REFRESH_SECRET=your-refresh-secret-here
CLIENT_URL=https://yourdomain.com
NODE_ENV=production
BREVO_API_KEY=your-brevo-key-here
EMAIL_USER=your-email-here
```

---

## SSH Key Authentication (For Private Repos)

If using private GitHub/GitLab repository:

### Generate SSH Key in cPanel

1. cPanel → **SSH Access** → **Manage SSH Keys**
2. Click **"Generate a New Key"**
3. Fill in:
   - **Key Name**: `github_deploy`
   - **Key Password**: (optional)
4. Click **"Generate Key"**
5. Click **"Manage"** → **"Authorize"**
6. View public key and copy it

### Add to GitHub/GitLab

**GitHub:**
1. **Settings** → **Deploy keys** → **Add deploy key**
2. Paste public key
3. Check **"Allow write access"** if needed
4. Click **"Add key"**

**GitLab:**
1. **Settings** → **Repository** → **Deploy Keys**
2. Paste public key
3. Click **"Add key"**

### Clone with SSH

```bash
# In Git Version Control, use SSH URL:
git@github.com:yourusername/taskflow.git
```

---

## Troubleshooting Git Deployment

### Issue: .cpanel.yml not executing

**Solutions:**
- Ensure file is in repository root
- Check YAML syntax (use yamllint.com)
- Verify deployment path is correct
- Check cPanel error logs

### Issue: npm install fails

**Solutions:**
- Ensure Node.js version is 18+ in cPanel
- Check if npm is available: `which npm`
- Verify package.json exists
- Check disk space and memory limits

### Issue: Build fails during deployment

**Solutions:**
- Test build locally first
- Check frontend/.env.production exists
- Verify all dependencies are in package.json
- Review deployment logs in cPanel

### Issue: Application doesn't restart

**Solutions:**
- Manually restart in Node.js App interface
- Verify restart command in .cpanel.yml
- Check if PM2 or other process manager is needed
- Review application logs

### Issue: MongoDB connection fails after deploy

**Solutions:**
- Verify MONGODB_URI in cPanel environment variables
- Whitelist cPanel server IP in MongoDB Atlas
- Test connection from cPanel terminal

### Issue: Changes not appearing

**Solutions:**
- Hard refresh browser (Ctrl+F5)
- Check if deployment actually ran
- Verify files were copied to public/
- Clear browser cache
- Check Node.js app is running

---

## Best Practices

### 1. Use Branches

```bash
# Develop on feature branches
git checkout -b feature/new-feature
# Make changes
git commit -m "Add new feature"
git push origin feature/new-feature

# Merge to main when ready
git checkout main
git merge feature/new-feature
git push origin main
```

### 2. Tag Releases

```bash
# Create version tags
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0

# Deploy specific version if needed
```

### 3. Test Before Pushing

```bash
# Always test locally first
npm run dev          # Backend
npm run dev          # Frontend (in another terminal)

# Then build and test
npm run build        # Frontend
# Test the production build
```

### 4. Monitor Deployments

- Check cPanel deployment logs after each push
- Monitor Node.js application logs
- Set up error alerting (email notifications)
- Use uptime monitoring service

### 5. Rollback Strategy

```bash
# If deployment breaks, rollback:
git revert HEAD
git push origin main

# Or deploy previous commit:
# In cPanel Git → Manage → Select previous commit → Deploy
```

---

## Advanced: Multiple Environments

Deploy to staging and production:

### Staging Branch → staging.yourdomain.com

```bash
git checkout -b staging
git push origin staging
```

Configure separate:
- Git repo in cPanel for staging branch
- Node.js app for staging subdomain
- Staging environment variables

### Production Branch → yourdomain.com

```bash
git checkout main
git push origin main
```

Test in staging first, then merge to main!

---

## CI/CD Pipeline (Advanced)

For even more automation, use GitHub Actions or GitLab CI:

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to cPanel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Build Frontend
        run: |
          cd frontend
          npm install
          npm run build
      
      - name: Deploy via Git
        run: |
          # Trigger cPanel webhook
          curl -X POST ${{ secrets.CPANEL_WEBHOOK_URL }}
```

---

## Quick Reference Commands

```bash
# Initial setup
git clone your-repo-url
cd taskflow
git remote -v

# Daily workflow
git pull                          # Get latest changes
git checkout -b feature/name      # Create feature branch
# ... make changes ...
git add .
git commit -m "Description"
git push origin feature/name

# Deploy to production
git checkout main
git merge feature/name
git push origin main              # Auto-deploys to cPanel!

# Check status
git status
git log --oneline -5

# Rollback if needed
git revert HEAD
git push origin main
```

---

## Monitoring & Maintenance

### After Each Deployment

1. ✅ Check deployment log in cPanel Git interface
2. ✅ Verify app is running in Node.js App interface
3. ✅ Test main functionality on live site
4. ✅ Check browser console for errors
5. ✅ Monitor error logs for first few minutes

### Regular Maintenance

- Weekly: Review application logs
- Monthly: Update dependencies (`npm update`)
- As needed: MongoDB Atlas backups
- As needed: Database optimization

---

## Summary: Why Git Deployment Rocks

| Feature | Manual Upload | Git Deployment |
|---------|--------------|----------------|
| **Deployment Speed** | 10-20 minutes | 30 seconds |
| **Version Control** | ❌ | ✅ |
| **Rollback** | Manual | One command |
| **Team Collaboration** | Difficult | Easy |
| **Automated Builds** | ❌ | ✅ |
| **Error Tracking** | Hard | Easy (via logs) |
| **Professional** | No | Yes |

---

## 🎉 You're Ready!

1. **Set up Git repo in cPanel**
2. **Configure .cpanel.yml** (already done!)
3. **Set up Node.js app**
4. **Push to deploy**
5. **Enjoy automatic deployments!**

For questions, check the main deployment guides:
- [QUICK_START_CPANEL.md](QUICK_START_CPANEL.md)
- [CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md)

---

**Happy deploying! Push with confidence! 🚀**
