# cPanel Deployment Guide for TaskFlow

This guide will help you deploy the TaskFlow application to cPanel hosting.

## Prerequisites

- cPanel account with Node.js support (version 18.x or higher)
- MongoDB Atlas account (already configured)
- SSH access (optional but recommended)
- FTP/File Manager access

## Overview

This application consists of:
- **Backend**: Node.js Express server with Socket.IO
- **Frontend**: React application built with Vite
- **Database**: MongoDB Atlas (cloud-hosted)
- **Email**: Brevo API service

## Deployment Steps

### Step 1: Build the Frontend Locally

Before uploading to cPanel, build the production version of your frontend:

```bash
cd frontend
npm install
npm run build
```

This creates a `dist` folder with optimized production files.

### Step 2: Prepare Backend for Production

The backend needs to be configured to serve the frontend static files. The server.js has been updated to do this automatically.

### Step 3: cPanel Setup

#### 3.1 Create Node.js Application in cPanel

1. Log into your cPanel account
2. Navigate to **"Setup Node.js App"** (under Software section)
3. Click **"Create Application"**
4. Configure:
   - **Node.js version**: 18.x or higher
   - **Application mode**: Production
   - **Application root**: `your-domain/taskflow` (or any folder name)
   - **Application URL**: Your domain or subdomain
   - **Application startup file**: `backend/server.js`
   - **Passenger log file**: Leave default
5. Click **"Create"**

#### 3.2 Upload Files

**Option A: Using File Manager**

1. Open cPanel **File Manager**
2. Navigate to your application root folder
3. Upload the following:
   - `backend/` folder (complete)
   - `frontend/dist/` folder contents to `backend/public/`
   - `package.json` from backend
   - `.env` file (update as needed)

**Option B: Using FTP Client (Recommended)**

1. Connect via FTP (FileZilla, WinSCP, etc.)
2. Upload:
   ```
   /taskflow/
   ├── backend/
   │   ├── config/
   │   ├── middleware/
   │   ├── models/
   │   ├── routes/
   │   ├── scripts/
   │   ├── services/
   │   ├── utils/
   │   ├── public/          (frontend dist files go here)
   │   ├── server.js
   │   ├── package.json
   │   └── .env
   ```

**Option C: Using Git (Best Practice)**

If your cPanel has Git support:

1. SSH into your cPanel account
2. Clone repository:
   ```bash
   cd ~/your-app-folder
   git clone <your-repo-url> .
   ```
3. Build and setup:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ../backend
   mkdir -p public
   cp -r ../frontend/dist/* public/
   npm install
   ```

### Step 4: Install Dependencies

1. In cPanel, go back to **"Setup Node.js App"**
2. Click on your application
3. In the **"Detected configuration files"** section, click **"Run NPM Install"**
4. Or use the terminal:
   ```bash
   cd ~/taskflow/backend
   npm install --production
   ```

### Step 5: Configure Environment Variables

1. In the Node.js App interface, scroll to **"Environment Variables"**
2. Add the following variables:

```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=TaskFlow
JWT_SECRET=your-jwt-secret-here
REFRESH_SECRET=your-refresh-secret-here
CLIENT_URL=https://yourdomain.com
NODE_ENV=production
BREVO_API_KEY=your-brevo-api-key-here
EMAIL_USER=your-email@example.com
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Important**: Replace `CLIENT_URL` with your actual domain!

### Step 6: Update Frontend API Configuration

Before building the frontend, update the API URL:

1. Edit `frontend/src/config.js` or wherever API URLs are defined
2. Change from `http://localhost:5000` to your cPanel domain
3. Rebuild the frontend if needed

### Step 7: Start the Application

1. In cPanel Node.js App interface, click **"Stop App"** then **"Start App"**
2. Or click **"Restart"** button
3. Check the application status - it should show "Running"

### Step 8: Configure .htaccess (Important!)

Create/edit `.htaccess` in your application root:

```apache
# Redirect all requests to Node.js app
RewriteEngine On
RewriteCond %{REQUEST_URI} !^/\.well-known/
RewriteRule ^(.*)$ http://127.0.0.1:5000/$1 [P,L]
```

This ensures all traffic is routed to your Node.js application.

## Verification

1. **Test the Application**:
   - Visit: `https://yourdomain.com`
   - Should load the login screen
   - Check browser console for errors

2. **Test API Health**:
   - Visit: `https://yourdomain.com/api/health`
   - Should return: `{"status":"OK","message":"CTMS Backend is running"}`

3. **Check Logs**:
   - In cPanel Node.js App interface, view the log file
   - Look for startup message and any errors

## Common Issues & Solutions

### Issue 1: Application Won't Start

**Solution**:
- Check Node.js version (must be 18+)
- Verify all dependencies are installed
- Check logs for error messages
- Ensure PORT environment variable is set

### Issue 2: MongoDB Connection Fails

**Solution**:
- Verify MONGODB_URI is correct
- Check MongoDB Atlas whitelist (add 0.0.0.0/0 for cPanel servers)
- Test connection from cPanel terminal:
  ```bash
  node -e "require('mongoose').connect('YOUR_URI').then(() => console.log('OK')).catch(e => console.log(e))"
  ```

### Issue 3: Frontend Shows Blank Page

**Solution**:
- Check if `public/` folder contains built frontend files
- Verify server.js serves static files correctly
- Check browser console for errors
- Ensure CLIENT_URL matches your domain

### Issue 4: API Requests Fail (CORS errors)

**Solution**:
- Update CORS configuration in `server.js`
- Add your domain to allowed origins
- Ensure CLIENT_URL environment variable is set correctly

### Issue 5: Socket.IO Connection Fails

**Solution**:
- Verify WebSocket support is enabled in cPanel
- Check if proxy settings allow WebSocket connections
- May need to configure Apache/Nginx for WebSocket passthrough

### Issue 6: Memory/Resource Limits

**Solution**:
- cPanel shared hosting may have resource limits
- Consider upgrading plan or using VPS
- Optimize application (reduce dependencies, enable caching)

## Security Best Practices

1. **Environment Variables**: Never commit .env file to Git
2. **MongoDB**: Use strong passwords and IP whitelisting
3. **JWT Secrets**: Use strong, random secrets
4. **HTTPS**: Ensure SSL certificate is installed
5. **Updates**: Keep Node.js and dependencies updated

## Performance Optimization

1. **Enable Compression**:
   - The server already includes compression middleware
   
2. **Static File Caching**:
   - Configure Apache/Nginx headers for caching
   
3. **CDN**: Consider using a CDN for static assets

4. **Monitoring**: Set up monitoring for uptime and errors

## Updating the Application

1. Build new frontend version locally
2. Upload new files via FTP/File Manager
3. In cPanel Node.js App, click **"Restart"**
4. Clear browser cache and test

## Alternative: Using PM2 (If SSH Available)

If you have SSH access and want better process management:

```bash
npm install -g pm2
cd ~/taskflow/backend
pm2 start server.js --name taskflow
pm2 save
pm2 startup
```

## Backup Recommendations

1. **Database**: Regular MongoDB Atlas backups (built-in)
2. **Files**: Weekly backup of application files
3. **Environment**: Keep secure copy of .env file

## Support & Troubleshooting

- **Application Logs**: Check via cPanel Node.js App interface
- **Error Logs**: Check cPanel Error Log viewer
- **Resource Usage**: Monitor in cPanel Resource Usage tool

## Production Checklist

- [ ] Frontend built for production
- [ ] Backend uploaded to cPanel
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] MongoDB connection tested
- [ ] Application started successfully
- [ ] Domain/SSL configured
- [ ] .htaccess configured
- [ ] API endpoints tested
- [ ] Login functionality tested
- [ ] Email system tested
- [ ] Socket.IO tested (real-time features)
- [ ] Mobile responsiveness verified
- [ ] Error logging configured
- [ ] Backup system in place

## Next Steps

After successful deployment:

1. Test all features thoroughly
2. Set up monitoring and alerts
3. Configure automated backups
4. Document any custom configurations
5. Train users on the system

---

**Need Help?**  
Check cPanel documentation or contact your hosting provider's support team for cPanel-specific issues.
