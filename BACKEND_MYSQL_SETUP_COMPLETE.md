# ✅ Backend MySQL Setup Complete

## What Has Been Created

### 1. Database Schema
- **File:** `backend/database/schema.sql`
- **Database:** `location_sharing`
- **Tables Created:**
  - `users` - User accounts with settings and subscription
  - `contacts` - User contacts list
  - `locations` - Location history
  - `location_shares` - Many-to-many location sharing
  - `groups` - User groups
  - `group_members` - Group membership
  - `otp_sessions` - OTP verification codes
  - `refresh_tokens` - JWT refresh tokens

### 2. MySQL Connection Module
- **File:** `backend/app/core/database_mysql.py`
- Async MySQL connection using `aiomysql`
- Connection pooling
- Helper functions for queries

### 3. Service Layer
- **Files:**
  - `backend/app/services/user_service.py` - User database operations
  - `backend/app/services/otp_service.py` - OTP management
- Business logic separated from endpoints

### 4. Updated API Endpoints
- **File:** `backend/app/api/v1/endpoints/auth.py`
- Updated to use MySQL instead of MongoDB
- Endpoints:
  - `POST /api/v1/auth/request-otp` - Request OTP
  - `POST /api/v1/auth/verify-otp` - Verify OTP and login
  - `POST /api/v1/auth/refresh` - Refresh access token
  - `POST /api/v1/auth/logout` - Logout
  - `GET /api/v1/auth/me` - Get current user

### 5. Configuration
- **File:** `backend/app/core/config_simple.py`
- Updated to load MySQL settings from `.env` file
- Supports environment variables

## 📋 Next Steps for You

### Step 1: Run the Database Script
1. Open MySQL Workbench
2. Connect to your MySQL server (127.0.0.1:3306)
3. Create database:
   ```sql
   CREATE DATABASE IF NOT EXISTS location_sharing;
   ```
4. Select `location_sharing` database
5. Open and execute `backend/database/schema.sql`
6. Verify tables: `SHOW TABLES;`

### Step 2: Create .env File
Create `backend/.env` file with your MySQL credentials (see `backend/CREATE_ENV_FILE.md` for details):

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=Root@1234
MYSQL_DATABASE=location_sharing
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
```

### Step 3: Install Dependencies
```powershell
cd backend
.\venv\Scripts\activate
pip install aiomysql python-dotenv
```

### Step 4: Test Backend
```powershell
cd backend
.\venv\Scripts\activate
python run.py
```

You should see:
- "Connected to MySQL database" in logs
- Server running on http://0.0.0.0:8000
- API docs at http://localhost:8000/docs

### Step 5: Test Endpoints

1. **Request OTP:**
   ```bash
   POST http://localhost:8000/api/v1/auth/request-otp
   Body: { "phone": "+1234567890" }
   ```

2. **Verify OTP:**
   ```bash
   POST http://localhost:8000/api/v1/auth/verify-otp
   Body: { "phone": "+1234567890", "otp": "123456" }
   ```

## 🔧 Troubleshooting

### Connection Error
- Check MySQL server is running
- Verify credentials in `.env` file
- Check firewall settings

### Import Error
- Make sure `aiomysql` is installed: `pip install aiomysql`
- Make sure `python-dotenv` is installed: `pip install python-dotenv`

### Database Error
- Verify database `location_sharing` exists
- Check all tables were created
- Run `SHOW TABLES;` to verify

## 📝 Notes

- **OTP in Development:** Currently returns OTP in response for testing. Remove in production!
- **Password:** Change `SECRET_KEY` in production
- **CORS:** Already configured for frontend on ports 19006 and 8082

