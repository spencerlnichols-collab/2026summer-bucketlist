export default function ProgressBar({ done, total, color = '#7D9B76', thin = false }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="w-full">
      <div
        className={`w-full rounded-full overflow-hidden ${thin ? 'h-1.5' : 'h-2.5'}`}
        style={{ backgroundColor: '#E8D5B7' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {!thin && (
        <p className="text-xs mt-1 text-right" style={{ color: '#A67C60' }}>
          {done}/{total} done
        </p>
      )}
    </div>
  );
}
