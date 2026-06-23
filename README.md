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
- **AI:** OpenAI integration for trip planning and recommendations
- **Port:** 3000 (default)

Key API routes:
- `POST   /api/auth/register` — Register a new user
- `POST   /api/auth/login` — Login and receive a JWT
- `GET    /api/experiences` — List all experiences (supports filters)
- `POST   /api/bookings` — Create a booking
- `GET    /api/bookings/my` — Get bookings for the logged-in user
- `POST   /api/ai/chat` — AI trip planner chat endpoint
- `GET    /api/admin/hosts` — List all operator/host accounts (admin only)
- `GET    /api/health` — Health check

---

### Customer App
- **Framework:** React Native with Expo (SDK 56)
- **Navigation:** React Navigation (bottom tabs + native stack)

**Features:**
- Browse and filter experiences by category, price, location, and more
- Experience detail screen with weather and safety condition widgets
- Full booking flow with dynamic pricing and date selection
- My Trips screen with countdown timer to upcoming experiences
- Trip Dashboard — detailed per-trip view with itinerary and status
- Cancel a booked trip
- AI Trip Planner — guided conversational planner that generates personalized itineraries via OpenAI
- Review history
- Wishlist
- Profile management with avatar upload
- Help center
- Settings

---

### Operator App
- **Framework:** React Native with Expo (SDK 56)

**Features:**
- Dashboard with live booking stats and revenue data (fully dynamic, no hardcoded data)
- Create and edit listings — comprehensive form covering all experience details, pricing, schedule, and media
- Manage bookings with real-time filters (status, date range)
- Reviews and ratings screen with live filter support
- Payouts screen with dynamic earnings data

---

### Operator Web Portal
- **Framework:** React + Vite + Tailwind CSS

**Features:**
- Dashboard with dynamic welcome message and revenue overview
- Analytics page with time-based revenue charting and period selection (weekly, monthly, yearly)
- Listings management — create, edit, and publish experiences; filter by status
- Bookings — searchable and filterable booking list; CSV export
- Reviews — sortable, paginated review list with real-time rating breakdown calculations
- Payouts overview
- Notifications and support

---

### Admin Portal
- **Framework:** React + Vite + Tailwind CSS

**Features:**
- Listings Approval Queue — review, approve, reject, and feature-toggle listings submitted by operators
- Hosts management — view all operator accounts and their listing counts
- Customers management
- Bookings and disputes
- Filter support across listings and other views
- Notifications and settings

---

## Prerequisites

- Node.js v18+
- npm
- MongoDB instance (local or Atlas)
- Expo CLI (`npm install -g expo-cli`) for mobile apps
- OpenAI API key (for AI trip planner)

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
OPENAI_API_KEY=your_openai_api_key
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

| Variable         | Location   | Description                              |
|------------------|------------|------------------------------------------|
| `mongo_uri`      | backend    | MongoDB connection string                |
| `JWT_SECRET`     | backend    | Secret key for signing JWT tokens        |
| `PORT`           | backend    | Port for the API server (default 3000)   |
| `OPENAI_API_KEY` | backend    | OpenAI key for AI trip planner feature   |

---

## Tech Stack

| Layer            | Technology                          |
|------------------|-------------------------------------|
| Mobile apps      | React Native, Expo SDK 56           |
| Web portals      | React 19, Vite, Tailwind CSS        |
| Backend          | Node.js, Express 5, Mongoose        |
| Database         | MongoDB                             |
| Auth             | JWT (jsonwebtoken), bcrypt          |
| AI               | OpenAI API                          |
| HTTP client      | Axios                               |
