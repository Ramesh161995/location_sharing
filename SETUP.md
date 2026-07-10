# Setup Guide — Clone and Run on a New Machine

This guide walks through setting up **PinShare** (location sharing app) after cloning the repository on a new computer.

## Prerequisites

Install these before you begin:

| Tool | Version | Purpose |
|------|---------|---------|
| Git | Latest | Clone the repository |
| Python | 3.8+ (3.13 supported) | FastAPI backend |
| Node.js | 20+ (20.19.4+ recommended) | Expo / React Native frontend |
| MySQL | 8.x | Application database |
| Expo Go | Latest (mobile app store) | Test on a physical phone |

Optional: Redis (not required for basic auth and location flows).

---

## 1. Clone the repository

```bash
git clone <your-repository-url>
cd location_sharing
```

Replace `<your-repository-url>` with your actual Git remote URL.

---

## 2. Backend setup

### 2.1 Create a Python virtual environment

The `venv/` folder is **not** committed to git. Create it on every new machine.

**Windows (PowerShell):**

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
```

**macOS / Linux:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 2.2 Install Python dependencies

For Python 3.13+:

```bash
pip install -r requirements-313.txt
```

For older Python versions:

```bash
pip install -r requirements.txt
pip install aiomysql python-dotenv
```

### 2.3 Create the backend `.env` file

`.env` files are gitignored and must be created manually.

```powershell
cd backend
# See backend/CREATE_ENV_FILE.md for the full template
```

Minimum required variables:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=location_sharing
SECRET_KEY=change-this-to-a-strong-random-key
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

> Use your own MySQL password. Do not commit `.env` to git.

### 2.4 Set up the MySQL database

1. Start the MySQL server.
2. Create the database and tables using one of these options:

**Option A — PowerShell script (Windows):**

```powershell
cd backend
.\run_sql_setup.ps1
```

Update MySQL credentials in the script if they differ from the defaults.

**Option B — MySQL Workbench:**

1. Connect to MySQL
2. Run: `CREATE DATABASE IF NOT EXISTS location_sharing;`
3. Open and execute `backend/database/schema.sql`

Verify tables exist:

```sql
USE location_sharing;
SHOW TABLES;
```

You should see 8 tables (`users`, `contacts`, `locations`, `location_shares`, `groups`, `group_members`, `otp_sessions`, `refresh_tokens`).

### 2.5 Start the backend

```powershell
cd backend
.\venv\Scripts\activate    # Windows
# source venv/bin/activate  # macOS/Linux
python run.py
```

**Verify:**

- Health check: http://localhost:8000/health
- API docs: http://localhost:8000/docs

Expected log output includes `Uvicorn running on http://0.0.0.0:8000`.

---

## 3. Frontend setup

Open a **second terminal** (keep the backend running).

### 3.1 Install Node dependencies

```bash
cd frontend
npm install
```

### 3.2 Configure the API URL for your machine

Edit `frontend/src/config/api.ts` and set your computer's LAN IP address:

```typescript
const DEVICE_IP = '192.168.x.x';  // your PC's IPv4 address
const USE_DEVICE_IP = true;       // true for physical phone
```

Find your IP:

- **Windows:** `ipconfig` → look for `IPv4 Address` under Wi-Fi
- **macOS / Linux:** `ifconfig` or `ip addr`

This controls **backend API calls** (`http://<IP>:8000/api/v1`), not the Expo Metro bundler URL.

### 3.3 Use the real backend (not mock API)

In `frontend/src/services/authAPI.ts`, confirm:

```typescript
const USE_MOCK_API = false;
```

### 3.4 Start Expo

```bash
npx expo start --lan
```

Use `--lan` when testing on a **physical phone** so the QR code uses your LAN IP (e.g. `exp://192.168.x.x:8081`) instead of `127.0.0.1`.

Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS).

---

## 4. Running both services

| Terminal | Directory | Command |
|----------|-----------|---------|
| 1 — Backend | `backend/` | `.\venv\Scripts\activate` then `python run.py` |
| 2 — Frontend | `frontend/` | `npx expo start --lan` |

Your phone and PC must be on the **same Wi-Fi network**.

---

## 5. Emulator vs physical device

### Physical phone (Expo Go)

```typescript
// frontend/src/config/api.ts
const DEVICE_IP = 'your-pc-lan-ip';
const USE_DEVICE_IP = true;
```

```bash
npx expo start --lan
```

### Android emulator

```typescript
const USE_DEVICE_IP = false;
```

Backend URL resolves to `http://10.0.2.2:8000/api/v1`.

### iOS simulator (macOS only)

```typescript
const USE_DEVICE_IP = false;
```

Backend URL resolves to `http://localhost:8000/api/v1`.

---

## 6. Quick verification checklist

```
[ ] git clone completed
[ ] Python, Node.js, and MySQL installed
[ ] backend/venv created and dependencies installed
[ ] backend/.env created with correct MySQL credentials
[ ] MySQL schema applied (backend/database/schema.sql)
[ ] Backend running — http://localhost:8000/health returns healthy
[ ] frontend npm install completed
[ ] DEVICE_IP updated in frontend/src/config/api.ts
[ ] Expo started with --lan
[ ] Phone can load app and request OTP
```

---

## 7. Troubleshooting

### Backend: "Can't connect to MySQL server"

- Confirm MySQL is running
- Check `MYSQL_HOST`, `MYSQL_USER`, and `MYSQL_PASSWORD` in `backend/.env`
- Test the connection in MySQL Workbench

### Frontend: "Network request failed"

- Backend must be running on port 8000
- Update `DEVICE_IP` in `api.ts` to your current PC IP
- Phone and PC must be on the same Wi-Fi
- Allow ports **8000** and **8081** through Windows Firewall if needed

### Expo shows `exp://127.0.0.1:8081`

- This is the Metro bundler URL, not the backend URL
- Start with `npx expo start --lan` for physical device testing
- If LAN still fails, try: `npx expo start --tunnel`

### Expo loads but API calls fail

- Watch Metro logs for: `Full URL: http://192.168.x.x:8000/api/v1/...`
- If the IP is wrong, update `api.ts` and reload the app (press `r` in Expo terminal)

### Do not copy `backend/.env` into `frontend/`

Expo auto-loads `frontend/.env`. Backend environment variables (MySQL passwords, JWT secrets) belong only in `backend/.env`.

---

## 8. Files not included in git

These must be recreated on each machine:

| Path | Action |
|------|--------|
| `backend/venv/` | `python -m venv venv` |
| `backend/.env` | Create from `backend/CREATE_ENV_FILE.md` |
| `frontend/node_modules/` | `npm install` |

---

## Related documentation

- [README.md](./README.md) — Project overview
- [backend/START_BACKEND.md](./backend/START_BACKEND.md) — Backend quick start
- [backend/CREATE_ENV_FILE.md](./backend/CREATE_ENV_FILE.md) — Full `.env` template
- [NEXT_STEPS.md](./NEXT_STEPS.md) — Post-setup testing steps
- [TROUBLESHOOTING_NETWORK_ERROR.md](./TROUBLESHOOTING_NETWORK_ERROR.md) — Network debugging
