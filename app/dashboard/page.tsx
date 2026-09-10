'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, Circle, Shuffle, Info, Settings } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ProfileModal from '@/components/profile/ProfileModal';
import ExerciseModal from '@/components/workout/ExerciseModal';
import SwapModal from '@/components/workout/SwapModal';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useUser } from '@/hooks/useUser';
import { useWorkout } from '@/hooks/useWorkout';
import { useLocalStorage } from '@/hooks/useStorage';
import { getWeekDays, isToday, getWeekLabel, getStreakFromLogs, getTagColor } from '@/lib/utils';
import { getExerciseImageCard } from '@/lib/data';
import { useRouter } from 'next/navigation';
import type { Exercise } from '@/lib/types';

const DAY = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

export default function DashboardPage() {
  const { user }                               = useUser();
  const { program, setProgram, logs, logWorkout } = useWorkout();
  const router                                 = useRouter();
  const [weekOff, setWeekOff]  = useLocalStorage('tw_week_offset', 0);
  const [selDay, setSelDay]    = useLocalStorage<number>('tw_selected_day',
    new Date().getDay()===0 ? 6 : new Date().getDay()-1);
  const [doneMap, setDoneMap]  = useLocalStorage<Record<string,boolean>>('tw_done', {});
  const [profileOpen, setProfileOpen] = useState(false);
  const [exModal, setExModal]  = useState<Exercise|null>(null);
  const [swapOpen, setSwapOpen]= useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const scrollRef              = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled]= useState(false);

  const days   = getWeekDays(weekOff);
  const streak = getStreakFromLogs(logs);
  const day    = program[selDay];
  const tc     = day ? getTagColor(day.tag) : 'var(--ac)';

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const fn = () => setScrolled(el.scrollTop > 4);
    el.addEventListener('scroll', fn, { passive:true });
    return () => el.removeEventListener('scroll', fn);
  }, []);

  const dk    = (d:number,n:string) => `${weekOff}_${d}_${n}`;
  const isDone = (n:string) => !!doneMap[dk(selDay,n)];
  const toggle = (n:string) => setDoneMap(p=>({...p,[dk(selDay,n)]:!p[dk(selDay,n)]}));
  const reset  = () => setDoneMap(p=>{const n={...p};allEx.forEach(e=>delete n[dk(selDay,e.name)]);return n;});

  const allEx  = day?.sections?.flatMap(s=>s.exercises) ?? [];
  const doneN  = allEx.filter(e=>isDone(e.name)).length;
  const totalN = allEx.length;
  const pct    = totalN>0?Math.round(doneN/totalN*100):0;

  const finish = () => {
    if (!doneN) return;
    logWorkout({dayIndex:selDay,dayName:day?.name??'',exercisesDone:doneN,totalExercises:totalN});
    setJustLogged(true);
    setTimeout(()=>setJustLogged(false),3000);
  };

  const saveEx = (name:string,patch:Partial<Exercise>) => {
    const up={...program};
    for(const d of Object.values(up)) for(const s of d.sections??[]){const ex=s.exercises.find(e=>e.name===name);if(ex)Object.assign(ex,patch);}
    setProgram(up);
  };
  const swapEx = (newName:string) => {
    if(!exModal) return;
    const old=exModal.name, up={...program};
    for(const d of Object.values(up)) for(const s of d.sections??[]){const ex=s.exercises.find(e=>e.name===old);if(ex)ex.name=newName;}
    setProgram(up); setExModal(null);
  };

  const avatarSeed = user?.avatarSeed || user?.firstName || 'Alex';
  const avatarUrl  = (seed:string) => `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,d1d4f9`;

  return (
    <AppShell>
      <div style={{ display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', background:'var(--bg)' }}>

        {/* ── HEADER ── */}
        <div style={{
          flexShrink:0, paddingTop:'max(env(safe-area-inset-top),16px)',
          paddingInline:20, paddingBottom:0, zIndex:50,
          background: scrolled ? 'var(--s1)' : 'transparent',
          borderBottom: scrolled ? '1px solid var(--bd)' : '1px solid transparent',
          transition:'background .2s, border-color .2s',
        }}>
          {/* Top row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:12, color:'var(--t3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em' }}>
                {['Bonjour','Bon après-midi','Bonsoir'][Math.min(Math.floor(new Date().getHours()/6),2) === 0 ? 0 : Math.floor(new Date().getHours()/6) < 3 ? 1 : 2]},
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--t1)', marginTop:1, letterSpacing:'-.02em' }}>
                {user?.firstName} {user?.lastName}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <ThemeToggle/>
              <button onClick={()=>router.push('/settings')}
                style={{ width:40, height:40, borderRadius:12, background:'var(--s2)', border:'1.5px solid var(--bd)', color:'var(--t2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <Settings size={18}/>
              </button>
              <button onClick={()=>setProfileOpen(true)}
                style={{ width:44, height:44, borderRadius:'50%', overflow:'hidden', border:'2.5px solid var(--ac)', cursor:'pointer', background:'#D1D4F9' }}>
                <img src={avatarUrl(avatarSeed)} alt="avatar" style={{ width:'100%', height:'100%' }}/>
              </button>
            </div>
          </div>

          {/* Week label + nav */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--t2)' }}>{getWeekLabel(weekOff)}</div>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={()=>setWeekOff(w=>w-1)} style={{ width:28,height:28,borderRadius:9,background:'var(--s2)',border:'1px solid var(--bd)',color:'var(--t2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}><ChevronLeft size={14}/></button>
              <button onClick={()=>setWeekOff(w=>w+1)} style={{ width:28,height:28,borderRadius:9,background:'var(--s2)',border:'1px solid var(--bd)',color:'var(--t2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}><ChevronRight size={14}/></button>
            </div>
          </div>

          {/* Day strip */}
          <div style={{ display:'flex', gap:4, overflowX:'auto', paddingBottom:14 }}>
            {days.map((date,i) => {
              const d=program[i], today=isToday(date), act=i===selDay;
              const color=d?getTagColor(d.tag):'var(--ac)';
              const hasDone=d?.sections?.flatMap(s=>s.exercises).some(e=>!!doneMap[dk(i,e.name)]);
              return (
                <motion.button key={i} whileTap={{scale:.88}} onClick={()=>setSelDay(i)}
                  style={{
                    flexShrink:0, minWidth:46, display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                    padding:'9px 8px', borderRadius:16, cursor:'pointer', border:'none',
                    background: act ? color : 'var(--s1)',
                    boxShadow: act ? `0 4px 12px ${color}40` : 'var(--shadow)',
                    transition:'all .2s',
                  }}>
                  <span style={{ fontSize:9, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase', color:act?'#fff':today?color:'var(--t3)' }}>{DAY[i]}</span>
                  <span style={{ fontSize:18, fontWeight:700, lineHeight:1, color:act?'#fff':'var(--t1)' }}>{date.getDate()}</span>
                  <div style={{ width:4, height:4, borderRadius:'50%', background:hasDone?(act?'rgba(255,255,255,.6)':color):(act?'rgba(255,255,255,.3)':'var(--bd2)') }}/>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div ref={scrollRef} style={{ flex:1, overflowY:'scroll', WebkitOverflowScrolling:'touch' as React.CSSProperties['WebkitOverflowScrolling'], paddingInline:20 }}>
          <AnimatePresence mode="wait">
            <motion.div key={selDay} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.2}}>
              <div className="pb-nav" style={{ paddingTop:12 }}>
                {day && (
                  <>
                    {/* HERO */}
                    <div style={{ position:'relative', borderRadius:22, overflow:'hidden', marginBottom:14, height:180 }}>
                      <img src={day.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(.45) saturate(1.2)' }}/>
                      <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,rgba(0,0,0,0) 30%,rgba(0,0,0,.7))' }}/>
                      <div style={{ position:'absolute', top:14, left:14, padding:'4px 12px', borderRadius:99, fontSize:11, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', background:tc+'22', border:`1px solid ${tc}50`, color:tc }}>
                        {day.label}
                      </div>
                      <div style={{ position:'absolute', bottom:18, left:18 }}>
                        <div style={{ fontFamily:'Inter,sans-serif', fontWeight:900, fontSize:32, lineHeight:1, color:'#fff', letterSpacing:'-.02em' }}>{day.name}</div>
                        <div style={{ fontSize:13, color:'rgba(255,255,255,.6)', marginTop:3 }}>{day.subtitle}</div>
                      </div>
                    </div>

                    {/* REST */}
                    {day.rest ? (
                      <div style={{ padding:28, borderRadius:22, background:'var(--s1)', border:'1px solid var(--bd)', textAlign:'center', boxShadow:'var(--shadow)' }}>
                        <div style={{ fontSize:36, marginBottom:10 }}>😴</div>
                        <div style={{ fontSize:17, fontWeight:700, color:'var(--t1)', marginBottom:6 }}>{day.label}</div>
                        {day.note && <div style={{ fontSize:14, color:'var(--t2)', lineHeight:1.65 }}>{day.note}</div>}
                      </div>
                    ) : (
                      <>
                        {/* STATS STRIP */}
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                          {[
                            { label:'Jours d\'affilés', value:streak, sub:'jour streak' },
                            { label:'Cette séance', value:`${doneN}/${totalN}`, sub:'exercices' },
                            { label:'Progression', value:`${pct}%`, sub:'complété' },
                          ].map(({label,value,sub})=>(
                            <div key={label} style={{ padding:'14px 12px', borderRadius:18, background:'var(--s1)', border:'1px solid var(--bd)', boxShadow:'var(--shadow)', textAlign:'center' }}>
                              <div style={{ fontWeight:800, fontSize:20, color:'var(--ac)', lineHeight:1 }}>{value}</div>
                              <div style={{ fontSize:10, color:'var(--t3)', marginTop:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em' }}>{sub}</div>
                            </div>
                          ))}
                        </div>

                        {/* PROGRESS BAR */}
                        {totalN>0 && (
                          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:18, background:'var(--s1)', border:'1px solid var(--bd)', marginBottom:14, boxShadow:'var(--shadow)' }}>
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                                <span style={{ fontSize:13, fontWeight:600, color:'var(--t2)' }}>Progression</span>
                                <span style={{ fontSize:13, fontWeight:800, color:'var(--ac)' }}>{pct}%</span>
                              </div>
                              <div style={{ height:6, borderRadius:99, background:'var(--s3)', overflow:'hidden' }}>
                                <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:.5,ease:'easeOut'}}
                                  style={{ height:'100%', borderRadius:99, background:`linear-gradient(90deg, var(--ac), var(--ac-l))` }}/>
                              </div>
                            </div>
                            <button onClick={reset} style={{ width:32,height:32,borderRadius:10,background:'var(--s2)',border:'1px solid var(--bd)',color:'var(--t3)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>
                              <RotateCcw size={13}/>
                            </button>
                          </div>
                        )}

                        {/* NOTE */}
                        {day.note && (
                          <div style={{ display:'flex', gap:10, padding:'12px 14px', borderRadius:14, background:'var(--ac2)', border:`1px solid var(--ac)30`, marginBottom:14 }}>
                            <Info size={15} style={{ color:'var(--ac)', flexShrink:0, marginTop:1 }}/>
                            <div style={{ fontSize:13, color:'var(--t1)', lineHeight:1.6 }}>{day.note}</div>
                          </div>
                        )}

                        {/* SECTIONS */}
                        {day.sections?.map((sec,si) => (
                          <div key={sec.title}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, margin:'18px 0 10px' }}>
                              <div style={{ width:3,height:16,borderRadius:99,background:tc }}/>
                              <div style={{ fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--t3)' }}>{sec.title}</div>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                              {sec.exercises.map((ex,ei) => {
                                const done=isDone(ex.name);
                                const label=ex.customName||ex.name;
                                const sets=ex.customSets||ex.sets;
                                return (
                                  <motion.div key={ex.name} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:si*.04+ei*.025}}
                                    style={{ display:'flex',alignItems:'stretch',borderRadius:18,overflow:'hidden', background:done?'var(--s2)':'var(--s1)', border:'1px solid var(--bd)', opacity:done?.5:1, filter:done?'grayscale(40%)':'none', transition:'all .3s', boxShadow:'var(--shadow)' }}>
                                    <button onClick={()=>setExModal(ex)} style={{ width:84,flexShrink:0,background:'#111',border:'none',padding:0,cursor:'pointer',overflow:'hidden' }}>
                                      <img src={getExerciseImageCard(ex.name,ex.customImg)} alt={label} style={{ width:'100%',height:84,objectFit:'cover',display:'block' }}/>
                                    </button>
                                    <button onClick={()=>setExModal(ex)} style={{ flex:1,padding:'12px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left',display:'flex',flexDirection:'column',justifyContent:'center',gap:4,minWidth:0 }}>
                                      <div style={{ fontSize:14,fontWeight:700,color:done?'var(--t3)':'var(--t1)',textDecoration:done?'line-through':'none',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as const,overflow:'hidden',lineHeight:1.3 }}>{label}</div>
                                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                                        <span style={{ fontSize:14,fontWeight:800,color:'var(--ac)' }}>{sets}</span>
                                        {ex.customWeight && <span style={{ fontSize:11,padding:'2px 8px',borderRadius:8,background:'var(--ac2)',color:'var(--ac)',fontWeight:700 }}>{ex.customWeight}</span>}
                                      </div>
                                      {ex.note&&!done&&<div style={{ fontSize:11,color:'var(--t3)',fontWeight:500 }}>{ex.note}</div>}
                                    </button>
                                    <div style={{ display:'flex',flexDirection:'column',borderLeft:'1px solid var(--bd)',width:50,flexShrink:0 }}>
                                      <motion.button whileTap={{scale:.8}} onClick={()=>toggle(ex.name)}
                                        style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',border:'none',borderBottom:'1px solid var(--bd)',background:done?'var(--ac2)':'none',color:done?'var(--ac)':'var(--t3)',cursor:'pointer' }}>
                                        {done?<CheckCircle2 size={22} className="pop-in"/>:<Circle size={22}/>}
                                      </motion.button>
                                      <motion.button whileTap={{scale:.8}} onClick={()=>{setExModal(ex);setSwapOpen(true);}}
                                        style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',border:'none',background:'none',color:'var(--t3)',cursor:'pointer' }}>
                                        <Shuffle size={16}/>
                                      </motion.button>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        {/* FEEDBACK */}
                        <AnimatePresence>
                          {justLogged && (
                            <motion.div initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} exit={{opacity:0}} style={{ padding:'14px 20px',borderRadius:16,background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.25)',color:'#22C55E',fontWeight:700,fontSize:14,textAlign:'center',marginTop:14 }}>
                              Séance enregistrée !
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* CTA */}
                        <button onClick={finish} disabled={!doneN}
                          className="btn-pill"
                          style={{
                            width:'100%', marginTop:16,
                            background: pct===100?'#22C55E':doneN?'var(--ac)':'var(--s2)',
                            color: doneN?'#fff':'var(--t3)',
                            boxShadow: doneN?`0 6px 20px ${pct===100?'rgba(34,197,94,.3)':'rgba(124,58,237,.25)'}`:undefined,
                            cursor: doneN?'pointer':'default',
                          }}>
                          {pct===100 ? '🎉 Enregistrer la séance' : doneN?`Terminer (${doneN}/${totalN})`:'Commencer la séance'}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <ProfileModal open={profileOpen} onClose={()=>setProfileOpen(false)}/>
      <ExerciseModal exercise={exModal} open={!!exModal&&!swapOpen} onClose={()=>{setExModal(null);setSwapOpen(false);}} onToggleDone={n=>{toggle(n);setExModal(null);}} onSave={saveEx} onSwap={()=>setSwapOpen(true)}/>
      <SwapModal open={swapOpen} onClose={()=>setSwapOpen(false)} onSelect={swapEx}/>
    </AppShell>
  );
}
