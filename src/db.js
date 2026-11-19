// Tiny JSON-file database. Good enough for a demo: data survives restarts.

const fs = require('fs');
const path = require('path');
const { seedBots } = require('./seed');

const FILE = path.join(__dirname, '..', 'data', 'db.json');

let db;

function fresh(realUsers = []) {
  return {
    users: [...seedBots(), ...realUsers],
    swipes: [], // { from, to, action, likedItem, comment, createdAt }
    matches: [], // { id, users: [a, b], createdAt }
    messages: [], // { id, matchId, senderId, text, createdAt }
    botCounter: 10000,
  };
}

function load() {
  try {
    db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    db = fresh();
    save();
  }
  return db;
}

let timer = null;
function save() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(db, null, 1));
  }, 200);
}

/** Reset swipes/matches/chats and regenerate bots, keeping real accounts. */
function reset() {
  const real = db.users.filter((u) => !u.isBot);
  db = fresh(real);
  save();
  return db;
}

module.exports = { load, save, reset, get: () => db };
