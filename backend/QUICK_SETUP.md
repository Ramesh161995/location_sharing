# Quick Setup Guide

## ✅ Step 1: .env File (Already Created!)
The `.env` file has been created in the `backend` directory with your MySQL credentials.

## 🔧 Step 2: Run SQL Script

### Option A: Using PowerShell Script (If MySQL is in PATH)
```powershell
cd backend
.\run_sql_setup.ps1
```

### Option B: Using MySQL Workbench (Recommended - Easiest)

1. **Open MySQL Workbench**
   - Connect to your MySQL server (127.0.0.1:3306, user: root)

2. **Create Database:**
   ```sql
   CREATE DATABASE IF NOT EXISTS location_sharing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Select Database:**
   - Click on `location_sharing` in the left panel (Schemas section)

4. **Run Schema:**
   - File → Open SQL Script
   - Navigate to: `backend/database/schema.sql`
   - Click Execute (⚡ button) or press `Ctrl+Shift+Enter`

5. **Verify:**
   ```sql
   SHOW TABLES;
   ```
   Should show 8 tables: users, contacts, locations, location_shares, groups, group_members, otp_sessions, refresh_tokens

### Option C: MySQL Command Line
```powershell
cd backend

# Create database
mysql -h 127.0.0.1 -P 3306 -u root -pRoot@1234 -e "CREATE DATABASE IF NOT EXISTS location_sharing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run schema
Get-Content database\schema.sql | mysql -h 127.0.0.1 -P 3306 -u root -pRoot@1234 location_sharing
```

## 📦 Step 3: Install Python Dependencies
```powershell
cd backend
.\venv\Scripts\activate
pip install aiomysql python-dotenv
```

## 🚀 Step 4: Start Backend
```powershell
cd backend
.\venv\Scripts\activate
python run.py
```

You should see:
- "Connected to MySQL database" in the logs
- Server running on http://0.0.0.0:8000
- API docs at http://localhost:8000/docs

## ✅ Step 5: Test Endpoints

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

## 🐛 Troubleshooting

### "mysql: command not found"
- MySQL command line tool is not in your PATH
- Use MySQL Workbench instead (Option B above)
- Or add MySQL bin directory to your PATH

### "Access denied" or connection errors
- Check MySQL server is running
- Verify credentials in `.env` file
- Test connection in MySQL Workbench first

### "Table already exists"
- Tables were already created
- This is fine - `CREATE TABLE IF NOT EXISTS` handles this
- Or drop and recreate: `DROP DATABASE location_sharing;`

