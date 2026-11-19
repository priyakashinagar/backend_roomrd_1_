# ROOMRD Backend

Node.js + Express API for **ROOMRD**, a Hinge-style roommate finder app (Flutter client).

## Run

```bash
npm install
npm run dev      # http://localhost:3000, auto-reload
# or
npm start
```

## Storage

| `MONGODB_URI` set? | Data (users, likes, chats) | Photos |
|---|---|---|
| Yes (production) | MongoDB, collection `state` | MongoDB GridFS bucket `uploads` |
| No (local dev) | `data/db.json` | `uploads/` folder |

Both are served at `/uploads/<name>`, so the app does not care which one is used.

### Environment variables

| Name | Default | |
|---|---|---|
| `MONGODB_URI` | _(empty)_ | e.g. `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DB` | `roomrd` | database name |
| `PORT` | `3000` | |

### MongoDB Atlas + Render setup

1. Create a free **M0** cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Database Access** → add a database user (username + password).
3. **Network Access** → allow `0.0.0.0/0` (Render's outbound IPs change).
4. **Connect → Drivers** → copy the `mongodb+srv://...` string and put the password in it.
5. On Render → your service → **Environment** → add `MONGODB_URI` with that string → save (it redeploys).
6. Render logs should show `Storage: MongoDB (...)`. If the URI is wrong the server stops with
   `Could not load the database: ...`.

Without `MONGODB_URI` on Render, data lives on Render's temporary disk and is lost on every
redeploy/restart.

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

## Web app + install link

`public/app/` holds the Flutter **web build** of ROOMRD plus the Android APKs, served at **`/app/`**
(the bare `/` redirects browsers there; tools still get the JSON health check).

- Every visit in a browser shows an **Install ROOMRD** sheet until the app is installed:
  Android Chrome → one-tap install (PWA) + APK download; iPhone Safari → "Share → Add to Home Screen" steps.
- `roomrd.apk` = arm64 (most phones), `roomrd-32bit.apk` = older 32-bit phones.

Update it after changing the app:

```powershell
cd roomrd_app
flutter build web --release --base-href /app/
flutter build apk --release --split-per-abi
# copy build\web\* (without canvaskit) to roomrd_backend\public\app\
# copy app-arm64-v8a-release.apk -> public\app\roomrd.apk, app-armeabi-v7a-release.apk -> public\app\roomrd-32bit.apk
```
