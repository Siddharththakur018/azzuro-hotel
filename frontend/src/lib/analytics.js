import { topicRules } from '../data/properties';

const dayDate = (date) => new Date(`${date}T12:00:00`);
export const average = (reviews) => reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;

export function getInsights(reviews, selectedProperty, days) {
  const scoped = reviews.filter((review) => selectedProperty === 'all' || review.property === selectedProperty);
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const previousMonday = new Date(monday);
  previousMonday.setDate(monday.getDate() - 7);
  const thisWeek = scoped.filter((review) => dayDate(review.date) >= monday && dayDate(review.date) <= now);
  const lastWeek = scoped.filter((review) => dayDate(review.date) >= previousMonday && dayDate(review.date) < monday);

  const periodEnd = new Date(now);
  periodEnd.setHours(23, 59, 59, 999);
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodEnd.getDate() - (Number(days) - 1));
  periodStart.setHours(0, 0, 0, 0);
  const previousStart = new Date(periodStart);
  previousStart.setDate(previousStart.getDate() - Number(days));
  const previousEnd = new Date(periodStart.getTime() - 1);
  const inPeriod = (review, start, end) => dayDate(review.date) >= start && dayDate(review.date) <= end;
  const periodReviews = scoped.filter((review) => inPeriod(review, periodStart, periodEnd));
  const previousPeriod = scoped.filter((review) => inPeriod(review, previousStart, previousEnd));
  const negativeReviews = periodReviews.filter((review) => review.rating <= 6);
  const topics = Object.keys(topicRules).map((name) => {
    const matching = periodReviews.filter((review) => review.topics.includes(name));
    return { name, count: matching.length, negative: matching.filter((review) => review.rating <= 6).length };
  }).sort((a, b) => b.count - a.count);
  const properties = ['olympic', 'potts', 'central', 'darling'].map((id) => {
    const rows = periodReviews.filter((review) => review.property === id);
    return { id, count: rows.length, rating: average(rows) };
  });
  return {
    thisWeek,
    lastWeek,
    weekAverage: average(thisWeek),
    lastWeekAverage: average(lastWeek),
    periodReviews,
    previousPeriod,
    properties,
    topics,
    negativeReviews,
    positiveReviews: periodReviews.filter((review) => review.rating >= 8),
    mixedReviews: periodReviews.filter((review) => review.rating === 7),
  };
}

export function getWeeklyTrend(reviews, selectedProperty) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayReviews = reviews.filter((review) => (selectedProperty === 'all' || review.property === selectedProperty) && review.date === key);
    return {
      key,
      label: new Intl.DateTimeFormat('en-AU', { weekday: 'short' }).format(date),
      positive: dayReviews.filter((review) => review.rating >= 8).length,
      negative: dayReviews.filter((review) => review.rating <= 6).length,
    };
  });
}
