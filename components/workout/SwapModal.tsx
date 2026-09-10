'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Check } from 'lucide-react';
import { EXERCISE_DB, EXERCISE_GROUPS } from '@/lib/exercises';
import { useLocalStorage } from '@/hooks/useStorage';
import type { ExerciseEntry } from '@/lib/exercises';

interface SwapModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;
}

export default function SwapModal({ open, onClose, onSelect }: SwapModalProps) {
  const [query, setQuery]   = useState('');
  const [group, setGroup]   = useState('Tous');
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useLocalStorage<ExerciseEntry[]>('tw_custom_exercises', []);
  const [newEx, setNewEx]   = useState({ name:'', muscle:'', group:'Full Body' });

  const allEx = [...EXERCISE_DB, ...custom];

  const filtered = allEx.filter(e => {
    const q = query.toLowerCase();
    const matchQ = !q || e.name.toLowerCase().includes(q) || e.muscle.toLowerCase().includes(q) || e.group.toLowerCase().includes(q);
    const matchG = group === 'Tous' || e.group === group;
    return matchQ && matchG;
  });

  const addCustom = () => {
    if (!newEx.name.trim()) return;
    const entry: ExerciseEntry = { name: newEx.name.trim(), muscle: newEx.muscle || 'Musculation', group: newEx.group };
    setCustom(p => [...p, entry]);
    setNewEx({ name:'', muscle:'', group:'Full Body' });
    setAdding(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          style={{ position:'fixed', inset:0, zIndex:600, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y:80 }} animate={{ y:0 }} exit={{ y:80 }}
            transition={{ type:'spring', stiffness:320, damping:32 }}
            style={{ width:'100%', maxWidth:430, background:'#13131c', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'28px 28px 0 0', display:'flex', flexDirection:'column', maxHeight:'88vh', paddingBottom:'max(env(safe-area-inset-bottom),8px)' }}
          >
            {/* Handle */}
            <div style={{ width:36, height:4, background:'rgba(255,255,255,0.15)', borderRadius:99, margin:'12px auto 0' }}/>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 0' }}>
              <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:26, color:'var(--t1)', letterSpacing:'.03em' }}>Remplacer par…</span>
              <div style={{ display:'flex', gap:8 }}>
                <motion.button whileTap={{scale:.88}} onClick={() => setAdding(v=>!v)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:12, background:'var(--ac2)', border:'1px solid rgba(206,245,51,0.25)', color:'var(--ac)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  <Plus size={14}/> Ajouter
                </motion.button>
                <motion.button whileTap={{scale:.88}} onClick={onClose}
                  style={{ width:34, height:34, borderRadius:'50%', background:'var(--s2)', border:'1px solid var(--bd)', color:'var(--t2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                  <X size={16}/>
                </motion.button>
              </div>
            </div>

            {/* Add custom form */}
            <AnimatePresence>
              {adding && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} style={{ overflow:'hidden' }}>
                  <div style={{ margin:'12px 20px 0', padding:16, borderRadius:18, background:'var(--s2)', border:'1px solid var(--bd)' }}>
                    <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--t3)', marginBottom:10 }}>Nouvel exercice</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <input value={newEx.name} onChange={e=>setNewEx(p=>({...p,name:e.target.value}))} className="fi" style={{fontSize:14}} placeholder="Nom de l'exercice *"/>
                      <input value={newEx.muscle} onChange={e=>setNewEx(p=>({...p,muscle:e.target.value}))} className="fi" style={{fontSize:14}} placeholder="Muscles travaillés"/>
                      <select value={newEx.group} onChange={e=>setNewEx(p=>({...p,group:e.target.value}))} className="fi" style={{fontSize:14}}>
                        {EXERCISE_GROUPS.filter(g=>g!=='Tous').map(g=><option key={g} value={g}>{g}</option>)}
                      </select>
                      <button onClick={addCustom} style={{ padding:'12px', borderRadius:12, background:'var(--ac)', border:'none', color:'#0c0c14', fontWeight:800, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                        <Check size={16}/> Ajouter l'exercice
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search */}
            <div style={{ padding:'12px 20px 0' }}>
              <div style={{ position:'relative' }}>
                <Search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--t3)' }}/>
                <input value={query} onChange={e=>setQuery(e.target.value)} className="fi" style={{ paddingLeft:40, fontSize:14 }} placeholder="Rechercher muscle ou exercice…" autoComplete="off"/>
              </div>
            </div>

            {/* Group filter */}
            <div style={{ display:'flex', gap:6, overflowX:'auto', padding:'10px 20px 0' }}>
              {EXERCISE_GROUPS.map(g => (
                <button key={g} onClick={()=>setGroup(g)}
                  style={{ flexShrink:0, padding:'6px 14px', borderRadius:99, fontSize:12, fontWeight:700, cursor:'pointer', border:'none', background: group===g ? 'var(--ac)' : 'var(--s2)', color: group===g ? '#0c0c14' : 'var(--t3)', transition:'all .15s' }}>
                  {g}
                </button>
              ))}
            </div>

            {/* Count */}
            <div style={{ padding:'8px 20px 4px', fontSize:11, color:'var(--t3)', fontWeight:600 }}>
              {filtered.length} exercice{filtered.length>1?'s':''}
            </div>

            {/* List */}
            <div style={{ flex:1, overflowY:'auto', padding:'0 20px' }}>
              {filtered.map((ex, i) => (
                <motion.button key={`${ex.name}-${i}`}
                  initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:Math.min(i*.015,.3)}}
                  onClick={() => { onSelect(ex.name); onClose(); }}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'12px 0', background:'none', border:'none', borderBottom:'1px solid var(--bd)', cursor:'pointer', textAlign:'left' }}
                  whileTap={{opacity:.6}}
                >
                  {/* Image or placeholder */}
                  <div style={{ width:56, height:56, borderRadius:14, overflow:'hidden', flexShrink:0, background:'#0a0a12', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {ex.img
                      ? <img src={ex.img} alt={ex.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      : <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:16, color:'var(--t3)' }}>{ex.name[0]}</div>
                    }
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ex.name}</div>
                    <div style={{ fontSize:12, color:'var(--t3)', marginTop:2 }}>{ex.muscle}</div>
                    {custom.some(c=>c.name===ex.name) && (
                      <div style={{ fontSize:10, color:'var(--ac)', fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', marginTop:2 }}>Personnalisé</div>
                    )}
                  </div>
                  <div style={{ width:28, height:28, borderRadius:10, background:'var(--s2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Plus size={14} style={{ color:'var(--t3)' }}/>
                  </div>
                </motion.button>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding:'32px 0', textAlign:'center' }}>
                  <div style={{ fontSize:14, color:'var(--t3)' }}>Aucun résultat — ajoute-le via "Ajouter"</div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
