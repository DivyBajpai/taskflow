# Quick Start: Deploy TaskFlow to cPanel

## 🚀 Fast Track Deployment (5 Steps)

### 1️⃣ Prepare Frontend Environment

Edit `frontend/.env.production`:
```env
VITE_API_URL=/api
VITE_SOCKET_URL=https://yourdomain.com
```

### 2️⃣ Build the Project

**Windows:**
```powershell
.\deploy-cpanel.ps1
```

**Mac/Linux:**
```bash
chmod +x deploy-cpanel.sh
./deploy-cpanel.sh
```

This creates a production-ready `backend/` folder with frontend built inside `public/`.

### 3️⃣ Upload to cPanel

Upload these files to your cPanel app folder:
- `backend/` (entire folder including `public/`)
- `.env` (backend environment variables)

### 4️⃣ Configure cPanel Node.js App

1. Go to cPanel → **Setup Node.js App**
2. Create new app:
   - **Application root**: `taskflow` or your folder name
   - **Application startup file**: `backend/server.js`
   - **Node.js version**: 18.x or higher
3. Add environment variables:
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
4. Click **Run NPM Install**
5. Click **Start App**

### 5️⃣ Verify Deployment

- Visit: `https://yourdomain.com` → Should show login page
- Test: `https://yourdomain.com/api/health` → Should return `{"status":"OK"}`

## 🔧 Important: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to: **Network Access**
3. Click **Add IP Address**
4. Add: `0.0.0.0/0` (Allow access from anywhere)
5. Click **Confirm**

> This allows your cPanel server to connect to MongoDB.

## 📝 Environment Variables Checklist

**Backend (.env):**
- ✅ `MONGODB_URI` - Your MongoDB Atlas connection string
- ✅ `JWT_SECRET` - Random secure string
- ✅ `REFRESH_SECRET` - Different random secure string
- ✅ `CLIENT_URL` - Your domain (https://yourdomain.com)
- ✅ `NODE_ENV` - Set to "production"
- ✅ `BREVO_API_KEY` - Your Brevo email API key
- ✅ `EMAIL_USER` - Your verified sender email

**Frontend (.env.production):**
- ✅ `VITE_API_URL` - Set to `/api` (relative) or `https://yourdomain.com/api`
- ✅ `VITE_SOCKET_URL` - Your domain (https://yourdomain.com)

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| **App won't start** | Check logs in cPanel → Node.js App interface |
| **White/blank page** | Verify `public/` folder has frontend files |
| **API errors** | Update CORS in server.js with your domain |
| **MongoDB connection fails** | Add 0.0.0.0/0 to MongoDB Atlas whitelist |
| **Socket.IO not working** | Check WebSocket support in cPanel/Apache |

## 📚 Need More Details?

See [CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md) for comprehensive instructions.

## 🔄 Updating Your App

1. Make changes locally
2. Run build script again: `.\deploy-cpanel.ps1`
3. Upload updated `backend/` folder
4. Restart app in cPanel Node.js interface

## ✅ Post-Deployment Checklist

- [ ] Application starts without errors
- [ ] Login works
- [ ] Dashboard loads
- [ ] Tasks can be created/edited
- [ ] Real-time updates work (Socket.IO)
- [ ] Email notifications send correctly
- [ ] Mobile view works properly
- [ ] SSL certificate installed (https://)

---

**Good to know:** The backend now serves the frontend automatically. You don't need separate hosting for frontend and backend!
