export default function MetricCard({ label, value, note }) {
  return <section className="rounded-md border border-stone-200 bg-white p-4">
    <p className="mb-2 text-[11px] text-stone-600">{label}</p>
    <strong className="block text-2xl font-semibold tracking-tight text-stone-800">{value}</strong>
    <span className="mt-1 block text-[10px] text-stone-500">{note}</span>
  </section>;
}
