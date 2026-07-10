# How to Run the SQL Script Manually

## Option 1: Using MySQL Workbench (Easiest)

1. **Open MySQL Workbench**
   - Launch MySQL Workbench application
   - Connect to your MySQL server (127.0.0.1:3306)

2. **Create the Database**
   - Click on "Schemas" in the left panel
   - Right-click in the schemas panel → "Create Schema"
   - Name: `location_sharing`
   - Collation: `utf8mb4_unicode_ci`
   - Click "Apply"

   OR run this query:
   ```sql
   CREATE DATABASE IF NOT EXISTS location_sharing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Select the Database**
   - In the left panel, under "Schemas", click on `location_sharing`
   - OR double-click it to set it as default

4. **Run the Schema Script**
   - Go to File → Open SQL Script
   - Navigate to: `backend/database/schema.sql`
   - Click "Open"
   - Click the "Execute" button (lightning bolt icon) or press `Ctrl+Shift+Enter`
   - Wait for "Query OK" messages

5. **Verify Tables Were Created**
   - In the left panel, expand `location_sharing` → Tables
   - You should see these tables:
     - users
     - contacts
     - locations
     - location_shares
     - groups
     - group_members
     - otp_sessions
     - refresh_tokens

## Option 2: Using MySQL Command Line

1. **Open Command Prompt or PowerShell**
   
2. **Navigate to backend directory**
   ```powershell
   cd C:\Users\RameshRanjan\source\Repo\location-sharing-app\backend
   ```

3. **Run MySQL commands**
   ```powershell
   # Create database
   mysql -h 127.0.0.1 -P 3306 -u root -pRoot@1234 -e "CREATE DATABASE IF NOT EXISTS location_sharing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   
   # Run schema file
   mysql -h 127.0.0.1 -P 3306 -u root -pRoot@1234 location_sharing < database\schema.sql
   ```

   Note: If MySQL is not in your PATH, use full path:
   ```powershell
   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h 127.0.0.1 -P 3306 -u root -pRoot@1234 location_sharing < database\schema.sql
   ```

4. **Verify**
   ```powershell
   mysql -h 127.0.0.1 -P 3306 -u root -pRoot@1234 -e "USE location_sharing; SHOW TABLES;"
   ```

## Option 3: Copy-Paste SQL Commands

1. **Open MySQL Workbench**

2. **Connect and select/create database**
   - Connect to your MySQL server
   - Run: `CREATE DATABASE IF NOT EXISTS location_sharing;`
   - Select: `USE location_sharing;`

3. **Copy the entire contents** of `backend/database/schema.sql`

4. **Paste into a new query tab** in MySQL Workbench

5. **Execute** (Ctrl+Shift+Enter)

## Verification Query

After running the script, verify all tables exist:

```sql
USE location_sharing;
SHOW TABLES;

-- Should show:
-- users
-- contacts
-- locations
-- location_shares
-- groups
-- group_members
-- otp_sessions
-- refresh_tokens
```

## Troubleshooting

### "Access denied" error
- Check username and password
- Verify MySQL server is running
- Try: `mysql -u root -p` (will prompt for password)

### "Can't connect to MySQL server"
- Make sure MySQL service is running
- Check if MySQL is on port 3306
- Verify firewall settings

### "Table already exists" error
- If you want to recreate, first drop: `DROP DATABASE location_sharing;`
- Then recreate and run the script again

