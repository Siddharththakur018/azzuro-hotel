export default function WeeklyTrend({ days }) {
  const max = Math.max(1, ...days.map((day) => day.positive + day.negative));
  return <section className="min-w-0 rounded-md border border-stone-200 bg-white p-4">
    <div className="mb-4"><h2 className="mb-1 text-sm font-semibold text-stone-800">Positive and negative reviews</h2><p className="mb-0 text-[10px] text-stone-500">Daily review counts · this week</p></div>
    <div className="mb-3 flex gap-4 text-[9px] text-stone-600"><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-700"/>Positive · 8–10</span><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-rose-400"/>Needs attention · 0–6</span></div>
    <div className="grid h-[130px] grid-cols-7 gap-2 border-b border-stone-200 px-1">{days.map((day) => {
      const total = day.positive + day.negative;
      return <div className="flex flex-col items-center justify-end gap-1.5 text-[9px] text-stone-500" key={day.key} title={`${day.positive} positive, ${day.negative} low-rated`}>
        <div className="flex h-[92px] w-full flex-col-reverse items-center justify-start"><i className="w-[min(22px,68%)] rounded-t-sm bg-emerald-700" style={{ height: `${day.positive / max * 100}%` }}/><i className="w-[min(22px,68%)] bg-rose-300" style={{ height: `${day.negative / max * 100}%` }}/></div>
        <span>{day.label}</span><small className="h-[11px] text-[8px]">{total || ''}</small>
      </div>;
    })}</div>
  </section>;
}
