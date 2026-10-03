export const properties = [
  { id: 'olympic', name: 'Olympic Hotel Paddington' },
  { id: 'potts', name: 'Potts Point' },
  { id: 'central', name: 'Central Sydney' },
  { id: 'darling', name: 'Darling Harbour' },
];

export const topicRules = {
  Cleanliness: ['clean', 'spotless', 'dust', 'hair', 'musty', 'tidy', 'dirty'],
  'Check-in': ['check-in', 'check in', 'arrival', 'waited'],
  'Staff & service': ['staff', 'reception', 'receptionist', 'team', 'helpful', 'welcome'],
  Noise: ['noise', 'noisy', 'quiet', 'traffic', 'walls', 'corridor', 'rattled'],
  Facilities: ['facilities', 'air conditioning', 'shower', 'bathroom', 'plumbing', 'pressure'],
  Location: ['location', 'station', 'walk', 'harbour', 'cafes', 'restaurants', 'transport'],
  'Room condition': ['room', 'dated', 'tired', 'refresh', 'bed', 'maintenance'],
  'Value for money': ['value', 'price', 'worth'],
};

export function classifyTopics(text = '') {
  const normalized = text.toLowerCase();
  return Object.entries(topicRules)
    .filter(([, words]) => words.some((word) => normalized.includes(word)))
    .map(([topic]) => topic);
}

export function normalizeReview(review, index = 0) {
  return {
    ...review,
    id: review.id || `demo-${index}`,
    rating: Number(review.rating),
    title: review.title || '',
    text: review.text || '',
    traveller: review.traveller || 'Guest',
    country: review.country || '',
    source: review.source || 'demo',
    topics: Array.isArray(review.topics) ? review.topics : classifyTopics(`${review.title || ''} ${review.text || ''}`),
  };
}
