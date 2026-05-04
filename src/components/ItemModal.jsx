import { useEffect, useState } from 'react';
import { ITEMS } from '../data/items';

function CommentInput({ onAdd }) {
  const [text, setText] = useState('');

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText('');
  };

  return (
    <div className="flex gap-2 mt-2">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Add a note…"
        rows={2}
        className="flex-1 rounded-xl px-3 py-2 text-sm resize-none outline-none"
        style={{ backgroundColor: '#F0E6D3', color: '#5A3520', border: '1px solid #E8C5A8' }}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
      />
      <button
        onClick={submit}
        disabled={!text.trim()}
        className="px-3 rounded-xl text-sm font-semibold transition-all self-stretch"
        style={{
          backgroundColor: text.trim() ? '#C4614A' : '#E8D5B7',
          color: text.trim() ? 'white' : '#A67C60',
        }}
      >
        Add
      </button>
    </div>
  );
}

export default function ItemModal({ itemId, onClose, comments = [], onAddComment, onDeleteComment }) {
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
              className="rounded-xl px-4 py-3 mb-4"
              style={{ backgroundColor: '#F0E6D3' }}
            >
              <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#A67C60' }}>Best Time to Go</h3>
              <p className="text-sm" style={{ color: '#5A3520' }}>{item.bestTime}</p>
            </div>
          )}

          {/* comments / notes */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#A67C60' }}>
              Our Notes {comments.length > 0 && `(${comments.length})`}
            </h3>
            {comments.length > 0 && (
              <div className="flex flex-col gap-2 mb-2">
                {comments.map(c => (
                  <div
                    key={c.id}
                    className="flex items-start gap-2 rounded-xl px-3 py-2 text-sm leading-relaxed group"
                    style={{ backgroundColor: '#F0E6D3', color: '#5A3520' }}
                  >
                    <span className="flex-1">{c.body}</span>
                    <button
                      onClick={() => onDeleteComment && onDeleteComment(c.id, itemId)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity mt-0.5"
                      style={{ color: '#7A4030' }}
                      aria-label="Delete note"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="2" y1="2" x2="10" y2="10"/>
                        <line x1="10" y1="2" x2="2" y2="10"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <CommentInput onAdd={(body) => onAddComment(item.id, body)} />
          </div>
        </div>
      </div>
    </div>
  );
}
