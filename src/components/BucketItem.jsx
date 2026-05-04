export default function BucketItem({ item, checked, onToggle, onOpen, onDelete, upvoteCount = 0, onUpvote, commentCount = 0 }) {
  const isSpecial = item.special;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        isSpecial ? 'ring-2' : ''
      }`}
      style={{
        backgroundColor: checked ? '#F0E6D3' : (isSpecial ? '#FFF3E0' : 'transparent'),
        ringColor: isSpecial ? '#C4614A' : 'transparent',
      }}
    >
      {/* checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
        className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all duration-200"
        style={{
          borderColor: checked ? '#7D9B76' : '#C4B5A0',
          backgroundColor: checked ? '#7D9B76' : 'transparent',
        }}
        aria-label={checked ? 'Mark undone' : 'Mark done'}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* content — clickable for modal */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpen && onOpen(item.id)}>
        <div className="flex items-start justify-between gap-2">
          <span
            className={`text-sm font-medium leading-snug transition-all duration-200 ${
              checked ? 'line-through opacity-50' : ''
            } ${isSpecial ? 'font-bold' : ''}`}
            style={{
              fontFamily: isSpecial ? "'Caveat', cursive" : 'inherit',
              fontSize: isSpecial ? '1.05rem' : undefined,
              color: isSpecial ? '#C4614A' : '#3D1F10',
            }}
          >
            {item.name}
          </span>
          {onOpen && (
            <svg
              className="flex-shrink-0 mt-0.5 opacity-30 group-hover:opacity-70 transition-opacity"
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3D1F10" strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          )}
        </div>
        <span className="text-xs" style={{ color: '#A67C60' }}>{item.tag}</span>
      </div>

      {/* comment badge */}
      {commentCount > 0 && (
        <div
          className="flex-shrink-0 flex items-center gap-0.5 mt-1 cursor-pointer"
          style={{ color: '#A67C60' }}
          onClick={() => onOpen && onOpen(item.id)}
          title={`${commentCount} note${commentCount !== 1 ? 's' : ''}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          <span className="text-xs font-semibold">{commentCount}</span>
        </div>
      )}

      {/* upvote button */}
      {onUpvote && (
        <button
          onClick={(e) => { e.stopPropagation(); onUpvote(item.id); }}
          className="flex-shrink-0 flex flex-col items-center gap-0 opacity-30 hover:opacity-100 transition-opacity"
          style={{ color: upvoteCount > 0 ? '#C4614A' : '#A67C60', minWidth: '18px' }}
          aria-label="Upvote"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4l8 8H4z"/>
          </svg>
          {upvoteCount > 0 && (
            <span className="text-xs font-bold leading-none" style={{ fontSize: '0.65rem' }}>{upvoteCount}</span>
          )}
        </button>
      )}

      {/* delete button — appears on hover */}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
          style={{ color: '#A67C60' }}
          aria-label="Remove"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="2" y1="2" x2="10" y2="10"/>
            <line x1="10" y1="2" x2="2" y2="10"/>
          </svg>
        </button>
      )}
    </div>
  );
}
