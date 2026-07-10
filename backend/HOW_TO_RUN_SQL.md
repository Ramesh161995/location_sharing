# How to Run the SQL Script

## Method 1: Using PowerShell Script (If MySQL is in PATH)

### Step 1: Open PowerShell
- Press `Win + X` and select "Windows PowerShell" or "Terminal"
- Navigate to the backend directory:
  ```powershell
  cd C:\Users\RameshRanjan\source\Repo\location-sharing-app\backend
  ```

### Step 2: Run the Script
```powershell
.\run_sql_setup.ps1
```

**If you get "Execution Policy" error:**
```powershell
# Allow script execution (one time)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Then run the script again
.\run_sql_setup.ps1
```

### Step 3: Verify
The script will:
1. ✅ Create the database `location_sharing`
2. ✅ Create all 8 tables
3. ✅ Show success message

---

## Method 2: Manual MySQL Command Line

### Step 1: Open PowerShell
```powershell
cd C:\Users\RameshRanjan\source\Repo\location-sharing-app\backend
```

### Step 2: Run Commands

**If MySQL is in your PATH:**
```powershell
# Create database
mysql -h 127.0.0.1 -P 3306 -u root -pRoot@1234 -e "CREATE DATABASE IF NOT EXISTS location_sharing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run schema
Get-Content database\schema.sql | mysql -h 127.0.0.1 -P 3306 -u root -pRoot@1234 location_sharing
```

**If MySQL is NOT in PATH, use full path:**
```powershell
# Find your MySQL installation path (usually one of these):
# C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
# C:\Program Files\MySQL\MySQL Server 8.1\bin\mysql.exe
# C:\xampp\mysql\bin\mysql.exe

# Replace with your actual path:
$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

# Create database
& $mysqlExe -h 127.0.0.1 -P 3306 -u root -pRoot@1234 -e "CREATE DATABASE IF NOT EXISTS location_sharing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run schema
Get-Content database\schema.sql | & $mysqlExe -h 127.0.0.1 -P 3306 -u root -pRoot@1234 location_sharing
```

---

## Method 3: Using MySQL Workbench (Recommended - Easiest)

### Step 1: Open MySQL Workbench
- Launch MySQL Workbench
- Connect to your MySQL server (click on your connection, enter password if needed)

### Step 2: Create Database
1. In the query window, type:
   ```sql
   CREATE DATABASE IF NOT EXISTS location_sharing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Click the Execute button (⚡ lightning bolt) or press `Ctrl+Enter`

### Step 3: Select Database
- In the left panel (Schemas), double-click on `location_sharing` to select it
- OR in the query window, type: `USE location_sharing;` and execute

### Step 4: Run Schema File
1. Go to: **File → Open SQL Script**
2. Navigate to: `C:\Users\RameshRanjan\source\Repo\location-sharing-app\backend\database\schema.sql`
3. Click **Open**
4. Click the **Execute** button (⚡) or press `Ctrl+Shift+Enter`
5. Wait for "Query OK" messages

### Step 5: Verify Tables
In the query window, run:
```sql
SHOW TABLES;
```

You should see 8 tables:
- users
- contacts
- locations
- location_shares
- groups
- group_members
- otp_sessions
- refresh_tokens

---

## Troubleshooting

### "mysql: command not found"
- MySQL command line tool is not in your PATH
- **Solution:** Use Method 3 (MySQL Workbench) instead, or find your MySQL installation and use full path

### "Access denied for user 'root'"
- Wrong password
- **Solution:** Check your password in `.env` file or MySQL Workbench connection

### "Can't connect to MySQL server"
- MySQL service is not running
- **Solution:** 
  - Open Services (Win+R → `services.msc`)
  - Find "MySQL" service
  - Right-click → Start

### "Execution Policy" error when running PowerShell script
- PowerShell blocks script execution
- **Solution:** Run this first:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
  ```

### "Table already exists" warnings
- Tables were already created before
- **Solution:** This is fine! The script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times

---

## Quick Check: Is MySQL in PATH?

Run this in PowerShell:
```powershell
where.exe mysql
```

If it shows a path → MySQL is in PATH, you can use Method 1 or 2  
If it shows nothing → MySQL is NOT in PATH, use Method 3 (MySQL Workbench)

---

## After Running the Script

Once the database is set up, you can:

1. **Install Python dependencies:**
   ```powershell
   cd backend
   .\venv\Scripts\activate
   pip install aiomysql python-dotenv
   ```

2. **Start the backend server:**
   ```powershell
   python run.py
   ```

3. **Test the API:**
   - Open browser: http://localhost:8000/docs
   - Try the `/api/v1/auth/request-otp` endpoint

