import { useState, useRef } from 'react';

const CATEGORIES = ['breakfast', 'lunch', 'dinner'];
const CATEGORY_LABEL = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner' };
const CATEGORY_COLOR = { breakfast: '#E8956D', lunch: '#D4A843', dinner: '#6B9BAF' };

function AddRecipeModal({ onSave, onClose }) {
  const [image, setImage]       = useState(null);   // object URL for preview
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [text, setText]         = useState('');
  const [title, setTitle]       = useState('');
  const [category, setCategory] = useState('dinner');
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImage(URL.createObjectURL(file));
    setScanning(true);
    setProgress(0);
    setText('');
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: m => { if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100)); },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setText(data.text.trim());
    } catch (e) {
      setText('');
    }
    setScanning(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const canSave = title.trim() && text.trim() && !scanning;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(60,30,10,0.55)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-y-auto"
        style={{ backgroundColor: '#FFF8F0', maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3" style={{ borderBottom: '1px solid #F0E6D3' }}>
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#3D1F10' }}>
            Add Recipe
          </h2>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: '#A67C60' }}>×</button>
        </div>

        <div className="px-6 py-4 flex flex-col gap-4">
          {/* image upload */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#A67C60' }}>
              Upload a photo of your recipe
            </p>
            <div
              className="rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all"
              style={{
                border: '2px dashed #C4B5A0',
                backgroundColor: '#FAF3EA',
                minHeight: image ? undefined : '120px',
                padding: image ? '0' : '24px',
              }}
              onClick={() => fileRef.current.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              {image ? (
                <img src={image} alt="recipe" className="w-full rounded-xl object-contain" style={{ maxHeight: '200px' }} />
              ) : (
                <>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C4B5A0" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p className="mt-2 text-sm font-medium" style={{ color: '#A67C60' }}>Tap to upload or drag & drop</p>
                  <p className="text-xs mt-1" style={{ color: '#C4B5A0' }}>JPG, PNG, HEIC — screenshot or photo</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          </div>

          {/* scanning progress */}
          {scanning && (
            <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ backgroundColor: '#F0E6D3' }}>
              <div className="flex-1">
                <p className="text-xs font-semibold mb-1" style={{ color: '#7A4030' }}>Reading recipe… {progress}%</p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E8D5B7' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#C4614A' }} />
                </div>
              </div>
            </div>
          )}

          {/* extracted text */}
          {(text || (!scanning && image)) && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#A67C60' }}>
                Extracted text — edit if needed
              </p>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={8}
                placeholder="No text detected — type it in manually"
                className="w-full rounded-xl px-3 py-2 text-sm resize-y outline-none"
                style={{ backgroundColor: '#F0E6D3', color: '#5A3520', border: '1px solid #E8C5A8', lineHeight: 1.6 }}
              />
            </div>
          )}

          {/* title */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#A67C60' }}>Recipe name</p>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Grandma's Pancakes"
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: '#F0E6D3', color: '#5A3520', border: '1px solid #E8C5A8' }}
            />
          </div>

          {/* category */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#A67C60' }}>Category</p>
            <div className="flex gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
                  style={{
                    backgroundColor: category === cat ? CATEGORY_COLOR[cat] : '#F0E6D3',
                    color: category === cat ? 'white' : '#7A4030',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* save */}
          <button
            onClick={() => { if (canSave) { onSave({ title: title.trim(), content: text.trim(), category }); onClose(); } }}
            disabled={!canSave}
            className="w-full py-3 rounded-xl font-bold text-base transition-all"
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: '1.2rem',
              backgroundColor: canSave ? '#C4614A' : '#E8D5B7',
              color: canSave ? 'white' : '#A67C60',
              boxShadow: canSave ? '0 4px 16px rgba(196,97,74,0.3)' : 'none',
            }}
          >
            Save Recipe
          </button>
        </div>
      </div>
    </div>
  );
}

function RecipeCard({ recipe, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ backgroundColor: '#FFF0E6', border: '1.5px solid #E8C5A8' }}
    >
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{CATEGORY_LABEL[recipe.category]?.split(' ')[0]}</span>
          <span className="font-semibold text-sm truncate" style={{ fontFamily: "'Playfair Display', serif", color: '#3D1F10' }}>
            {recipe.title}
          </span>
        </div>
        <svg
          className="flex-shrink-0 ml-2 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', color: '#A67C60' }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <pre
            className="text-xs whitespace-pre-wrap leading-relaxed"
            style={{ color: '#5A3520', fontFamily: 'system-ui, sans-serif' }}
          >
            {recipe.content}
          </pre>
          <button
            onClick={() => onDelete(recipe.id)}
            className="mt-3 text-xs px-3 py-1.5 rounded-full font-semibold transition-all hover:opacity-100 opacity-50"
            style={{ backgroundColor: '#E8D5B7', color: '#7A4030' }}
          >
            Delete recipe
          </button>
        </div>
      )}
    </div>
  );
}

export default function RecipesView({ recipes, onAdd, onDelete }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = activeCategory === 'all'
    ? recipes
    : recipes.filter(r => r.category === activeCategory);

  return (
    <div className="max-w-lg mx-auto px-4 pb-16 pt-4">
      {/* category filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory('all')}
          className="px-4 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-all"
          style={{
            backgroundColor: activeCategory === 'all' ? '#C4614A' : '#E8D5B7',
            color: activeCategory === 'all' ? 'white' : '#7A4030',
          }}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-all capitalize"
            style={{
              backgroundColor: activeCategory === cat ? CATEGORY_COLOR[cat] : '#E8D5B7',
              color: activeCategory === cat ? 'white' : '#7A4030',
            }}
          >
            {CATEGORY_LABEL[cat]}
          </button>
        ))}
      </div>

      {/* recipe list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📖</p>
          <p style={{ fontFamily: "'Caveat', cursive", color: '#C4614A', fontSize: '1.3rem' }}>
            no recipes yet — add one!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} onDelete={onDelete} />
          ))}
        </div>
      )}

      {/* add button */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl font-bold transition-transform hover:scale-110"
        style={{ backgroundColor: '#C4614A', boxShadow: '0 4px 20px rgba(196,97,74,0.4)' }}
        aria-label="Add recipe"
      >
        +
      </button>

      {showAdd && <AddRecipeModal onSave={onAdd} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
