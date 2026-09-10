'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Key, Sparkles, MessageSquare, Dumbbell } from 'lucide-react';
import VoiceInput from '@/components/ui/VoiceInput';
import AppShell from '@/components/layout/AppShell';
import { useUser } from '@/hooks/useUser';
import { useWorkout } from '@/hooks/useWorkout';
import { useLocalStorage } from '@/hooks/useStorage';
import type { ChatMessage } from '@/lib/types';

const SUGGESTIONS = [
  'Comment progresser sur le développé couché ?',
  'Combien de protéines par jour pour moi ?',
  'Comment éviter le surentraînement ?',
  'Quels exercices pour les points faibles de mon programme ?',
];

function buildProgramSummary(program: Record<number, { name:string; label:string; rest?:boolean; sections?:{title:string;exercises:{name:string}[]}[] }>) {
  const lines = [];
  for (let i = 0; i < 7; i++) {
    const d = program[i];
    if (!d) continue;
    if (d.rest) {
      lines.push(`${d.name}: Repos`);
    } else {
      const exList = d.sections?.flatMap(s => s.exercises.map(e => e.name)).join(', ') ?? '';
      lines.push(`${d.name}: ${d.label} — ${exList}`);
    }
  }
  return lines.join('\n');
}

export default function CoachPage() {
  const { user } = useUser();
  const { program, setProgram } = useWorkout();
  const [activeTab, setActiveTab] = useState<'chat'|'program'>('chat');
  const [msgs, setMsgs] = useLocalStorage<ChatMessage[]>('tw_chat', [
    { role:'assistant', content:`Bonjour ${user?.firstName || ''} ! Je suis ton coach virtuel. Pose-moi tes questions sur tes exercices, ta nutrition ou demande des ajustements à ton programme.` }
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [groqKey, setGroqKey] = useLocalStorage('tw_groq_key', '');
  const [keyOpen, setKeyOpen] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genDone, setGenDone]   = useState(false);
  const chatRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs, loading]);

  const programSummary = buildProgramSummary(program);
  const equipLabel = user?.equipment === 'bodyweight' ? 'poids du corps uniquement' : user?.equipment === 'home' ? 'matériel maison (haltères, élastiques)' : 'salle de sport complète';

  const SYSTEM_CHAT = `Tu es un coach fitness expert. Réponds en français, directement et avec précision. Pas d'emojis.

Profil de l'utilisateur:
- Prénom: ${user?.firstName ?? 'Utilisateur'}
- Objectif: ${user?.goal ?? 'Non défini'}
- Niveau: ${user?.level ?? 'Non défini'}
- Matériel: ${equipLabel}
- Poids: ${user?.weight ?? '?'}kg, Taille: ${user?.height ?? '?'}cm

Programme actuel:
${programSummary || 'Aucun programme configuré'}`;

  const SYSTEM_GEN = `Tu génères des programmes de musculation. Réponds UNIQUEMENT avec du JSON brut, sans markdown, sans texte.
Format MINIMAL obligatoire — exactement 7 clés "0" à "6":
{"0":{"name":"Lundi","label":"Push","tag":"push","subtitle":"Pecs · Épaules · Triceps","sections":[{"title":"Pectoraux","exercises":[{"name":"Développé couché","sets":"4×8"},{"name":"Écarté haltères","sets":"3×12"}]},{"title":"Épaules","exercises":[{"name":"Développé militaire","sets":"4×10"}]}]},"1":{"name":"Mardi","label":"Repos","tag":"rest","rest":true},...,"6":{...}}
Règles strictes:
- Tags: push / pull / legs / full / arms / rest
- Jour de repos: {"name":"...","label":"Repos","tag":"rest","rest":true} SANS sections
- Max 3 exercices par section, max 2 sections par jour d'entraînement
- Chaque exercice: uniquement "name" et "sets"
- NE PAS inclure: color, img, note, customName, customSets, customWeight, customRest, customImg
- Termine impérativement le JSON avec }}`;

  const callGroq = async (messages: ChatMessage[], system: string, maxTokens = 1200) => {
    if (!groqKey) throw new Error('Clé API manquante — configure-la ci-dessus');
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:'POST',
      headers:{ Authorization:`Bearer ${groqKey}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ model:'llama-3.3-70b-versatile', messages:[{role:'system',content:system},...messages], max_tokens:maxTokens, temperature:.7 }),
    });
    if (!r.ok) throw new Error(`Erreur Groq: ${r.status}`);
    return (await r.json()).choices[0].message.content as string;
  };

  const sendChat = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    const um: ChatMessage = { role:'user', content:msg };
    setMsgs(p => [...p, um]);
    setLoading(true);
    try {
      const reply = await callGroq([...msgs, um].slice(-10), SYSTEM_CHAT);
      setMsgs(p => [...p, { role:'assistant', content:reply }]);
    } catch(e: unknown) {
      const m = e instanceof Error ? e.message : 'Erreur';
      setMsgs(p => [...p, { role:'assistant', content:m }]);
      if (!groqKey) setKeyOpen(true);
    } finally { setLoading(false); }
  };

  const [genError, setGenError] = useState('');

  const generateProgram = async () => {
    if (!genPrompt.trim() || generating) return;
    setGenerating(true);
    setGenDone(false);
    setGenError('');

    const DAY_NAMES = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
    const TAG_COLOR: Record<string, string> = { push:'var(--orange)', pull:'#3B82F6', legs:'#22C55E', arms:'#A855F7', full:'var(--ac)', rest:'var(--t3)' };
    const TAG_IMG:   Record<string, string> = {
      push: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=70',
      pull: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=70',
      legs: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=70',
      arms: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=70',
      full: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=70',
      rest: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=70',
    };

    // Fill in all defaults the AI was not asked to generate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalize = (raw: Record<string, any>): import('@/lib/types').Program => {
      const out: import('@/lib/types').Program = {};
      for (let i = 0; i < 7; i++) {
        const d = raw[i] ?? raw[String(i)];
        if (!d || d.rest) {
          out[i] = { name: d?.name ?? DAY_NAMES[i], label: 'Repos', tag: 'rest', color: TAG_COLOR.rest, subtitle: 'Récupération', img: TAG_IMG.rest, rest: true, sections: [] };
        } else {
          const tag = d.tag ?? 'full';
          out[i] = {
            name:     d.name     ?? DAY_NAMES[i],
            label:    d.label    ?? tag,
            tag,
            color:    TAG_COLOR[tag] ?? 'var(--orange)',
            subtitle: d.subtitle ?? '',
            img:      TAG_IMG[tag] ?? TAG_IMG.full,
            sections: (d.sections ?? []).map((s: { title: string; exercises: { name: string; sets: string }[] }) => ({
              title: s.title ?? '',
              exercises: (s.exercises ?? []).map((e: { name: string; sets: string }) => ({
                name: e.name ?? '', sets: e.sets ?? '3×10',
                note: '', customName: '', customSets: '', customWeight: '', customRest: '', customImg: '',
              })),
            })),
          };
        }
      }
      return out;
    };

    const prompt = `Niveau: ${user?.level ?? 'intermédiaire'}, objectif: ${user?.goal ?? 'prise de masse'}, matériel: ${equipLabel}. Programme: ${genPrompt}`;
    try {
      const reply = await callGroq([{ role:'user', content: prompt }], SYSTEM_GEN, 4000);
      const cleaned = reply.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim();
      const start = cleaned.indexOf('{');
      const end   = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('Aucun JSON dans la réponse');
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      setProgram(normalize(parsed));
      setGenDone(true);
      setGenPrompt('');
    } catch(e: unknown) {
      setGenError(e instanceof Error ? e.message : 'Erreur lors de la génération');
    } finally { setGenerating(false); }
  };

  const fmt = (s: string) => s
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--ac)">$1</strong>')
    .replace(/\n/g, '<br/>');

  return (
    <AppShell>
      <div style={{ display:'flex', flexDirection:'column', height:'100dvh', paddingTop:'calc(env(safe-area-inset-top,0px) + 14px)' }}>

        {/* ── HEADER ── */}
        <div style={{ flexShrink:0, padding:'0 20px 0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:14, background:'var(--ac2)', border:'1px solid rgba(206,245,51,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Bot size={20} color="var(--ac)"/>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:17, color:'var(--t1)' }}>Coach IA</div>
                <div style={{ fontSize:11, color:'var(--t3)', marginTop:1 }}>LLaMA 3.3 · Groq</div>
              </div>
            </div>
            <motion.button whileTap={{ scale:.88 }} onClick={() => setKeyOpen(v=>!v)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:99, cursor:'pointer', fontSize:12, fontWeight:700,
                background: groqKey ? 'rgba(48,209,88,0.1)' : 'var(--s2)',
                border: groqKey ? '1px solid rgba(48,209,88,0.25)' : '1px solid var(--bd)',
                color: groqKey ? '#30d158' : 'var(--t2)' }}>
              <Key size={12}/>{groqKey ? 'API OK' : 'Clé API'}
            </motion.button>
          </div>

          {/* Key input */}
          <AnimatePresence>
            {keyOpen && (
              <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:'hidden', marginBottom:12 }}>
                <div style={{ padding:14, borderRadius:16, background:'var(--s2)', border:'1px solid var(--bd)' }}>
                  <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--t3)', marginBottom:8 }}>Clé Groq (gratuite)</div>
                  <input type="password" value={groqKey} onChange={e=>setGroqKey(e.target.value)} className="fi" placeholder="gsk_... — console.groq.com/keys" style={{ fontSize:13 }}/>
                  <div style={{ fontSize:11, color:'var(--t3)', marginTop:5 }}>Stockée localement sur ton appareil.</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab switcher */}
          <div style={{ display:'flex', gap:6, padding:5, borderRadius:16, background:'var(--s2)', border:'1px solid var(--bd)', marginBottom:12 }}>
            {([
              { id:'chat',    icon:<MessageSquare size={15}/>, label:'Questions' },
              { id:'program', icon:<Sparkles size={15}/>,     label:'Programme' },
            ] as const).map(tab => (
              <button key={tab.id} onClick={()=>{setActiveTab(tab.id);setGenDone(false);}}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'10px 8px', borderRadius:12, border:'none', cursor:'pointer', fontSize:13, fontWeight:700, transition:'all .18s',
                  background: activeTab===tab.id ? 'var(--s1)' : 'transparent',
                  color:      activeTab===tab.id ? 'var(--t1)' : 'var(--t3)',
                  boxShadow:  activeTab===tab.id ? 'var(--shadow)' : 'none',
                }}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CHAT TAB ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-12}}
              style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

              <div ref={chatRef} style={{ flex:1, overflowY:'auto', padding:'4px 20px 8px', display:'flex', flexDirection:'column', gap:10 }}>
                {msgs.map((m, i) => (
                  <div key={i} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
                    {m.role === 'assistant' && (
                      <div style={{ width:28, height:28, borderRadius:9, background:'var(--ac2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginRight:8, marginTop:4 }}>
                        <Bot size={14} color="var(--ac)"/>
                      </div>
                    )}
                    <div style={{
                      maxWidth:'80%', padding:'12px 16px', borderRadius:18, fontSize:14, lineHeight:1.6,
                      ...(m.role==='user'
                        ? { background:'#1A1A1A', color:'#fff', borderBottomRightRadius:4, fontWeight:500 }
                        : { background:'var(--s2)', color:'var(--t1)', borderBottomLeftRadius:4 })
                    }} dangerouslySetInnerHTML={{ __html: fmt(m.content) }} />
                  </div>
                ))}

                {loading && (
                  <div style={{ display:'flex', alignItems:'center' }}>
                    <div style={{ width:28, height:28, borderRadius:9, background:'var(--ac2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginRight:8 }}>
                      <Bot size={14} color="var(--ac)"/>
                    </div>
                    <div style={{ padding:'12px 16px', borderRadius:18, borderBottomLeftRadius:4, background:'var(--s2)', display:'flex', gap:5 }}>
                      {[0,1,2].map(i => (
                        <motion.div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--t2)' }}
                          animate={{ y:[0,-5,0] }} transition={{ duration:.6, delay:i*.15, repeat:Infinity }} />
                      ))}
                    </div>
                  </div>
                )}

                {msgs.length <= 1 && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--t3)', marginBottom:10 }}>Suggestions</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {SUGGESTIONS.map(s => (
                        <motion.button key={s} whileTap={{ scale:.97 }} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                          style={{ textAlign:'left', padding:'12px 16px', borderRadius:14, background:'var(--s1)', border:'1px solid var(--bd)', color:'var(--t2)', fontSize:13, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{ flexShrink:0, padding:'10px 16px', paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 90px)', background:'var(--bg)', borderTop:'1px solid var(--bd)' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', padding:'8px 12px', borderRadius:18, background:'var(--s1)', border:'1.5px solid var(--bd)' }}>
                  <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Pose ta question…"
                    style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:15, color:'var(--t1)', fontFamily:'Inter,sans-serif', minWidth:0 }}/>
                  <VoiceInput onResult={t=>{setInput(p=>p?p+' '+t:t);inputRef.current?.focus();}}/>
                  <motion.button whileTap={{scale:.88}} onClick={sendChat} disabled={!input.trim()||loading}
                    style={{ width:38,height:38,borderRadius:'50%',background:input.trim()?'var(--ac)':'var(--s3)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#fff',transition:'all .2s' }}>
                    <Send size={16}/>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── PROGRAMME TAB ── */}
          {activeTab === 'program' && (
            <motion.div key="program" initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} exit={{opacity:0,x:12}}
              style={{ flex:1, overflowY:'auto', padding:'4px 20px', paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 100px)' }}>

              {/* Context pill */}
              <div style={{ padding:'10px 14px', borderRadius:14, background:'var(--s2)', border:'1px solid var(--bd)', marginBottom:16, display:'flex', gap:10, alignItems:'center' }}>
                <Dumbbell size={14} color="var(--t3)"/>
                <div style={{ fontSize:12, color:'var(--t3)', flex:1 }}>
                  {user?.level} · {user?.goal} · {equipLabel}
                </div>
              </div>

              {genDone ? (
                <motion.div initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}}
                  style={{ padding:24, borderRadius:20, background:'var(--s1)', border:'1px solid var(--bd)', textAlign:'center', marginBottom:16 }}>
                  <div style={{ width:56, height:56, borderRadius:18, background:'var(--ac2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                    <Dumbbell size={26} color="var(--ac)"/>
                  </div>
                  <div style={{ fontSize:17, fontWeight:800, color:'var(--t1)', marginBottom:6 }}>Programme appliqué</div>
                  <div style={{ fontSize:13, color:'var(--t2)', marginBottom:20, lineHeight:1.5 }}>Ton nouveau programme est disponible dans l&apos;onglet Séances.</div>
                  <button onClick={()=>setGenDone(false)} style={{ padding:'10px 24px', borderRadius:99, background:'var(--s2)', border:'1px solid var(--bd)', color:'var(--t2)', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    Générer un autre
                  </button>
                </motion.div>
              ) : (
                <>
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--t1)', marginBottom:6 }}>Décris ton programme idéal</div>
                    <div style={{ fontSize:12, color:'var(--t3)', lineHeight:1.6, marginBottom:14 }}>
                      Jours disponibles, groupes musculaires prioritaires, exercices préférés, structure souhaitée (PPL, Full body, etc.).
                    </div>
                    <textarea value={genPrompt} onChange={e=>setGenPrompt(e.target.value)}
                      rows={5} className="fi"
                      placeholder="Ex : PPL sur 5 jours, priorité pectoraux et épaules, pas de squats, 45 min par séance..."
                      style={{ resize:'none', fontSize:14, lineHeight:1.6, borderRadius:16 }}/>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
                      <VoiceInput onResult={text => setGenPrompt(p => p ? p+' '+text : text)}/>
                      <span style={{ fontSize:12, color:'var(--t3)' }}>Ou dicte ton programme</span>
                    </div>
                  </div>

                  {genError && (
                    <div style={{ padding:'12px 14px', borderRadius:14, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#EF4444', fontSize:13, fontWeight:600, marginBottom:12 }}>
                      {genError}
                    </div>
                  )}

                  <button onClick={generateProgram} disabled={generating || !genPrompt.trim()}
                    style={{ width:'100%', padding:'15px', borderRadius:16, background: genPrompt.trim() ? 'var(--ac)' : 'var(--s2)', border:'none', color: genPrompt.trim() ? '#07070d' : 'var(--t3)', fontWeight:800, fontSize:15, cursor: genPrompt.trim() ? 'pointer' : 'default', display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'all .2s', opacity: generating ? .7 : 1 }}>
                    {generating
                      ? <><div style={{ width:18, height:18, borderRadius:'50%', border:'2.5px solid rgba(7,7,13,.3)', borderTopColor:'#07070d' }} className="spin"/>Génération…</>
                      : <><Sparkles size={18}/>Créer mon programme</>}
                  </button>

                  {/* Preset suggestions */}
                  <div style={{ marginTop:20 }}>
                    <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--t3)', marginBottom:10 }}>Suggestions rapides</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {[
                        'PPL 3 jours, débutant, prise de masse',
                        'Full body 4 jours, perte de graisse, salle',
                        'Push/Pull 5 jours, intermédiaire, force',
                        'Haut du corps 3 jours, poids du corps uniquement',
                      ].map(s=>(
                        <button key={s} onClick={()=>setGenPrompt(s)}
                          style={{ textAlign:'left', padding:'11px 14px', borderRadius:13, background:'var(--s1)', border:'1px solid var(--bd)', color:'var(--t2)', fontSize:13, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
