import { useState, useEffect, useCallback } from 'react';
import { ITEMS, CATEGORIES } from './data/items';
import { supabase } from './lib/supabase';
import Header from './components/Header';
import CategorySection from './components/CategorySection';
import ItemModal from './components/ItemModal';
import AddItem from './components/AddItem';
import BucketItem from './components/BucketItem';

const STORAGE_KEY  = 'bucket_list_checks';
const CUSTOM_KEY   = 'bucket_list_custom';
const HIDDEN_KEY   = 'bucket_list_hidden';

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveLocal(v) { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); }

function loadCustom() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || []; }
  catch { return []; }
}
function saveCustom(v) { localStorage.setItem(CUSTOM_KEY, JSON.stringify(v)); }

function loadHidden() {
  try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY)) || []); }
  catch { return new Set(); }
}
function saveHidden(set) { localStorage.setItem(HIDDEN_KEY, JSON.stringify([...set])); }

export default function App() {
  const [checks, setChecks]      = useState(loadLocal);
  const [customItems, setCustom] = useState(loadCustom);
  const [hidden, setHidden]      = useState(loadHidden);
  const [modalId, setModalId]    = useState(null);
  const [synced, setSynced]      = useState(false);

  // ── Supabase bootstrap ───────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;
    supabase.from('checks').select('item_id, checked').then(({ data, error }) => {
      if (error || !data) return;
      const merged = { ...loadLocal() };
      data.forEach(row => { merged[row.item_id] = row.checked; });
      setChecks(merged);
      saveLocal(merged);
      setSynced(true);
    });
    const channel = supabase.channel('checks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checks' }, payload => {
        const row = payload.new;
        if (!row || row.item_id == null) return;
        setChecks(prev => {
          const next = { ...prev, [row.item_id]: row.checked };
          saveLocal(next);
          return next;
        });
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // ── Toggle preset ────────────────────────────────────────────────────────
  const handleToggle = useCallback((id) => {
    setChecks(prev => {
      const next = { ...prev, [id]: !prev[id] };
      saveLocal(next);
      if (supabase) supabase.from('checks').upsert({ item_id: id, checked: next[id] }, { onConflict: 'item_id' }).then(() => {});
      return next;
    });
  }, []);

  // ── Toggle custom ────────────────────────────────────────────────────────
  const handleToggleCustom = useCallback((id) => {
    setCustom(prev => {
      const next = prev.map(it => it.id === id ? { ...it, checked: !it.checked } : it);
      saveCustom(next);
      return next;
    });
  }, []);

  // ── Add custom ───────────────────────────────────────────────────────────
  const handleAdd = useCallback((name) => {
    setCustom(prev => {
      const next = [...prev, { id: `custom_${Date.now()}`, name, checked: false }];
      saveCustom(next);
      return next;
    });
  }, []);

  // ── Delete custom item ───────────────────────────────────────────────────
  const handleDeleteCustom = useCallback((id) => {
    setCustom(prev => {
      const next = prev.filter(it => it.id !== id);
      saveCustom(next);
      return next;
    });
  }, []);

  // ── Hide preset item ─────────────────────────────────────────────────────
  const handleHidePreset = useCallback((id) => {
    setHidden(prev => {
      const next = new Set(prev);
      next.add(id);
      saveHidden(next);
      return next;
    });
  }, []);

  const visibleItems   = ITEMS.filter(i => !hidden.has(i.id));
  const presetDone     = visibleItems.filter(i => checks[i.id]).length;
  const customDone     = customItems.filter(i => i.checked).length;
  const totalDone      = presetDone + customDone;
  const totalAll       = visibleItems.length + customItems.length;

  const byCategory = CATEGORIES.map(cat => ({
    category: cat,
    items: visibleItems.filter(i => i.category === cat.id),
  })).filter(({ items }) => items.length > 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF8F0' }}>
      <Header done={totalDone} total={totalAll} />

      {supabase && !synced && (
        <div className="text-center py-1 text-xs" style={{ backgroundColor: '#E8D5B7', color: '#7A4030' }}>
          connecting to shared list…
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 pb-16 pt-6">
        <AddItem onAdd={handleAdd} />

        {customItems.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📝</span>
              <h2 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#3D1F10' }}>
                Our Additions
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#E8D5B7', color: '#7A4030' }}>
                {customDone}/{customItems.length}
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: '#F0E6D3' }}>
              {customItems.map(item => (
                <BucketItem
                  key={item.id}
                  item={{ id: item.id, name: item.name, tag: 'added by us' }}
                  checked={item.checked}
                  onToggle={handleToggleCustom}
                  onDelete={handleDeleteCustom}
                />
              ))}
            </div>
          </section>
        )}

        {byCategory.map(({ category, items }) => (
          <CategorySection
            key={category.id}
            category={category}
            items={items}
            checks={checks}
            onToggle={handleToggle}
            onOpen={setModalId}
            onDelete={handleHidePreset}
          />
        ))}

        <div className="text-center mt-8">
          <p style={{ fontFamily: "'Caveat', cursive", color: '#C4614A', fontSize: '1.3rem' }}>
            made with love ☀️ for our best summer yet
          </p>
        </div>
      </main>

      {modalId && <ItemModal itemId={modalId} onClose={() => setModalId(null)} />}
    </div>
  );
}
