# Redhill Infra - Investor & Project Management Portal

A full-stack portal for infrastructure investors and administrators to monitor project progress, construction milestones, investment financials, document legalities, and receive automated email updates.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, TypeScript, SQLite (`better-sqlite3`), Nodemailer / SendGrid, JWT Authentication.
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, TanStack React Query, Lucide Icons, Recharts, Framer Motion.

---



## 💻 Local Development Setup

### 1. Start the Backend Server
```bash
cd Backend
cp .env.example .env   # Configure your environment variables
npm install
npm run dev
```
- **Backend URL**: `http://localhost:5001`
- **Health Check**: `http://localhost:5001/health`

### 2. Start the Frontend Application
```bash
cd Frontend
cp .env.example .env   # Optional (defaults use local Vite proxy)
npm install
npm run dev
```
- **Frontend URL**: `http://localhost:3001` (or `http://localhost:5173`)

---

## 🔑 Default Login Credentials

| Role | Email / Login ID | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@redhillinfra.com` | `admin123` | Full admin dashboard, milestone manager, investor assignments, staff management, notifications |
| **Site Engineer / Manager** | `sitemanager@redhillinfra.com` | `site123` | Site progress, milestones update, CCTV stream, field notes |
| **Financial Officer** | `finance@redhillinfra.com` | `finance123` | Investment ledger, transactions, escrow management, payouts |
| **Support Agent** | `support@redhillinfra.com` | `support123` | Investor inquiries, support tickets, communication hub |
| **Investor (John)** | `investor@example.com` or `jo210` | `investor123` | Investor portfolio, live project tracking, documents, media & ledger |
| **Investor (Sarah)** | `sarah.investor@example.com` or `sa223` | `investor123` | Portfolio view, documents & queries |
| **Investor (David)** | `david.investor@example.com` or `da445` | `investor123` | Portfolio view, documents & queries |
| **Investor (Michael)** | `michael.investor@example.com` or `mi667` | `investor123` | Portfolio view, documents & queries |
| **Investor (Vinay)** | `vinaykl990280487@gmail.com` or `vi870` | `investor123` | Custom investor account |

---

## ⚙️ Environment Variables Reference

### Backend (`Backend/.env`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Runtime mode (`development` / `production`) |
| `PORT` | `5001` | Port number the server binds to |
| `HOST` | `0.0.0.0` | Host address |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend URL for redirects & email action links |
| `CORS_ORIGIN` | `http://localhost:5173,http://localhost:3000,http://localhost:3001` | Comma-separated allowed CORS origins |
| `JWT_SECRET` | `redhill-infra-secret-key-dev-only` | Secret key for JWT token signing |
| `JWT_EXPIRES_IN` | `24h` | Token expiration duration |
| `DATABASE_PATH` | `database.sqlite` | SQLite file path |
| `UPLOADS_DIR` | `uploads` | Directory for uploaded media & documents |
| `GMAIL_USER` | - | Gmail account for SMTP email delivery |
| `GMAIL_APP_PASSWORD` | - | 16-character Google App Password |
| `FROM_EMAIL` | `noreply@redhillinfra.com` | Email "From" address |

### Frontend (`Frontend/.env`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `""` (empty = proxy) | Live Backend API URL (e.g. `https://api.onrender.com`) |
| `VITE_ASSETS_BASE_URL` | Same as API URL | Base URL for serving media uploads |
| `VITE_APP_NAME` | `Redhill Infrastructure Investor Portal` | Application brand name |
| `VITE_PROXY_TARGET` | `http://localhost:5001` | Local development proxy target |
