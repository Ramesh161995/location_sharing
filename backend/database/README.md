# Database Setup Instructions

## MySQL Database Setup

1. **Create the Database:**
   - Open MySQL Workbench
   - Connect to your MySQL server (127.0.0.1:3306)
   - Run: `CREATE DATABASE IF NOT EXISTS location_sharing;`

2. **Run the Schema Script:**
   - Open `schema.sql` in MySQL Workbench
   - Make sure `location_sharing` database is selected
   - Execute the entire script to create all tables

3. **Verify Tables:**
   ```sql
   USE location_sharing;
   SHOW TABLES;
   ```
   You should see:
   - users
   - contacts
   - locations
   - location_shares
   - groups
   - group_members
   - otp_sessions
   - refresh_tokens

## Database Connection Details

- **Host:** 127.0.0.1
- **Port:** 3306
- **Username:** root
- **Password:** Root@1234
- **Database:** location_sharing

## Update .env File

Make sure your `backend/.env` file has:
```
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=Root@1234
MYSQL_DATABASE=location_sharing
```

