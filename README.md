# Plasma Hub

Blood bank management web app built with the MERN stack. Patients request blood, hospitals manage inventory and respond to requests, and admins monitor the platform. Access is role-based, and personal data is encrypted before it is stored.

Started as my internship project at Zenexis Solutions (2025).

## Features

**Patient**
- Register and log in
- Find hospitals by blood group (only hospitals with stock of that group are listed)
- Create a blood request: blood group, 1–10 units, routine / urgent / critical priority, optional note, optional preferred hospital
- View own requests and cancel them (fulfilled or cancelled requests cannot be cancelled)

**Hospital**
- Manage stock for all 8 blood groups
- See incoming requests, filter by status, and approve, reject or fulfil them. Fulfilling checks stock and deducts the units
- Dashboard counts: total stock, pending, fulfilled and rejected requests

**Admin**
- Platform metrics: patients, hospitals, total / pending / fulfilled / critical requests, requests in the last 7 days, demand per blood group
- Paginated user and request lists with filters, plus every hospital's inventory

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router 6, Axios, Context API |
| Backend | Node.js, Express 4, Mongoose 8 |
| Database | MongoDB |
| Auth and security | JWT, bcryptjs, crypto-js (AES), Helmet, CORS, express-rate-limit |

## How a request flows

```
React (Vite) → Axios adds "Authorization: Bearer <JWT>"
  → Express route
  → protect      verifies the JWT and loads the user (rejects inactive users)
  → authorize()  checks the user's role for that route group
  → controller → Mongoose model → MongoDB
```

## Project structure

```
plasmahub/
├── client/                     React app
│   └── src/
│       ├── components/         auth, patient, hospital, admin, shared
│       ├── context/            AuthContext (login, register, logout, current user)
│       └── service/api.js      Axios instance, JWT header, API helpers
├── server/                     Express API
│   ├── config/db.js
│   ├── controllers/            auth, patient, hospital, admin
│   ├── middleware/             authMiddleware (protect, authorize), errorHandler
│   ├── models/                 User, BloodRequest, Inventory
│   ├── routes/
│   └── utils/                  encryption.js, seed.js
└── DEBUG_REPORT.md             write-up of a request / re-render loop and its fix
```

## Security design

- Passwords are hashed with bcrypt (12 rounds) and are never returned by the API.
- JWTs expire after 7 days by default (`JWT_EXPIRE`) and are checked on every protected request.
- Public registration can only create `patient` or `hospital` accounts. Admin accounts come from the seed script.
- Each route group is guarded by role: `/api/patient`, `/api/hospital`, `/api/admin`.
- These fields are encrypted with AES before they are saved: user name, phone, address, hospital licence number, and request notes. The key comes from `ENCRYPTION_KEY`.
- Not encrypted, because they are queried or filtered on: email, blood group, age, hospital name, city, state.
- Helmet headers, CORS limited to `CLIENT_URL`, 20 requests per 15 minutes on `/api/auth`, and a 10 KB JSON body limit.

## API

All paths are under `/api`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | Register a patient or hospital (hospitals get an empty inventory) |
| POST | `/auth/login` | public | Log in, returns a JWT |
| GET | `/auth/me` | logged in | Current user |
| GET | `/patient/requests` | patient | Own requests |
| POST | `/patient/requests` | patient | Create a request |
| DELETE | `/patient/requests/:id` | patient | Cancel own request |
| GET | `/patient/hospitals?bloodGroup=` | patient | Hospitals with stock |
| GET | `/hospital/inventory` | hospital | Own inventory |
| PUT | `/hospital/inventory` | hospital | Update stock per blood group |
| GET | `/hospital/requests?status=` | hospital | Requests sent to this hospital |
| PATCH | `/hospital/requests/:id` | hospital | Approve, reject or fulfil |
| GET | `/hospital/stats` | hospital | Stock and request counts |
| GET | `/admin/metrics` | admin | Platform metrics |
| GET | `/admin/users?role=&page=&limit=` | admin | Users |
| GET | `/admin/requests?status=&urgency=&bloodGroup=&page=&limit=` | admin | All requests |
| GET | `/admin/inventory` | admin | All inventories |
| GET | `/health` | public | Health check |

## Getting started

Requirements: Node.js 18+ and a MongoDB instance (local or Atlas).

```bash
# 1. API
cd server
npm install
cp .env.example .env        # then set JWT_SECRET and ENCRYPTION_KEY
node utils/seed.js          # optional demo data. It deletes all users, inventories and requests first
npm run dev                 # http://localhost:4000

# 2. Client (new terminal)
cd client
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Demo accounts created by the seed script (local use only):

| Role | Email | Password |
|---|---|---|
| Admin | admin@plasmahub.com | Admin@123 |
| Hospital | apollo@plasmahub.com | Hospital@123 |
| Hospital | fortis@plasmahub.com | Hospital@123 |
| Patient | patient@plasmahub.com | Patient@123 |

## Engineering notes

`DEBUG_REPORT.md` describes a loop of repeated API calls and re-renders. The cause was a `useToast` hook returning new function references on every render, which re-created the fetch callbacks and re-triggered their effects. The fix memoises the hook and the `AuthContext` value and makes effects depend on state instead of callback identity.

## Known limitations

- No automated tests yet. Endpoints were tested manually in Postman.
- The token is kept in `localStorage`, and there are no refresh tokens.
- Fulfilling a request reads stock and then writes it, so two simultaneous fulfilments could overdraw stock. It needs an atomic update or a transaction.
- Encryption uses crypto-js in passphrase mode (AES-256-CBC with an older MD5-based key derivation and no authentication tag). Moving to Node's `crypto` with AES-256-GCM would be stronger. There is also no key rotation.
- The Axios interceptor redirects to `/login` on any 401, including a failed login.
