# Dairy Milk Collection System

A full-stack MERN (MongoDB Atlas, Express, React, Node.js) application for managing dairy milk collections, user roles (Admin & Operator), and daily operations.

## Project Structure

```text
dairy-milk-collection/
├── package.json           # Root package with concurrent execution scripts
├── README.md              # Instructions and project documentation
├── server/                # Express backend + Mongoose + JWT Auth
│   ├── .env.example       # Backend environment variables template
│   ├── package.json
│   └── src/
│       ├── config/        # Database connection config
│       ├── controllers/   # Route controllers (auth, health, etc.)
│       ├── middleware/    # Auth & role verification middleware
│       ├── models/        # Mongoose schema models (User, etc.)
│       ├── routes/        # Express API routes
│       ├── utils/         # JWT generation and helpers
│       └── server.js      # Server entry point
└── client/                # Vite + React + TypeScript + Tailwind CSS v3
    ├── .env.example       # Client environment variables template
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── api/           # Axios instance with auth interceptors
        ├── components/    # PrivateRoute, Layout, Navbar, etc.
        ├── context/       # AuthContext for global authentication
        ├── pages/         # Login, Dashboard, Unauthorized, NotFound
        ├── types/         # TypeScript interfaces
        ├── App.tsx        # React Router v6 setup
        └── main.tsx       # Vite application mounting point
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB**: MongoDB Atlas connection URI (or local MongoDB server)

---

### Setup Instructions

1. **Install All Dependencies**

   Run the following command from the project root directory to install dependencies for root, server, and client:

   ```bash
   npm run install:all
   ```

   *Alternatively, install manually:*
   ```bash
   npm install                    # Root dependencies (concurrently)
   cd server && npm install       # Backend dependencies
   cd ../client && npm install    # Frontend dependencies
   ```

2. **Configure Environment Variables**

   - **Backend Configuration**:
     Copy `server/.env.example` to `server/.env` and update the values:
     ```bash
     cp server/.env.example server/.env
     ```
     Values in `server/.env`:
     ```env
     PORT=5000
     MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dairy_db?retryWrites=true&w=majority
     JWT_SECRET=your_super_secret_jwt_key_change_in_production
     CLIENT_ORIGIN=http://localhost:5173
     ```

   - **Frontend Configuration**:
     Copy `client/.env.example` to `client/.env` (or `client/.env.local`):
     ```bash
     cp client/.env.example client/.env
     ```
     Values in `client/.env`:
     ```env
     VITE_API_URL=http://localhost:5000
     ```

---

## Running the Application

### 1. Run Server and Client Concurrently (Recommended)

From the project root:

```bash
npm run dev
```

This will run:
- **Server**: `http://localhost:5000` (via `nodemon`)
- **Client**: `http://localhost:5173` (via `vite`)

---

### 2. Run Independently

- **Server only**:
  ```bash
  cd server
  npm run dev
  ```

- **Client only**:
  ```bash
  cd client
  npm run dev
  ```

---

## API Endpoints

### Health Check
- `GET /api/health` - Check backend server status and timestamp.

### Authentication
- `POST /api/auth/login` - Authenticate user & return JWT token.
- `POST /api/auth/register` - Register new user (Admin / Operator).
- `GET /api/auth/me` - Get current authenticated user profile (`Bearer <token>` required).

---

## User Roles & Security

- **Admin**: Full control over collection records, pricing, users, and reports.
- **Operator**: Entry operator for daily milk collection records.
- **JWT Storage**: JWT token stored in `localStorage` and attached via Axios request interceptor (`Authorization: Bearer <token>`).

# Dairy
