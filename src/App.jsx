import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { ITEMS, CATEGORIES } from './data/items';
import { supabase } from './lib/supabase';
import Header from './components/Header';
import CategorySection from './components/CategorySection';
import ItemModal from './components/ItemModal';
import AddItem from './components/AddItem';
import BucketItem from './components/BucketItem';
const MapView = lazy(() => import('./components/MapView'));
const WheelView = lazy(() => import('./components/WheelView'));

const STORAGE_KEY  = 'bucket_list_checks';
const CUSTOM_KEY   = 'bucket_list_custom';
const HIDDEN_KEY   = 'bucket_list_hidden';
const UPVOTED_KEY  = 'bucket_list_upvoted';

function loadUpvoted() {
  try { return new Set(JSON.parse(localStorage.getItem(UPVOTED_KEY)) || []); }
  catch { return new Set(); }
}
function saveUpvoted(set) { localStorage.setItem(UPVOTED_KEY, JSON.stringify([...set])); }

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
  const [view, setView]          = useState('list'); // 'list' | 'map' | 'wheel'
  const [upvotes, setUpvotes]    = useState({});          // { [item_id]: count }
  const [comments, setComments]  = useState({});          // { [item_id]: [{id, body, created_at}] }
  const [myUpvotes, setMyUpvotes] = useState(loadUpvoted); // items this device has upvoted

  // ── Supabase bootstrap ───────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;

    // load checks
    supabase.from('checks').select('item_id, checked').then(({ data, error }) => {
      if (error || !data) return;
      const merged = { ...loadLocal() };
      data.forEach(row => { merged[row.item_id] = row.checked; });
      setChecks(merged);
      saveLocal(merged);
      setSynced(true);
    });

    // load custom items
    supabase.from('custom_items').select('id, name, checked').then(({ data, error }) => {
      if (error || !data) return;
      const items = data.map(row => ({ id: row.id, name: row.name, checked: row.checked }));
      setCustom(items);
      saveCustom(items);
    });

    // load upvotes
    supabase.from('upvotes').select('item_id, count').then(({ data }) => {
      if (!data) return;
      const map = {};
      data.forEach(row => { map[row.item_id] = row.count; });
      setUpvotes(map);
    });

    // load comments
    supabase.from('comments').select('id, item_id, body, created_at').order('created_at').then(({ data }) => {
      if (!data) return;
      const map = {};
      data.forEach(row => {
        if (!map[row.item_id]) map[row.item_id] = [];
        map[row.item_id].push({ id: row.id, body: row.body, created_at: row.created_at });
      });
      setComments(map);
    });

    const channel = supabase.channel('all_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checks' }, payload => {
        const row = payload.new;
        if (!row || row.item_id == null) return;
        setChecks(prev => {
          const next = { ...prev, [row.item_id]: row.checked };
          saveLocal(next);
          return next;
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'custom_items' }, payload => {
        const row = payload.new;
        setCustom(prev => {
          if (prev.find(i => i.id === row.id)) return prev;
          const next = [...prev, { id: row.id, name: row.name, checked: row.checked }];
          saveCustom(next);
          return next;
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'custom_items' }, payload => {
        const row = payload.new;
        setCustom(prev => {
          const next = prev.map(i => i.id === row.id ? { ...i, checked: row.checked } : i);
          saveCustom(next);
          return next;
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'custom_items' }, payload => {
        const row = payload.old;
        setCustom(prev => {
          const next = prev.filter(i => i.id !== row.id);
          saveCustom(next);
          return next;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'upvotes' }, payload => {
        const row = payload.new;
        if (!row) return;
        setUpvotes(prev => ({ ...prev, [row.item_id]: row.count }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, payload => {
        const row = payload.new;
        if (!row) return;
        setComments(prev => {
          const existing = prev[row.item_id] || [];
          if (existing.find(c => c.id === row.id)) return prev;
          return { ...prev, [row.item_id]: [...existing, { id: row.id, body: row.body, created_at: row.created_at }] };
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, payload => {
        const row = payload.old;
        if (!row) return;
        setComments(prev => ({
          ...prev,
          [row.item_id]: (prev[row.item_id] || []).filter(c => c.id !== row.id),
        }));
      })
      .subscribe();

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
      const item = prev.find(it => it.id === id);
      const next = prev.map(it => it.id === id ? { ...it, checked: !it.checked } : it);
      saveCustom(next);
      if (supabase && item) supabase.from('custom_items').update({ checked: !item.checked }).eq('id', id).then(() => {});
      return next;
    });
  }, []);

  // ── Add custom ───────────────────────────────────────────────────────────
  const handleAdd = useCallback((name) => {
    const newItem = { id: `custom_${Date.now()}`, name, checked: false };
    setCustom(prev => {
      const next = [...prev, newItem];
      saveCustom(next);
      return next;
    });
    if (supabase) supabase.from('custom_items').insert(newItem).then(() => {});
  }, []);

  // ── Delete custom item ───────────────────────────────────────────────────
  const handleDeleteCustom = useCallback((id) => {
    setCustom(prev => {
      const next = prev.filter(it => it.id !== id);
      saveCustom(next);
      return next;
    });
    if (supabase) supabase.from('custom_items').delete().eq('id', id).then(() => {});
  }, []);

  // ── Upvote (toggle) ──────────────────────────────────────────────────────
  const handleUpvote = useCallback((id) => {
    const key = String(id);
    setMyUpvotes(prev => {
      const next = new Set(prev);
      const alreadyVoted = next.has(key);
      if (alreadyVoted) {
        next.delete(key);
        setUpvotes(u => ({ ...u, [key]: Math.max(0, (u[key] || 0) - 1) }));
        if (supabase) supabase.rpc('decrement_upvote', { p_item_id: key }).then(() => {});
      } else {
        next.add(key);
        setUpvotes(u => ({ ...u, [key]: (u[key] || 0) + 1 }));
        if (supabase) supabase.rpc('increment_upvote', { p_item_id: key }).then(() => {});
      }
      saveUpvoted(next);
      return next;
    });
  }, []);

  // ── Add comment ──────────────────────────────────────────────────────────
  const handleAddComment = useCallback((itemId, body) => {
    const key = String(itemId);
    const newComment = { id: `comment_${Date.now()}`, item_id: key, body, created_at: new Date().toISOString() };
    setComments(prev => {
      const existing = prev[key] || [];
      return { ...prev, [key]: [...existing, { id: newComment.id, body, created_at: newComment.created_at }] };
    });
    if (supabase) supabase.from('comments').insert(newComment).then(() => {});
  }, []);

  // ── Delete comment ───────────────────────────────────────────────────────
  const handleDeleteComment = useCallback((commentId, itemId) => {
    const key = String(itemId);
    setComments(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(c => c.id !== commentId),
    }));
    if (supabase) supabase.from('comments').delete().eq('id', commentId).then(() => {});
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

      {/* List / Map toggle */}
      <div className="flex justify-center pt-5 pb-1">
        <div className="flex rounded-full p-1" style={{ backgroundColor: '#E8D5B7' }}>
          {[
            { id: 'list', label: '☰ List' },
            { id: 'map', label: '🗺 Map' },
            { id: 'wheel', label: '🎡 Wheel' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: view === id ? '#C4614A' : 'transparent',
                color: view === id ? 'white' : '#7A4030',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'map' ? (
        <div className="max-w-lg mx-auto px-4 pb-16 pt-4">
          <Suspense fallback={<div className="text-center py-10" style={{ color: '#A67C60' }}>loading map…</div>}>
            <MapView checks={checks} onToggle={handleToggle} hidden={hidden} />
          </Suspense>
          <p className="text-center mt-3 text-xs" style={{ color: '#A67C60' }}>
            Tap a pin to see the spot • red = to do · green = done
          </p>
        </div>
      ) : view === 'wheel' ? (
        <div className="max-w-lg mx-auto">
          <Suspense fallback={<div className="text-center py-10" style={{ color: '#A67C60' }}>loading wheel…</div>}>
            <WheelView checks={checks} customItems={customItems} hidden={hidden} />
          </Suspense>
        </div>
      ) : (
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
                  upvoteCount={upvotes[String(item.id)] || 0}
                  onUpvote={handleUpvote}
                  myUpvoted={myUpvotes.has(String(item.id))}
                  commentCount={0}
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
            upvotes={upvotes}
            onUpvote={handleUpvote}
            myUpvotes={myUpvotes}
            comments={comments}
          />
        ))}

        <div className="text-center mt-8">
          <p style={{ fontFamily: "'Caveat', cursive", color: '#C4614A', fontSize: '1.3rem' }}>
            made with love ☀️ for our best summer yet
          </p>
        </div>
      </main>

      )}

      {modalId && (
        <ItemModal
          itemId={modalId}
          onClose={() => setModalId(null)}
          comments={comments[String(modalId)] || []}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
        />
      )}
    </div>
  );
}
