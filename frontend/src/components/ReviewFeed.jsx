import { useMemo, useState } from 'react';
import { properties, topicRules } from '../data/properties';

const formatDate = (value) => new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));

export default function ReviewFeed({ reviews }) {
  const [property, setProperty] = useState('all');
  const [topic, setTopic] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const filtered = useMemo(() => reviews.filter((review) =>
    (property === 'all' || review.property === property) &&
    (topic === 'all' || review.topics.includes(topic)) &&
    (!search || `${review.title} ${review.text} ${review.country}`.toLowerCase().includes(search.toLowerCase())),
  ), [reviews, property, topic, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const change = (setter) => (event) => { setter(event.target.value); setPage(1); };

  return <section className="mt-3 rounded-md border border-stone-200 bg-white p-4 pb-0" id="reviews">
    <div className="mb-4"><h2 className="mb-1 text-sm font-semibold text-stone-800">Guest reviews <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[9px] font-medium text-stone-600">{filtered.length}</span></h2><p className="mb-0 text-[10px] text-stone-500">Read the comments behind the scores</p></div>
    <div className="flex flex-wrap gap-2 border-b border-stone-100 pb-3">
      <label><span className="visually-hidden">Property</span><select className="min-h-[35px] min-w-[132px] rounded border border-stone-300 bg-white px-2.5 text-[11px]" value={property} onChange={change(setProperty)}><option value="all">All properties</option>{properties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label><span className="visually-hidden">Topic</span><select className="min-h-[35px] min-w-[132px] rounded border border-stone-300 bg-white px-2.5 text-[11px]" value={topic} onChange={change(setTopic)}><option value="all">All topics</option>{Object.keys(topicRules).map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="ml-auto max-sm:ml-0 max-sm:w-full"><span className="visually-hidden">Search review text</span><input className="min-h-[35px] min-w-[190px] rounded border border-stone-300 bg-white px-2.5 text-[11px] max-sm:w-full" placeholder="Search reviews" value={search} onChange={change(setSearch)}/></label>
    </div>
    <div>{visible.length ? visible.map((review) => {
      const hotel = properties.find((item) => item.id === review.property);
      return <article className="grid grid-cols-[42px_minmax(0,1fr)] gap-3 border-b border-stone-100 py-4" key={review.id}>
        <div className="rounded bg-emerald-50 px-0.5 py-1.5 text-center text-xs font-semibold text-emerald-900">{review.rating.toFixed(1)}<small className="mt-0.5 block text-[8px] font-normal text-stone-500">/ 10</small></div>
        <div><div className="flex justify-between gap-3"><h3 className="mb-0 text-[11px] font-semibold">{review.title || 'Guest review'}</h3><time className="whitespace-nowrap text-[9px] text-stone-500" dateTime={review.date}>{formatDate(review.date)}</time></div>
          <p className="my-2 text-[10px] leading-relaxed text-stone-600">{review.text}</p>
          <div className="flex flex-wrap gap-2.5 text-[9px] text-stone-500"><span>{hotel?.name || review.property}</span><span>{review.traveller}</span>{review.country && <span>{review.country}</span>}{review.source === 'demo' && <span className="text-[8px] uppercase tracking-wide text-amber-800">Sample</span>}</div>
          {review.topics.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{review.topics.map((item) => <button className="rounded bg-stone-100 px-2 py-1 text-[8px] text-stone-600 hover:bg-stone-200" key={item} onClick={() => { setTopic(item); setPage(1); }}>{item}</button>)}</div>}
        </div>
      </article>;
    }) : <p className="py-8 text-center text-[11px] text-stone-500">No reviews match these filters.</p>}</div>
    {filtered.length > 0 && <div className="flex min-h-12 items-center justify-between text-[9px] text-stone-500"><span>Showing {Math.min(filtered.length, (page - 1) * pageSize + 1)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><div className="flex items-center gap-2"><button className="rounded border border-stone-300 px-2 py-1 disabled:text-stone-400" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>{page} / {pages}</span><button className="rounded border border-stone-300 px-2 py-1 disabled:text-stone-400" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div></div>}
  </section>;
}
