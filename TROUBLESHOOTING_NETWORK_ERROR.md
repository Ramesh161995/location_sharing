# Troubleshooting Network Error on OTP Verification

## Quick Checks:

### 1. Backend is Running?
- Check Terminal 1: Should show "Uvicorn running on http://0.0.0.0:8000"
- Test in browser: http://localhost:8000/health

### 2. Check Backend Logs
When you try to verify OTP, check the backend terminal for:
- Any error messages
- Request logs showing the incoming request

### 3. API URL Configuration

**For Emulator/Simulator:**
- iOS Simulator: Uses `localhost` ✅ (should work)
- Android Emulator: Uses `10.0.2.2` ✅ (should work)

**For Physical Device:**
- You need to update `DEVICE_IP` in `frontend/src/config/api.ts`
- Set `USE_DEVICE_IP = true`
- Get your computer's IP: Run `ipconfig` in PowerShell, find "IPv4 Address"

### 4. Common Issues:

#### Issue: "Network request failed" on Physical Device
**Solution:**
1. Find your computer's IP address:
   ```powershell
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   ```

2. Update `frontend/src/config/api.ts`:
   ```typescript
   const DEVICE_IP = '192.168.1.100'; // Your actual IP
   const USE_DEVICE_IP = true; // Change to true
   ```

3. Make sure phone and computer are on same WiFi network

4. Check Windows Firewall - it might be blocking port 8000

#### Issue: CORS Error
**Solution:**
- Backend should already allow all origins in development
- Check `.env` file: `BACKEND_CORS_ORIGINS=["*"]`

#### Issue: Backend Not Receiving Request
**Solution:**
- Check backend terminal for incoming requests
- If no logs appear, the request isn't reaching the backend
- Check API URL in frontend logs

### 5. Debug Steps:

1. **Check Frontend Console:**
   - Open React Native debugger or check Metro bundler logs
   - Look for the actual error message

2. **Check Backend Logs:**
   - Look for the request coming in
   - Check for any errors

3. **Test API Directly:**
   - Open http://localhost:8000/docs
   - Try the `/api/v1/auth/verify-otp` endpoint manually
   - See if it works

4. **Check Network:**
   - If using physical device, ensure same WiFi network
   - Try pinging your computer's IP from the device

### 6. Enable More Detailed Logging:

Add this to `frontend/src/services/authAPI.ts` in the `createRealAPI` function:

```typescript
// Add before return statement
api.interceptors.request.use((config) => {
  console.log('API Request:', config.method?.toUpperCase(), config.url);
  console.log('Full URL:', config.baseURL + config.url);
  console.log('Data:', config.data);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.message);
    console.error('Error Details:', error.response?.data || error.message);
    console.error('Error Status:', error.response?.status);
    return Promise.reject(error);
  }
);
```

This will show you exactly what's happening in the console.

