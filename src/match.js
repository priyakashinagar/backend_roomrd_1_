// Distance + roommate compatibility scoring.

function distanceKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

const CLEAN = ['Neat Freak', 'Tidy', 'Messy but clean', 'Relaxed'];
const GUESTS = ['Rarely', 'Sometimes', 'Often'];
const VEGGIE = ['Veg', 'Vegan', 'Jain'];

/**
 * Returns { score: 0-100, reasons: [short strings] }.
 * Each block adds points; reasons explain the strongest overlaps.
 */
function compatibility(me, other) {
  const a = me.lifestyle || {};
  const b = other.lifestyle || {};
  let score = 0;
  const reasons = [];

  // Sleep (15)
  if (a.sleep && a.sleep === b.sleep) {
    score += 15;
    reasons.push(a.sleep === 'Night Owl' ? 'Both night owls' : a.sleep === 'Early Bird' ? 'Both early birds' : 'Both flexible sleepers');
  } else if (a.sleep === 'Flexible' || b.sleep === 'Flexible') score += 10;

  // Cleanliness (15)
  const ci = CLEAN.indexOf(a.cleanliness);
  const cj = CLEAN.indexOf(b.cleanliness);
  if (ci >= 0 && cj >= 0) {
    const d = Math.abs(ci - cj);
    score += [15, 10, 4, 0][d];
    if (d === 0) reasons.push(`Both ${a.cleanliness.toLowerCase()}`);
  }

  // Food (10)
  if (a.food && a.food === b.food) {
    score += 10;
    reasons.push(`Both ${a.food.toLowerCase()}`);
  } else if (VEGGIE.includes(a.food) && VEGGIE.includes(b.food)) score += 8;
  else if (a.food === 'Eggetarian' || b.food === 'Eggetarian') score += 5;
  else if (!VEGGIE.includes(a.food) && !VEGGIE.includes(b.food)) score += 8;

  // Smoking (15)
  if (a.smoking === b.smoking) {
    score += 15;
    if (a.smoking === 'Non-smoker') reasons.push('Both non-smokers');
  } else if (a.smoking === 'Outside only' || b.smoking === 'Outside only') score += 8;

  // Guests (10)
  const gi = GUESTS.indexOf(a.guests);
  const gj = GUESTS.indexOf(b.guests);
  if (gi >= 0 && gj >= 0) score += [10, 6, 2][Math.abs(gi - gj)];

  // Pets (10)
  const petClash =
    (me.pets === 'has_pet' && other.pets === 'no_pets') || (me.pets === 'no_pets' && other.pets === 'has_pet');
  if (!petClash) {
    score += 10;
    if (me.pets !== 'no_pets' && other.pets !== 'no_pets') reasons.push('Pet friendly');
  }

  // Budget (15)
  if (me.rent && other.rent) {
    const diff = Math.abs(me.rent - other.rent) / Math.max(me.rent, other.rent);
    const pts = Math.round(15 * Math.max(0, 1 - diff / 0.5));
    score += pts;
    if (pts >= 11) reasons.push('Similar budget');
  }

  // Role (10): host + hunter is the ideal pair.
  if (me.role && other.role && me.role !== other.role) score += 10;
  else if (me.role === 'hunter' && other.role === 'hunter') score += 6;

  // Shared interests (bonus reason only)
  const shared = (me.interests || []).filter((i) => (other.interests || []).includes(i));
  if (shared.length) reasons.push(`Both into ${shared.slice(0, 2).join(' & ').toLowerCase()}`);

  return { score: Math.max(0, Math.min(100, score)), reasons: reasons.slice(0, 4) };
}

module.exports = { distanceKm, compatibility };
