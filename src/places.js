// Popular rental areas in Indian cities (approximate centre coordinates).
// Used for manual location search and for placing dummy profiles.

const PLACES = [
  // Bengaluru
  ['Koramangala', 'Bengaluru', 12.9352, 77.6245],
  ['HSR Layout', 'Bengaluru', 12.9116, 77.6474],
  ['Indiranagar', 'Bengaluru', 12.9784, 77.6408],
  ['Whitefield', 'Bengaluru', 12.9698, 77.75],
  ['Marathahalli', 'Bengaluru', 12.9591, 77.6974],
  ['BTM Layout', 'Bengaluru', 12.9166, 77.6101],
  ['Electronic City', 'Bengaluru', 12.8452, 77.6602],
  ['Bellandur', 'Bengaluru', 12.9304, 77.6784],
  ['JP Nagar', 'Bengaluru', 12.9063, 77.5857],
  ['Hebbal', 'Bengaluru', 13.0358, 77.597],
  // Delhi NCR
  ['Hauz Khas', 'New Delhi', 28.5494, 77.2001],
  ['Lajpat Nagar', 'New Delhi', 28.5677, 77.2433],
  ['Saket', 'New Delhi', 28.5245, 77.2066],
  ['Karol Bagh', 'New Delhi', 28.6519, 77.1909],
  ['Dwarka', 'New Delhi', 28.5921, 77.046],
  ['DLF Cyber City', 'Gurugram', 28.495, 77.0895],
  ['Sohna Road', 'Gurugram', 28.4089, 77.0418],
  ['Sector 62', 'Noida', 28.627, 77.3725],
  ['Sector 18', 'Noida', 28.5708, 77.3261],
  // Mumbai
  ['Andheri West', 'Mumbai', 19.1364, 72.8296],
  ['Bandra West', 'Mumbai', 19.0596, 72.8295],
  ['Powai', 'Mumbai', 19.1176, 72.906],
  ['Lower Parel', 'Mumbai', 18.9953, 72.83],
  ['Malad West', 'Mumbai', 19.1874, 72.8484],
  ['Thane West', 'Thane', 19.2183, 72.9781],
  // Pune
  ['Koregaon Park', 'Pune', 18.5362, 73.893],
  ['Hinjewadi', 'Pune', 18.5913, 73.7389],
  ['Viman Nagar', 'Pune', 18.5679, 73.9143],
  ['Kothrud', 'Pune', 18.5074, 73.8077],
  ['Baner', 'Pune', 18.559, 73.7868],
  // Hyderabad
  ['Gachibowli', 'Hyderabad', 17.4401, 78.3489],
  ['HITEC City', 'Hyderabad', 17.4435, 78.3772],
  ['Madhapur', 'Hyderabad', 17.4483, 78.3915],
  ['Kondapur', 'Hyderabad', 17.47, 78.357],
  ['Banjara Hills', 'Hyderabad', 17.4156, 78.4347],
  // Chennai
  ['Adyar', 'Chennai', 13.0012, 80.2565],
  ['T Nagar', 'Chennai', 13.0418, 80.2341],
  ['OMR Thoraipakkam', 'Chennai', 12.9416, 80.2362],
  // Others
  ['Salt Lake', 'Kolkata', 22.5867, 88.4171],
  ['Prahlad Nagar', 'Ahmedabad', 23.012, 72.5108],
  ['Sector 17', 'Chandigarh', 30.7398, 76.7827],
  ['Malviya Nagar', 'Jaipur', 26.8549, 75.8243],
  ['Vijay Nagar', 'Indore', 22.7533, 75.8937],
].map(([area, city, lat, lng]) => ({ area, city, lat, lng }));

function searchPlaces(q) {
  const s = (q || '').trim().toLowerCase();
  if (!s) return PLACES.slice(0, 15);
  return PLACES.filter((p) => p.area.toLowerCase().includes(s) || p.city.toLowerCase().includes(s)).slice(0, 25);
}

module.exports = { PLACES, searchPlaces };
