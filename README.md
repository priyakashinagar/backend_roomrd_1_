# ROOMRD Backend

Node.js + Express API for **ROOMRD**, a Hinge-style roommate finder app (Flutter client).

## Run

```bash
npm install
npm run dev      # http://localhost:3000, auto-reload
# or
npm start
```

- Data is stored in `data/db.json` (created on first run, git-ignored). Delete it to start fresh.
- Uploaded photos go to `uploads/` (git-ignored) and are served at `/uploads/...`.
- `PORT` env var changes the port (default `3000`).

## What it does

- Phone-number login with a bearer token (no OTP yet).
- Profiles: role (has a room / needs a room), location (lat/lng + area/city), rent, move-in,
  furnishing, bathroom, amenities, pets, lifestyle, interests, photos, room photos, bio, prompts.
- Discover feed filtered by the user's preferences, with **distance** (haversine) and a
  **compatibility score** (0-100) plus reasons.
- Likes, matches, undo, chat with unread counts.
- Demo data: dummy profiles across Indian cities (`src/seed.js`), 10 more generated around each new
  user's location, a few auto-likes, and canned chat replies from dummy users.

## Files

| File | Purpose |
|---|---|
| `src/server.js` | Routes, auth, match logic, demo replies, location cleanup |
| `src/db.js` | JSON-file storage and reset |
| `src/seed.js` | Dummy profile generator |
| `src/match.js` | Distance and compatibility score |
| `src/options.js` | Sign-up options served to the app (`/api/meta`) |
| `src/places.js` | Searchable list of Indian areas with coordinates |

## API

All routes except `auth/login`, `meta` and `places` need `Authorization: Bearer <token>`.

| Method | Path | |
|---|---|---|
| POST | /api/auth/login | `{phone}` → `{token, isNew}` |
| GET | /api/meta | sign-up options |
| GET | /api/places?q= | search areas/cities |
| GET / PUT | /api/me | my profile / update fields (incl. `prefs`) |
| POST | /api/upload | multipart `photo` → `{url}` |
| GET | /api/feed | discover feed with `distanceKm` + `compatibility` |
| POST | /api/swipe | `{targetId, action: like\|pass, likedItem?, comment?}` → `{matched, match?}` |
| POST | /api/swipe/undo | undo last swipe |
| GET | /api/likes-you | people who liked me |
| GET | /api/counts | `{likes, unread}` |
| GET | /api/matches | matches + last message + unread |
| DELETE | /api/matches/:id | unmatch |
| GET / POST | /api/matches/:id/messages | read / send chat (`{text}`) |
| POST | /api/reset | reset swipes/matches/chats, regenerate dummy profiles |
