'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Circle, Shuffle, Save, Clock, Zap, AlertTriangle, Dumbbell } from 'lucide-react';
import type { Exercise } from '@/lib/types';
import { EXERCISE_INFO, getExerciseImageModal } from '@/lib/data';

interface Props {
  exercise: Exercise | null;
  open: boolean;
  onClose: () => void;
  onToggleDone: (name: string) => void;
  onSave: (name: string, patch: Partial<Exercise>) => void;
  onSwap: () => void;
}

export default function ExerciseModal({ exercise, open, onClose, onToggleDone, onSave, onSwap }: Props) {
  const [sets,   setSets]   = useState('');
  const [weight, setWeight] = useState('');
  const [rest,   setRest]   = useState('');
  const [cname,  setCname]  = useState('');
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    if (!exercise) return;
    setSets(exercise.customSets || exercise.sets || '');
    setWeight(exercise.customWeight || '');
    setRest(exercise.customRest || '');
    setCname(exercise.customName || '');
    setSaved(false);
  }, [exercise]);

  if (!exercise) return null;

  const name = exercise.customName || exercise.name;
  const info = EXERCISE_INFO[exercise.name];
  const img  = getExerciseImageModal(exercise.name, exercise.customImg);

  const handleSave = () => {
    onSave(exercise.name, { customName: cname, customSets: sets, customWeight: weight, customRest: rest });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const levelColor = info?.d === 'Avancé' ? '#ff6240' : info?.d === 'Intermédiaire' ? '#ffd426' : '#2ed158';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={e => e.target === e.currentTarget && onClose()}
          style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end' }}
        >
          <motion.div
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            exit={{ y: 60 }}
            transition={{ type:'spring', stiffness:340, damping:34 }}
            style={{ width:'100%', maxWidth:430, background:'#13131c', borderRadius:'28px 28px 0 0', border:'1px solid rgba(255,255,255,0.08)', maxHeight:'92dvh', display:'flex', flexDirection:'column', overflow:'hidden', paddingBottom:'max(env(safe-area-inset-bottom),8px)' }}
          >
            {/* HEADER — fixed */}
            <div style={{ flexShrink:0, padding:'0 20px' }}>
              <div style={{ width:36, height:4, background:'rgba(255,255,255,0.15)', borderRadius:99, margin:'12px auto 0' }}/>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', paddingTop:14, paddingBottom:12, gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:28, color:'var(--t1)', letterSpacing:'.03em', lineHeight:1.1, wordBreak:'break-word' }}>{name}</h2>
                  {info && (
                    <div style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:6, padding:'4px 10px', borderRadius:99, background:`${levelColor}15`, border:`1px solid ${levelColor}30` }}>
                      <Zap size={11} color={levelColor}/>
                      <span style={{ fontSize:11, fontWeight:700, color:levelColor, letterSpacing:'.06em', textTransform:'uppercase' }}>{info.d}</span>
                    </div>
                  )}
                </div>
                <button onClick={onClose} style={{ width:34, height:34, borderRadius:'50%', background:'var(--s2)', border:'1px solid var(--bd)', color:'var(--t2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginTop:2 }}>
                  <X size={16}/>
                </button>
              </div>
            </div>

            {/* SCROLLABLE BODY */}
            <div style={{ flex:1, overflowY:'auto', padding:'0 20px 8px' }}>

              {/* IMAGE */}
              <div style={{ borderRadius:20, overflow:'hidden', marginBottom:16, position:'relative', height:220, background:'#0a0a12' }}>
                <img src={img} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                {info && (
                  <div style={{ position:'absolute', bottom:12, left:12, display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:99, background:'rgba(12,12,20,0.85)', backdropFilter:'blur(8px)' }}>
                    <Clock size={12} color="var(--ac)"/>
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--t1)' }}>Repos : {info.r}</span>
                  </div>
                )}
              </div>

              {/* INFO PILLS */}
              {info && (
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                  <InfoRow icon={<Dumbbell size={15} color="var(--ac)"/>} label="Muscles" value={info.m} />
                  <InfoRow icon={<Zap size={15} color="#3d9bff"/>} label="Technique" value={info.t} color="#3d9bff" />
                  <InfoRow icon={<AlertTriangle size={15} color="#ff6240"/>} label="Erreur fréquente" value={info.err} color="#ff6240" />
                </div>
              )}

              {/* CUSTOMIZE */}
              <div style={{ background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:18, padding:16, marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--t3)', marginBottom:12 }}>Personnaliser</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <input value={cname} onChange={e=>setCname(e.target.value)} className="fi" placeholder="Nom personnalisé (optionnel)" style={{ fontSize:14 }}/>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <input value={sets} onChange={e=>setSets(e.target.value)} className="fi" placeholder="Séries (ex: 4×10)" style={{ fontSize:14 }}/>
                    <input value={weight} onChange={e=>setWeight(e.target.value)} className="fi" placeholder="Poids (ex: 60 kg)" style={{ fontSize:14 }}/>
                  </div>
                  <input value={rest} onChange={e=>setRest(e.target.value)} className="fi" placeholder="Repos (ex: 90 s)" style={{ fontSize:14 }}/>
                </div>
              </div>

              {/* ACTIONS */}
              <div style={{ display:'flex', flexDirection:'column', gap:10, paddingBottom:8 }}>
                {/* Primary — toggle done */}
                <motion.button whileTap={{scale:.97}} onClick={() => { onToggleDone(exercise.name); onClose(); }}
                  style={{ width:'100%', padding:'16px', borderRadius:16, border:'none', cursor:'pointer', background: exercise.done ? 'rgba(46,209,88,0.15)' : 'var(--ac)', color: exercise.done ? '#2ed158' : '#0c0c14', fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow: exercise.done ? 'none' : '0 4px 20px rgba(206,245,51,0.2)' }}>
                  {exercise.done ? <><Circle size={18}/> Marquer non fait</> : <><CheckCircle2 size={18}/> Marquer comme fait</>}
                </motion.button>

                {/* Secondary row */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <motion.button whileTap={{scale:.97}} onClick={handleSave}
                    style={{ padding:'13px', borderRadius:14, border:'1.5px solid var(--bd)', background: saved ? 'rgba(46,209,88,0.1)' : 'var(--s2)', color: saved ? '#2ed158' : 'var(--t2)', cursor:'pointer', fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                    <Save size={15}/> {saved ? 'Enregistré' : 'Enregistrer'}
                  </motion.button>
                  <motion.button whileTap={{scale:.97}} onClick={onSwap}
                    style={{ padding:'13px', borderRadius:14, border:'1.5px solid var(--bd)', background:'var(--s2)', color:'var(--t2)', cursor:'pointer', fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                    <Shuffle size={15}/> Alternative
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InfoRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div style={{ display:'flex', gap:12, padding:'12px 14px', borderRadius:14, background:'var(--s2)', border:'1px solid var(--bd)' }}>
      <div style={{ flexShrink:0, marginTop:1 }}>{icon}</div>
      <div>
        <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--t3)', marginBottom:3 }}>{label}</div>
        <div style={{ fontSize:14, fontWeight:600, color: color || 'var(--t1)', lineHeight:1.4 }}>{value}</div>
      </div>
    </div>
  );
}
