# Campus Connect - Deployment Guide

## GitHub + Vercel Deployment

This guide provides step-by-step instructions for deploying the Campus Connect application using GitHub for version control and Vercel for hosting.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Repository Setup](#github-repository-setup)
3. [Server Deployment (Vercel)](#server-deployment-vercel)
4. [Client Deployment (Vercel)](#client-deployment-vercel)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting deployment, ensure you have:

| Requirement | Purpose |
|-------------|---------|
| **GitHub Account** | Repository hosting |
| **Vercel Account** | Application hosting |
| **Node.js 18+** | Local development and build |
| **Git** | Version control |
| **SQLite Database** | Local testing (Prisma with SQLite) |

---

## GitHub Repository Setup

### Step 1: Initialize Repository

```bash
# Navigate to project root
cd Campus_Connect

# Initialize Git repository (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Campus Connect full-stack application"
```

### Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click **New Repository**
3. Enter repository name: `campus-connect`
4. Set visibility: **Public** or **Private**
5. **Do NOT** initialize with README (we already have one)
6. Click **Create Repository**

### Step 3: Link Local to Remote

```bash
# Add remote origin (replace with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/campus-connect.git

# Push to GitHub
git push -u origin main
```

### Step 4: Configure .gitignore

Ensure the following is in your `.gitignore`:

```
node_modules/
dist/
.env
*.log
.DS_Store
firebase-service-account.json
```

---

## Server Deployment (Vercel)

### Step 1: Prepare Server for Vercel

Create `vercel.json` in the server directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 2: Update Server Package.json

Add build script and update main entry:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "seed": "ts-node src/seed/seed.ts",
    "db:generate": "prisma generate",
    "db:push": "prisma db push"
  }
}
```

### Step 3: Configure Database for Production (SQLite)

Keep SQLite for production. The database file will be committed to GitHub and deployed with the application.

**Prisma Schema (Keep as-is)**

```prisma
// prisma/schema.prisma - SQLite configuration
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**⚠️ Important: SQLite on Serverless Platforms**

Vercel uses serverless functions with ephemeral filesystem. SQLite changes won't persist between function invocations. You have two options:

**Option 1: Use a VPS/Server with Persistent Storage (Recommended for SQLite)**
- Deploy to Railway, Render, or a traditional VPS
- These platforms provide persistent storage

**Option 2: Use Turso (Distributed SQLite)**
- Sign up at [Turso](https://turso.tech)
- Install CLI: `npm install -g @tursodatabase/cli`
- Create database and get connection URL
- Update `DATABASE_URL` to use `libsql://` protocol

**Option 3: Commit SQLite to Git (Read-only Data)**
- Only suitable for static/read-only scenarios
- Data changes will be lost on redeploy

### Step 4: Deploy to Vercel

#### Method A: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to server directory
cd server

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - What's your project name? campus-connect-server
# - Which directory is your code located? ./
```

#### Method B: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import Git Repository → Select `campus-connect`
4. Configure:
   - **Root Directory**: `server`
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click **Deploy**

### Step 5: Environment Variables

Add these environment variables in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | `file:./prisma/dev.db` | Yes |
| `JWT_SECRET` | Your secure random string | Yes |
| `NODE_ENV` | `production` | Yes |
| `CLIENT_URL` | `https://your-client-url.vercel.app` | Yes |
| `PORT` | `3000` (Vercel sets this automatically) | No |

---

## Client Deployment (Vercel)

### Step 1: Prepare Client for Production

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

### Step 2: Create Environment Variables Template

Create `client/.env.production`:

```
VITE_API_URL=https://your-server-url.vercel.app/api
```

**Note**: In Vercel, add as `VITE_API_URL` in environment variables.

### Step 3: Deploy Client to Vercel

#### Method A: Vercel CLI

```bash
# Navigate to client directory
cd client

# Deploy
vercel

# Follow prompts:
# - Framework? Vite
# - Root directory? ./
```

#### Method B: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import same Git Repository
4. Configure:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**

### Step 4: Client Environment Variables

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_URL` | `https://campus-connect-server.vercel.app/api` | Yes |

---

## Environment Configuration

### Complete .env.example for Server

```env
# Server Configuration
PORT=5000
NODE_ENV=production
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
COLLEGE_EMAIL_DOMAIN=college.edu
ROLL_NUMBER_PATTERN=^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$
CLIENT_URL=https://campus-connect-client.vercel.app
```

### Client Environment

```env
# Client Configuration
VITE_API_URL=https://campus-connect-server.vercel.app/api
```

---

## Database Setup

### Step 1: Generate Prisma Client

```bash
cd server
npx prisma generate
```

### Step 2: Initialize SQLite Database

```bash
# Create and push schema to SQLite
npx prisma db push

# Or use migrate for version control
npx prisma migrate dev --name init
```

### Step 3: Seed Database

```bash
# Seed default users including admin
npx ts-node src/seed/seed.ts
```

### Step 4: Commit SQLite to GitHub

Since you're using SQLite, you need to decide whether to commit the database file:

**Option A: Commit Database with Seed Data**

```bash
# Remove .db from .gitignore (if present)
# Edit .gitignore and remove or comment out: *.db

# Add the database file
git add prisma/dev.db
git commit -m "Add SQLite database with seed data"
git push origin main
```

**⚠️ Warning**: Only commit if the data is static/seed data. User data should NOT be committed.

**Option B: Generate Database on Deploy**

Add a build script to generate the database during deployment:

```json
// server/package.json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma db push && npm run build"
  }
}
```

Then in Vercel, set the build command to `npm run vercel-build`.

**Note**: Data will be lost on each redeploy with this approach.

---

## Post-Deployment Verification

### Checklist

- [ ] Server API responds at `https://your-server.vercel.app/api/health`
- [ ] Client loads without errors
- [ ] Login works with test credentials
- [ ] Database connections are stable
- [ ] File uploads work (if using external storage)
- [ ] Real-time notifications function

### API Health Check

```bash
curl https://your-server.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "Campus Connect API",
  "timestamp": "2026-03-13T..."
}
```

---

## Troubleshooting

### Common Issues

#### Issue 1: "Cannot find module" errors

**Solution**: Ensure `vercel.json` is in the server root and builds are configured correctly.

```json
{
  "builds": [{ "src": "src/index.ts", "use": "@vercel/node" }]
}
```

#### Issue 2: Database connection fails

**Solution**: Verify `DATABASE_URL` is set correctly in Vercel environment variables.

```bash
# SQLite should use file path
DATABASE_URL=file:./prisma/dev.db
```

**For SQLite on Vercel**: The filesystem is read-only in production. Consider:
- Using Turso (libSQL) for serverless SQLite
- Deploying to Railway/Render for persistent storage
- Using Vercel Postgres instead

#### Issue 3: CORS errors in browser

**Solution**: Update server CORS configuration:

```typescript
// server/src/index.ts
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

Ensure `CLIENT_URL` matches your Vercel client domain exactly.

#### Issue 4: Environment variables not loading

**Solution**: 
- Client variables must start with `VITE_`
- Server variables must be added in Vercel Dashboard
- Redeploy after adding variables

#### Issue 5: Prisma Client not found

**Solution**: Add postinstall script:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Vercel-Specific Notes

1. **Serverless Functions**: Vercel runs server code as serverless functions. Long-running processes (like SSE streams) may need special handling.

2. **File Uploads**: Local file storage doesn't persist. Use cloud storage (AWS S3, Cloudinary) for production.

3. **Database - SQLite**: SQLite file changes won't persist on Vercel's serverless platform. Options:
   - Use **Turso** (distributed SQLite) for serverless compatibility
   - Deploy to **Railway** or **Render** for persistent SQLite storage
   - Use **Vercel Postgres** instead of SQLite

4. **Environment Variables**: Must be explicitly set in Vercel dashboard, not just in `.env` files.

5. **SQLite Database Path**: Ensure the database file path is correct for the serverless environment:
   ```env
   DATABASE_URL=file:./prisma/dev.db
   ```

---

## Continuous Deployment

### Setup GitHub Integration

1. In Vercel Dashboard, go to Project → Git
2. Connect to GitHub repository
3. Enable **Auto-Deploy** on push to main branch
4. Configure preview deployments for pull requests

### Branch Strategy

```
main → Production deployment
  ↓
develop → Staging deployment (optional)
  ↓
feature/* → Preview deployments
```

---

## Production Checklist

Before going live:

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET (min 32 characters)
- [ ] Configure proper email domain validation
- [ ] Set up external file storage (S3/Cloudinary)
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Configure rate limiting on API
- [ ] Remove seed data with test passwords
- [ ] Set up monitoring (Vercel Analytics)
- [ ] Configure custom domain (optional)
- [ ] Test all user flows end-to-end

---

## Quick Reference Commands

```bash
# Full deployment from scratch

# 1. Push to GitHub (with SQLite database if desired)
git add .
git commit -m "Production deployment"
git push origin main

# 2. Deploy server (Vercel CLI) - Note: SQLite data won't persist on Vercel
cd server
vercel --prod

# 3. Deploy client (Vercel CLI)
cd ../client
vercel --prod

# 4. Update environment variables in Vercel Dashboard
# Server: DATABASE_URL=file:./prisma/dev.db, JWT_SECRET, CLIENT_URL
# Client: VITE_API_URL

# For SQLite with persistent storage (Recommended)
# Use Railway or Render instead of Vercel:
# - Railway: railway.app
# - Render: render.com
```

---

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

---

*Last Updated: March 2026*
