# Wildvora

Wildvora is a travel and adventure booking platform that connects customers with outdoor experiences. The platform consists of five separate applications that work together across mobile and web.

---

## Project Structure

```
WILDVORA/
├── backend/              Node.js + Express REST API
├── customer-app/         React Native (Expo) mobile app for customers
├── operator-app/         React Native (Expo) mobile app for operators
├── operator-web-portal/  React web portal for operators (Vite + Tailwind)
└── admin-portal/         React web portal for admins (Vite + Tailwind)
```

---

## Applications

### Backend API
- **Runtime:** Node.js with Express
- **Database:** MongoDB via Mongoose
- **Auth:** JWT-based authentication
- **Port:** 3000 (default)

Key API routes:
- `POST   /api/auth/register` — Register a new user
- `POST   /api/auth/login` — Login and receive a JWT
- `GET    /api/experiences` — List all experiences
- `POST   /api/bookings` — Create a booking
- `GET    /api/bookings/my` — Get bookings for the logged-in user
- `GET    /api/health` — Health check

### Customer App
- **Framework:** React Native with Expo (SDK 56)
- **Navigation:** React Navigation (bottom tabs + native stack)
- Allows customers to browse experiences, make bookings, and manage their trips.

### Operator App
- **Framework:** React Native with Expo (SDK 56)
- Allows experience operators to manage their listings and view bookings from a mobile device.

### Operator Web Portal
- **Framework:** React + Vite + Tailwind CSS
- Web-based dashboard for operators to manage experiences, view booking history, and handle payouts.

### Admin Portal
- **Framework:** React + Vite + Tailwind CSS
- Internal dashboard for platform administrators to manage users, operators, experiences, and disputes.

---

## Prerequisites

- Node.js v18+
- npm
- MongoDB instance (local or Atlas)
- Expo CLI (`npm install -g expo-cli`) for mobile apps

---

## Setup and Running

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```
mongo_uri=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000
```

Start the server:

```bash
npm start
```

### 2. Customer App

```bash
cd customer-app
npm install
npx expo start
```

Use the Expo Go app on your device, or press `i` for iOS simulator / `a` for Android emulator.

> **Note:** Update the IP address in `src/services/api.js` to match your machine's local IP so physical devices can reach the backend.

### 3. Operator App

```bash
cd operator-app
npm install
npx expo start
```

Same setup as the customer app above.

### 4. Operator Web Portal

```bash
cd operator-web-portal
npm install
npm run dev
```

Runs at `http://localhost:5173` by default.

### 5. Admin Portal

```bash
cd admin-portal
npm install
npm run dev
```

Runs at `http://localhost:5173` by default (run on a different port if both portals are active simultaneously using `--port`).

---

## Environment Variables

| Variable      | Location   | Description                        |
|---------------|------------|------------------------------------|
| `mongo_uri`   | backend    | MongoDB connection string          |
| `JWT_SECRET`  | backend    | Secret key for signing JWT tokens  |
| `PORT`        | backend    | Port for the API server (default 3000) |

---

## Tech Stack

| Layer            | Technology                          |
|------------------|-------------------------------------|
| Mobile apps      | React Native, Expo SDK 56           |
| Web portals      | React 19, Vite, Tailwind CSS        |
| Backend          | Node.js, Express 5, Mongoose        |
| Database         | MongoDB                             |
| Auth             | JWT (jsonwebtoken), bcrypt          |
| HTTP client      | Axios                               |
