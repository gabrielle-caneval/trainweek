'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Scale, Plus, Flame, Zap, TrendingUp, Award } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useUser } from '@/hooks/useUser';
import { useWorkout } from '@/hooks/useWorkout';
import { getStreakFromLogs, formatDate, calculateBMI, getBMICategory } from '@/lib/utils';

const DAYS = ['L','M','M','J','V','S','D'];

export default function StatsPage() {
  const { user }                              = useUser();
  const { logs, weights, addWeight, prs }     = useWorkout();
  const [newWeight, setNewWeight]             = useState('');
  const [weightOpen, setWeightOpen]           = useState(false);
  const streak = getStreakFromLogs(logs);

  const weekLogs = logs.filter(l => {
    const d = new Date(l.date), now = new Date(), s = new Date(now);
    s.setDate(now.getDate() - 6); return d >= s;
  });

  const currentWeight = weights[0]?.weight ?? user?.weight ?? 0;
  const diff          = +(currentWeight - (user?.weight ?? 0)).toFixed(1);
  const bmi           = user ? calculateBMI(currentWeight || user.weight, user.height) : 0;
  const bmiCat        = bmi > 0 ? getBMICategory(bmi) : null;

  const chartData = [...weights].reverse().slice(-20).map(w => ({
    d: new Date(w.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}),
    v: w.weight,
  }));

  const weekBars = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    const n = logs.filter(l=>l.date===formatDate(d)).length;
    return { day:DAYS[d.getDay()===0?6:d.getDay()-1], n };
  });

  const statItems = [
    { label:'Séances totales', value:logs.length,        color:'var(--ac)',  bg:'rgba(206,245,51,0.08)',   Icon:Zap },
    { label:'Streak actuel',   value:`${streak}j`,       color:'var(--push)',bg:'rgba(255,98,64,0.08)',    Icon:Flame },
    { label:'Cette semaine',   value:weekLogs.length,    color:'var(--pull)',bg:'rgba(61,155,255,0.08)',   Icon:TrendingUp },
    { label:'Poids actuel',    value:`${currentWeight}kg`,color:'var(--legs)',bg:'rgba(46,209,88,0.08)',   Icon:Scale },
  ];

  return (
    <AppShell>
      {/* Full page scroll container */}
      <div className="page-scroll">

        {/* HEADER */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:28, fontWeight:900, color:'var(--t1)', lineHeight:1, letterSpacing:'-.03em' }}>Statistiques</div>
            <div style={{ fontSize:14, color:'var(--t3)', marginTop:5, fontWeight:500 }}>Ta progression</div>
          </div>
          <div style={{ width:46, height:46, borderRadius:14, background:'var(--ac2)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'var(--shadow)' }}>
            <TrendingUp size={21} color="var(--ac)"/>
          </div>
        </div>

        {/* STAT GRID */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
          {statItems.map(({label,value,color,bg,Icon},i) => (
            <motion.div key={label} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:i*.08, type:'spring', stiffness:260, damping:24}}
              style={{ background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:22, padding:'20px 18px', display:'flex', flexDirection:'column', gap:14, boxShadow:'var(--shadow)' }}>
              <div style={{ width:42, height:42, borderRadius:13, background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={21} color={color}/>
              </div>
              <div>
                <div style={{ fontWeight:900, fontSize:36, color, lineHeight:1, letterSpacing:'-.03em' }}>{value}</div>
                <div style={{ fontSize:11, color:'var(--t3)', marginTop:6, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase' }}>{label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* BMI INDICATOR */}
        {bmi > 0 && bmiCat && (
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.18}}
            style={{ background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:22, padding:'18px 20px', marginBottom:14, boxShadow:'var(--shadow)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--t1)' }}>Indice de masse corporelle</div>
              <div style={{ padding:'4px 12px', borderRadius:99, background:bmiCat.bg, border:`1px solid ${bmiCat.color}30` }}>
                <span style={{ fontSize:12, fontWeight:700, color:bmiCat.color }}>{bmiCat.label}</span>
              </div>
            </div>
            {/* IMC bar */}
            <div style={{ position:'relative', height:10, borderRadius:99, background:'linear-gradient(to right, #60A5FA 0%, #22C55E 30%, #F97316 65%, #EF4444 100%)', marginBottom:8 }}>
              {/* Cursor */}
              <div style={{
                position:'absolute', top:'50%', transform:`translateX(-50%) translateY(-50%)`,
                left:`${Math.min(Math.max((bmi - 14) / (42 - 14) * 100, 2), 98)}%`,
                width:18, height:18, borderRadius:'50%', background:'#fff',
                border:`3px solid ${bmiCat.color}`, boxShadow:'0 2px 8px rgba(0,0,0,0.2)',
                transition:'left .6s ease',
              }}/>
            </div>
            {/* Scale labels */}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--t3)', fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase' }}>
              <span>14</span><span>Maigre</span><span>Normal</span><span>Surpoids</span><span>42+</span>
            </div>
            <div style={{ marginTop:12, display:'flex', alignItems:'baseline', gap:6 }}>
              <span style={{ fontSize:36, fontWeight:900, color:bmiCat.color, letterSpacing:'-.03em' }}>{bmi}</span>
              <span style={{ fontSize:14, color:'var(--t2)', fontWeight:500 }}>kg/m²</span>
            </div>
          </motion.div>
        )}

        {/* WEEK BARS */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.22}}
          style={{ background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:20, padding:'20px', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--t1)' }}>Fréquence hebdo</div>
            <div style={{ fontSize:13, fontWeight:800, color:'var(--ac)' }}>{weekLogs.length}<span style={{ color:'var(--t3)', fontWeight:500 }}>/7 jours</span></div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'flex-end', height:80 }}>
            {weekBars.map((b,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <div style={{ width:'100%', flex:1, display:'flex', alignItems:'flex-end' }}>
                  <motion.div initial={{scaleY:0}} animate={{scaleY:1}} transition={{delay:i*.04,duration:.4,ease:'easeOut'}}
                    style={{ width:'100%', borderRadius:'6px 6px 0 0', background: b.n>0?'var(--ac)':'var(--s3)', height: b.n>0?'100%':10, transformOrigin:'bottom' }}/>
                </div>
                <span style={{ fontSize:11, fontWeight:700, color: b.n>0?'var(--t2)':'var(--t3)' }}>{b.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* WEIGHT CHART */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.3}}
          style={{ background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:20, padding:'20px', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--t1)' }}>Évolution du poids</div>
              <div style={{ fontSize:13, fontWeight:700, color: diff>=0?'var(--legs)':'var(--push)', marginTop:4 }}>
                {diff>=0?'+':''}{diff} kg depuis le début
              </div>
            </div>
            <motion.button whileTap={{scale:.88}} onClick={()=>setWeightOpen(v=>!v)}
              style={{ width:36, height:36, borderRadius:11, background:'var(--ac2)', border:'1px solid rgba(206,245,51,0.25)', color:'var(--ac)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <Plus size={17}/>
            </motion.button>
          </div>

          <AnimatePresence>
            {weightOpen && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} style={{overflow:'hidden',marginBottom:14}}>
                <div style={{display:'flex',gap:10}}>
                  <input value={newWeight} onChange={e=>setNewWeight(e.target.value)} className="fi" type="number" placeholder="Ton poids (kg)" inputMode="decimal"
                    onKeyDown={e=>{if(e.key==='Enter'&&+newWeight>0){addWeight(+newWeight);setNewWeight('');setWeightOpen(false);}}} style={{flex:1,fontSize:15}}/>
                  <button onClick={()=>{if(+newWeight>0){addWeight(+newWeight);setNewWeight('');setWeightOpen(false);}}}
                    style={{padding:'0 20px',borderRadius:14,background:'var(--ac)',border:'none',color:'#0c0c14',fontWeight:800,fontSize:14,cursor:'pointer'}}>
                    OK
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData} margin={{top:5,right:0,left:-28,bottom:0}}>
                <defs>
                  <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#cef533" stopOpacity={.25}/>
                    <stop offset="95%" stopColor="#cef533" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tick={{fill:'var(--t3)',fontSize:10}} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                <YAxis tick={{fill:'var(--t3)',fontSize:10}} tickLine={false} axisLine={false} domain={['auto','auto']}/>
                <Tooltip contentStyle={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:14,color:'var(--t1)',fontSize:13,boxShadow:'var(--shadow2)'}}
                  labelStyle={{color:'var(--t3)',fontSize:11}} formatter={(v)=>[`${v} kg`,'Poids']}/>
                <Area type="monotone" dataKey="v" stroke="#cef533" strokeWidth={2.5} fill="url(#wg)" dot={false} activeDot={{r:5,fill:'#cef533'}}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{height:90,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8}}>
              <Scale size={26} color="var(--t3)"/>
              <div style={{fontSize:13,color:'var(--t3)'}}>Ajoute ton premier poids pour voir la courbe</div>
            </div>
          )}
        </motion.div>

        {/* WEIGHT HISTORY LIST */}
        {weights.length > 0 && (
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.35}}
            style={{ background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:20, padding:'20px', marginBottom:14 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--t1)', marginBottom:14 }}>Historique des pesées</div>
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {weights.slice(0, 12).map((w, i) => {
                const prev = weights[i + 1];
                const delta = prev ? +(w.weight - prev.weight).toFixed(1) : null;
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 0', borderBottom: i < Math.min(weights.length, 12) - 1 ? '1px solid var(--bd)' : 'none' }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, color:'var(--t1)' }}>{new Date(w.date).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      {delta !== null && (
                        <div style={{ fontSize:12, fontWeight:700, color: delta > 0 ? 'var(--legs)' : delta < 0 ? 'var(--push)' : 'var(--t3)', background: delta > 0 ? 'rgba(34,197,94,0.08)' : delta < 0 ? 'rgba(249,115,22,0.08)' : 'var(--s2)', padding:'2px 8px', borderRadius:99 }}>
                          {delta > 0 ? '+' : ''}{delta} kg
                        </div>
                      )}
                      <div style={{ fontSize:16, fontWeight:800, color:'var(--ac)' }}>{w.weight} kg</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* HISTORY */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.37}}
          style={{ background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:20, padding:'20px', marginBottom:14 }}>
          <div style={{fontSize:15,fontWeight:700,color:'var(--t1)',marginBottom:16}}>Historique des séances</div>
          {logs.length===0 ? (
            <div style={{textAlign:'center',padding:'20px 0'}}>
              <Zap size={26} color="var(--t3)" style={{margin:'0 auto 8px'}}/>
              <div style={{fontSize:13,color:'var(--t3)'}}>Pas encore de séance enregistrée</div>
            </div>
          ) : logs.slice(0,15).map((l,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 0',borderBottom:i<logs.length-1?'1px solid var(--bd)':'none'}}>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:'var(--t1)'}}>{l.dayName}</div>
                <div style={{fontSize:12,color:'var(--t3)',marginTop:2}}>{new Date(l.date).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:15,fontWeight:800,color:'var(--ac)'}}>{l.exercisesDone}/{l.totalExercises}</div>
                <div style={{fontSize:11,color:'var(--t3)',marginTop:1}}>exercices</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* PRs */}
        {prs.length>0 && (
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.44}}
            style={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:20,padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
              <Award size={18} color="var(--ac)"/>
              <div style={{fontSize:15,fontWeight:700,color:'var(--t1)'}}>Records personnels</div>
            </div>
            {prs.map((p,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--bd)'}}>
                <div style={{fontSize:14,color:'var(--t2)',fontWeight:500}}>{p.exercise}</div>
                <div style={{fontSize:14,fontWeight:800,color:'var(--ac)'}}>{p.weight}kg × {p.reps}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
