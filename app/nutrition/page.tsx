'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { useUser } from '@/hooks/useUser';
import { useWorkout } from '@/hooks/useWorkout';
import { useLocalStorage } from '@/hooks/useStorage';
import { calculateBMR, calculateTDEE, getMassGainCalories, formatDate } from '@/lib/utils';
import { Droplets, ChevronRight, Plus, Camera, Send, Trash2, Bot, Info, Settings, History, ChevronDown, Lightbulb } from 'lucide-react';
import VoiceInput from '@/components/ui/VoiceInput';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useRouter } from 'next/navigation';

interface FoodLog { id:string; text:string; date:string; macros?:{p:number;c:number;f:number;k:number}; analysis?:string; }

const MEAL_IDEAS: Record<string,{time:string;foods:string[];p:number;c:number;f:number;k:number}[]> = {
  'Prise de masse': [
    { time:'7h',  foods:['4 œufs brouillés','2 tranches pain complet','1 banane'],             p:35,c:60,f:18,k:540 },
    { time:'12h', foods:['200g poulet grillé','200g riz cuit','Légumes vapeur'],                p:52,c:68,f:10,k:570 },
    { time:'16h', foods:['1 banane','30g flocons d\'avoine','1 scoop whey'],                    p:24,c:50,f:4, k:330 },
    { time:'20h', foods:['200g saumon','200g patate douce','Salade verte'],                     p:48,c:50,f:18,k:560 },
  ],
  'Force + masse': [
    { time:'7h',  foods:['3 œufs','150g flocons d\'avoine','30g beurre de cacahuète'],          p:32,c:70,f:20,k:590 },
    { time:'12h', foods:['250g bœuf haché','200g pâtes cuites','Sauce tomate'],                 p:55,c:72,f:18,k:670 },
    { time:'16h', foods:['1 scoop whey','1 banane','30g amandes'],                              p:28,c:40,f:14,k:398 },
    { time:'20h', foods:['200g thon','200g riz complet','1 avocat'],                            p:46,c:52,f:22,k:580 },
  ],
  'Sèche': [
    { time:'7h',  foods:['4 blancs d\'œuf','150g fromage blanc 0%','Fruits rouges'],            p:38,c:20,f:2, k:250 },
    { time:'12h', foods:['200g blanc de poulet','200g légumes verts','50g riz'],                p:50,c:25,f:5, k:345 },
    { time:'16h', foods:['1 scoop whey','1 pomme'],                                             p:25,c:20,f:2, k:198 },
    { time:'20h', foods:['200g thon','Salade composée','1 œuf dur'],                            p:45,c:8, f:8, k:284 },
  ],
  'Recomposition': [
    { time:'7h',  foods:['3 œufs entiers','1 blanc d\'œuf','Épinards sautés','1 tranche pain'], p:30,c:28,f:16,k:375 },
    { time:'12h', foods:['200g dinde','150g quinoa cuit','Légumes rôtis'],                      p:48,c:40,f:8, k:420 },
    { time:'16h', foods:['100g fromage blanc','15g noix','1 kiwi'],                             p:14,c:18,f:8, k:200 },
    { time:'20h', foods:['200g saumon','200g courgettes','1 c.à.s. huile olive'],               p:42,c:10,f:20,k:390 },
  ],
  'Remise en forme': [
    { time:'7h',  foods:['2 œufs','1 tranche pain complet','1 orange'],                         p:18,c:30,f:10,k:284 },
    { time:'12h', foods:['150g poulet','Salade verte','1 tranche pain'],                        p:35,c:25,f:8, k:310 },
    { time:'16h', foods:['1 yaourt nature','1 pomme','10g amandes'],                            p:9, c:22,f:5, k:170 },
    { time:'20h', foods:['150g poisson blanc','200g légumes vapeur','1 patate douce'],          p:32,c:30,f:4, k:285 },
  ],
};

const GOAL_TIPS: Record<string, string[]> = {
  'Prise de masse':   ['Surplus calorique de 200-400 kcal/j','2g de protéines par kg de poids','Ne pas sauter le repas post-séance','Favoriser les glucides complexes autour de l\'entraînement'],
  'Force + masse':    ['Surplus modéré 300-500 kcal/j','2.2g protéines/kg minimum','Glucides ++ le jour des séances lourdes','Créatine : 5g/j peut augmenter la force de 5-10%'],
  'Sèche':            ['Déficit calorique de 300-500 kcal/j','Maintien des protéines à 2.2g/kg pour préserver le muscle','Glucides bas le soir et les jours off','Cardio modéré en complément'],
  'Recomposition':    ['Calories proches de la maintenance','Protéines élevées : 2-2.4g/kg','Glucides autour des séances, lipides les jours off','Patience — c\'est le processus le plus lent'],
  'Remise en forme':  ['Équilibre alimentaire avant tout','Évite les aliments ultra-transformés','Hydratation : 2L minimum par jour','Manger lentement et écouter ta satiété'],
};

async function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function NutritionPage() {
  const { user }                  = useUser();
  const { weights }               = useWorkout();
  const router                    = useRouter();
  const [groqKey]                 = useLocalStorage('tw_groq_key', '');
  const [foodLogs, setFoodLogs]   = useLocalStorage<FoodLog[]>('tw_food_logs', []);
  const [foodInput, setFoodInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showLogger, setShowLogger] = useState(false);
  const [showIdeas, setShowIdeas]   = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const imgRef                    = useRef<HTMLInputElement>(null);

  const w      = weights[0]?.weight ?? user?.weight ?? 0;
  const h      = user?.height ?? 175;
  const age    = user?.age ?? 24;
  const gender = user?.gender ?? 'H';
  const goal   = user?.goal ?? 'Prise de masse';

  const bmr    = w > 0 ? calculateBMR(w, h, age, gender) : 0;
  const tdee   = bmr > 0 ? calculateTDEE(bmr) : 0;
  const isCut  = goal.toLowerCase().includes('sèche');
  const target = tdee > 0 ? (isCut ? tdee - 400 : getMassGainCalories(tdee)) : 0;

  const proteins = w > 0 ? Math.round(w * 2.1) : 0;
  const fat      = w > 0 ? Math.round(w * 1.0) : 0;
  const carbs    = target > 0 ? Math.max(50, Math.round((target - proteins*4 - fat*9) / 4)) : 0;
  const water    = w > 0 ? Math.round(w * 35 / 100) / 10 : 0;

  const today     = formatDate(new Date());
  const todayLogs = foodLogs.filter(l => l.date === today);
  const loggedCal = todayLogs.reduce((a, l) => a + (l.macros?.k ?? 0), 0);
  const loggedP   = todayLogs.reduce((a, l) => a + (l.macros?.p ?? 0), 0);
  const loggedC   = todayLogs.reduce((a, l) => a + (l.macros?.c ?? 0), 0);
  const loggedF   = todayLogs.reduce((a, l) => a + (l.macros?.f ?? 0), 0);
  const pctRing   = target > 0 ? Math.min(loggedCal / target * 100, 100) : 0;

  // Group historical logs by date (past 7 days, excluding today)
  const historyDates = Array.from(new Set(
    foodLogs.filter(l => l.date !== today).map(l => l.date)
  )).sort((a, b) => b.localeCompare(a)).slice(0, 7);

  const analyzeFood = async (desc: string, imageBase64?: string) => {
    if (!desc.trim() && !imageBase64) return;
    setAnalyzing(true);
    const entry: FoodLog = { id: Date.now().toString(), text: imageBase64 ? `[Photo] ${desc}` : desc.trim(), date: today };
    try {
      if (groqKey) {
        const messages = imageBase64
          ? [{ role:'user', content:[
              { type:'image_url', image_url:{ url: imageBase64 } },
              { type:'text', text:`Analyse nutritionnelle de ce repas. Réponds UNIQUEMENT en JSON sans markdown: {"k":calories_kcal,"p":proteines_g,"c":glucides_g,"f":lipides_g,"comment":"description courte du plat et commentaire nutritionnel 1 phrase"}` },
            ]}]
          : [{ role:'user', content:`Analyse: ${desc}` }];

        const model = imageBase64 ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
        const systemMsg = imageBase64 ? undefined : { role:'system', content:'Nutritionniste expert. Analyse le repas et réponds UNIQUEMENT en JSON sans markdown: {"k":calories_kcal,"p":proteines_g,"c":glucides_g,"f":lipides_g,"comment":"commentaire court 1 phrase"}. Sois précis.' };

        const body: Record<string, unknown> = {
          model,
          messages: systemMsg ? [systemMsg, ...messages] : messages,
          max_tokens: 300,
          temperature: .2,
        };

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method:'POST',
          headers:{ Authorization:`Bearer ${groqKey}`, 'Content-Type':'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        const m = data.choices?.[0]?.message?.content?.match(/\{[\s\S]*\}/);
        if (m) {
          const p = JSON.parse(m[0]);
          entry.macros   = { k:p.k, p:p.p, c:p.c, f:p.f };
          entry.analysis = p.comment;
          if (imageBase64 && desc) entry.text = desc;
        }
      } else {
        entry.analysis = 'Ajoute ta clé Groq dans Paramètres pour l\'analyse IA.';
      }
    } catch { entry.analysis = 'Analyse indisponible.'; }
    setFoodLogs(prev => [entry, ...prev]);
    setFoodInput('');
    setAnalyzing(false);
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const base64 = await toBase64(file);
      await analyzeFood(file.name.replace(/\.[^.]+$/, '') || 'Mon repas', base64);
    } catch { /* ignore */ }
  };

  const mealPlan = MEAL_IDEAS[goal] ?? MEAL_IDEAS['Prise de masse'];
  const tips     = GOAL_TIPS[goal] ?? GOAL_TIPS['Remise en forme'];

  const R = 58, C = 2 * Math.PI * R;
  const card = { background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:20, boxShadow:'var(--shadow)' };

  if (!user) return (
    <AppShell>
      <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', color:'var(--t2)', fontSize:15, fontWeight:600 }}>Connecte-toi d&apos;abord</div>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="page-scroll">

        {/* HEADER */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <div>
            <div style={{ fontSize:24, fontWeight:800, letterSpacing:'-.02em', color:'var(--t1)' }}>Nutrition</div>
            <div style={{ fontSize:13, color:'var(--t2)', marginTop:2 }}>{goal}</div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <ThemeToggle/>
            <button onClick={()=>router.push('/settings')} style={{ width:40,height:40,borderRadius:12,background:'var(--s2)',border:'1px solid var(--bd)',color:'var(--t2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
              <Settings size={16}/>
            </button>
          </div>
        </div>

        {/* CALORIE RING */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
          style={{ ...card, padding:'20px 20px', marginBottom:14, display:'flex', alignItems:'center', gap:20 }}>
          {/* Ring — explicit 140×140 block container prevents drift */}
          <div style={{ width:140, height:140, position:'relative', flexShrink:0 }}>
            <svg width={140} height={140} viewBox="0 0 140 140" style={{ display:'block', transform:'rotate(-90deg)' }}>
              <circle cx={70} cy={70} r={R} fill="none" stroke="var(--s3)" strokeWidth={10}/>
              <circle cx={70} cy={70} r={R} fill="none" stroke="var(--ac)" strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={`${C * pctRing / 100} ${C}`}
                style={{ transition:'stroke-dasharray .8s ease' }}/>
            </svg>
            <div style={{ position:'absolute', top:0, left:0, width:140, height:140, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontSize:26, fontWeight:900, color:'var(--t1)', lineHeight:1 }}>{loggedCal}</div>
              <div style={{ fontSize:10, color:'var(--t3)', fontWeight:700, textTransform:'uppercase', marginTop:2 }}>kcal</div>
              <div style={{ width:24, height:1, background:'var(--bd)', margin:'5px 0' }}/>
              <div style={{ fontSize:16, fontWeight:700, color:'var(--ac)' }}>{target > 0 ? target : '—'}</div>
              <div style={{ fontSize:9, color:'var(--t3)', fontWeight:700 }}>objectif</div>
            </div>
          </div>

          <div style={{ flex:1 }}>
            {target > 0 ? (
              <>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--t2)', marginBottom:10 }}>
                  {target - loggedCal > 0 ? `Reste ${target - loggedCal} kcal` : 'Objectif atteint !'}
                </div>
                {[
                  { label:'Protéines', logged:loggedP, target:proteins, color:'#F97316' },
                  { label:'Glucides',  logged:loggedC, target:carbs,    color:'#3B82F6' },
                  { label:'Lipides',   logged:loggedF, target:fat,      color:'#EAB308' },
                ].map(m => (
                  <div key={m.label} style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:'var(--t2)' }}>{m.label}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:m.color }}>{m.logged}/{m.target}g</span>
                    </div>
                    <div style={{ height:4, borderRadius:99, background:'var(--s3)', overflow:'hidden' }}>
                      <motion.div initial={{width:0}} animate={{width:`${Math.min(m.logged/m.target*100,100)}%`}}
                        transition={{duration:.7, ease:'easeOut', delay:.1}}
                        style={{ height:'100%', borderRadius:99, background:m.color }}/>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ fontSize:13, color:'var(--t3)', lineHeight:1.6 }}>
                Complète ton profil (poids, taille) dans les Paramètres pour voir tes objectifs caloriques.
              </div>
            )}
          </div>
        </motion.div>

        {/* MACRO GRID */}
        {target > 0 && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.08}}
            style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
            {[
              { label:'Protéines', g:proteins, color:'#F97316', bg:'rgba(249,115,22,0.08)' },
              { label:'Glucides',  g:carbs,    color:'#3B82F6', bg:'rgba(59,130,246,0.08)' },
              { label:'Lipides',   g:fat,      color:'#EAB308', bg:'rgba(234,179,8,0.08)'  },
            ].map(m => (
              <div key={m.label} style={{ padding:'14px 10px', borderRadius:16, background:m.bg, border:`1px solid ${m.color}20`, textAlign:'center' }}>
                <div style={{ fontWeight:900, fontSize:22, color:m.color, lineHeight:1 }}>{m.g}<span style={{fontSize:12,fontWeight:600}}>g</span></div>
                <div style={{ fontSize:10, color:'var(--t3)', marginTop:4, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>{m.label}</div>
                <div style={{ fontSize:10, color:m.color, fontWeight:600, marginTop:1 }}>objectif</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* WATER */}
        {water > 0 && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.12}}
            style={{ ...card, display:'flex', alignItems:'center', gap:14, padding:'16px 18px', marginBottom:14 }}>
            <div style={{ width:46,height:46,borderRadius:14,background:'rgba(59,130,246,0.10)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,lineHeight:0 }}>
              <Droplets size={22} color="#3B82F6"/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:22, color:'#3B82F6', lineHeight:1 }}>{water} L</div>
              <div style={{ fontSize:12, color:'var(--t2)', marginTop:2 }}>Objectif hydratation journalier</div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontWeight:800, fontSize:20, color:'#3B82F6', lineHeight:1 }}>{Math.round(water * 4)}</div>
              <div style={{ fontSize:11, color:'var(--t2)', fontWeight:600, marginTop:2 }}>verres</div>
            </div>
          </motion.div>
        )}

        {/* FOOD LOGGER */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.16}}
          style={{ ...card, overflow:'hidden', marginBottom:14 }}>
          <button onClick={()=>setShowLogger(v=>!v)}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', background:'none', border:'none', cursor:'pointer' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36,height:36,borderRadius:11,background:'var(--ac2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <Bot size={17} color="var(--ac)"/>
              </div>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--t1)' }}>Journal alimentaire IA</div>
                <div style={{ fontSize:12, color:'var(--t3)', marginTop:1 }}>
                  {todayLogs.length > 0 ? `${todayLogs.length} repas — ${loggedCal} kcal aujourd'hui` : 'Enregistre ce que tu manges'}
                </div>
              </div>
            </div>
            <motion.div animate={{rotate:showLogger?90:0}} transition={{duration:.2}}>
              <ChevronRight size={16} color="var(--t3)"/>
            </motion.div>
          </button>

          <AnimatePresence>
            {showLogger && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} style={{overflow:'hidden'}}>
                <div style={{ padding:'0 18px 16px', display:'flex', flexDirection:'column', gap:10 }}>
                  <textarea value={foodInput} onChange={e=>setFoodInput(e.target.value)} rows={2}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:14, background:'var(--s2)', border:'1.5px solid var(--bd)', color:'var(--t1)', fontSize:14, fontFamily:'Inter,sans-serif', resize:'none', outline:'none' }}
                    placeholder="Ex : 200g poulet, 150g riz, brocolis vapeur..."/>
                  <div style={{ display:'flex', gap:8 }}>
                    <VoiceInput onResult={t=>setFoodInput(p=>p?p+' '+t:t)}/>
                    <button onClick={()=>imgRef.current?.click()}
                      style={{ height:44,paddingInline:14,borderRadius:13,background:'var(--s2)',border:'1.5px solid var(--bd)',color:'var(--t2)',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6 }}>
                      <Camera size={14}/>Photo
                    </button>
                    <input ref={imgRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handleImageCapture}/>
                    <button onClick={()=>analyzeFood(foodInput)} disabled={!foodInput.trim()||analyzing}
                      style={{ flex:1,height:44,borderRadius:13,background:foodInput.trim()?'var(--ac)':'var(--s2)',border:'none',color:foodInput.trim()?'#07070d':'var(--t3)',fontWeight:700,fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,opacity:analyzing?.7:1,transition:'all .2s' }}>
                      {analyzing ? <div style={{width:16,height:16,borderRadius:'50%',border:'2px solid rgba(7,7,13,.3)',borderTopColor:'#07070d'}} className="spin"/> : <><Send size={14}/>Analyser</>}
                    </button>
                  </div>

                  {todayLogs.length > 0 && (
                    <div>
                      <div style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--t3)',marginBottom:8 }}>Aujourd&apos;hui</div>
                      {todayLogs.map(log=>(
                        <div key={log.id} style={{ padding:'12px 13px',borderRadius:14,background:'var(--s2)',border:'1px solid var(--bd)',marginBottom:8 }}>
                          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:log.macros?6:0 }}>
                            <div style={{ fontSize:13,fontWeight:600,color:'var(--t1)',flex:1,marginRight:8,lineHeight:1.4 }}>{log.text}</div>
                            <button onClick={()=>setFoodLogs(p=>p.filter(l=>l.id!==log.id))} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--t3)',padding:2,flexShrink:0 }}>
                              <Trash2 size={13}/>
                            </button>
                          </div>
                          {log.macros && (
                            <div style={{ display:'flex',gap:10,marginBottom:log.analysis?5:0 }}>
                              <span style={{ fontSize:12,fontWeight:700,color:'#F97316' }}>P {log.macros.p}g</span>
                              <span style={{ fontSize:12,fontWeight:700,color:'#3B82F6' }}>G {log.macros.c}g</span>
                              <span style={{ fontSize:12,fontWeight:700,color:'#EAB308' }}>L {log.macros.f}g</span>
                              <span style={{ fontSize:12,fontWeight:700,color:'var(--ac)' }}>{log.macros.k} kcal</span>
                            </div>
                          )}
                          {log.analysis && <div style={{ fontSize:12,color:'var(--t3)',lineHeight:1.5 }}>{log.analysis}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* FOOD HISTORY */}
        {historyDates.length > 0 && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.18}}
            style={{ ...card, overflow:'hidden', marginBottom:14 }}>
            <button onClick={()=>setShowHistory(v=>!v)}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', background:'none', border:'none', cursor:'pointer' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36,height:36,borderRadius:11,background:'rgba(59,130,246,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <History size={17} color="#3B82F6"/>
                </div>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--t1)' }}>Historique alimentaire</div>
                  <div style={{ fontSize:12, color:'var(--t3)', marginTop:1 }}>{historyDates.length} jours enregistrés</div>
                </div>
              </div>
              <motion.div animate={{rotate:showHistory?180:0}} transition={{duration:.2}}>
                <ChevronDown size={16} color="var(--t3)"/>
              </motion.div>
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} style={{overflow:'hidden'}}>
                  <div style={{ padding:'0 18px 16px' }}>
                    {historyDates.map(date => {
                      const dayLogs  = foodLogs.filter(l => l.date === date);
                      const dayKcal  = dayLogs.reduce((a,l)=>a+(l.macros?.k??0),0);
                      const dayLabel = new Date(date).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'short'});
                      return (
                        <div key={date} style={{ marginBottom:12 }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                            <div style={{ fontSize:13, fontWeight:700, color:'var(--t2)', textTransform:'capitalize' }}>{dayLabel}</div>
                            {dayKcal > 0 && <div style={{ fontSize:13, fontWeight:800, color:'var(--ac)' }}>{dayKcal} kcal</div>}
                          </div>
                          {dayLogs.map(log=>(
                            <div key={log.id} style={{ padding:'10px 12px', borderRadius:12, background:'var(--s2)', border:'1px solid var(--bd)', marginBottom:6 }}>
                              <div style={{ fontSize:13, fontWeight:600, color:'var(--t1)', marginBottom: log.macros ? 4 : 0 }}>{log.text}</div>
                              {log.macros && (
                                <div style={{ display:'flex', gap:8 }}>
                                  <span style={{ fontSize:11,fontWeight:700,color:'#F97316' }}>P {log.macros.p}g</span>
                                  <span style={{ fontSize:11,fontWeight:700,color:'#3B82F6' }}>G {log.macros.c}g</span>
                                  <span style={{ fontSize:11,fontWeight:700,color:'#EAB308' }}>L {log.macros.f}g</span>
                                  <span style={{ fontSize:11,fontWeight:700,color:'var(--ac)' }}>{log.macros.k} kcal</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* MEAL IDEAS */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.2}}
          style={{ ...card, overflow:'hidden', marginBottom:14 }}>
          <button onClick={()=>setShowIdeas(v=>!v)}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', background:'none', border:'none', cursor:'pointer' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36,height:36,borderRadius:11,background:'rgba(34,197,94,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <Plus size={17} color="var(--legs)"/>
              </div>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:14,fontWeight:700,color:'var(--t1)' }}>Plan alimentaire type</div>
                <div style={{ fontSize:12,color:'var(--t3)',marginTop:1 }}>Adapté : {goal}</div>
              </div>
            </div>
            <motion.div animate={{rotate:showIdeas?90:0}} transition={{duration:.2}}>
              <ChevronRight size={16} color="var(--t3)"/>
            </motion.div>
          </button>
          <AnimatePresence>
            {showIdeas && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} style={{overflow:'hidden'}}>
                <div style={{ padding:'0 18px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                  {mealPlan.map((meal,i)=>(
                    <div key={i} style={{ padding:'13px 14px',borderRadius:14,background:'var(--s2)',border:'1px solid var(--bd)' }}>
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
                        <div style={{ fontWeight:700,fontSize:14,color:'var(--t1)' }}>{meal.time}</div>
                        <div style={{ fontSize:12,fontWeight:700,color:'var(--ac)',background:'var(--ac2)',padding:'2px 10px',borderRadius:99 }}>{meal.k} kcal</div>
                      </div>
                      {meal.foods.map(f=>(
                        <div key={f} style={{ fontSize:13,color:'var(--t2)',display:'flex',alignItems:'center',gap:6,marginBottom:3 }}>
                          <div style={{ width:4,height:4,borderRadius:'50%',background:'var(--ac)',flexShrink:0 }}/>
                          {f}
                        </div>
                      ))}
                      <div style={{ display:'flex',gap:10,marginTop:8,paddingTop:8,borderTop:'1px solid var(--bd)' }}>
                        <span style={{ fontSize:11,fontWeight:700,color:'#F97316' }}>P:{meal.p}g</span>
                        <span style={{ fontSize:11,fontWeight:700,color:'#3B82F6' }}>G:{meal.c}g</span>
                        <span style={{ fontSize:11,fontWeight:700,color:'#EAB308' }}>L:{meal.f}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* GOAL-BASED TIPS */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.24}}
          style={{ ...card, padding:18, marginBottom:14 }}>
          <div style={{ fontSize:14,fontWeight:700,color:'var(--t1)',marginBottom:14,display:'flex',alignItems:'center',gap:8 }}>
            <Lightbulb size={16} color="var(--ac)"/>
            Recommandations — {goal}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {tips.map((tip, i)=>(
              <div key={i} style={{ display:'flex',gap:12,padding:'12px 13px',borderRadius:14,background:'var(--s2)',border:'1px solid var(--bd)' }}>
                <div style={{ width:4,borderRadius:3,background:'var(--ac)',flexShrink:0 }}/>
                <div style={{ fontSize:13,color:'var(--t2)',lineHeight:1.6 }}>{tip}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* GENERAL TIPS */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.28}}
          style={{ ...card, padding:18 }}>
          <div style={{ fontSize:14,fontWeight:700,color:'var(--t1)',marginBottom:14,display:'flex',alignItems:'center',gap:8 }}>
            <Info size={16} color="var(--t3)"/> Principes clés
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { label:'Protéines',   body:'Vise 2g/kg de poids corporel. Sources : poulet, œufs, fromage blanc, whey.' },
              { label:'Timing',      body:'20-30g de protéines dans les 2h post-séance pour optimiser la récupération musculaire.' },
              { label:'Hydratation', body:'2-3L d\'eau par jour minimum. La déshydratation réduit la force de 10%.' },
            ].map(t=>(
              <div key={t.label} style={{ display:'flex',gap:12,padding:'12px 13px',borderRadius:14,background:'var(--s2)',border:'1px solid var(--bd)' }}>
                <div style={{ width:4,borderRadius:3,background:'var(--t3)',flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:13,fontWeight:700,color:'var(--t1)',marginBottom:3 }}>{t.label}</div>
                  <div style={{ fontSize:13,color:'var(--t2)',lineHeight:1.6 }}>{t.body}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </AppShell>
  );
}
