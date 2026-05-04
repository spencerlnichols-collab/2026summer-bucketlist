import { useRef, useState, useEffect, useCallback } from 'react';
import { ITEMS } from '../data/items';

const CATEGORY_COLORS = {
  hikes:    '#7D9B76',
  sunsets:  '#E8956D',
  food:     '#C4614A',
  sf:       '#D4A843',
  water:    '#6B9BAF',
  daytrips: '#C4A882',
  niche:    '#A882C4',
  custom:   '#D4B896',
};

function easeOut(t) {
  return 1 - Math.pow(1 - t, 4);
}

export default function WheelView({ checks, customItems, hidden }) {
  const canvasRef   = useRef(null);
  const animRef     = useRef(null);
  const angleRef    = useRef(0);   // current rotation in degrees
  const [spinning, setSpinning]   = useState(false);
  const [result, setResult]       = useState(null);  // winning item

  // Build the full items list — preset (visible, unchecked) + custom
  const allItems = [
    ...ITEMS.filter(i => !hidden.has(i.id) && !checks[i.id]),
    ...customItems.filter(i => !i.checked).map(i => ({ ...i, category: 'custom' })),
  ];

  const sliceAngle = allItems.length > 0 ? 360 / allItems.length : 360;

  const drawWheel = useCallback((angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r  = size / 2 - 4;

    ctx.clearRect(0, 0, size, size);

    if (allItems.length === 0) {
      ctx.fillStyle = '#E8D5B7';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#7A4030';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('All done! 🎉', cx, cy);
      return;
    }

    const startRad = (angle - 90) * (Math.PI / 180); // start from top

    allItems.forEach((item, i) => {
      const start = startRad + (i * sliceAngle * Math.PI) / 180;
      const end   = startRad + ((i + 1) * sliceAngle * Math.PI) / 180;
      const color = CATEGORY_COLORS[item.category] || '#C4A882';

      // alternating shade for contrast
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? color : adjustBrightness(color, -15);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // label — only draw if slice is wide enough
      if (sliceAngle > 6) {
        const mid = start + (end - start) / 2;
        const labelR = r * 0.68;
        const tx = cx + Math.cos(mid) * labelR;
        const ty = cy + Math.sin(mid) * labelR;

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(mid + Math.PI / 2);
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.min(11, Math.max(7, sliceAngle * 0.7))}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // truncate long names
        const name = item.name.replace(/^🌮\s*/, '').replace(/^PILGRIMAGE:\s*/, '');
        const maxLen = sliceAngle > 20 ? 22 : sliceAngle > 12 ? 14 : 8;
        ctx.fillText(name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name, 0, 0);
        ctx.restore();
      }
    });

    // center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFF8F0';
    ctx.fill();
    ctx.strokeStyle = '#E8D5B7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // spin icon in center
    ctx.fillStyle = '#C4614A';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', cx, cy);
  }, [allItems, sliceAngle]);

  // draw on mount and when items/checks change
  useEffect(() => {
    drawWheel(angleRef.current);
  }, [drawWheel]);

  const spin = () => {
    if (spinning || allItems.length === 0) return;
    setResult(null);
    setSpinning(true);

    const extraSpins   = 6 + Math.random() * 6;           // 6–12 full rotations
    const landingSlice = Math.floor(Math.random() * allItems.length);
    const landingAngle = landingSlice * sliceAngle + sliceAngle / 2; // center of winning slice
    const totalRotation = extraSpins * 360 + landingAngle;
    const duration     = 4500 + Math.random() * 1500;    // 4.5–6s
    const startAngle   = angleRef.current;
    const startTime    = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easedT = easeOut(t);
      const current = startAngle + totalRotation * easedT;
      angleRef.current = current;
      drawWheel(current);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setResult(allItems[landingSlice]);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  return (
    <div className="flex flex-col items-center pt-4 pb-16 px-4">
      {/* pointer triangle */}
      <div style={{
        width: 0, height: 0,
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderTop: '22px solid #C4614A',
        marginBottom: '-2px',
        zIndex: 10,
        filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))',
      }} />

      {/* wheel canvas */}
      <div
        onClick={spin}
        style={{ cursor: spinning ? 'default' : 'pointer', position: 'relative' }}
      >
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          style={{ borderRadius: '50%', boxShadow: '0 8px 32px rgba(60,30,10,0.18)' }}
        />
      </div>

      {/* spin button */}
      <button
        onClick={spin}
        disabled={spinning || allItems.length === 0}
        className="mt-6 px-8 py-3 rounded-full text-white font-bold text-base transition-all"
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: '1.3rem',
          backgroundColor: spinning ? '#C4B5A0' : '#C4614A',
          boxShadow: spinning ? 'none' : '0 4px 16px rgba(196,97,74,0.35)',
          transform: spinning ? 'none' : 'translateY(-1px)',
        }}
      >
        {spinning ? 'spinning…' : allItems.length === 0 ? 'all done! 🎉' : '✦ spin it'}
      </button>

      <p className="mt-2 text-xs" style={{ color: '#A67C60' }}>
        {allItems.length} activities left to do
      </p>

      {/* result card */}
      {result && (
        <div
          className="mt-6 w-full max-w-sm rounded-2xl px-6 py-5 text-center"
          style={{ backgroundColor: '#FFF0E6', border: '2px solid #E8C5A8' }}
        >
          <p style={{ fontFamily: "'Caveat', cursive", color: '#A67C60', fontSize: '1rem' }}>
            you're doing…
          </p>
          <p
            className="mt-1 font-bold leading-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: '#3D1F10', fontSize: '1.35rem' }}
          >
            {result.name.replace(/^🌮\s*PILGRIMAGE:\s*/, '🌮 ')}
          </p>
          {result.tag && (
            <p className="mt-1 text-sm" style={{ color: '#A67C60' }}>{result.tag}</p>
          )}
          <div className="flex gap-2 mt-4 justify-center">
            <button
              onClick={() => setResult(null)}
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: '#E8D5B7', color: '#7A4030' }}
            >
              spin again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function adjustBrightness(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `rgb(${r},${g},${b})`;
}
