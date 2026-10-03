export default function TopicSummary({ topics, negativeCount }) {
  const top = topics.slice(0, 6);
  const max = Math.max(1, ...top.map((topic) => topic.count));
  const mostCommonNegative = [...topics].sort((a, b) => b.negative - a.negative)[0];
  const share = negativeCount && mostCommonNegative?.negative ? Math.round(mostCommonNegative.negative / negativeCount * 100) : 0;
  return <section className="min-w-0 rounded-md border border-stone-200 bg-white p-4">
    <div className="mb-4"><h2 className="mb-1 text-sm font-semibold text-stone-800">Topics guests mention</h2><p className="mb-0 text-[10px] text-stone-500">Reviews can appear in more than one topic</p></div>
    {top.length ? <div className="grid gap-3">{top.map((topic) => <div className="grid grid-cols-[120px_1fr_22px] items-center gap-2.5 text-[10px]" key={topic.name}>
      <span>{topic.name}</span><div className="h-[5px] overflow-hidden rounded-full bg-stone-100"><i className="block h-full rounded-full bg-emerald-700/60" style={{ width: `${topic.count / max * 100}%` }}/></div><b className="text-right font-medium">{topic.count}</b>
    </div>)}</div> : <p className="empty-note">No reviews in this date range.</p>}
    {share > 0 && <p className="mt-4 rounded bg-stone-50 p-2.5 text-[10px] text-stone-600"><b>{share}%</b> of low-rated reviews mentioned {mostCommonNegative.name.toLowerCase()}.</p>}
    <p className="mt-3 text-[10px] text-stone-500">Topic labels use simple keyword matching. Check the reviews before acting on a trend.</p>
  </section>;
}
