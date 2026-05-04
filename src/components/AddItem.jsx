import { useState } from 'react';

export default function AddItem({ onAdd }) {
  const [text, setText] = useState('');

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText('');
  };

  return (
    <div
      className="flex gap-2 mb-8 px-1"
    >
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="Add something to the list…"
        className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none border-2 transition-colors"
        style={{
          backgroundColor: '#FFF8F0',
          borderColor: text ? '#C4614A' : '#E8D5B7',
          color: '#3D1F10',
          fontFamily: 'inherit',
        }}
      />
      <button
        onClick={submit}
        disabled={!text.trim()}
        className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
        style={{
          backgroundColor: text.trim() ? '#C4614A' : '#E8D5B7',
          color: text.trim() ? 'white' : '#A67C60',
          cursor: text.trim() ? 'pointer' : 'default',
        }}
      >
        Add
      </button>
    </div>
  );
}
