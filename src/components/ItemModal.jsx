import { useEffect } from 'react';
import { ITEMS } from '../data/items';

export default function ItemModal({ itemId, onClose }) {
  const item = ITEMS.find(i => i.id === itemId);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(60,30,10,0.55)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#FFF8F0', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* destination photo */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={item.photo}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(255,248,240,0.9) 0%, transparent 60%)' }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-lg shadow-md transition-transform hover:scale-110"
            style={{ backgroundColor: 'rgba(60,30,10,0.55)' }}
          >
            ×
          </button>
        </div>

        <div className="px-6 pb-6 -mt-4 relative">
          {/* tag pill */}
          <span
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-2"
            style={{ backgroundColor: '#E8D5B7', color: '#7A4030' }}
          >
            {item.tag}
          </span>

          {/* title */}
          <h2
            className="text-2xl font-bold mb-1 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: '#3D1F10' }}
          >
            {item.name}
          </h2>

          {/* address */}
          {item.address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(item.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm mb-4 hover:underline"
              style={{ color: '#C4614A' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {item.address}
            </a>
          )}

          {/* notes */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#A67C60' }}>About</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#5A3520' }}>{item.notes}</p>
          </div>

          {/* best time */}
          {item.bestTime && (
            <div
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: '#F0E6D3' }}
            >
              <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#A67C60' }}>Best Time to Go</h3>
              <p className="text-sm" style={{ color: '#5A3520' }}>{item.bestTime}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
