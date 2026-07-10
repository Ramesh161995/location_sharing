# Create .env File

Since .env files are typically in .gitignore, please create it manually:

**File:** `backend/.env`

**Content:**

```env
# Server Configuration
APP_NAME=Location Sharing App
DEBUG=True
ENVIRONMENT=development
API_V1_STR=/api/v1
PROJECT_NAME=Location Sharing App

# Server Settings
HOST=0.0.0.0
PORT=8000
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:19006", "http://localhost:8082"]

# MySQL Database Configuration
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=Root@1234
MYSQL_DATABASE=location_sharing

# Redis Configuration (optional for now)
REDIS_URL=redis://localhost:6379
REDIS_DB=0
REDIS_MAX_CONNECTIONS=20

# JWT Configuration
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production-please-use-a-strong-random-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Phone Authentication
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Google Maps API
GOOGLE_MAPS_API_KEY=

# OpenAI API (for AI features)
OPENAI_API_KEY=

# Email Configuration
SMTP_TLS=True
SMTP_PORT=587
SMTP_HOST=smtp.gmail.com
SMTP_USER=
SMTP_PASSWORD=
EMAILS_FROM_EMAIL=noreply@locationsharingapp.com
EMAILS_FROM_NAME=Location Sharing App

# Security
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# AI Features
AI_ENABLED=True
ML_MODEL_PATH=./models
ANOMALY_DETECTION_THRESHOLD=0.8

# Monitoring
SENTRY_DSN=
PROMETHEUS_PORT=9090
```

## Quick Copy Command (PowerShell)

```powershell
cd backend
@"
# Server Configuration
APP_NAME=Location Sharing App
DEBUG=True
ENVIRONMENT=development
API_V1_STR=/api/v1
PROJECT_NAME=Location Sharing App

# Server Settings
HOST=0.0.0.0
PORT=8000
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:19006", "http://localhost:8082"]

# MySQL Database Configuration
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=Root@1234
MYSQL_DATABASE=location_sharing

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_DB=0
REDIS_MAX_CONNECTIONS=20

# JWT Configuration
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Phone Authentication
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Google Maps API
GOOGLE_MAPS_API_KEY=

# OpenAI API
OPENAI_API_KEY=

# Email Configuration
SMTP_TLS=True
SMTP_PORT=587
SMTP_HOST=smtp.gmail.com
SMTP_USER=
SMTP_PASSWORD=
EMAILS_FROM_EMAIL=noreply@locationsharingapp.com
EMAILS_FROM_NAME=Location Sharing App

# Security
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# AI Features
AI_ENABLED=True
ML_MODEL_PATH=./models
ANOMALY_DETECTION_THRESHOLD=0.8

# Monitoring
SENTRY_DSN=
PROMETHEUS_PORT=9090
"@ | Out-File -FilePath .env -Encoding utf8
```

