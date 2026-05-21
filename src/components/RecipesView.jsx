import { useState, useRef, useEffect } from 'react';

const CATEGORIES = ['breakfast', 'lunch', 'dinner'];
const CATEGORY_LABEL = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner' };
const CATEGORY_COLOR = { breakfast: '#E8956D', lunch: '#D4A843', dinner: '#6B9BAF' };

async function runOCR(file, onProgress) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: m => { if (m.status === 'recognizing text') onProgress(Math.round(m.progress * 100)); },
  });
  const { data } = await worker.recognize(file);
  await worker.terminate();
  return data.text.trim();
}

// ── Upload + OCR block ────────────────────────────────────────────────────────
function UploadBlock({ label, image, setImage, text, setText, scanning, setScanning, progress, setProgress, highlight }) {
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImage(URL.createObjectURL(file));
    setScanning(true);
    setProgress(0);
    setText('');
    try { setText(await runOCR(file, setProgress)); } catch { setText(''); }
    setScanning(false);
  };

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#A67C60' }}>{label}</p>
      <div
        className="rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all"
        style={{
          border: `2px dashed ${highlight ? '#C4614A' : '#C4B5A0'}`,
          backgroundColor: highlight ? '#FFF3EE' : '#FAF3EA',
          minHeight: image ? undefined : '90px',
          padding: image ? 0 : '18px',
        }}
        onClick={() => fileRef.current.click()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        onDragOver={e => e.preventDefault()}
      >
        {image
          ? <img src={image} alt={label} className="w-full rounded-xl object-contain" style={{ maxHeight: '150px' }} />
          : <>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={highlight ? '#C4614A' : '#C4B5A0'} strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p className="mt-2 text-xs font-medium" style={{ color: highlight ? '#C4614A' : '#A67C60' }}>
                Tap to upload or drag & drop
              </p>
            </>
        }
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />

      {scanning && (
        <div className="mt-2 rounded-xl px-3 py-2" style={{ backgroundColor: '#F0E6D3' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#7A4030' }}>Reading… {progress}%</p>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E8D5B7' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#C4614A' }} />
          </div>
        </div>
      )}

      {!scanning && image && (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={5}
          placeholder="No text detected — type it in manually"
          className="mt-2 w-full rounded-xl px-3 py-2 text-xs resize-y outline-none"
          style={{ backgroundColor: '#F0E6D3', color: '#5A3520', border: '1px solid #E8C5A8', lineHeight: 1.6 }}
        />
      )}
    </div>
  );
}

// ── Add recipe modal ──────────────────────────────────────────────────────────
function AddRecipeModal({ onSave, onClose }) {
  const [ingImage, setIngImage]       = useState(null);
  const [ingText, setIngText]         = useState('');
  const [ingScanning, setIngScanning] = useState(false);
  const [ingProgress, setIngProgress] = useState(0);

  const [insImage, setInsImage]       = useState(null);
  const [insText, setInsText]         = useState('');
  const [insScanning, setInsScanning] = useState(false);
  const [insProgress, setInsProgress] = useState(0);

  const [title, setTitle]             = useState('');
  const [category, setCategory]       = useState('dinner');

  // Which section is focused for paste (default: ingredients)
  const pasteTargetRef = useRef('ingredients');

  // Per-section file processors — kept in refs so paste handler never goes stale
  const ingProcessRef = useRef(null);
  const insProcessRef = useRef(null);

  ingProcessRef.current = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setIngImage(URL.createObjectURL(file));
    setIngScanning(true); setIngProgress(0); setIngText('');
    try { setIngText(await runOCR(file, setIngProgress)); } catch { setIngText(''); }
    setIngScanning(false);
  };

  insProcessRef.current = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setInsImage(URL.createObjectURL(file));
    setInsScanning(true); setInsProgress(0); setInsText('');
    try { setInsText(await runOCR(file, setInsProgress)); } catch { setInsText(''); }
    setInsScanning(false);
  };

  // Global paste listener — uses refs so it always has the latest handlers + target
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (!file) break;
          if (pasteTargetRef.current === 'instructions') {
            insProcessRef.current?.(file);
          } else {
            ingProcessRef.current?.(file);
          }
          break;
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const canSave = title.trim() && ingText.trim() && !ingScanning && !insScanning;

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
        <div className="flex items-center justify-between px-6 pt-5 pb-3" style={{ borderBottom: '1px solid #F0E6D3' }}>
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#3D1F10' }}>Add Recipe</h2>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: '#A67C60' }}>×</button>
        </div>

        {/* paste hint */}
        <div className="mx-6 mt-3 rounded-xl px-3 py-2 text-xs text-center" style={{ backgroundColor: '#F0E6D3', color: '#7A4030' }}>
          📋 <strong>Cmd+Ctrl+Shift+4</strong> copies a screenshot — click a section below to select it, then <strong>Cmd+V</strong> to paste
        </div>

        <div className="px-6 py-4 flex flex-col gap-5">

          {/* ingredients */}
          <div
            onClick={() => { pasteTargetRef.current = 'ingredients'; }}
            className="rounded-xl p-3 transition-all cursor-default"
            style={{ outline: pasteTargetRef.current === 'ingredients' ? '2px solid #C4614A' : '2px solid transparent' }}
          >
            <UploadBlock
              label="📋 Ingredients"
              image={ingImage} setImage={setIngImage}
              text={ingText} setText={setIngText}
              scanning={ingScanning} setScanning={setIngScanning}
              progress={ingProgress} setProgress={setIngProgress}
              highlight={false}
            />
          </div>

          {/* instructions */}
          <div
            onClick={() => { pasteTargetRef.current = 'instructions'; }}
            className="rounded-xl p-3 transition-all cursor-default"
            style={{ outline: pasteTargetRef.current === 'instructions' ? '2px solid #6B9BAF' : '2px solid transparent' }}
          >
            <UploadBlock
              label="📝 Instructions"
              image={insImage} setImage={setInsImage}
              text={insText} setText={setInsText}
              scanning={insScanning} setScanning={setInsScanning}
              progress={insProgress} setProgress={setInsProgress}
              highlight={false}
            />
          </div>

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
            onClick={() => {
              if (canSave) {
                onSave({ title: title.trim(), content: ingText.trim(), instructions: insText.trim() || null, category });
                onClose();
              }
            }}
            disabled={!canSave}
            className="w-full py-3 rounded-xl font-bold transition-all"
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

// ── Recipe card ───────────────────────────────────────────────────────────────
function RecipeCard({ recipe, onDelete, onUpvote, myUpvoted }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFF0E6', border: '1.5px solid #E8C5A8' }}>
      <div className="flex items-center">
        <button
          onClick={() => onUpvote(recipe.id)}
          className="flex flex-col items-center px-3 py-3 flex-shrink-0 transition-opacity"
          style={{ color: myUpvoted ? '#C4614A' : '#A67C60', opacity: myUpvoted ? 1 : 0.35 }}
          aria-label={myUpvoted ? 'Remove upvote' : 'Upvote'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 8H4z"/></svg>
          {recipe.votes > 0 && (
            <span className="font-bold leading-none mt-0.5" style={{ fontSize: '0.65rem', color: '#C4614A' }}>{recipe.votes}</span>
          )}
        </button>

        <button
          className="flex-1 flex items-center justify-between py-3 pr-4 text-left min-w-0"
          onClick={() => setExpanded(e => !e)}
        >
          <span className="font-semibold text-sm truncate" style={{ fontFamily: "'Playfair Display', serif", color: '#3D1F10' }}>
            {recipe.title}
          </span>
          <svg
            className="flex-shrink-0 ml-2 transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', color: '#A67C60' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1" style={{ borderTop: '1px solid #F0E6D3' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#A67C60' }}>Ingredients</p>
          <pre className="text-xs whitespace-pre-wrap leading-relaxed mb-3" style={{ color: '#5A3520', fontFamily: 'system-ui, sans-serif' }}>
            {recipe.content}
          </pre>
          {recipe.instructions && (
            <>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#A67C60' }}>Instructions</p>
              <pre className="text-xs whitespace-pre-wrap leading-relaxed mb-3" style={{ color: '#5A3520', fontFamily: 'system-ui, sans-serif' }}>
                {recipe.instructions}
              </pre>
            </>
          )}
          <button
            onClick={() => onDelete(recipe.id)}
            className="text-xs px-3 py-1.5 rounded-full font-semibold opacity-50 hover:opacity-100 transition-opacity"
            style={{ backgroundColor: '#E8D5B7', color: '#7A4030' }}
          >
            Delete recipe
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function RecipesView({ recipes, onAdd, onDelete, onUpvote, myRecipeUpvotes }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = (activeCategory === 'all' ? recipes : recipes.filter(r => r.category === activeCategory))
    .slice().sort((a, b) => (b.votes || 0) - (a.votes || 0));

  return (
    <div className="max-w-lg mx-auto px-4 pb-16 pt-4">
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory('all')}
          className="px-4 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-all"
          style={{ backgroundColor: activeCategory === 'all' ? '#C4614A' : '#E8D5B7', color: activeCategory === 'all' ? 'white' : '#7A4030' }}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-all capitalize"
            style={{ backgroundColor: activeCategory === cat ? CATEGORY_COLOR[cat] : '#E8D5B7', color: activeCategory === cat ? 'white' : '#7A4030' }}
          >
            {CATEGORY_LABEL[cat]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📖</p>
          <p style={{ fontFamily: "'Caveat', cursive", color: '#C4614A', fontSize: '1.3rem' }}>no recipes yet — add one!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} onDelete={onDelete} onUpvote={onUpvote} myUpvoted={myRecipeUpvotes.has(recipe.id)} />
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl font-bold transition-transform hover:scale-110"
        style={{ backgroundColor: '#C4614A', boxShadow: '0 4px 20px rgba(196,97,74,0.4)' }}
      >
        +
      </button>

      {showAdd && <AddRecipeModal onSave={onAdd} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
