'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronRight, Scale, Bot, TrendingUp, Settings, Play, Sun, Moon, Zap, Utensils, ClipboardList } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ThemeToggle from '@/components/ui/ThemeToggle';
import MuscleMap from '@/components/ui/MuscleMap';
import { useUser } from '@/hooks/useUser';
import { useWorkout } from '@/hooks/useWorkout';
import { useLocalStorage } from '@/hooks/useStorage';
import { getWeekDays, isToday, getStreakFromLogs, getTagColor, formatDate } from '@/lib/utils';
import type { WorkoutDay } from '@/lib/types';

const DAY_SHORT = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

export default function HomePage() {
  const { user }   = useUser();
  const { program, logs, weights } = useWorkout();
  const router     = useRouter();
  const [foodLogs] = useLocalStorage<{date:string;macros?:{k:number}}[]>('tw_food_logs', []);

  const streak    = getStreakFromLogs(logs);
  const currentW  = weights[0]?.weight ?? user?.weight ?? 0;
  const today     = formatDate(new Date());
  const todayLogs = foodLogs.filter(l => l.date === today);
  const loggedCal = todayLogs.reduce((a,l) => a + (l.macros?.k ?? 0), 0);
  const todayIdx  = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const todayDay  = program[todayIdx] as WorkoutDay | undefined;
  const tc        = todayDay ? getTagColor(todayDay.tag) : 'var(--orange)';
  const muscleTag = (todayDay?.tag ?? 'rest') as 'push'|'pull'|'legs'|'arms'|'full'|'rest';

  const days     = getWeekDays(0);
  const weekLogs = logs.filter(l => {
    const d = new Date(l.date), s = new Date(); s.setDate(s.getDate()-6); return d >= s;
  });

  const avatarSeed = user?.avatarSeed || user?.firstName || 'Alex';
  const avatarUrl  = (seed:string) => `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,d1d4f9`;

  const hour      = new Date().getHours();
  const GreetIcon = hour < 12 ? Sun : hour < 18 ? Zap : Moon;
  const greetText = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <AppShell>
      <div className="page-scroll">

        {/* ── HEADER ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:13, color:'var(--t2)', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
              <GreetIcon size={13} color="var(--orange)"/> {greetText}
            </div>
            <div style={{ fontSize:28, fontWeight:900, letterSpacing:'-.03em', color:'var(--t1)', marginTop:2, lineHeight:1.08 }}>
              {user?.firstName} {user?.lastName}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <ThemeToggle/>
            <button onClick={()=>router.push('/settings')}
              style={{ width:38,height:38,borderRadius:'50%',background:'var(--s2)',border:'none',color:'var(--t2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
              <Settings size={17}/>
            </button>
            <button onClick={()=>router.push('/settings')}
              style={{ width:44,height:44,borderRadius:'50%',overflow:'hidden',border:'2.5px solid var(--orange)',background:'#D1D4F9',cursor:'pointer',padding:0,boxShadow:'0 0 0 4px var(--orange2)' }}>
              <img src={avatarUrl(avatarSeed)} alt="avatar" style={{ width:'100%',height:'100%' }}/>
            </button>
          </div>
        </div>

        {/* ── STREAK CARD — orange hero ── */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.04}}
          style={{ padding:'20px 22px', borderRadius:22, background:'var(--orange)', marginBottom:16, position:'relative', overflow:'hidden', boxShadow:'0 8px 32px rgba(245,162,40,0.32)' }}>
          {/* decorative circles */}
          <div style={{ position:'absolute', top:-30, right:-30, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.09)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:10, right:24, width:72, height:72, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }}/>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.72)', marginBottom:6 }}>
            Jours d&apos;affilée
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:10 }}>
            <span style={{ fontSize:48, fontWeight:900, color:'#fff', lineHeight:1, letterSpacing:'-.04em' }}>{streak}</span>
            <span style={{ fontSize:18, color:'rgba(255,255,255,0.85)', fontWeight:600 }}>jours</span>
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.68)', fontWeight:500 }}>
            {streak === 0 ? 'Lance-toi aujourd\'hui !' : streak >= 7 ? `Incroyable, ${user?.firstName} !` : `Continue comme ça, ${user?.firstName} !`}
          </div>
        </motion.div>

        {/* ── STATS ROW ── */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.08}}
          style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          {/* Séances */}
          <div style={{ padding:'18px 18px', borderRadius:20, background:'var(--s1)', border:'1px solid var(--bd)', boxShadow:'var(--shadow)' }}>
            <div style={{ fontSize:12, color:'var(--t2)', marginBottom:4, fontWeight:500 }}>Séances totales</div>
            <div style={{ fontSize:32, fontWeight:900, color:'var(--t1)', lineHeight:1, letterSpacing:'-.02em' }}>{logs.length}</div>
          </div>
          {/* Poids */}
          <div style={{ padding:'18px 18px', borderRadius:20, background:'var(--s1)', border:'1px solid var(--bd)', boxShadow:'var(--shadow)' }}>
            <div style={{ fontSize:12, color:'var(--t2)', marginBottom:4, fontWeight:500 }}>Poids actuel</div>
            <div style={{ fontSize:32, fontWeight:900, color:'var(--t1)', lineHeight:1, letterSpacing:'-.02em' }}>
              {currentW ? `${currentW}` : '—'}
              {currentW > 0 && <span style={{ fontSize:16, fontWeight:600, color:'var(--t2)' }}> kg</span>}
            </div>
          </div>
        </motion.div>

        {/* ── SESSION + MUSCLE MAP SIDE BY SIDE ── */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.1}}
          style={{ marginBottom:14 }}>
          <div className="section-title">Prochaine séance</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 118px', gap:10, alignItems:'stretch' }}>

            {/* Session card */}
            {todayDay ? (
              <button onClick={()=>router.push('/dashboard')}
                style={{ padding:'18px 20px', borderRadius:22, background:todayDay.rest?'var(--s1)':'var(--orange)', border:todayDay.rest?'1px solid var(--bd)':'none', cursor:'pointer', textAlign:'left', boxShadow:todayDay.rest?'var(--shadow)':'0 8px 28px rgba(245,162,40,0.28)', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                {!todayDay.rest && <div style={{ position:'absolute', top:-18, right:-18, width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,0.09)', pointerEvents:'none' }}/>}
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color: todayDay.rest ? 'var(--t2)' : 'rgba(255,255,255,0.72)', marginBottom:5 }}>
                  {todayDay.label}
                </div>
                <div style={{ fontSize:18, fontWeight:800, color: todayDay.rest ? 'var(--t1)' : '#fff', marginBottom:3, letterSpacing:'-.01em', lineHeight:1.1 }}>
                  {todayDay.name}
                </div>
                <div style={{ fontSize:12, color: todayDay.rest ? 'var(--t2)' : 'rgba(255,255,255,0.68)', fontWeight:500 }}>
                  {todayDay.subtitle}
                </div>
                {!todayDay.rest && (
                  <div style={{ marginTop:12, display:'inline-flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:99, background:'rgba(255,255,255,0.22)', color:'#fff', fontSize:12, fontWeight:700, alignSelf:'flex-start' }}>
                    <Play size={11} fill="#fff"/> Démarrer
                  </div>
                )}
              </button>
            ) : (
              <div style={{ padding:20, borderRadius:22, background:'var(--s1)', border:'1px solid var(--bd)', textAlign:'center', color:'var(--t2)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                Aucune séance configurée
              </div>
            )}

            {/* Muscle map — right column (no toggle in compact view) */}
            <div style={{ padding:'10px 8px', borderRadius:22, background:'var(--s1)', border:'1px solid var(--bd)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:'var(--shadow)' }}>
              <MuscleMap tag={muscleTag} size={82} showLabel={false}/>
            </div>
          </div>
        </motion.div>

        {/* ── WEEK STRIP ── */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.13}}
          style={{ padding:'16px', borderRadius:22, background:'var(--s1)', border:'1px solid var(--bd)', marginBottom:14, boxShadow:'var(--shadow)' }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            {days.map((date, i) => {
              const isCurrentDay = isToday(date);
              const hasLog = logs.some(l => l.date === formatDate(date));
              return (
                <button key={i} onClick={()=>router.push('/dashboard')}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                    background: isCurrentDay ? 'var(--orange)' : 'none',
                    border:'none', borderRadius:100, padding:'8px 6px', cursor:'pointer',
                    minWidth:38, transition:'background .15s' }}>
                  <span style={{ fontSize:11, fontWeight:500, color: isCurrentDay ? 'rgba(255,255,255,0.8)' : 'var(--t2)' }}>{DAY_SHORT[i]}</span>
                  <span style={{ fontSize:17, fontWeight:800, color: isCurrentDay ? '#fff' : 'var(--t1)' }}>{date.getDate()}</span>
                  <div style={{ width:5, height:5, borderRadius:'50%', background: hasLog ? (isCurrentDay ? 'rgba(255,255,255,.8)' : 'var(--orange)') : 'transparent' }}/>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── QUICK ACTIONS — unified premium list ── */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.16}}>
          <div className="section-title">Accès rapide</div>
          <div style={{ borderRadius:22, background:'var(--s1)', border:'1px solid var(--bd)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            {([
              { label:'Coach IA',     sub:'Programme · Conseils · Questions',                                                       icon:<Bot size={18}/>,          color:'var(--ac)',   bg:'var(--ac2)',             href:'/coach' },
              { label:'Statistiques', sub:`${logs.length} séance${logs.length>1?'s':''} · Streak ${streak}j`,                       icon:<TrendingUp size={18}/>,   color:'var(--pull)', bg:'rgba(59,130,246,0.1)', href:'/stats' },
              { label:'Nutrition',    sub:loggedCal > 0 ? `${loggedCal} kcal aujourd\'hui` : 'Journal alimentaire IA',               icon:<Utensils size={18}/>,    color:'var(--legs)', bg:'rgba(34,197,94,0.1)',  href:'/nutrition' },
              { label:'Mon Bilan',    sub:'Objectif · Programme · Nutrition · Roadmap',                                              icon:<ClipboardList size={18}/>, color:'var(--orange)', bg:'var(--orange2)',    href:'/bilan' },
            ] as const).map(({ label, sub, icon, color, bg, href }, i) => (
              <motion.button key={label} whileTap={{scale:.98}} onClick={()=>router.push(href)}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', background:'none', border:'none',
                  borderBottom: i < 3 ? '1px solid var(--bd)' : 'none',
                  cursor:'pointer', width:'100%', textAlign:'left' }}>
                <div style={{ width:42,height:42,borderRadius:13,background:bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color }}>
                  {icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--t1)' }}>{label}</div>
                  <div style={{ fontSize:12, color:'var(--t2)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sub}</div>
                </div>
                <ChevronRight size={14} color="var(--t3)" style={{ flexShrink:0 }}/>
              </motion.button>
            ))}
          </div>
        </motion.div>

      </div>
    </AppShell>
  );
}
