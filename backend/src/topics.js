const rules = {
  'Cleanliness': ['clean', 'spotless', 'dirty', 'dust', 'hair', 'musty', 'tidy', 'stain'],
  'Check-in': ['check-in', 'check in', 'checkin', 'arrival', 'waited'],
  'Staff & service': ['staff', 'reception', 'receptionist', 'team', 'helpful', 'welcome', 'service'],
  'Noise': ['noise', 'noisy', 'quiet', 'traffic', 'thin walls', 'corridor', 'loud'],
  'Facilities': ['facilities', 'air conditioning', 'shower', 'bathroom', 'plumbing', 'pressure', 'wifi', 'wi-fi'],
  'Location': ['location', 'station', 'walk', 'harbour', 'cafe', 'restaurant', 'transport', 'nearby'],
  'Room condition': ['room', 'dated', 'tired', 'refresh', 'bed', 'maintenance', 'furniture'],
  'Value for money': ['value', 'price', 'worth', 'expensive', 'cheap'],
};

export function classifyTopics(text = '') {
  const normalized = text.toLowerCase();
  return Object.entries(rules).filter(([, words]) => words.some((word) => normalized.includes(word))).map(([topic]) => topic);
}
