#!/bin/bash
# Production Build and Deployment Script for cPanel (Linux/Mac)

echo "🔨 Building frontend..."
cd frontend
npm install
npm run build

echo "📁 Setting up backend public directory..."
cd ../backend
mkdir -p public

echo "📦 Copying frontend build to backend..."
cp -r ../frontend/dist/* public/

echo "📚 Installing backend dependencies..."
npm install --production

echo ""
echo "✅ Build complete! Ready for cPanel deployment."
echo "📤 Files to upload to cPanel:"
echo "   - backend/ folder (including new public/ directory)"
echo "   - .env file (with production settings)"
echo ""
echo "🚀 Next steps:"
echo "   1. Upload backend/ folder to your cPanel application root"
echo "   2. Configure environment variables in cPanel"
echo "   3. Run 'npm install' in cPanel terminal or Node.js App interface"
echo "   4. Start/Restart your Node.js application"
echo ""
echo "📖 See CPANEL_DEPLOYMENT_GUIDE.md for detailed instructions."

cd ..
