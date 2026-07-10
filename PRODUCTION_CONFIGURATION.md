# Production Configuration Checklist

## 🔧 Configuration Files to Update

### Backend Configuration

#### 1. `backend/.env` (Create if doesn't exist)

```env
# Environment
ENVIRONMENT=production
DEBUG=False

# Database (Use production database credentials)
MYSQL_HOST=your-production-db.example.com
MYSQL_PORT=3306
MYSQL_USER=prod_user
MYSQL_PASSWORD=secure_random_password_here
MYSQL_DATABASE=location_sharing_prod

# API Configuration
API_V1_STR=/api/v1
PROJECT_NAME=Location Sharing API
APP_NAME=Location Sharing

# JWT Configuration
JWT_SECRET=generate-very-long-random-secret-minimum-32-characters
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24 hours

# CORS - IMPORTANT: Add your production domains
BACKEND_CORS_ORIGINS=["https://yourdomain.com","https://www.yourdomain.com","https://api.yourdomain.com"]

# Redis (if using production Redis)
REDIS_URL=redis://your-redis-host:6379

# Server
HOST=0.0.0.0
PORT=8000
```

**⚠️ Important**: 
- Never commit `.env` file to git
- Use strong, randomly generated passwords
- Rotate secrets regularly
- Use different database for production

#### 2. `backend/app/core/config_simple.py`

Verify that it loads from environment variables correctly (should already be set up).

### Frontend Configuration

#### 1. `frontend/src/config/api.ts`

Update for production:

```typescript
import Constants from 'expo-constants';

// Determine if we're in development or production
const isDev = __DEV__;
const isProduction = !isDev;

// Production API URL - UPDATE THIS
const PRODUCTION_API_URL = 'https://api.yourdomain.com';

// Development API URL (for local testing)
const DEV_API_URL = 'http://192.168.31.180:8000';

// Use device IP in development for physical device testing
const USE_DEVICE_IP = isDev ? true : false;
const DEVICE_IP = '192.168.31.180'; // Your local IP for testing

// Mock API flag - ALWAYS FALSE in production
export const USE_MOCK_API = false;

// Base API URL
export const API_BASE_URL = isProduction 
  ? PRODUCTION_API_URL 
  : (USE_DEVICE_IP ? `http://${DEVICE_IP}:8000` : DEV_API_URL);

console.log('API Base URL:', API_BASE_URL);
```

#### 2. `frontend/app.json`

Update with production details:

```json
{
  "expo": {
    "name": "Location Sharing",
    "slug": "location-sharing-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#667eea"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.locationsharing",
      "buildNumber": "1",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Location Sharing needs your location to share it with your contacts and show your position on the map.",
        "NSLocationAlwaysUsageDescription": "Location Sharing needs your location for real-time tracking and sharing with your contacts.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Location Sharing needs your location for real-time tracking and sharing with your contacts.",
        "NSContactsUsageDescription": "Location Sharing needs access to your contacts to help you add friends for location sharing."
      },
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#667eea"
      },
      "package": "com.yourcompany.locationsharing",
      "versionCode": 1,
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "READ_CONTACTS"
      ],
      "googleServicesFile": "./google-services.json"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Location Sharing to use your location for real-time tracking and sharing with your contacts."
        }
      ],
      [
        "expo-contacts",
        {
          "contactsPermission": "Allow Location Sharing to access your contacts to add them for location sharing."
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

#### 3. Remove Debug Code

Search and remove/comment out:
- `console.log()` statements (keep `console.error()` for production logging)
- Mock API calls
- Test data
- Development-only features

```bash
# Search for console.log in frontend
cd frontend
grep -r "console.log" src/

# Consider using a logging library for production
# Or wrap console.log in a debug flag
```

---

## 🔐 Security Checklist

### Backend Security

1. **Environment Variables**
   - [ ] All secrets in `.env` (not in code)
   - [ ] `.env` in `.gitignore`
   - [ ] Strong JWT secret (32+ characters)
   - [ ] Database password is strong and unique

2. **API Security**
   - [ ] CORS configured for specific domains only
   - [ ] Rate limiting implemented (prevent abuse)
   - [ ] Input validation on all endpoints
   - [ ] SQL injection prevention (using parameterized queries)
   - [ ] HTTPS only (no HTTP in production)

3. **Authentication**
   - [ ] JWT tokens expire appropriately
   - [ ] Refresh token rotation implemented
   - [ ] Password hashing (if you add password auth later)

### Frontend Security

1. **API Configuration**
   - [ ] Production API URL uses HTTPS
   - [ ] No API keys hardcoded
   - [ ] Sensitive data encrypted in storage

2. **Error Handling**
   - [ ] No sensitive information in error messages
   - [ ] Proper error boundaries
   - [ ] User-friendly error messages

---

## 🌐 Domain & SSL Setup

### Required Domains

1. **API Domain**: `api.yourdomain.com`
   - Points to your backend server
   - SSL certificate required (Let's Encrypt free)

2. **Website Domain** (optional): `yourdomain.com`
   - For privacy policy, terms of service
   - Can use GitHub Pages (free)

### SSL Certificate Setup

Using Let's Encrypt (Free):

```bash
# On your server
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
```

---

## 📦 Build Configuration

### EAS Build Configuration

Create/update `frontend/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "env": {
        "API_BASE_URL": "https://api.yourdomain.com"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "bundleIdentifier": "com.yourcompany.locationsharing"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./path-to-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

---

## 🗄️ Database Migration for Production

### Create Production Database

```sql
-- Run this on production database server
CREATE DATABASE location_sharing_prod 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Create production user
CREATE USER 'prod_user'@'%' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON location_sharing_prod.* TO 'prod_user'@'%';
FLUSH PRIVILEGES;
```

### Run Schema Migration

```bash
# On production server
cd backend
mysql -h your-db-host -u prod_user -p location_sharing_prod < database/schema.sql
```

### Verify Tables

```sql
USE location_sharing_prod;
SHOW TABLES;
-- Should show: users, contacts, locations, location_shares, groups, group_members, otp_sessions, refresh_tokens
```

---

## 🔄 Environment-Specific Builds

### Development
- API: `http://localhost:8000` or device IP
- Debug mode: Enabled
- Mock data: Can be enabled

### Staging
- API: `https://staging-api.yourdomain.com`
- Debug mode: Disabled
- Mock data: Disabled

### Production
- API: `https://api.yourdomain.com`
- Debug mode: Disabled
- Mock data: Disabled
- Error tracking: Enabled
- Analytics: Enabled

---

## 📊 Monitoring Setup

### Error Tracking (Sentry)

1. Sign up at sentry.io
2. Create React Native project
3. Install Sentry:

```bash
cd frontend
npx expo install sentry-expo
```

4. Configure in `App.tsx`:

```typescript
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  enableInExpoDevelopment: false,
  debug: false,
});
```

### Analytics (Firebase)

1. Create Firebase project
2. Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
3. Install Firebase:

```bash
npx expo install expo-firebase-analytics
```

---

## ✅ Pre-Launch Verification

### Backend Tests
```bash
# Test API endpoints
curl https://api.yourdomain.com/health

# Test authentication
curl -X POST https://api.yourdomain.com/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

### Frontend Tests
- [ ] App builds successfully
- [ ] Production API URL is correct
- [ ] Location permissions work
- [ ] Contacts import works
- [ ] Location sharing works
- [ ] Theme switching works
- [ ] All screens render correctly

### Performance Checks
- [ ] App startup time < 3 seconds
- [ ] API response time < 500ms
- [ ] No memory leaks
- [ ] Battery usage reasonable

---

## 🚀 Deployment Commands

### Backend Deployment

```bash
# SSH into production server
ssh user@your-server.com

# Navigate to app directory
cd location-sharing-app/backend

# Pull latest code
git pull origin main

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
pip install -r requirements-313.txt

# Run database migrations (if any)
mysql -h your-db-host -u user -p database < migrations/new_migration.sql

# Restart service
sudo systemctl restart location-sharing

# Check status
sudo systemctl status location-sharing

# View logs
sudo journalctl -u location-sharing -f
```

### Frontend Build

```bash
cd frontend

# Install EAS CLI (if not installed)
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS (first time only)
eas build:configure

# Build for production
eas build --platform android --profile production
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## 📝 Additional Notes

1. **Version Management**: Update version in `app.json` and `package.json` before each release
2. **Changelog**: Maintain a changelog for users
3. **Backup Strategy**: Regular database backups (daily recommended)
4. **Update Strategy**: Plan for regular updates (bug fixes, new features)
5. **Support Channel**: Set up support email/contact method

---

**Remember**: Test everything in a staging environment before production deployment!

