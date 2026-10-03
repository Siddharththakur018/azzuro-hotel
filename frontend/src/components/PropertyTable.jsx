import { properties } from '../data/properties';

function score(value) {
  return value == null ? '—' : value.toFixed(1);
}

export default function PropertyTable({ rows, onSelect, selected }) {
  const counts = rows.reduce((total, row) => total + row.count, 0);
  return <section className="min-w-0 rounded-md border border-stone-200 bg-white p-4">
    <div className="mb-4"><h2 className="mb-1 text-sm font-semibold text-stone-800">Property performance</h2><p className="mb-0 text-[10px] text-stone-500">Guest scores and review counts for the selected period</p></div>
    <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-[11px]"><thead><tr className="text-[9px] font-semibold text-stone-500"><th className="px-2 pb-2">Property</th><th className="px-2 pb-2">Average score</th><th className="px-2 pb-2">Reviews</th></tr></thead>
      <tbody>{properties.map((property) => {
        const data = rows.find((row) => row.id === property.id);
        return <tr key={property.id} className={`cursor-pointer border-t border-stone-100 hover:bg-stone-50 ${selected === property.id ? 'bg-stone-50' : ''}`} onClick={() => onSelect(selected === property.id ? 'all' : property.id)}>
          <td className="px-2 py-2.5">{property.name}</td><td className="px-2 py-2.5">{score(data?.rating)} <span className="text-stone-400">/ 10</span></td><td className="px-2 py-2.5">{data?.count || 0}</td>
        </tr>;
      })}</tbody>
      <tfoot><tr className="border-t border-stone-200 font-semibold text-stone-600"><td className="px-2 py-2.5">All properties</td><td className="px-2 py-2.5">—</td><td className="px-2 py-2.5">{counts}</td></tr></tfoot>
    </table></div>
  </section>;
}
