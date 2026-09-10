'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Target, Dumbbell, Utensils, TrendingUp, Calendar, Lightbulb, BookOpen, Scale, Zap } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import MuscleMap from '@/components/ui/MuscleMap';
import { useUser } from '@/hooks/useUser';
import { useWorkout } from '@/hooks/useWorkout';
import { calculateBMI, calculateBMR, calculateTDEE, getMassGainCalories, getStreakFromLogs, getBMICategory } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useStorage';

// ── Goal content library ──────────────────────────────────────────────────────
const GOAL_CONTENT: Record<string, {
  icon: string;
  why: string;
  how: string;
  nutrition: string;
  timeline: { months: number; label: string; what: string }[];
  tips: string[];
}> = {
  'Prise de masse': {
    icon: '💪',
    why: 'La prise de masse vise à augmenter le volume musculaire en créant un surplus calorique contrôlé. Le muscle ne se construit pas dans la douleur de l\'entraînement, mais pendant la récupération — c\'est pourquoi le sommeil et la nutrition sont aussi importants que les séances.',
    how: 'Programmes axés sur les mouvements polyarticulaires lourds (squat, développé couché, soulevé de terre). Progression des charges chaque semaine. Volume modéré à élevé (3–5 séries × 6–12 reps). Temps de repos 90–180 secondes entre les séries.',
    nutrition: 'Surplus de 200–400 kcal/jour. Protéines : 2–2.2g/kg. Glucides abondants autour des séances. Lipides : 20–30% des calories. Ne pas négliger les micronutriments (zinc, magnésium, vitamine D).',
    timeline: [
      { months:1, label:'Mois 1–3', what:'Adaptation neuromusculaire. Tu te sentiras plus fort avant de voir visuellement des changements. C\'est normal et attendu.' },
      { months:3, label:'Mois 3–6', what:'Premiers changements visibles. Le corps commence à stocker plus de glycogène musculaire. +1 à 2kg de masse musculaire réaliste.' },
      { months:6, label:'Mois 6–12', what:'Progression significative. Silhouette notablement transformée. +3 à 5kg de muscle pour un entraîné sérieux.' },
    ],
    tips: [
      'Dors 7–9h par nuit : 70% de la synthèse musculaire a lieu pendant le sommeil',
      'Mange 30g de protéines dans les 2h post-séance',
      'Augmente les charges de 2–5% dès que tu réalises les reps prescrites avec facilité',
      'Le cardio léger (2×30min/semaine) améliore le flux sanguin et la récupération',
    ],
  },
  'Force + masse': {
    icon: '🏋️',
    why: 'L\'objectif force + masse combine la force maximale et l\'hypertrophie. En travaillant à la fois dans les zones de force (1–5 reps) et d\'hypertrophie (6–12 reps), tu développes un physique dense et fonctionnel.',
    how: 'Périodisation des charges : semaines lourdes (1–5 reps, 85–95% 1RM) alternées avec semaines de volume (8–12 reps). Focus sur les 5 grands lifts : squat, développé couché, soulevé de terre, développé militaire, tractions lestées.',
    nutrition: 'Légèrement au-dessus de la maintenance (+150–300 kcal). Protéines : 2.2–2.5g/kg. Créatine monohydrate : 5g/jour, cliniquement prouvé pour améliorer la force de 5–15%.',
    timeline: [
      { months:1, label:'Mois 1–3', what:'Progression rapide des charges (débutant/intermédiaire). Les gains de force sont d\'abord neurologiques.' },
      { months:3, label:'Mois 3–6', what:'Adaptation structurelle. Fibres musculaires de type II (force) qui s\'épaississent. Force en hausse de 15–30%.' },
      { months:6, label:'Mois 6–12', what:'Physique de powerlifter athlétique. Force significativement au-dessus de la moyenne de la population.' },
    ],
    tips: [
      'Ne saute jamais les exercices polyarticulaires : ils génèrent le plus de testostérone',
      'Semaine de décharge (50% volume) toutes les 4–6 semaines pour éviter le surentraînement',
      'Le sommeil est le meilleur anabolisant naturel — gratuit et légal',
      'Tiens un carnet de bord des performances pour visualiser ta progression',
    ],
  },
  'Sèche': {
    icon: '🔥',
    why: 'La sèche consiste à réduire la masse grasse tout en préservant au maximum le muscle acquis. Un déficit calorique trop agressif entraîne une perte musculaire — la clé est la patience et un déficit modéré.',
    how: 'Maintien du volume d\'entraînement pour préserver le muscle. Cardio progressif (LISS + HIIT). Charges maintenues aussi hautes que possible. Réduction progressive du volume si la fatigue s\'accumule.',
    nutrition: 'Déficit de 300–500 kcal/jour. Protéines élevées : 2.2–2.5g/kg pour préserver le muscle. Glucides réduits les jours off, conservés autour des séances. Hydratation maximale (3–4L/jour).',
    timeline: [
      { months:1, label:'Mois 1–3', what:'Perte d\'eau et de glycogène d\'abord (2–4kg). Puis réduction progressive du tissu adipeux : 0.5–1kg/semaine max.' },
      { months:3, label:'Mois 3–6', what:'Définition musculaire visible. Réduction de 8–15cm de tour de taille réaliste. Les muscles ressortent.' },
      { months:6, label:'Mois 6–12', what:'Physique sec et athlétique. Si suivi rigoureux : -15 à 25kg de gras possibles selon le point de départ.' },
    ],
    tips: [
      'Pèse-toi le matin à jeun, mais observe la tendance sur 2 semaines, pas chaque jour',
      'Le cardio à jeun brûle plus de graisses — mais garde les séances courtes (20–30min)',
      'Les légumes verts à volonté : rassasiants, peu caloriques, riches en micronutriments',
      'Ne supprime pas les lipides — essentiels pour la production hormonale',
    ],
  },
  'Recomposition': {
    icon: '⚖️',
    why: 'La recomposition (perdre du gras ET gagner du muscle simultanément) est possible mais exige patience. Elle est particulièrement efficace pour les débutants et les personnes en surpoids qui ont un potentiel de gain musculaire élevé.',
    how: 'Calories proches de la maintenance. Entraînement en résistance 3–4x/semaine. Cardio modéré 2–3x/semaine. Les jours d\'entraînement, manger légèrement plus — les jours off, légèrement moins.',
    nutrition: 'Cycling calorique : +150 kcal les jours de muscu, -150 les jours off. Protéines très élevées : 2.4g/kg. C\'est le macronutriment le plus important en recomposition.',
    timeline: [
      { months:1, label:'Mois 1–3', what:'La balance ne bougera peut-être pas — mais la composition change. Photos mensuelles et tour de taille sont de meilleurs indicateurs.' },
      { months:3, label:'Mois 3–6', what:'Changements visibles : silhouette affinée, muscles plus visibles. 3–4kg de graisse perdu, 1–2kg de muscle gagné réaliste.' },
      { months:6, label:'Mois 6–12', what:'Transformation visible pour l\'entourage. Confiance en soi améliorée. Corps fonctionnel et esthétique.' },
    ],
    tips: [
      'Le timing des glucides (avant/après séance) compte plus que leur quantité totale en recompo',
      'Mesure ton tour de taille et de hanche chaque mois — pas seulement ton poids',
      'La progression en force est le meilleur indicateur de gain musculaire pendant la recompo',
      'Évite le cardio excessif : il complique la balance calorique',
    ],
  },
  'Remise en forme': {
    icon: '🌟',
    why: 'La remise en forme vise à améliorer la santé globale, l\'énergie quotidienne, la mobilité et la condition cardiovasculaire. Ce n\'est pas seulement une question d\'esthétique — c\'est un investissement dans ta qualité de vie sur le long terme.',
    how: 'Programme progressif combinant musculation (3x/sem) et cardio varié (marche, vélo, natation). Priorité à la technique et à la régularité plutôt qu\'à l\'intensité. Trouver des activités plaisantes pour la durabilité.',
    nutrition: 'Alimentation équilibrée sans restriction extrême. Manger moins transformé, plus de légumes, protéines suffisantes (1.6g/kg minimum). L\'hydratation est souvent sous-estimée : 2–3L/jour.',
    timeline: [
      { months:1, label:'Mois 1–3', what:'Amélioration rapide de l\'énergie, du sommeil et de l\'humeur. Le cardio devient plus facile. Premières habitudes solides.' },
      { months:3, label:'Mois 3–6', what:'Changements de composition corporelle visibles. Endurance améliorée. Réduction du risque de maladies métaboliques.' },
      { months:6, label:'Mois 6–12', what:'Nouveau mode de vie installé. Bien-être général transformé. Les bénéfices sur la santé cardiovasculaire deviennent mesurables.' },
    ],
    tips: [
      'La régularité bat l\'intensité : 3 séances à 70% valent mieux qu\'1 séance à 100% + abandon',
      'Marche 8 000–10 000 pas/jour : aussi efficace que le cardio pour la santé cardiovasculaire',
      'Le stress chronique sabote la perte de graisse — gérer le stress est autant de la récupération',
      'Prends des photos tous les mois, pas toutes les semaines',
    ],
  },
};

// ── Section card helper ───────────────────────────────────────────────────────
function Section({ title, icon, color, bg, children, delay = 0 }: {
  title: string; icon: React.ReactNode; color: string; bg: string;
  children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay, type:'spring', stiffness:240, damping:24}}
      style={{ background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:22, padding:'18px 20px', marginBottom:14, boxShadow:'var(--shadow)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <div style={{ width:38, height:38, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color }}>
          {icon}
        </div>
        <div style={{ fontSize:15, fontWeight:800, color:'var(--t1)' }}>{title}</div>
      </div>
      {children}
    </motion.div>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid var(--bd)' }}>
      <span style={{ fontSize:13, color:'var(--t2)', fontWeight:500 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:700, color: color ?? 'var(--t1)' }}>{value}</span>
    </div>
  );
}

export default function BilanPage() {
  const { user }          = useUser();
  const { program, logs, weights } = useWorkout();
  const router            = useRouter();
  const [foodLogs]        = useLocalStorage<{date:string;macros?:{k:number}}[]>('tw_food_logs', []);

  if (!user) return null;

  const currentW  = weights[0]?.weight ?? user.weight;
  const bmi       = calculateBMI(currentW, user.height);
  const bmiCat    = getBMICategory(bmi);
  const bmr       = calculateBMR(currentW, user.height, user.age, user.gender);
  const tdee      = calculateTDEE(bmr);
  const isCut     = user.goal.toLowerCase().includes('sèche');
  const targetCal = isCut ? tdee - 400 : getMassGainCalories(tdee);
  const proteins  = Math.round(currentW * 2.1);
  const streak    = getStreakFromLogs(logs);

  const goalData  = GOAL_CONTENT[user.goal] ?? GOAL_CONTENT['Remise en forme'];
  const equipLabel = user.equipment === 'bodyweight' ? 'Poids du corps' : user.equipment === 'home' ? 'Matériel maison' : 'Salle de sport';

  // Dominant workout tags in program
  const tagCounts: Record<string, number> = {};
  Object.values(program).forEach(d => { if (!d.rest && d.tag) tagCounts[d.tag] = (tagCounts[d.tag] ?? 0) + 1; });
  const dominantTag = Object.entries(tagCounts).sort((a,b) => b[1]-a[1])[0]?.[0] as 'push'|'pull'|'legs'|'arms'|'full'|'rest' ?? 'full';

  const trainingDays = Object.values(program).filter(d => !d.rest).length;
  const restDays     = 7 - trainingDays;

  return (
    <AppShell>
      <div className="page-scroll">

        {/* HEADER */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <button onClick={() => router.back()}
            style={{ width:38,height:38,borderRadius:12,background:'var(--s2)',border:'1px solid var(--bd)',color:'var(--t2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>
            <ChevronLeft size={18}/>
          </button>
          <div>
            <div style={{ fontSize:26, fontWeight:900, color:'var(--t1)', letterSpacing:'-.03em', lineHeight:1 }}>Mon Bilan</div>
            <div style={{ fontSize:13, color:'var(--t2)', marginTop:3 }}>Ton programme personnalisé expliqué</div>
          </div>
        </div>

        {/* PROFILE HERO */}
        <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:.04}}
          style={{ background:'var(--orange)', borderRadius:22, padding:'20px 22px', marginBottom:14, position:'relative', overflow:'hidden', boxShadow:'0 8px 28px rgba(245,162,40,0.28)' }}>
          <div style={{ position:'absolute', top:-24, right:-24, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.09)', pointerEvents:'none' }}/>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'rgba(255,255,255,0.7)', marginBottom:4 }}>
            {user.firstName} {user.lastName} · {user.age} ans
          </div>
          <div style={{ fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'-.02em', marginBottom:8 }}>
            {user.goal}
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' as const }}>
            {[
              `${user.level}`,
              equipLabel,
              `${trainingDays}j/semaine`,
              `Streak ${streak}j`,
            ].map(tag => (
              <span key={tag} style={{ padding:'4px 10px', borderRadius:99, background:'rgba(255,255,255,0.2)', fontSize:12, fontWeight:600, color:'#fff' }}>
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* BMI */}
        <Section title="Composition corporelle" icon={<Scale size={19}/>} color={bmiCat.color} bg={bmiCat.bg} delay={.08}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:40, fontWeight:900, color:bmiCat.color, letterSpacing:'-.04em', lineHeight:1 }}>{bmi}</div>
              <div style={{ fontSize:10, color:'var(--t3)', fontWeight:700, textTransform:'uppercase', marginTop:2 }}>IMC (kg/m²)</div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ padding:'6px 12px', borderRadius:99, background:bmiCat.bg, border:`1px solid ${bmiCat.color}30`, display:'inline-block', marginBottom:6 }}>
                <span style={{ fontSize:13, fontWeight:700, color:bmiCat.color }}>{bmiCat.label}</span>
              </div>
              <div style={{ position:'relative', height:8, borderRadius:99, background:'linear-gradient(to right,#60A5FA 0%,#22C55E 30%,#F97316 65%,#EF4444 100%)', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, bottom:0, left:`${Math.min(Math.max((bmi-14)/(42-14)*100,1),99)}%`, width:3, background:'#fff', boxShadow:'0 0 4px rgba(0,0,0,0.4)', borderRadius:99 }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--t3)', marginTop:4, fontWeight:600 }}>
                <span>Maigre</span><span>Normal</span><span>Surpoids</span><span>Obèse</span>
              </div>
            </div>
          </div>
          <InfoRow label="Poids" value={`${currentW} kg`}/>
          <InfoRow label="Taille" value={`${user.height} cm`}/>
          <InfoRow label="Métabolisme de base (BMR)" value={`${Math.round(bmr)} kcal`}/>
          <div style={{ borderBottom:'none' }}>
            <InfoRow label="Dépense journalière (TDEE)" value={`${Math.round(tdee)} kcal`} color="var(--ac)"/>
          </div>
        </Section>

        {/* OBJECTIF */}
        <Section title={`Objectif · ${user.goal}`} icon={<Target size={19}/>} color="var(--orange)" bg="var(--orange2)" delay={.12}>
          <p style={{ fontSize:14, color:'var(--t2)', lineHeight:1.65, marginBottom:14 }}>{goalData.why}</p>
          <div style={{ padding:'12px 14px', borderRadius:14, background:'var(--s2)', border:'1px solid var(--bd)' }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--t3)', marginBottom:6 }}>Comment y arriver</div>
            <p style={{ fontSize:13, color:'var(--t2)', lineHeight:1.6 }}>{goalData.how}</p>
          </div>
        </Section>

        {/* PROGRAMME + MUSCLE MAP */}
        <Section title="Ton programme" icon={<Dumbbell size={19}/>} color="var(--pull)" bg="rgba(59,130,246,0.1)" delay={.16}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:14, alignItems:'start' }}>
            <div>
              <InfoRow label="Jours d'entraînement" value={`${trainingDays} / 7`} color="var(--pull)"/>
              <InfoRow label="Jours de repos" value={`${restDays} / 7`}/>
              {Object.values(program).filter(d => !d.rest).slice(0,4).map((d,i) => (
                <InfoRow key={i} label={d.name} value={d.label} color="var(--ac)"/>
              ))}
              {trainingDays > 4 && (
                <div style={{ fontSize:12, color:'var(--t3)', marginTop:4 }}>
                  + {trainingDays - 4} autre{trainingDays - 4 > 1 ? 's' : ''} séance{trainingDays - 4 > 1 ? 's' : ''}
                </div>
              )}
            </div>
            <div style={{ padding:'10px 8px', borderRadius:16, background:'var(--s2)', border:'1px solid var(--bd)' }}>
              <MuscleMap tag={dominantTag} size={80} showLabel={true}/>
            </div>
          </div>
        </Section>

        {/* NUTRITION */}
        <Section title="Stratégie nutritionnelle" icon={<Utensils size={19}/>} color="var(--legs)" bg="rgba(34,197,94,0.1)" delay={.2}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
            {[
              { label:'Objectif', value:`${Math.round(targetCal)} kcal`, color:'var(--orange)' },
              { label:'Protéines', value:`${proteins}g`, color:'#F97316' },
              { label:'Approche', value: isCut ? 'Déficit' : 'Surplus', color:'var(--legs)' },
            ].map(m => (
              <div key={m.label} style={{ textAlign:'center', padding:'12px 8px', borderRadius:14, background:'var(--s2)', border:'1px solid var(--bd)' }}>
                <div style={{ fontSize:15, fontWeight:900, color:m.color, lineHeight:1 }}>{m.value}</div>
                <div style={{ fontSize:10, color:'var(--t3)', marginTop:4, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>{m.label}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize:14, color:'var(--t2)', lineHeight:1.65 }}>{goalData.nutrition}</p>
        </Section>

        {/* ROADMAP */}
        <Section title="Progression attendue" icon={<TrendingUp size={19}/>} color="var(--ac)" bg="var(--ac2)" delay={.24}>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {goalData.timeline.map((step, i) => (
              <div key={i} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--ac2)', border:`2px solid var(--ac)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'var(--ac)' }}>
                    {step.months}m
                  </div>
                  {i < goalData.timeline.length - 1 && (
                    <div style={{ width:2, height:24, background:'var(--bd)', marginTop:4 }}/>
                  )}
                </div>
                <div style={{ flex:1, paddingTop:4 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--t1)', marginBottom:3 }}>{step.label}</div>
                  <div style={{ fontSize:13, color:'var(--t2)', lineHeight:1.55 }}>{step.what}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* KEY TIPS */}
        <Section title="Conseils clés" icon={<Lightbulb size={19}/>} color="var(--full)" bg="rgba(234,179,8,0.1)" delay={.28}>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {goalData.tips.map((tip, i) => (
              <div key={i} style={{ display:'flex', gap:12, padding:'12px 14px', borderRadius:14, background:'var(--s2)', border:'1px solid var(--bd)' }}>
                <div style={{ width:4, borderRadius:3, background:'var(--orange)', flexShrink:0 }}/>
                <p style={{ fontSize:13, color:'var(--t2)', lineHeight:1.6, margin:0 }}>{tip}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* COMING SOON — Sources */}
        <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:.32}}
          style={{ background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:22, padding:'18px 20px', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <BookOpen size={18} color="var(--t3)"/>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--t2)' }}>Sources & références — Bientôt</div>
          </div>
          <p style={{ fontSize:13, color:'var(--t3)', lineHeight:1.6 }}>
            Prochainement : articles scientifiques, recommandations de coachs certifiés et nutritionnistes, études cliniques sur l&apos;hypertrophie et la performance — directement intégrés à ton bilan pour valider chaque conseil avec des preuves.
          </p>
          <div style={{ marginTop:12, display:'flex', gap:8 }}>
            {['PubMed', 'NSCA', 'ISSN', 'Examine.com'].map(src => (
              <span key={src} style={{ padding:'4px 10px', borderRadius:99, background:'var(--s3)', fontSize:11, fontWeight:600, color:'var(--t3)' }}>{src}</span>
            ))}
          </div>
        </motion.div>

        {/* FOOTER STATS */}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.36}}
          style={{ textAlign:'center', padding:'10px 0 4px', color:'var(--t3)', fontSize:12 }}>
          <Zap size={12} style={{ display:'inline', marginRight:4 }}/>
          {logs.length} séance{logs.length !== 1 ? 's' : ''} complétée{logs.length !== 1 ? 's' : ''} · Streak {streak} jour{streak !== 1 ? 's' : ''}
        </motion.div>

      </div>
    </AppShell>
  );
}
