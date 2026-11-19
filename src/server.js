const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const DB = require('./db');
const { OPTIONS } = require('./options');
const { searchPlaces } = require('./places');
const { distanceKm, compatibility } = require('./match');
const { botsAround } = require('./seed');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;
const UPLOADS = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });

// Photos: served from MongoDB GridFS when connected, else from the uploads folder.
app.get('/uploads/:name', async (req, res, next) => {
  const m = DB.mongo();
  if (!m) return next();
  const file = await m.bucket.find({ filename: req.params.name }).next();
  if (!file) return res.status(404).end();
  res.set('Content-Type', (file.metadata && file.metadata.contentType) || 'image/jpeg');
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  m.bucket.openDownloadStreamByName(req.params.name).on('error', () => res.status(404).end()).pipe(res);
});
app.use('/uploads', express.static(UPLOADS));

const db = () => DB.get();

const newId = (p) => `${p}_${crypto.randomBytes(6).toString('hex')}`;
const now = () => new Date().toISOString();
const findUser = (id) => db().users.find((u) => u.id === id);

// ---------------------------------------------------------------- helpers

const LIKE_COMMENTS = [
  'Your place looks so cozy! 😍',
  'We seem super compatible, would love to chat!',
  'Same budget and area - lets talk?',
  'Love your vibe, I am also very tidy 😄',
  '',
  '',
];
const BOT_REPLIES = [
  'Hey! When would you like to come see the place?',
  'That sounds great 😊 What does your typical weekday look like?',
  'Nice! How do you feel about splitting groceries and bills?',
  'Totally agree! Are you okay with an 11 month agreement?',
  'I am usually home after 7pm, want to do a quick video call?',
  'Perfect. Any dealbreakers I should know about?',
  'Haha same! Do you cook or order in mostly?',
  'Deposit is 2 months rent, is that okay for you?',
];

// Google plus codes ("XPFC+PFM") are not readable area names.
const PLUS_CODE = /^[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{0,3}\b/i;

function cleanLocation(loc) {
  if (!loc) return loc;
  const city = PLUS_CODE.test(loc.city || '') ? '' : loc.city || '';
  let area = (loc.area || '').replace(/^[23456789CFGHJMPQRVWX+]{4,}\s*,?\s*/i, '').trim();
  if (!area || PLUS_CODE.test(area)) area = city || 'Nearby';
  return { ...loc, area, city };
}

function publicUser(u, viewer) {
  if (!u) return null;
  const { token, phone, prefs, isBot, ...rest } = u;
  const out = { ...rest, location: cleanLocation(rest.location) };
  if (viewer && viewer.id !== u.id) {
    out.distanceKm = distanceKm(viewer.location, u.location);
    out.compatibility = compatibility(viewer, u);
  }
  return out;
}

function likeOf(from, to) {
  return db().swipes.find((s) => s.from === from && s.to === to && s.action === 'like');
}

function matchBetween(a, b) {
  return db().matches.find((m) => m.users.includes(a) && m.users.includes(b));
}

function createMatch(a, b) {
  const existing = matchBetween(a, b);
  if (existing) return existing;
  const m = { id: newId('m'), users: [a, b], createdAt: now(), readAt: {} };
  db().matches.unshift(m);
  return m;
}

function matchSummary(m, viewer) {
  const otherId = m.users.find((x) => x !== viewer.id);
  const msgs = db().messages.filter((x) => x.matchId === m.id);
  const readAt = (m.readAt && m.readAt[viewer.id]) || '';
  return {
    id: m.id,
    createdAt: m.createdAt,
    user: publicUser(findUser(otherId), viewer),
    lastMessage: msgs.length ? msgs[msgs.length - 1] : null,
    unread: msgs.filter((x) => x.senderId !== viewer.id && x.createdAt > readAt).length,
  };
}

const isOnboarded = (u) =>
  !!(u.name && u.age && u.gender && u.role && u.location && u.location.lat != null && u.rent && u.photos && u.photos.length &&
    (u.bio || '').trim().length >= 20);

/** Make sure a user has bots nearby and a few incoming likes (demo life). */
function warmUp(user) {
  const d = db();
  if (!user.location) return;
  user.location = cleanLocation(user.location);
  const near = d.users.filter((u) => u.isBot && (distanceKm(user.location, u.location) ?? 999) <= 25);
  if (near.length < 8) {
    const bots = botsAround(user.location, d.botCounter, 10, d.botCounter);
    d.botCounter += bots.length;
    d.users.push(...bots);
  }
  const alreadyLiking = d.swipes.filter((s) => s.to === user.id && s.action === 'like').length;
  if (alreadyLiking >= 3) return;
  const candidates = d.users
    .filter((u) => u.isBot && !d.swipes.some((s) => s.from === u.id && s.to === user.id))
    .map((u) => ({ u, km: distanceKm(user.location, u.location) ?? 9999 }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 12)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
  for (const { u } of candidates) {
    const usePrompt = user.prompts && user.prompts.length && Math.random() < 0.4;
    d.swipes.push({
      from: u.id,
      to: user.id,
      action: 'like',
      likedItem: usePrompt ? { type: 'prompt', index: 0 } : { type: 'photo', index: 0 },
      comment: LIKE_COMMENTS[Math.floor(Math.random() * LIKE_COMMENTS.length)],
      createdAt: now(),
    });
  }
}

// ----------------------------------------------------------------- auth

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const user = token && db().users.find((u) => u.token === token);
  if (!user) return res.status(401).json({ error: 'Not logged in' });
  req.user = user;
  next();
}

// ---------------------------------------------------------------- routes

// Health check: also says which storage is active (never the connection string).
app.get('/', (_req, res) =>
  res.json({
    app: 'ROOMRD API',
    status: 'ok',
    version: 2,
    storage: DB.mongo() ? 'mongodb' : 'file',
    mongodbUriSet: !!process.env.MONGODB_URI,
    users: db().users.length,
  }),
);

app.get('/api/meta', (_req, res) => res.json(OPTIONS));

app.get('/api/places', (req, res) => res.json(searchPlaces(req.query.q)));

// Phone login: creates the account if the number is new.
app.post('/api/auth/login', (req, res) => {
  const phone = String((req.body && req.body.phone) || '').replace(/\D/g, '');
  if (phone.length < 10) return res.status(400).json({ error: 'Enter a valid 10 digit phone number' });
  let user = db().users.find((u) => !u.isBot && u.phone === phone);
  const isNew = !user;
  if (!user) {
    user = {
      id: newId('u'),
      phone,
      token: crypto.randomBytes(24).toString('hex'),
      onboarded: false,
      verified: true, // phone verified
      prefs: { gender: 'Any', maxDistanceKm: 25, role: 'all', maxRent: 50000 },
      createdAt: now(),
    };
    db().users.push(user);
    DB.save();
  }
  res.json({ token: user.token, isNew, user: publicUser(user) });
});

app.get('/api/me', auth, (req, res) => res.json({ ...publicUser(req.user), prefs: req.user.prefs }));

const EDITABLE = [
  'name', 'age', 'gender', 'role', 'occupation', 'workType', 'bio', 'photos', 'roomPhotos', 'location', 'rent',
  'moveIn', 'furnishing', 'sharedBathroom', 'amenities', 'pets', 'petDetail', 'lifestyle', 'interests', 'prompts', 'prefs',
];

app.put('/api/me', auth, (req, res) => {
  const u = req.user;
  const body = req.body || {};
  for (const k of EDITABLE) if (k in body) u[k] = body[k];
  if (u.age) u.age = Math.max(18, Math.min(99, parseInt(u.age, 10) || 18));
  if (u.rent) u.rent = Math.max(0, parseInt(u.rent, 10) || 0);
  if (u.location) u.location = cleanLocation(u.location);
  const wasOnboarded = u.onboarded;
  u.onboarded = isOnboarded(u);
  if (u.onboarded && (!wasOnboarded || 'location' in body)) warmUp(u);
  DB.save();
  res.json({ ...publicUser(u), prefs: u.prefs });
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\//.test(file.mimetype) || /\.(jpe?g|png|webp|heic)$/i.test(file.originalname)),
});

app.post('/api/upload', auth, upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const name = `${newId('img')}${path.extname(req.file.originalname || '') || '.jpg'}`;
    const m = DB.mongo();
    if (m) {
      await new Promise((resolve, reject) =>
        m.bucket
          .openUploadStream(name, { metadata: { contentType: req.file.mimetype, owner: req.user.id } })
          .on('finish', resolve)
          .on('error', reject)
          .end(req.file.buffer),
      );
    } else {
      fs.writeFileSync(path.join(UPLOADS, name), req.file.buffer);
    }
    res.status(201).json({ url: `/uploads/${name}` });
  } catch (e) {
    next(e);
  }
});

// Higher compatibility first, nearby people nudged up.
const rank = (u) => u.compatibility.score - Math.min(u.distanceKm ?? 0, 50) * 0.6;

// Discover feed, filtered by the user's saved preferences.
app.get('/api/feed', auth, (req, res) => {
  const me = req.user;
  const p = me.prefs || {};
  const swiped = new Set(db().swipes.filter((s) => s.from === me.id).map((s) => s.to));
  const list = db()
    .users.filter((u) => u.id !== me.id && u.onboarded && !swiped.has(u.id))
    .map((u) => publicUser(u, me))
    .filter((u) => {
      if (p.role && p.role !== 'all' && u.role !== p.role) return false;
      if (p.gender && p.gender !== 'Any' && u.gender !== p.gender) return false;
      if (p.maxRent && u.rent > p.maxRent) return false;
      if (p.maxDistanceKm && u.distanceKm != null && u.distanceKm > p.maxDistanceKm) return false;
      return true;
    })
    .sort((a, b) => rank(b) - rank(a));
  res.json(list.slice(0, 40));
});

app.get('/api/users/:id', auth, (req, res) => {
  const u = findUser(req.params.id);
  if (!u || !u.onboarded) return res.status(404).json({ error: 'Profile not found' });
  res.json(publicUser(u, req.user));
});

// People who liked me that I have not answered yet.
app.get('/api/likes-you', auth, (req, res) => {
  const me = req.user;
  const answered = new Set(db().swipes.filter((s) => s.from === me.id).map((s) => s.to));
  const list = db()
    .swipes.filter((s) => s.to === me.id && s.action === 'like' && !answered.has(s.from))
    .map((s) => ({
      user: publicUser(findUser(s.from), me),
      like: { item: s.likedItem ? s.likedItem.type : 'profile', itemIndex: s.likedItem ? s.likedItem.index : 0, comment: s.comment || '' },
      createdAt: s.createdAt,
    }))
    .filter((x) => x.user);
  res.json(list);
});

// body: { targetId, action: 'like'|'pass', likedItem?: {type,index}, comment? }
app.post('/api/swipe', auth, (req, res) => {
  const me = req.user;
  const { targetId, action, likedItem, comment } = req.body || {};
  const target = findUser(targetId);
  if (!target || target.id === me.id) return res.status(404).json({ error: 'Profile not found' });
  if (!['like', 'pass'].includes(action)) return res.status(400).json({ error: 'action must be like or pass' });

  const d = db();
  d.swipes = d.swipes.filter((s) => !(s.from === me.id && s.to === target.id));
  d.swipes.push({ from: me.id, to: target.id, action, likedItem: likedItem || null, comment: (comment || '').trim(), createdAt: now() });

  let match = null;
  if (action === 'like') {
    let theyLike = !!likeOf(target.id, me.id);
    if (!theyLike && target.isBot) {
      // Bots like back based on compatibility (plus a bit of luck).
      const { score } = compatibility(target, me);
      if (Math.random() * 100 < score * 0.8) {
        d.swipes.push({ from: target.id, to: me.id, action: 'like', likedItem: null, comment: '', createdAt: now() });
        theyLike = true;
      }
    }
    if (theyLike) {
      match = createMatch(me.id, target.id);
      const c = (comment || '').trim();
      if (c) d.messages.push({ id: newId('msg'), matchId: match.id, senderId: me.id, text: c, createdAt: now() });
      const theirLike = likeOf(target.id, me.id);
      if (theirLike && theirLike.comment) {
        d.messages.push({ id: newId('msg'), matchId: match.id, senderId: target.id, text: theirLike.comment, createdAt: now() });
      }
    }
  }
  DB.save();
  res.json({ matched: !!match, match: match ? matchSummary(match, me) : null });
});

// Undo my most recent swipe (only if it did not create a match).
app.post('/api/swipe/undo', auth, (req, res) => {
  const me = req.user;
  const d = db();
  const mine = d.swipes.filter((s) => s.from === me.id);
  const last = mine[mine.length - 1];
  if (!last) return res.status(404).json({ error: 'Nothing to undo' });
  if (matchBetween(me.id, last.to)) return res.status(409).json({ error: 'You already matched with this person' });
  d.swipes = d.swipes.filter((s) => s !== last);
  DB.save();
  res.json(publicUser(findUser(last.to), me));
});

app.get('/api/matches', auth, (req, res) => {
  const me = req.user;
  const list = db()
    .matches.filter((m) => m.users.includes(me.id))
    .map((m) => matchSummary(m, me))
    .filter((m) => m.user)
    .sort((a, b) => ((b.lastMessage || {}).createdAt || b.createdAt).localeCompare((a.lastMessage || {}).createdAt || a.createdAt));
  res.json(list);
});

app.delete('/api/matches/:id', auth, (req, res) => {
  const d = db();
  const m = d.matches.find((x) => x.id === req.params.id && x.users.includes(req.user.id));
  if (!m) return res.status(404).json({ error: 'Match not found' });
  d.matches = d.matches.filter((x) => x !== m);
  d.messages = d.messages.filter((x) => x.matchId !== m.id);
  DB.save();
  res.json({ ok: true });
});

function myMatch(req, res) {
  const m = db().matches.find((x) => x.id === req.params.id && x.users.includes(req.user.id));
  if (!m) res.status(404).json({ error: 'Match not found' });
  return m;
}

app.get('/api/matches/:id/messages', auth, (req, res) => {
  const m = myMatch(req, res);
  if (!m) return;
  m.readAt = m.readAt || {};
  m.readAt[req.user.id] = now();
  DB.save();
  res.json(db().messages.filter((x) => x.matchId === m.id));
});

app.post('/api/matches/:id/messages', auth, (req, res) => {
  const m = myMatch(req, res);
  if (!m) return;
  const text = String((req.body && req.body.text) || '').trim();
  if (!text) return res.status(400).json({ error: 'text is required' });
  const msg = { id: newId('msg'), matchId: m.id, senderId: req.user.id, text, createdAt: now() };
  db().messages.push(msg);
  DB.save();

  const other = findUser(m.users.find((x) => x !== req.user.id));
  if (other && other.isBot) {
    setTimeout(() => {
      if (!db().matches.includes(m)) return;
      db().messages.push({
        id: newId('msg'),
        matchId: m.id,
        senderId: other.id,
        text: BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)],
        createdAt: now(),
      });
      DB.save();
    }, 1500 + Math.random() * 1500);
  }
  res.status(201).json(msg);
});

// Badge counts for the bottom navigation.
app.get('/api/counts', auth, (req, res) => {
  const me = req.user;
  const answered = new Set(db().swipes.filter((s) => s.from === me.id).map((s) => s.to));
  const likes = db().swipes.filter((s) => s.to === me.id && s.action === 'like' && !answered.has(s.from)).length;
  const unread = db()
    .matches.filter((m) => m.users.includes(me.id))
    .reduce((n, m) => n + matchSummary(m, me).unread, 0);
  res.json({ likes, unread });
});

// Demo helper: clears swipes/matches/chats, regenerates dummy profiles.
app.post('/api/reset', (_req, res) => {
  DB.reset();
  for (const u of db().users) if (!u.isBot && u.onboarded) warmUp(u);
  DB.save();
  res.json({ ok: true });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

DB.load()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`ROOMRD API running on http://localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.error('Could not load the database:', e.message);
    process.exit(1);
  });
