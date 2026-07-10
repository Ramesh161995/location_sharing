# How to Start the Backend

## Quick Start

1. **Open PowerShell in backend directory:**
   ```powershell
   cd C:\Users\RameshRanjan\source\Repo\location-sharing-app\backend
   ```

2. **Activate virtual environment:**
   ```powershell
   .\venv\Scripts\activate
   ```

3. **Start the server:**
   ```powershell
   python run.py
   ```

## Expected Output

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Connected to MySQL database
INFO:     Location Sharing App started successfully
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Test the Backend

1. **Health Check:**
   - Open browser: http://localhost:8000/health
   - Should return: `{"status":"healthy","app":"Location Sharing App",...}`

2. **API Documentation:**
   - Open browser: http://localhost:8000/docs
   - Interactive Swagger UI with all endpoints

3. **Test Endpoints:**
   - `POST /api/v1/auth/request-otp` - Request OTP
   - `POST /api/v1/auth/verify-otp` - Verify OTP

## Troubleshooting

### "ModuleNotFoundError: No module named 'uvicorn'"
**Solution:** Dependencies are already installed. Make sure you activated the virtual environment:
```powershell
.\venv\Scripts\activate
python run.py
```

### "Can't connect to MySQL server"
- Check MySQL server is running
- Verify credentials in `.env` file
- Test connection in MySQL Workbench

### "Access denied for user 'root'"
- Check password in `.env` file matches MySQL
- Verify user has access to `location_sharing` database

### Port 8000 already in use
- Change PORT in `.env` file
- Or stop the other service using port 8000

