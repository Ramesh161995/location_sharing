# Production Deployment Guide
## Location Sharing App - Play Store & App Store

This guide covers deploying your React Native (Expo) app to Google Play Store and Apple App Store.

---

## 📋 Pre-Deployment Checklist

### ✅ Code & Features
- [x] All features implemented and tested
- [x] Error handling in place
- [x] Loading states implemented
- [x] Theme support (light/dark mode)
- [x] Backend API endpoints working
- [x] Database migrations complete

### 🔧 Required Changes for Production

#### 1. **Backend Configuration**

**File: `backend/.env`**
```env
# Production Environment
ENVIRONMENT=production
DEBUG=False

# Production Database (use managed MySQL service)
MYSQL_HOST=your-production-db-host.com
MYSQL_PORT=3306
MYSQL_USER=your_prod_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=location_sharing_prod

# Production API URL
API_BASE_URL=https://api.yourdomain.com

# CORS - Add your production frontend URLs
BACKEND_CORS_ORIGINS=["https://yourdomain.com","https://www.yourdomain.com"]

# JWT Secret - Use strong random secret
JWT_SECRET=your-very-long-random-secret-key-here-min-32-chars

# Redis (if using production Redis)
REDIS_URL=redis://your-redis-host:6379
```

#### 2. **Frontend Configuration**

**File: `frontend/src/config/api.ts`**
```typescript
// Production API URL
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.31.180:8000' // Development
  : 'https://api.yourdomain.com'; // Production

export const USE_MOCK_API = false; // Always false in production
```

#### 3. **App Configuration**

**File: `frontend/app.json`** - Update with your production details:
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
        "NSLocationWhenInUseUsageDescription": "We need your location to share it with your contacts.",
        "NSLocationAlwaysUsageDescription": "We need your location for real-time tracking and sharing.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "We need your location for real-time tracking and sharing.",
        "NSContactsUsageDescription": "We need access to your contacts to add them for location sharing."
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
        "READ_CONTACTS",
        "WRITE_CONTACTS"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Location Sharing to use your location for real-time tracking."
        }
      ],
      [
        "expo-contacts",
        {
          "contactsPermission": "Allow Location Sharing to access your contacts."
        }
      ]
    ]
  }
}
```

---

## 🚀 Deployment Steps

### Phase 1: Backend Deployment

#### Option A: Cloud Hosting (Recommended)

**Recommended Providers:**
1. **AWS** (EC2, RDS, ElastiCache)
2. **Google Cloud Platform** (Compute Engine, Cloud SQL)
3. **DigitalOcean** (Droplets, Managed Databases)
4. **Heroku** (Simplest, but more expensive)

**Example: Deploy to AWS EC2**

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t3.medium or larger (2 vCPU, 4GB RAM minimum)
   - Configure security group (open ports 8000, 22, 3306 from specific IPs)

2. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install python3.13 python3-pip python3-venv mysql-client nginx
   ```

3. **Setup Application**
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/location-sharing-app.git
   cd location-sharing-app/backend

   # Create virtual environment
   python3.13 -m venv venv
   source venv/bin/activate

   # Install dependencies
   pip install -r requirements-313.txt

   # Setup database (use managed RDS or install MySQL)
   # Configure .env file
   nano .env

   # Run database migrations
   mysql -h your-db-host -u user -p < database/schema.sql
   ```

4. **Run with Gunicorn (Production WSGI Server)**
   ```bash
   pip install gunicorn
   
   # Run application
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app \
     --bind 0.0.0.0:8000 \
     --timeout 120 \
     --access-logfile - \
     --error-logfile -
   ```

5. **Setup Nginx Reverse Proxy**
   ```nginx
   # /etc/nginx/sites-available/location-sharing
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

6. **Setup SSL Certificate (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

7. **Setup Process Manager (PM2 or systemd)**
   ```bash
   # Using systemd
   sudo nano /etc/systemd/system/location-sharing.service
   ```

   ```ini
   [Unit]
   Description=Location Sharing API
   After=network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/home/ubuntu/location-sharing-app/backend
   Environment="PATH=/home/ubuntu/location-sharing-app/backend/venv/bin"
   ExecStart=/home/ubuntu/location-sharing-app/backend/venv/bin/gunicorn \
     -w 4 -k uvicorn.workers.UvicornWorker app.main:app \
     --bind 0.0.0.0:8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   sudo systemctl enable location-sharing
   sudo systemctl start location-sharing
   ```

#### Option B: Managed Backend Services

**Backend as a Service:**
- **Railway.app** (~$5-20/month) - Easiest deployment
- **Render.com** (Free tier available, $7+/month for production)
- **Fly.io** (Pay as you go)
- **AWS Lambda + API Gateway** (Serverless, pay per request)

**Example: Railway.app**
1. Sign up at railway.app
2. Connect GitHub repository
3. Add environment variables
4. Deploy automatically on git push

### Phase 2: Database Setup

**Recommended: Managed Database Services**

1. **AWS RDS (MySQL)**
   - db.t3.micro: ~$15/month
   - db.t3.small: ~$30/month
   - Automated backups, scaling

2. **Google Cloud SQL (MySQL)**
   - Similar pricing to AWS RDS

3. **DigitalOcean Managed Database**
   - Basic: $15/month
   - Standard: $60/month

4. **PlanetScale** (MySQL-compatible, serverless)
   - Free tier available
   - Pay as you scale

### Phase 3: Frontend Build & Deployment

#### For Android (Play Store)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Configure EAS Build**
   ```bash
   cd frontend
   eas build:configure
   ```

   This creates `eas.json`:
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
         "android": {
           "buildType": "app-bundle"
         }
       }
     },
     "submit": {
       "production": {}
     }
   }
   ```

3. **Update app.json with production API URL**
   ```json
   {
     "expo": {
       "extra": {
         "apiUrl": "https://api.yourdomain.com"
       }
     }
   }
   ```

4. **Create Production Build**
   ```bash
   # Build Android App Bundle (required for Play Store)
   eas build --platform android --profile production
   ```

5. **Submit to Play Store**
   ```bash
   # First time setup
   eas submit --platform android
   
   # Or manually upload AAB file from Play Console
   ```

#### For iOS (App Store)

1. **Apple Developer Account Setup**
   - Enroll in Apple Developer Program ($99/year)
   - Create App ID in developer.apple.com
   - Create certificates and provisioning profiles

2. **Update app.json with iOS Bundle ID**
   ```json
   {
     "ios": {
       "bundleIdentifier": "com.yourcompany.locationsharing"
     }
   }
   ```

3. **Create iOS Build**
   ```bash
   eas build --platform ios --profile production
   ```

4. **Submit to App Store**
   ```bash
   eas submit --platform ios
   ```

---

## 💰 Cost Estimation

### Minimum Viable Production Setup

| Service | Provider | Cost/Month | Notes |
|---------|----------|------------|-------|
| **Backend Hosting** | DigitalOcean Droplet | $12-24 | 2GB RAM, 1 vCPU |
| **Database** | DigitalOcean Managed DB | $15 | 1GB RAM, 10GB storage |
| **Domain** | Namecheap/Google Domains | $1-2/year | ~$0.10/month |
| **SSL Certificate** | Let's Encrypt | **FREE** | Auto-renewal |
| **Android Developer** | Google Play | **$25 one-time** | Lifetime |
| **iOS Developer** | Apple | **$99/year** | Required |
| **CDN (Optional)** | Cloudflare | **FREE** | Basic plan |
| **Email Service** | SendGrid/SES | **FREE** | Limited tier |

**Monthly Cost: ~$27-39/month**  
**One-time/Annual: $124 (first year), $99/year (subsequent years for iOS)**

### Recommended Production Setup

| Service | Provider | Cost/Month |
|---------|----------|------------|
| **Backend** | AWS EC2 (t3.medium) | $30 |
| **Database** | AWS RDS (db.t3.small) | $30 |
| **Redis** | AWS ElastiCache | $15 |
| **CDN** | Cloudflare | FREE |
| **Monitoring** | Sentry (free tier) | FREE |
| **Email** | AWS SES | FREE (62,000/month) |

**Total: ~$75/month + $124 first-year fees**

### Scaling Costs (as users grow)

- **Database**: Scale up as needed ($30-200/month)
- **Backend**: Auto-scale with load ($30-100/month)
- **CDN Bandwidth**: Cloudflare free tier covers most use cases
- **Storage**: Minimal for location data

---

## 📱 Play Store Submission Steps

### 1. Create Google Play Developer Account
- Go to play.google.com/console
- Pay $25 one-time registration fee
- Complete account verification

### 2. Create App Listing
- App name: "Location Sharing"
- Default language: English
- App type: App
- Free or paid: Free

### 3. Store Listing Information
- **Short description**: "Share your location with friends and family in real-time"
- **Full description**: [Write compelling app description]
- **App icon**: 512x512px PNG
- **Feature graphic**: 1024x500px
- **Screenshots**: 
  - Phone: 2-8 screenshots
  - Tablet (optional): 2-8 screenshots

### 4. Content Rating
- Complete questionnaire
- Submit for rating (automated)

### 5. Privacy Policy
- **Required**: Create privacy policy page
- Add URL in Play Console
- Must cover: location data, contacts, user information

### 6. App Content
- Data Safety section: Declare data collection practices
- Target audience: All ages or specific age groups
- Content rating: Complete questionnaire

### 7. Production Release
- Upload AAB file (from EAS build)
- Complete release checklist
- Submit for review
- Review time: 1-7 days typically

---

## 🍎 App Store Submission Steps

### 1. Apple Developer Account
- Enroll at developer.apple.com
- Cost: $99/year
- Complete enrollment process (may take 1-2 days)

### 2. App Store Connect Setup
- Create App ID in Certificates, Identifiers & Profiles
- Create App in App Store Connect
- Bundle ID: com.yourcompany.locationsharing

### 3. App Information
- Name: "Location Sharing"
- Primary Language: English
- Bundle ID: Select from dropdown
- SKU: Unique identifier (e.g., LOCSHARE001)

### 4. App Privacy Details
- Privacy policy URL: Required
- Data collection: Declare location, contacts usage
- Tracking: Declare if you track users (typically NO for this app)

### 5. App Store Listing
- Description: Write compelling description
- Keywords: location, sharing, friends, family, GPS, tracking
- Support URL: Your website/support page
- Marketing URL (optional)

### 6. App Screenshots & Preview
- Screenshots required for all device sizes:
  - iPhone 6.7" Display: 1290x2796
  - iPhone 6.5" Display: 1284x2778
  - iPhone 5.5" Display: 1242x2208
- App Preview video (optional but recommended)

### 7. Build Upload
- Upload IPA file (from EAS build)
- Or use EAS submit to upload automatically

### 8. Submit for Review
- Complete all required information
- Submit for App Review
- Review time: 1-3 days typically (can be longer)

---

## 🔒 Security Checklist

### Backend Security
- [ ] Use HTTPS only (SSL certificate)
- [ ] Strong JWT secret (32+ characters, random)
- [ ] Database credentials secured in environment variables
- [ ] CORS properly configured (specific origins only)
- [ ] Rate limiting implemented (prevent abuse)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using parameterized queries)
- [ ] Regular security updates

### Frontend Security
- [ ] API keys not hardcoded
- [ ] Sensitive data encrypted in storage
- [ ] HTTPS only for API calls
- [ ] Proper error handling (no sensitive info in errors)

### Data Privacy
- [ ] GDPR compliance (if targeting EU)
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Data retention policy
- [ ] User data deletion capability

---

## 🧪 Testing Before Production

### 1. Test on Real Devices
- [ ] Android device (various versions)
- [ ] iOS device (latest and previous version)
- [ ] Test location permissions
- [ ] Test contacts import
- [ ] Test location sharing
- [ ] Test in background

### 2. Performance Testing
- [ ] App startup time
- [ ] Location update frequency
- [ ] Battery usage
- [ ] Network efficiency
- [ ] Memory usage

### 3. Backend Load Testing
- Use tools like Apache Bench or k6
- Test with 100+ concurrent users
- Monitor response times
- Check database performance

---

## 📊 Post-Deployment Monitoring

### Recommended Tools

1. **Error Tracking**
   - **Sentry** (free tier: 5,000 events/month)
   - Track crashes, errors in production

2. **Analytics**
   - **Google Analytics for Firebase** (free)
   - User engagement, retention

3. **Performance Monitoring**
   - **AWS CloudWatch** (if using AWS)
   - Monitor server resources, API latency

4. **Uptime Monitoring**
   - **UptimeRobot** (free: 50 monitors)
   - Alert if backend goes down

---

## 🔄 Continuous Deployment

### Setup CI/CD Pipeline

**Using GitHub Actions:**

```yaml
# .github/workflows/deploy.yml
name: Deploy Backend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd location-sharing-app/backend
            git pull
            source venv/bin/activate
            pip install -r requirements-313.txt
            sudo systemctl restart location-sharing
```

---

## 📝 Required Legal Documents

### 1. Privacy Policy
Must include:
- What data you collect (location, contacts, user info)
- How you use the data
- Who you share it with
- User rights (access, deletion)
- Contact information
- Data security measures

**Template available at**: privacypolicygenerator.info

### 2. Terms of Service
Must include:
- User responsibilities
- Service limitations
- Intellectual property
- Dispute resolution
- Contact information

**Template available at**: termly.io

### 3. Data Safety Information
- Required for Play Store
- Complete in Play Console > Data safety section

---

## 🚨 Common Issues & Solutions

### Issue: Backend not accessible from app
**Solution**: Check CORS settings, ensure HTTPS is used, verify API URL in app config

### Issue: Location not updating in background
**Solution**: 
- Android: Check battery optimization settings
- iOS: Ensure "Always" location permission granted
- Backend: Verify location update endpoints are called

### Issue: App rejected by App Store
**Common reasons**:
- Missing privacy policy
- Incomplete app description
- Missing required permissions explanation
- App crashes during review

**Solution**: Address all rejection reasons, resubmit

### Issue: High server costs
**Solution**: 
- Implement caching (Redis)
- Optimize database queries
- Use CDN for static assets
- Implement rate limiting

---

## ✅ Final Checklist Before Launch

### Backend
- [ ] Production database migrated
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] API tested and working
- [ ] Error logging configured
- [ ] Backups configured
- [ ] Monitoring setup

### Frontend
- [ ] Production API URL configured
- [ ] App icons and splash screens added
- [ ] App name and bundle IDs set
- [ ] Permissions properly configured
- [ ] Tested on real devices
- [ ] No console.log statements left

### Store Listings
- [ ] App description written
- [ ] Screenshots prepared
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] App content rated
- [ ] Support contact information added

### Legal
- [ ] Privacy policy complete
- [ ] Terms of service complete
- [ ] Data safety information declared
- [ ] GDPR compliant (if needed)

---

## 📞 Support & Maintenance

### Regular Tasks
- Monitor error logs daily
- Check server resources weekly
- Update dependencies monthly
- Review user feedback
- Plan feature updates

### Emergency Contacts
- Backend hosting support
- Database support
- Domain registrar support
- App store support (for submission issues)

---

## 🎯 Summary Timeline

**Week 1**: Backend deployment and testing  
**Week 2**: Build production app bundles, prepare store listings  
**Week 3**: Submit to Play Store and App Store  
**Week 4**: Review process, address feedback, launch

**Total estimated time: 3-4 weeks from start to launch**

---

## 📚 Additional Resources

- [Expo Deployment Guide](https://docs.expo.dev/distribution/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

**Need Help?** Create issues in your repository or consult with a DevOps expert for complex setups.

