# ✅ Database Setup Complete! Next Steps

## Step 1: Install Python Dependencies

Open PowerShell in the backend directory:

```powershell
cd C:\Users\RameshRanjan\source\Repo\location-sharing-app\backend

# Activate virtual environment
.\venv\Scripts\activate

# Install MySQL and environment variable packages
pip install aiomysql python-dotenv
```

## Step 2: Test Backend Connection

Start the backend server:

```powershell
# Make sure you're in backend directory and venv is activated
python run.py
```

**Expected Output:**
- ✅ "Connected to MySQL database" in the logs
- ✅ "Location Sharing App started successfully"
- ✅ Server running on http://0.0.0.0:8000

If you see errors, check:
- MySQL server is running
- Credentials in `.env` file are correct
- Database `location_sharing` exists with all tables

## Step 3: Test API Endpoints

### Option A: Using Browser
Open: http://localhost:8000/docs

### Option B: Using curl or Postman

1. **Health Check:**
   ```bash
   GET http://localhost:8000/health
   ```

2. **Request OTP:**
   ```bash
   POST http://localhost:8000/api/v1/auth/request-otp
   Content-Type: application/json
   
   {
     "phone": "+1234567890"
   }
   ```

3. **Verify OTP:**
   ```bash
   POST http://localhost:8000/api/v1/auth/verify-otp
   Content-Type: application/json
   
   {
     "phone": "+1234567890",
     "otp": "123456"
   }
   ```

## Step 4: Connect Frontend to Backend

Once backend is working, update frontend to use real API:

1. **Open:** `frontend/src/services/authAPI.ts`
2. **Find:** `const USE_MOCK_API = true;`
3. **Change to:** `const USE_MOCK_API = false;`
4. **Restart Expo:** `npm start`

## Step 5: Test End-to-End

1. Start backend: `python run.py`
2. Start frontend: `npm start` (in frontend directory)
3. Test login flow on your mobile/emulator
4. Verify user is created in database:
   ```sql
   SELECT * FROM users;
   SELECT * FROM otp_sessions;
   ```

---

## 🎉 You're Ready!

Your backend is now connected to MySQL and ready to:
- ✅ Accept phone number for OTP
- ✅ Generate and store OTP codes
- ✅ Verify OTP and create users
- ✅ Issue JWT tokens for authentication
- ✅ Store user data in MySQL database

