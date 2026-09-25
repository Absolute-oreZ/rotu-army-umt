export function BestCadetQuote({ quote, label }: { quote: string | null; label: string }) {
  if (!quote) return null;
  return <div className="border-l-2 border-[color:var(--ring)] pl-4"><p className="record-label">{label}</p><blockquote className="mt-2 max-w-xl text-xl font-medium leading-8">{quote}</blockquote></div>;
}
