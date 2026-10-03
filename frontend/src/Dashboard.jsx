import { useEffect, useMemo, useState } from 'react';
import demoReviews from './data/demo-reviews.json';
import { properties, normalizeReview } from './data/properties';
import { getInsights, getWeeklyTrend } from './lib/analytics';
import MetricCard from './components/MetricCard';
import PropertyTable from './components/PropertyTable';
import ReviewFeed from './components/ReviewFeed';
import TopicSummary from './components/TopicSummary';
import WeeklyTrend from './components/WeeklyTrend';

export default function Dashboard() {
  const [reviews, setReviews] = useState(() => demoReviews.map(normalizeReview));
  const [dataMode, setDataMode] = useState('demo');
  const [property, setProperty] = useState('all');
  const [days, setDays] = useState('30');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/reviews`)
      .then((response) => { if (!response.ok) throw new Error('Review API unavailable'); return response.json(); })
      .then((data) => { if (data.reviews?.length) { setReviews(data.reviews.map(normalizeReview)); setDataMode(data.mode || 'database'); } })
      .catch(() => {})
  }, []);

  const insights = useMemo(() => getInsights(reviews, property, days), [reviews, property, days]);
  const trend = useMemo(() => getWeeklyTrend(reviews, property), [reviews, property]);
  const selectedProperty = properties.find((item) => item.id === property);
  const weekChange = insights.weekAverage != null && insights.lastWeekAverage != null
    ? insights.weekAverage - insights.lastWeekAverage
    : null;
  const periodChange = insights.periodReviews.length - insights.previousPeriod.length;
  const needsAttention = insights.periodReviews.length
    ? `${Math.round(insights.negativeReviews.length / insights.periodReviews.length * 100)}% of reviews rated 6 or below`
    : 'No reviews in this period';

  return <main className="min-h-screen bg-stone-50 text-stone-800">
    <header className="flex h-[58px] items-center gap-4 border-b border-stone-200 bg-white px-6 sm:px-[max(24px,calc((100vw-1120px)/2))]"><a className="text-xl font-bold tracking-tight text-emerald-950 no-underline" href="#top">azzuro<span className="text-amber-700">.</span></a><span className="border-l border-stone-200 pl-4 text-xs text-stone-500">Guest review insights</span></header>
    <div className="mx-auto max-w-[1120px] px-6 pb-8 pt-10 max-sm:px-4 max-sm:pt-7" id="top">
      <div className="mb-5 flex items-end justify-between gap-6 max-sm:block"><div><p className="mb-2 text-[10px] font-semibold tracking-[1.1px] text-emerald-800">OPERATIONS DASHBOARD</p><h1 className="mb-1 text-[29px] font-semibold tracking-tight">Guest reviews</h1><p className="mb-0 text-[13px] text-stone-500">A clear view of guest feedback across Azzuro Hotels.</p></div>
        <div className="flex gap-2 max-sm:mt-5"><label className="grid gap-1 text-[10px] text-stone-500"><span>Property</span><select className="min-h-[35px] min-w-[150px] rounded border border-stone-300 bg-white px-2.5 text-[11px] text-stone-700 outline-emerald-700 max-sm:min-w-0" value={property} onChange={(event) => setProperty(event.target.value)}><option value="all">All properties</option>{properties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="grid gap-1 text-[10px] text-stone-500"><span>Date range</span><select className="min-h-[35px] min-w-[140px] rounded border border-stone-300 bg-white px-2.5 text-[11px] text-stone-700 outline-emerald-700 max-sm:min-w-0" value={days} onChange={(event) => setDays(event.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label></div>
      </div>
      {dataMode === 'demo' && <div className="mb-4 flex items-baseline gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-950 max-sm:items-start"><strong className="whitespace-nowrap">Sample data</strong><span>This preview uses made-up reviews. Connect an approved feed or import an authorized export to view real feedback.</span></div>}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Average rating · this week" value={insights.weekAverage == null ? '—' : `${insights.weekAverage.toFixed(1)} / 10`} note={weekChange == null ? 'No previous-week comparison' : `${weekChange > 0 ? '+' : ''}${weekChange.toFixed(1)} points vs last week`}/>
        <MetricCard label={`Reviews · last ${days} days`} value={insights.periodReviews.length} note={`${periodChange > 0 ? '+' : ''}${periodChange} vs previous ${days} days`}/>
        <MetricCard label="Needs attention" value={`${insights.negativeReviews.length}`} note={needsAttention}/>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.1fr_.9fr]">
        <PropertyTable rows={insights.properties} onSelect={setProperty} selected={property}/>
        <WeeklyTrend days={trend}/>
        <TopicSummary topics={insights.topics} negativeCount={insights.negativeReviews.length}/>
        <section className="min-w-0 rounded-md border border-stone-200 bg-white p-4"><div className="mb-4"><h2 className="mb-1 text-sm font-semibold">Review mix</h2><p className="mb-0 text-[10px] text-stone-500">Scores for the last {days} days{selectedProperty ? ` · ${selectedProperty.name}` : ''}</p></div>
          <div className="mb-3 mt-4 text-2xl font-semibold">{insights.periodReviews.length}<span className="text-[11px] font-normal text-stone-500"> reviews</span></div>
          <div className="flex h-3 overflow-hidden rounded" aria-label="Distribution of positive, mixed, and low-rated reviews"><i className="bg-emerald-700" style={{ width: `${insights.periodReviews.length ? insights.positiveReviews.length / insights.periodReviews.length * 100 : 0}%` }}/><i className="bg-stone-300" style={{ width: `${insights.periodReviews.length ? insights.mixedReviews.length / insights.periodReviews.length * 100 : 0}%` }}/><i className="bg-rose-400" style={{ width: `${insights.periodReviews.length ? insights.negativeReviews.length / insights.periodReviews.length * 100 : 0}%` }}/></div>
          <div className="mt-4 grid gap-3 text-[10px]"><div className="flex items-center gap-2"><i className="h-2 w-2 rounded-sm bg-emerald-700"/>Positive <small className="text-stone-500">8–10</small><b className="ml-auto">{insights.positiveReviews.length}</b></div><div className="flex items-center gap-2"><i className="h-2 w-2 rounded-sm bg-stone-300"/>Mixed <small className="text-stone-500">7</small><b className="ml-auto">{insights.mixedReviews.length}</b></div><div className="flex items-center gap-2"><i className="h-2 w-2 rounded-sm bg-rose-400"/>Low <small className="text-stone-500">0–6</small><b className="ml-auto">{insights.negativeReviews.length}</b></div></div>
        </section>
      </div>
      <ReviewFeed reviews={insights.periodReviews}/>
      <footer className="px-0.5 py-4 text-[9px] leading-relaxed text-stone-500">Topic counts are based on keyword matching and may overlap. Review text should be checked before drawing conclusions.</footer>
    </div>
  </main>;
}
