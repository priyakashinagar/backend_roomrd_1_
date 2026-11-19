// Generates dummy ("bot") roommate profiles. Deterministic per seed so the
// same data comes back after a reset.

const { PLACES } = require('./places');
const { OPTIONS } = require('./options');

const img = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const FEMALE_PHOTOS = [
  '1494790108377-be9c29b29330', '1544005313-94ddf0286df2', '1531123897727-8f129e1688ce', '1524504388940-b1c1722653e1',
  '1529626455594-4ff0802cfb7e', '1488426862026-3ee34a7d66df', '1534528741775-53994a69daeb',
  '1438761681033-6461ffad8d80', '1517841905240-472988babdf9', '1487412720507-e7ab37603c6f', '1502823403499-6ccfcf4fb453',
  '1531746020798-e6953c6e8e04', '1580489944761-15a19d654956', '1573496359142-b8d87734a5a2', '1607746882042-944635dfe10e',
  '1611432579699-484f7990b127', '1609505848912-b7c3b8b4beda', '1619895862022-09114b41f16f',
];
const MALE_PHOTOS = [
  '1507003211169-0a1dd7228f2d', '1500648767791-00dcc994a43e', '1506794778202-cad84cf45f1d', '1492562080023-ab3db95bfbce',
  '1539571696357-5a69c17a67c6', '1519085360753-af0119f7cbe7',
  '1463453091185-61582044d556', '1522556189639-b150ed9c4330', '1535713875002-d1d0cf377fde', '1560250097-0b93528c311a',
  '1599566150163-29194dcaad36', '1607990281513-2c110a25bd8c', '1615109398623-88346a601842',
];
const ROOM_PHOTOS = [
  ['1502672260266-1c1ef2d93688', 'Bright living room'],
  ['1505691938895-1758d7feb511', 'Your bedroom - fits a queen bed'],
  ['1522708323590-d24dbb6b0267', 'Open kitchen + hall'],
  ['1540518614846-7eded433c457', 'Available bedroom'],
  ['1493809842364-78817add7ffb', 'Living room with balcony'],
  ['1484154218962-a197022b5858', 'Fully equipped kitchen'],
  ['1560448204-e02f11c3d0e2', 'Cozy hall'],
  ['1556909114-f6e7ad7d3136', 'Modular kitchen'],
  ['1586023492125-27b2c045efd7', 'Plant-filled living room'],
  ['1554995207-c18c203602cb', 'Sunny room, big windows'],
  ['1600210492486-724fe5c67fb0', 'Gated society, modern hall'],
  ['1617806118233-18e1de247200', 'Room with attached bathroom'],
  ['1512918728675-ed5a9ecdebfd', 'Work desk corner'],
  ['1536376072261-38c75010e6c9', 'Minimal bedroom'],
  ['1522771739844-6a9f6d5f14af', 'Clean, airy bedroom'],
  ['1595526114035-0d45ed16cfbf', 'Master bedroom'],
  ['1598928506311-c55ded91a20c', 'Living + dining'],
  ['1631049307264-da0ec9d70304', 'Room with wardrobe'],
];

const FEMALE_NAMES = ['Ananya', 'Priya', 'Sneha', 'Riya', 'Aditi', 'Kavya', 'Isha', 'Meera', 'Pooja', 'Neha', 'Tanvi', 'Shruti', 'Diya', 'Nikita', 'Aisha', 'Sakshi', 'Ritika', 'Simran', 'Pallavi', 'Zoya'];
const MALE_NAMES = ['Arjun', 'Rohan', 'Karan', 'Aditya', 'Vikram', 'Rahul', 'Siddharth', 'Aman', 'Nikhil', 'Varun', 'Kunal', 'Ishaan', 'Yash', 'Harsh', 'Dev', 'Kabir', 'Abhishek', 'Manish', 'Rishabh', 'Farhan'];
const OCCUPATIONS = {
  Student: ['MBA student', 'Engineering student', 'Design student', 'Law student', 'MBBS student', 'UPSC aspirant'],
  'Work from home': ['Freelance designer', 'Content writer', 'Remote developer', 'Data analyst'],
  Hybrid: ['Software Engineer', 'Product Manager', 'UX Designer', 'Marketing Manager', 'Consultant'],
  Office: ['Investment Banker', 'Chartered Accountant', 'Sales Manager', 'HR Executive', 'Doctor', 'Architect'],
};
const BIOS = [
  'Shifted to {city} for work. Pretty chill, keep common areas clean and love a good chai session on the balcony.',
  'Looking for a roommate who is respectful and easy-going. I cook on weekends and will happily share!',
  'Mostly at work during the day, Netflix at night. Quiet, clean and pay rent on time - always.',
  'Fitness person, early mornings at the gym. Would love a flatmate who is tidy and drama free.',
  'New to {city}! Would love a roommate who can also become a friend to explore the city with.',
  'Introvert with extrovert weekends. I value my space but always up for a movie night.',
  'Student by day, guitarist by night (with headphones, promise). Neat and organised.',
  'Love plants, cooking and long walks. Looking for a calm, clean home near {area}.',
];
const ANSWERS = {
  'The perfect roommate is': ['Someone who replaces the toilet roll without being asked.', 'Clean, chill and up for chai at 11pm.', 'A friend first, flatmate second.'],
  'House rule I swear by': ['Dishes do not sleep in the sink.', 'Shoes off at the door.', 'Tell before inviting guests over.'],
  'My most irrational fear': ['Missing a stair step.', 'Running out of Wi-Fi data.', 'Lizards. Just lizards.'],
  'A typical Sunday for me': ['Late brunch, cricket on TV, early night.', 'Farmers market and meal prep.', 'Long ride and a big nap.'],
  'We will get along if': ['You do not mind my 6am blender.', 'You like dosa as much as I do.', 'You split groceries fairly.'],
  'Dealbreaker': ['Smoking inside the house.', 'Not paying bills on time.', 'Loud music after midnight.'],
  'I will make you': ['Masala chai every morning.', 'The best maggi of your life.', 'Join me for weekend treks.'],
  'Green flags I look for': ['Labels their leftovers.', 'Texts before bringing friends over.', 'Cleans as they cook.'],
  'My roommate love language': ['Leftovers labelled "for you".', 'Bringing back snacks from home.', 'Taking out the trash unasked.'],
  'After work you will find me': ['At the gym or on a run.', 'On the couch with a book.', 'Trying a new cafe nearby.'],
};

// Small seeded PRNG so dummy data is stable.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeBot(r, idx, place, { jitterKm = 3 } = {}) {
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const pickN = (arr, n) => [...arr].sort(() => r() - 0.5).slice(0, n);

  const gender = r() < 0.5 ? 'Female' : 'Male';
  const name = pick(gender === 'Female' ? FEMALE_NAMES : MALE_NAMES);
  const photosPool = gender === 'Female' ? FEMALE_PHOTOS : MALE_PHOTOS;
  const role = r() < 0.6 ? 'host' : 'hunter';
  const workType = pick(OPTIONS.workTypes);
  const lifestyle = {};
  for (const q of OPTIONS.lifestyle) lifestyle[q.key] = pick(q.options);
  // Bias towards common, friendlier answers.
  if (r() < 0.7) lifestyle.smoking = 'Non-smoker';
  if (r() < 0.6) lifestyle.cleanliness = pick(['Neat Freak', 'Tidy']);

  const metroRent = ['Mumbai', 'Gurugram', 'Bengaluru', 'New Delhi'].includes(place.city);
  const base = metroRent ? 12000 : 8000;
  const rent = Math.round((base + r() * (metroRent ? 20000 : 12000)) / 500) * 500;

  const moveIn = new Date(Date.now() + (5 + Math.floor(r() * 60)) * 86400000).toISOString().slice(0, 10);
  const prompts = pickN(Object.keys(ANSWERS), 3).map((q) => ({ question: q, answer: pick(ANSWERS[q]) }));
  const rooms = pickN(ROOM_PHOTOS, role === 'host' ? 3 : 2).map(([id, caption]) => ({ url: img(id), caption }));

  // Random point within jitterKm of the place centre.
  const ang = r() * Math.PI * 2;
  const dist = r() * jitterKm;
  const lat = place.lat + (dist / 111) * Math.cos(ang);
  const lng = place.lng + (dist / (111 * Math.cos((place.lat * Math.PI) / 180))) * Math.sin(ang);

  const firstPhoto = pick(photosPool);
  const secondPhoto = pick(photosPool.filter((p) => p !== firstPhoto));

  return {
    id: `bot_${idx}`,
    isBot: true,
    onboarded: true,
    phone: null,
    name,
    age: 20 + Math.floor(r() * 12),
    gender,
    role,
    occupation: pick(OCCUPATIONS[workType]),
    workType,
    bio: pick(BIOS).replace('{city}', place.city).replace('{area}', place.area),
    photos: [img(firstPhoto), img(secondPhoto)],
    roomPhotos: rooms,
    location: { lat: +lat.toFixed(5), lng: +lng.toFixed(5), area: place.area, city: place.city },
    rent,
    moveIn,
    furnishing: pick(OPTIONS.furnishing),
    sharedBathroom: r() < 0.5,
    amenities: pickN(OPTIONS.amenities, 3 + Math.floor(r() * 4)),
    pets: pick(['has_pet', 'open_to_pets', 'open_to_pets', 'no_pets']),
    petDetail: null,
    lifestyle,
    interests: pickN(OPTIONS.interests, 4),
    prompts,
    verified: r() < 0.7,
    prefs: { gender: 'Any', maxDistanceKm: 50, role: 'all', maxRent: 50000 },
    createdAt: new Date().toISOString(),
  };
}

/** Initial bots: a few in every place. */
function seedBots() {
  const r = rng(42);
  const bots = [];
  let i = 0;
  for (const place of PLACES) {
    const n = 1 + Math.floor(r() * 2); // 1-2 per area
    for (let k = 0; k < n; k++) bots.push(makeBot(r, i++, place));
  }
  for (const b of bots) {
    if (b.pets === 'has_pet') b.petDetail = b.gender === 'Female' ? 'A friendly indie dog' : 'A lazy cat';
  }
  return bots;
}

/** Extra bots placed around a real user's location so everyone has people nearby. */
function botsAround(location, startIdx, count = 10, seed = Date.now()) {
  const r = rng(seed);
  const place = { area: location.area || 'Nearby', city: location.city || '', lat: location.lat, lng: location.lng };
  const out = [];
  for (let k = 0; k < count; k++) out.push(makeBot(r, startIdx + k, place, { jitterKm: 8 }));
  return out;
}

module.exports = { seedBots, botsAround };
