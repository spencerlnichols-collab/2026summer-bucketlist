import { useState } from 'react';
import BucketItem from './BucketItem';
import ProgressBar from './ProgressBar';

export default function CategorySection({ category, items, checks, onToggle, onOpen, onDelete, upvotes, onUpvote, myUpvotes, comments }) {
  const [collapsed, setCollapsed] = useState(false);
  const done = items.filter(i => checks[i.id]).length;

  const sortedItems = [...items].sort((a, b) =>
    (upvotes[String(b.id)] || 0) - (upvotes[String(a.id)] || 0)
  );

  return (
    <section className="mb-8">
      {/* category header */}
      <button
        className="w-full flex items-center justify-between mb-3 group"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{category.emoji}</span>
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: '#3D1F10' }}
          >
            {category.label.replace(/^[^\s]+\s/, '')}
          </h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: '#E8D5B7', color: '#7A4030' }}
          >
            {done}/{items.length}
          </span>
        </div>
        <svg
          className="transition-transform duration-200"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', color: '#A67C60' }}
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <ProgressBar done={done} total={items.length} thin />

      {!collapsed && (
        <div className="mt-3 divide-y" style={{ borderColor: '#F0E6D3' }}>
          {sortedItems.map(item => (
            <BucketItem
              key={item.id}
              item={item}
              checked={!!checks[item.id]}
              onToggle={onToggle}
              onOpen={onOpen}
              onDelete={onDelete}
              upvoteCount={upvotes[String(item.id)] || 0}
              onUpvote={onUpvote}
              myUpvoted={myUpvotes.has(String(item.id))}
              commentCount={(comments[String(item.id)] || []).length}
            />
          ))}
        </div>
      )}
    </section>
  );
}
