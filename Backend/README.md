# ParkEase Backend

Express + MongoDB backend for the existing ParkEase React/Vite frontend.

## Setup
1. Install Node.js LTS and MongoDB (local) or use MongoDB Atlas.
2. Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`.
3. Run `npm install`.
4. Run `npm run seed` once. This creates the admin account and 90 slots (30 cars + 60 bikes).
5. Run `npm run dev`.
6. Check `http://localhost:5000/api/health`.

## Demo admin
Email: `admin@parkease.com`
Password: `admin123`

Admin has no public registration route.

## Main API groups
- POST `/api/auth/register` — student/faculty only
- POST `/api/auth/login`
- GET `/api/auth/me`
- GET `/api/slots`
- POST `/api/slots` (admin)
- POST `/api/bookings`
- GET `/api/bookings/my`
- PATCH `/api/bookings/:id/cancel`
- POST `/api/bookings/verify-entry`
- POST `/api/sessions/:id/start`
- POST `/api/sessions/:id/end`
- POST `/api/sessions/:id/extend`
- GET `/api/admin/dashboard` (admin)
- GET `/api/admin/bookings` (admin)
- GET `/api/admin/users` (admin)
- GET `/api/admin/reports` (admin)
- GET `/api/events/active`
- POST `/api/events/guest-bookings`
- GET/POST/PATCH `/api/events` (admin)
- GET/POST `/api/violations`
- GET/PATCH `/api/notifications`

## Slot status
The database stores a slot as `available` or `disabled`. Time-specific booking availability is calculated from bookings:
- available: no overlapping booking
- booked: overlapping reservation with status `booked`
- occupied: overlapping booking with status `active`

The backend is the source of truth; the current frontend still uses mock/local state and will need its service files connected to these APIs in the integration stage.
