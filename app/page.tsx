'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, ClipboardList, Dumbbell, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import VoiceInput from '@/components/ui/VoiceInput';
import { useUser } from '@/hooks/useUser';
import { useLocalStorage } from '@/hooks/useStorage';
import { useWorkout } from '@/hooks/useWorkout';
import type { User } from '@/lib/types';

type Step = 'splash' | 'hero' | 'profile' | 'avatar' | 'program' | 'ai-chat' | 'existing-program';

const GOALS      = ['Prise de masse','Force + masse','Sèche','Recomposition','Remise en forme'];
const LEVELS     = ['Débutant','Intermédiaire','Avancé'];
const GENDERS: [string,string][] = [['H','Homme'],['F','Femme'],['A','Autre']];
const EQUIPMENT: { id: User['equipment']; label: string; sub: string }[] = [
  { id:'bodyweight', label:'Poids du corps', sub:'Aucun matériel requis' },
  { id:'home',       label:'Matériel maison', sub:'Haltères, élastiques…' },
  { id:'gym',        label:'Salle de sport',  sub:'Machines, barres, câbles' },
];

const AVATARS = [
  'Felix','Alex','Jordan','Sam','Taylor','Morgan','Riley','Casey','Parker','Quinn',
];

const HERO_IMAGE = 'https://images.unsplash.com/photo-1549476464-37392f717541?w=800&q=80';

export default function OnboardingPage() {
  const { isLoggedIn, hydrated, login } = useUser();
  const { setProgram } = useWorkout();
  const [groqKey, setGroqKey] = useLocalStorage('tw_groq_key', '');
  const router = useRouter();

  const [step, setStep]         = useState<Step>('splash');
  const [splashPct, setSplashPct] = useState(0);

  const [form, setForm] = useState({
    firstName:'', lastName:'', age:'', weight:'', height:'',
    gender:'H', goal:'Prise de masse', level:'Intermédiaire',
    equipment: 'gym' as User['equipment'],
  });
  const [errs, setErrs]     = useState<Record<string,string>>({});
  const [avatar, setAvatar]                   = useState(AVATARS[0]);
  const [aiPrompt, setAiPrompt]               = useState('');
  const [generating, setGenerating]           = useState(false);
  const [aiMsgs, setAiMsgs]                   = useState<{role:'user'|'assistant';text:string}[]>([]);
  const [existingText, setExistingText]       = useState('');
  const [parsingExisting, setParsingExisting] = useState(false);
  const [parseStatus, setParseStatus]         = useState<'idle'|'ok'|'error'>('idle');

  useEffect(() => {
    if (hydrated && isLoggedIn) router.replace('/home');
  }, [hydrated, isLoggedIn, router]);

  // Splash progress
  useEffect(() => {
    let p = 0;
    const t = setInterval(() => {
      p += 5; setSplashPct(Math.min(p, 100));
      if (p >= 100) { clearInterval(t); setTimeout(() => setStep('hero'), 400); }
    }, 30);
    return () => clearInterval(t);
  }, []);

  const validateProfile = () => {
    const e: Record<string,string> = {};
    if (!form.firstName.trim()) e.firstName = 'Requis';
    if (!form.lastName.trim())  e.lastName  = 'Requis';
    if (+form.age < 10)         e.age       = 'Invalide';
    if (+form.weight < 30)      e.weight    = 'Invalide';
    if (+form.height < 100)     e.height    = 'Invalide';
    setErrs(e); return !Object.keys(e).length;
  };

  const doLogin = () => {
    const u: User = {
      firstName:  form.firstName.trim(),
      lastName:   form.lastName.trim(),
      age:        +form.age,
      weight:     +form.weight,
      height:     +form.height,
      gender:     form.gender as User['gender'],
      goal:       form.goal,
      level:      form.level,
      equipment:  form.equipment,
      avatarSeed: avatar,
      createdAt:  new Date().toISOString(),
    };
    login(u);
    router.replace('/home');
  };

  const parseExistingProgram = async () => {
    if (!existingText.trim() || !groqKey) { doLogin(); return; }
    setParsingExisting(true);
    setParseStatus('idle');
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{ Authorization:`Bearer ${groqKey}`, 'Content-Type':'application/json' },
        body: JSON.stringify({
          model:'llama-3.3-70b-versatile',
          messages:[
            { role:'system', content:`Tu reçois la description d'un programme de musculation existant. Convertis-le en JSON structuré. Réponds UNIQUEMENT avec du JSON valide (pas de markdown):
{"0":{"name":"Lundi","label":"Push","tag":"push","color":"var(--push)","subtitle":"Pecs · Épaules · Triceps","img":"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=70","sections":[{"title":"Pectoraux","exercises":[{"name":"Développé couché barre","sets":"4 × 8-10","note":"","customName":"","customSets":"","customWeight":"","customRest":"","customImg":""}]}]},...jusqu'à "6"}
Tags: push,pull,legs,full,arms,rest. 7 jours (0-6). Jours non mentionnés → repos: "rest":true sans sections.` },
            { role:'user', content:`Voici mon programme existant: ${existingText}` }
          ],
          max_tokens:3000, temperature:.3
        })
      });
      const data = await res.json();
      const txt = data.choices[0].message.content as string;
      const m = txt.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        for (let i=0;i<7;i++) if(!parsed[i]) parsed[i]={name:['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'][i],label:'Repos',tag:'rest',color:'var(--rest)',subtitle:'Repos',img:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=70',rest:true};
        setProgram(parsed);
        setParseStatus('ok');
        setTimeout(() => doLogin(), 1400);
      } else {
        setParseStatus('error');
        setTimeout(() => doLogin(), 1600);
      }
    } catch {
      setParseStatus('error');
      setTimeout(() => doLogin(), 1600);
    }
    setParsingExisting(false);
  };

  const generateProgram = async () => {
    if (!aiPrompt.trim() || generating) return;
    setGenerating(true);
    const userMsg = aiPrompt;
    setAiMsgs(p => [...p, { role:'user', text:userMsg }]);
    setAiPrompt('');
    const equipLabel = EQUIPMENT.find(e => e.id === form.equipment)?.label ?? 'Salle de sport';
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{ Authorization:`Bearer ${groqKey}`, 'Content-Type':'application/json' },
        body: JSON.stringify({
          model:'llama-3.3-70b-versatile',
          messages:[
            { role:'system', content:`Tu génères des programmes de musculation. Réponds UNIQUEMENT avec du JSON valide (pas de markdown):
{"0":{"name":"Lundi","label":"Push","tag":"push","color":"var(--push)","subtitle":"Pecs · Épaules · Triceps","img":"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=70","sections":[{"title":"Pectoraux","exercises":[{"name":"Développé couché barre","sets":"4 × 8-10","note":"","customName":"","customSets":"","customWeight":"","customRest":"","customImg":""}]}]},...jusqu'à "6"}
Tags: push,pull,legs,full,arms,rest. 7 jours (0-6). Repos: "rest":true sans sections. Adapte les exercices au matériel disponible.` },
            { role:'user', content:`Programme pour: ${form.level}, objectif: ${form.goal}, matériel: ${equipLabel}. Demande: ${userMsg}` }
          ],
          max_tokens:3000, temperature:.4
        })
      });
      const data = await res.json();
      const txt = data.choices[0].message.content as string;
      const m = txt.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        for (let i=0;i<7;i++) if(!parsed[i]) parsed[i]={name:['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'][i],label:'Repos',tag:'rest',color:'var(--rest)',subtitle:'Repos',img:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=70',rest:true};
        setProgram(parsed);
        setAiMsgs(p => [...p, { role:'assistant', text:'Programme créé ! Clique sur "Commencer" pour accéder à ton app.' }]);
      } else {
        setAiMsgs(p => [...p, { role:'assistant', text:'Réessaie avec une description plus simple.' }]);
      }
    } catch {
      setAiMsgs(p => [...p, { role:'assistant', text:'Erreur API. Vérifie ta clé Groq.' }]);
    }
    setGenerating(false);
  };

  const f = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
    setForm(p=>({...p,[k]:e.target.value}));
    setErrs(p=>{const n={...p};delete n[k];return n;});
  };

  const avatarUrl = (seed:string) => `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,d1d4f9,c0aede,ffdfbf`;

  const totalSteps = 3;
  const pageStyle = { minHeight:'100vh', background:'var(--bg)', position:'relative' as const, overflow:'hidden', maxWidth:430, margin:'0 auto' };

  // ── SPLASH ──────────────────────────────────────────────────
  if (step === 'splash') return (
    <div style={{ ...pageStyle, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'var(--s1)' }}>
      <motion.div initial={{scale:.7,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',stiffness:200,damping:20}}>
        <div style={{ width:88, height:88, borderRadius:22, background:'#1C1C1E', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', marginBottom:20 }}>
          <Dumbbell size={40} color="#fff"/>
        </div>
      </motion.div>
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.2}}>
        <div style={{ fontWeight:800, fontSize:28, color:'var(--t1)', letterSpacing:'-.02em' }}>TrainWeek</div>
      </motion.div>
      <div style={{ position:'absolute', bottom:40, width:120, height:3, background:'var(--s3)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${splashPct}%`, background:'var(--ac)', borderRadius:99, transition:'width .03s linear' }}/>
      </div>
    </div>
  );

  // ── HERO ────────────────────────────────────────────────────
  if (step === 'hero') return (
    <div style={{ ...pageStyle, background:'var(--s1)' }}>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{ position:'relative', height:'100vh', display:'flex', flexDirection:'column' }}>
        <div style={{ position:'absolute', top:'max(env(safe-area-inset-top),20px)', left:0, right:0, textAlign:'center', zIndex:2 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--t2)', letterSpacing:'.02em' }}>TrainWeek</div>
        </div>
        <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
          <img src={HERO_IMAGE} alt="Fitness" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(255,255,255,0) 30%, var(--s1) 85%)' }}/>
        </div>
        <div style={{ padding:'0 28px 40px', paddingBottom:'max(40px, calc(env(safe-area-inset-bottom) + 40px))', textAlign:'center' }}>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.2}}>
            <div className="display-xl" style={{ marginBottom:12, color:'var(--t1)' }}>
              Atteins tes objectifs,<br/>
              <span style={{ color:'var(--ac)' }}>bats tes records.</span>
            </div>
            <div style={{ fontSize:15, color:'var(--t2)', lineHeight:1.55, marginBottom:32 }}>
              Programmes sur mesure, suivi IA, nutrition personnalisée.
            </div>
          </motion.div>
          <motion.button
            initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.35}}
            onClick={()=>setStep('profile')}
            className="btn-pill btn-accent"
            style={{ width:'100%', fontSize:17 }}
          >
            Get started <ChevronRight size={20}/>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  // ── PROFILE ─────────────────────────────────────────────────
  if (step === 'profile') return (
    <div style={{ ...pageStyle, background:'var(--bg)' }}>
      <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} style={{ padding:'max(env(safe-area-inset-top),24px) 24px 40px', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        <StepBar current={0} total={totalSteps}/>
        <button onClick={()=>setStep('hero')} style={{ marginTop:20, display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--t2)', cursor:'pointer', fontSize:14, fontWeight:600, marginBottom:28 }}>
          <ChevronLeft size={18}/>Retour
        </button>

        <div className="display-lg" style={{ marginBottom:6, color:'var(--t1)' }}>Parle nous de toi !</div>
        <div style={{ fontSize:15, color:'var(--t2)', marginBottom:28 }}>Indique tes informations pour personnaliser ton expérience</div>

        <div style={{ display:'flex', flexDirection:'column', gap:16, flex:1 }}>
          <FLabel label="PRÉNOM" error={errs.firstName}>
            <input value={form.firstName} onChange={f('firstName')} className="fi" placeholder="Alex" autoComplete="given-name"/>
          </FLabel>
          <FLabel label="NOM" error={errs.lastName}>
            <input value={form.lastName} onChange={f('lastName')} className="fi" placeholder="Martin" autoComplete="family-name"/>
          </FLabel>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <FLabel label="AGE" error={errs.age}><input value={form.age} onChange={f('age')} className="fi" type="number" placeholder="24" inputMode="numeric"/></FLabel>
            <FLabel label="POIDS" error={errs.weight}><input value={form.weight} onChange={f('weight')} className="fi" type="number" placeholder="75kg" inputMode="decimal"/></FLabel>
            <FLabel label="TAILLE(CM)" error={errs.height}><input value={form.height} onChange={f('height')} className="fi" type="number" placeholder="178" inputMode="numeric"/></FLabel>
          </div>
          <FLabel label="SEXE">
            <div style={{ display:'flex', gap:8 }}>
              {GENDERS.map(([v,l])=>(
                <button key={v} onClick={()=>setForm(p=>({...p,gender:v}))}
                  style={{ flex:1, padding:'13px 8px', borderRadius:14, border:`2px solid ${form.gender===v?'var(--ac)':'var(--bd)'}`, background:form.gender===v?'var(--ac2)':'var(--s1)', color:form.gender===v?'var(--ac)':'var(--t2)', fontWeight:700, fontSize:14, cursor:'pointer', transition:'all .15s' }}>
                  {l}
                </button>
              ))}
            </div>
          </FLabel>
          <FLabel label="OBJECTIF">
            <select value={form.goal} onChange={f('goal')} className="fi">
              {GOALS.map(g=><option key={g} value={g}>{g}</option>)}
            </select>
          </FLabel>
          <FLabel label="NIVEAU">
            <div style={{ display:'flex', gap:8 }}>
              {LEVELS.map(l=>(
                <button key={l} onClick={()=>setForm(p=>({...p,level:l}))}
                  style={{ flex:1, padding:'13px 6px', borderRadius:14, border:`2px solid ${form.level===l?'var(--ac)':'var(--bd)'}`, background:form.level===l?'var(--ac2)':'var(--s1)', color:form.level===l?'var(--ac)':'var(--t2)', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .15s' }}>
                  {l}
                </button>
              ))}
            </div>
          </FLabel>
          <FLabel label="MATÉRIEL DISPONIBLE">
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {EQUIPMENT.map(eq=>(
                <button key={eq.id} onClick={()=>setForm(p=>({...p,equipment:eq.id}))}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderRadius:14, border:`2px solid ${form.equipment===eq.id?'var(--ac)':'var(--bd)'}`, background:form.equipment===eq.id?'var(--ac2)':'var(--s1)', cursor:'pointer', transition:'all .15s' }}>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontSize:14, fontWeight:700, color:form.equipment===eq.id?'var(--ac)':'var(--t1)' }}>{eq.label}</div>
                    <div style={{ fontSize:12, color:'var(--t3)', marginTop:2 }}>{eq.sub}</div>
                  </div>
                  <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${form.equipment===eq.id?'var(--ac)':'var(--bd)'}`, background:form.equipment===eq.id?'var(--ac)':'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {form.equipment===eq.id && <div style={{ width:8, height:8, borderRadius:'50%', background:'#fff' }}/>}
                  </div>
                </button>
              ))}
            </div>
          </FLabel>
        </div>

        <button onClick={()=>{if(validateProfile())setStep('avatar');}} className="btn-pill btn-ghost" style={{ width:'100%', marginTop:24 }}>
          Continuer <ChevronRight size={18}/>
        </button>
      </motion.div>
    </div>
  );

  // ── AVATAR ──────────────────────────────────────────────────
  if (step === 'avatar') return (
    <div style={{ ...pageStyle, background:'var(--bg)' }}>
      <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} style={{ padding:'max(env(safe-area-inset-top),24px) 24px', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        <StepBar current={1} total={totalSteps}/>
        <button onClick={()=>setStep('profile')} style={{ marginTop:20, display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--t2)', cursor:'pointer', fontSize:14, fontWeight:600, marginBottom:24 }}>
          <ChevronLeft size={18}/>Retour
        </button>

        <div style={{ textAlign:'center', marginBottom:8 }}>
          <div style={{ fontSize:17, fontWeight:700, color:'var(--t1)' }}>Choisis ton avatar</div>
          <div style={{ fontSize:13, color:'var(--t3)', marginTop:4 }}>Tu pourras le changer dans les paramètres</div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:32, marginTop:16 }}>
          <div style={{ width:120, height:120, borderRadius:'50%', overflow:'hidden', background:'#D1D4F9', position:'relative', boxShadow:'0 8px 32px rgba(124,58,237,0.2)' }}>
            <img src={avatarUrl(avatar)} alt={avatar} style={{ width:'100%', height:'100%' }}/>
          </div>
          <div style={{ fontSize:18, fontWeight:700, marginTop:12, color:'var(--t1)' }}>{form.firstName || 'Alex'}</div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:'auto' }}>
          {AVATARS.map(a=>(
            <button key={a} onClick={()=>setAvatar(a)}
              style={{ aspectRatio:'1', borderRadius:'50%', overflow:'hidden', border:`3px solid ${a===avatar?'var(--ac)':'transparent'}`, cursor:'pointer', background:'#D1D4F9', transition:'all .15s', boxShadow: a===avatar ? '0 4px 16px rgba(124,58,237,0.3)' : 'none', padding:0 }}>
              <img src={avatarUrl(a)} alt={a} style={{ width:'100%', height:'100%' }}/>
            </button>
          ))}
        </div>

        <button onClick={()=>setStep('program')} className="btn-pill btn-accent" style={{ width:'100%', marginTop:28 }}>
          Continuer <ChevronRight size={18}/>
        </button>
      </motion.div>
    </div>
  );

  // ── PROGRAM CHOICE ──────────────────────────────────────────
  if (step === 'program') return (
    <div style={{ ...pageStyle, background:'var(--bg)' }}>
      <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} style={{ padding:'max(env(safe-area-inset-top),24px) 24px', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        <StepBar current={2} total={totalSteps}/>
        <button onClick={()=>setStep('avatar')} style={{ marginTop:20, display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--t2)', cursor:'pointer', fontSize:14, fontWeight:600, marginBottom:28 }}>
          <ChevronLeft size={18}/>Retour
        </button>

        <div style={{ textAlign:'center', fontSize:17, fontWeight:700, color:'var(--t1)', marginBottom:20 }}>Programme</div>

        <div style={{ padding:'16px 18px', borderRadius:18, background:'var(--s2)', border:'1px solid var(--bd)', marginBottom:28, display:'flex', gap:12, alignItems:'flex-start' }}>
          <div style={{ width:32, height:32, borderRadius:10, background:'var(--ac2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Info size={16} color="var(--ac)"/>
          </div>
          <div style={{ fontSize:14, color:'var(--t2)', lineHeight:1.55 }}>Bonjour {form.firstName}, tu peux laisser l&apos;IA générer un programme adapté à tes objectifs ou commencer directement.</div>
        </div>

        <div style={{ flex:1 }}>
          <div style={{ marginBottom:20 }}>
            <div className="label" style={{ marginBottom:10 }}>PROGRAMME FAIT PAR IA</div>
            <button onClick={()=>setStep('ai-chat')}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px', borderRadius:18, background:'var(--s1)', border:'1.5px solid var(--bd)', cursor:'pointer', boxShadow:'var(--shadow)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:'var(--ac2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Sparkles size={20} color="var(--ac)"/>
                </div>
                <div style={{ textAlign:'left' }}>
                  <span style={{ fontSize:15, fontWeight:700, color:'var(--t1)', display:'block' }}>IA</span>
                  <span style={{ fontSize:12, color:'var(--t3)' }}>Adapté à {EQUIPMENT.find(e=>e.id===form.equipment)?.label}</span>
                </div>
              </div>
              <ChevronRight size={18} color="var(--t3)"/>
            </button>
          </div>

          <div>
            <div className="label" style={{ marginBottom:10 }}>VOUS AVEZ DÉJÀ UN PROGRAMME</div>
            <button onClick={()=>setStep('existing-program')}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px', borderRadius:18, background:'var(--s1)', border:'1.5px solid var(--bd)', cursor:'pointer', boxShadow:'var(--shadow)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:'rgba(59,130,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <ClipboardList size={20} color="#3B82F6"/>
                </div>
                <div style={{ textAlign:'left' }}>
                  <span style={{ fontSize:15, fontWeight:700, color:'var(--t1)', display:'block' }}>Déjà un programme</span>
                  <span style={{ fontSize:12, color:'var(--t3)' }}>Colle-le ou dicte-le, l&apos;IA l&apos;importe</span>
                </div>
              </div>
              <ChevronRight size={18} color="var(--t3)"/>
            </button>
          </div>
        </div>

        <button onClick={()=>doLogin()} className="btn-pill btn-ghost" style={{ width:'100%', marginTop:20 }}>
          Continuer <ChevronRight size={18}/>
        </button>
      </motion.div>
    </div>
  );

  // ── AI CHAT PROGRAM ─────────────────────────────────────────
  if (step === 'ai-chat') return (
    <div style={{ ...pageStyle, background:'var(--bg)' }}>
      <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} style={{ padding:'max(env(safe-area-inset-top),24px) 24px', height:'100vh', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <button onClick={()=>setStep('program')} style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', color:'var(--t2)', cursor:'pointer', fontSize:14, fontWeight:600 }}>
            <ChevronLeft size={18}/>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Sparkles size={16} color="var(--ac)"/>
            <span style={{ fontSize:16, fontWeight:700, color:'var(--t1)' }}>Programme IA</span>
          </div>
          <div style={{ width:40 }}/>
        </div>

        {!groqKey && (
          <div style={{ padding:'12px 16px', borderRadius:14, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#EF4444', marginBottom:6 }}>Clé API Groq requise</div>
            <input type="password" value={groqKey} onChange={e=>setGroqKey(e.target.value)} className="fi" placeholder="gsk_... — console.groq.com/keys" style={{fontSize:13}}/>
          </div>
        )}

        <div style={{ padding:'14px 16px', borderRadius:16, background:'var(--s2)', border:'1px solid var(--bd)', marginBottom:16 }}>
          <div style={{ fontSize:13, color:'var(--t2)', lineHeight:1.6 }}>
            Décrivez vos objectifs, jours disponibles et préférences pour personnaliser votre programme
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, paddingBottom:8 }}>
          {aiMsgs.map((m,i)=>(
            <motion.div key={i} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
              style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
              <div style={{ maxWidth:'80%', padding:'12px 16px', borderRadius:18, fontSize:14, lineHeight:1.5,
                background:m.role==='user'?'var(--t1)':'var(--s1)',
                color:m.role==='user'?'var(--bg)':'var(--t1)',
                borderBottomRightRadius:m.role==='user'?4:18,
                borderBottomLeftRadius:m.role==='assistant'?4:18,
                boxShadow:'var(--shadow)',
              }}>
                {m.text}
              </div>
            </motion.div>
          ))}
          {generating && (
            <div style={{ display:'flex' }}>
              <div style={{ padding:'12px 16px', borderRadius:18, background:'var(--s1)', boxShadow:'var(--shadow)', display:'flex', gap:4 }}>
                {[0,1,2].map(i=>(
                  <motion.div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--ac)' }}
                    animate={{y:[0,-4,0]}} transition={{duration:.5,delay:i*.12,repeat:Infinity}}/>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:'12px 16px', borderRadius:20, background:'var(--s1)', border:'1px solid var(--bd)', boxShadow:'var(--shadow2)' }}>
          <textarea value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} rows={2}
            style={{ width:'100%', background:'none', border:'none', outline:'none', fontSize:14, color:'var(--t1)', fontFamily:'Inter,sans-serif', resize:'none' }}
            placeholder="Ex: PPL 5 jours, prise de masse, salle complète..."/>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
            <button onClick={generateProgram} disabled={!aiPrompt.trim()||generating}
              style={{ width:40, height:40, borderRadius:'50%', background:aiPrompt.trim()?'var(--ac)':'var(--s2)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:aiPrompt.trim()?'#fff':'var(--t3)', transition:'all .15s' }}>
              <ChevronRight size={18}/>
            </button>
          </div>
        </div>

        <button onClick={()=>doLogin()} className="btn-pill btn-accent" style={{ width:'100%', marginTop:12 }}>
          Commencer <ChevronRight size={18}/>
        </button>
      </motion.div>
    </div>
  );

  // ── EXISTING PROGRAM ────────────────────────────────────────
  if (step === 'existing-program') return (
    <div style={{ ...pageStyle, background:'var(--bg)' }}>
      <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}}
        style={{ padding:'max(env(safe-area-inset-top),24px) 24px', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        <button onClick={()=>setStep('program')}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--t2)', cursor:'pointer', fontSize:14, fontWeight:600, marginBottom:28 }}>
          <ChevronLeft size={18}/>Retour
        </button>

        <div className="display-lg" style={{ marginBottom:6, color:'var(--t1)' }}>Copie ton programme</div>
        <div style={{ fontSize:15, color:'var(--t2)', lineHeight:1.55, marginBottom:24 }}>
          Colle-le, décris-le ou dicte-le — l&apos;IA le structure pour l&apos;app.
        </div>

        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:14 }}>
          <textarea
            value={existingText}
            onChange={e => setExistingText(e.target.value)}
            rows={9}
            className="fi"
            placeholder={'Ex : Lundi – Push : développé couché 4×8, écarté 3×12\nMardi – Pull : tractions 4×6, rowing 4×8\nMercredi – Repos\n...'}
            style={{ borderRadius:18, resize:'none', fontSize:14, lineHeight:1.6, fontFamily:'inherit' }}
          />

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <VoiceInput onResult={t => setExistingText(p => p ? p + '\n' + t : t)}/>
            <span style={{ fontSize:13, color:'var(--t2)' }}>Ou dicte ton programme</span>
          </div>

          {parseStatus === 'ok' && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:14, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)' }}>
              <CheckCircle2 size={18} color="#22C55E"/>
              <span style={{ fontSize:14, color:'#22C55E', fontWeight:600 }}>Programme importé ! Démarrage…</span>
            </motion.div>
          )}
          {parseStatus === 'error' && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:14, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={18} color="#EF4444"/>
              <span style={{ fontSize:14, color:'#EF4444', fontWeight:600 }}>Analyse échouée — programme par défaut utilisé.</span>
            </motion.div>
          )}

          {!groqKey && existingText.trim() && (
            <div style={{ padding:'12px 16px', borderRadius:14, background:'var(--ac2)', border:'1px solid var(--ac)', fontSize:13, color:'var(--ac)' }}>
              Configure ta clé Groq dans les Paramètres pour activer l&apos;analyse IA.
            </div>
          )}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:20 }}>
          <button onClick={parseExistingProgram} disabled={parsingExisting}
            className="btn-pill btn-accent" style={{ width:'100%' }}>
            {parsingExisting
              ? <><div style={{width:18,height:18,borderRadius:'50%',border:'2.5px solid rgba(255,255,255,.3)',borderTopColor:'#fff'}} className="spin"/>Analyse…</>
              : <><Sparkles size={18}/>{(existingText.trim() && groqKey) ? "Analyser avec l'IA" : 'Continuer'}</>}
          </button>
          <button onClick={doLogin}
            style={{ background:'none', border:'none', fontSize:14, color:'var(--t2)', cursor:'pointer', padding:'8px 0', fontFamily:'inherit', fontWeight:500, textAlign:'center' }}>
            Continuer sans importer
          </button>
        </div>
      </motion.div>
    </div>
  );

  return null;
}

function StepBar({ current, total }: { current:number; total:number }) {
  return (
    <div style={{ display:'flex', gap:6 }}>
      {Array.from({length:total},(_,i)=>(
        <div key={i} style={{ height:4, borderRadius:99, background:i<=current?'var(--ac)':'var(--s3)', flex:i===current?2:1, transition:'all .3s' }}/>
      ))}
    </div>
  );
}

function FLabel({ label, error, children }: { label:string; error?:string; children:React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:error?'#EF4444':'var(--t3)', marginBottom:7 }}>
        {label}{error?` — ${error}`:''}
      </div>
      {children}
    </div>
  );
}
