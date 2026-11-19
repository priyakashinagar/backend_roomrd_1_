// Storage for the demo. The whole state lives in memory and is persisted to:
//   - MongoDB, when MONGODB_URI is set (survives redeploys, e.g. on Render), or
//   - data/db.json otherwise (local development).
// In MongoDB each part (users, swipes, matches, messages, meta) is stored as one
// document in the `state` collection, so the code stays simple; a single part
// is limited to 16 MB, which is plenty for a demo.

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { seedBots } = require('./seed');

const FILE = path.join(__dirname, '..', 'data', 'db.json');
const MONGODB_URI = process.env.MONGODB_URI || '';
const PARTS = ['users', 'swipes', 'matches', 'messages'];

let db;
let mongo = null; // { client, state, bucket }

function fresh(realUsers = []) {
  return {
    users: [...seedBots(), ...realUsers],
    swipes: [], // { from, to, action, likedItem, comment, createdAt }
    matches: [], // { id, users: [a, b], createdAt }
    messages: [], // { id, matchId, senderId, text, createdAt }
    botCounter: 10000,
  };
}

async function connectMongo() {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const database = client.db(process.env.MONGODB_DB || 'roomrd');
  const { GridFSBucket } = require('mongodb');
  mongo = { client, state: database.collection('state'), bucket: new GridFSBucket(database, { bucketName: 'uploads' }) };
}

/** Loads state from MongoDB or the JSON file. Call once before serving. */
async function load() {
  if (MONGODB_URI) {
    await connectMongo();
    const docs = await mongo.state.find({}).toArray();
    if (docs.length) {
      const byId = Object.fromEntries(docs.map((d) => [d._id, d]));
      db = fresh();
      for (const p of PARTS) db[p] = (byId[p] && byId[p].items) || [];
      db.botCounter = (byId.meta && byId.meta.botCounter) || 10000;
      if (!db.users.length) db = fresh();
    } else {
      db = fresh();
      await flush();
    }
    console.log(`Storage: MongoDB (${db.users.length} users)`);
  } else {
    try {
      db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch {
      db = fresh();
      await flush();
    }
    console.log(`Storage: ${FILE} (${db.users.length} users)`);
  }
  return db;
}

async function flush() {
  if (mongo) {
    await Promise.all([
      ...PARTS.map((p) => mongo.state.replaceOne({ _id: p }, { _id: p, items: db[p] }, { upsert: true })),
      mongo.state.replaceOne({ _id: 'meta' }, { _id: 'meta', botCounter: db.botCounter }, { upsert: true }),
    ]);
  } else {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(db, null, 1));
  }
}

// Debounced so a burst of changes becomes one write.
let timer = null;
let writing = Promise.resolve();
function save() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    writing = writing.then(flush).catch((e) => console.error('Save failed:', e.message));
  }, 300);
}

/** Reset swipes/matches/chats and regenerate bots, keeping real accounts. */
function reset() {
  const real = db.users.filter((u) => !u.isBot);
  db = fresh(real);
  save();
  return db;
}

module.exports = { load, save, reset, get: () => db, mongo: () => mongo };
