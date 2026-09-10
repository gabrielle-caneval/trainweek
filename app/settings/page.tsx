'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, User, Bell, Key, Star, HelpCircle, LogOut, Shield, Dumbbell, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useUser } from '@/hooks/useUser';
import { useLocalStorage } from '@/hooks/useStorage';
import { useWorkout } from '@/hooks/useWorkout';
import { calculateBMI, getStreakFromLogs, getBMICategory } from '@/lib/utils';

const AVATARS = [
  'Felix','Alex','Jordan','Sam','Taylor','Morgan','Riley','Casey','Parker','Quinn',
  'Drew','Blake','Avery','Harper','Sage','River','Reese','Finley','Rowan','Emery',
];

const avatarUrl = (seed:string) => `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,d1d4f9,c0aede,ffdfbf`;

export default function SettingsPage() {
  const { user, logout, update } = useUser();
  const { logs, weights }        = useWorkout();
  const [groqKey, setGroqKey]    = useLocalStorage('tw_groq_key', '');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [editWeight, setEditWeight] = useState('');
  const [showWeightEdit, setShowWeightEdit] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const router = useRouter();

  const streak     = getStreakFromLogs(logs);
  const current    = weights[0]?.weight ?? user?.weight ?? 0;
  const bmi        = user ? calculateBMI(current || user.weight, user.height) : 0;
  const bmiCat     = bmi > 0 ? getBMICategory(bmi) : null;
  const currentAvatar = user?.avatarSeed || user?.firstName || 'Alex';

  const handleLogout = () => {
    if (!confirmLogout) { setConfirmLogout(true); return; }
    logout();
    router.replace('/');
  };

  const S = {
    row:   { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--bd)', cursor:'pointer' } as React.CSSProperties,
    icon:  { width:36, height:36, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 } as React.CSSProperties,
    label: { fontSize:14, fontWeight:600, color:'var(--t1)', marginLeft:12 } as React.CSSProperties,
  };

  return (
    <AppShell>
      <div className="page-scroll" style={{ paddingInline:0 }}>

        {/* HEADER */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingInline:20, marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={()=>router.back()} style={{ width:36,height:36,borderRadius:11,background:'var(--s2)',border:'1px solid var(--bd)',color:'var(--t2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
              <ChevronLeft size={18}/>
            </button>
            <span style={{ fontSize:18, fontWeight:700, color:'var(--t1)' }}>Paramètres</span>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <ThemeToggle/>
            <button onClick={()=>setShowAvatarPicker(v=>!v)}
              style={{ position:'relative', width:44,height:44,borderRadius:'50%',overflow:'visible',background:'transparent',border:'none',cursor:'pointer',padding:0 }}>
              <div style={{ width:44,height:44,borderRadius:'50%',overflow:'hidden',border:'2px solid var(--ac)',background:'#D1D4F9' }}>
                <img src={avatarUrl(currentAvatar)} alt="avatar" style={{ width:'100%',height:'100%' }}/>
              </div>
              <div style={{ position:'absolute',bottom:-2,right:-2,width:18,height:18,borderRadius:'50%',background:'var(--ac)',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid var(--bg)' }}>
                <Camera size={9} color="#07070d"/>
              </div>
            </button>
          </div>
        </div>

        {/* AVATAR PICKER */}
        <AnimatePresence>
          {showAvatarPicker && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
              style={{ overflow:'hidden', paddingInline:20, marginBottom:16 }}>
              <div style={{ padding:16, borderRadius:20, background:'var(--s1)', border:'1px solid var(--bd)' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--t1)', marginBottom:12 }}>Changer d&apos;avatar</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
                  {AVATARS.map(a=>(
                    <button key={a} onClick={()=>{ update({ avatarSeed:a }); setShowAvatarPicker(false); }}
                      style={{ aspectRatio:'1', borderRadius:'50%', overflow:'hidden', border:`3px solid ${a===currentAvatar?'var(--ac)':'transparent'}`, cursor:'pointer', background:'#D1D4F9', transition:'all .15s', padding:0,
                        boxShadow: a===currentAvatar ? '0 0 0 3px var(--ac2)' : 'none' }}>
                      <img src={avatarUrl(a)} alt={a} style={{ width:'100%',height:'100%' }}/>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ paddingInline:20 }}>
          {/* PREMIUM BANNER */}
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
            style={{ padding:'18px 20px', borderRadius:20, background:'linear-gradient(135deg, #7C3AED, #A855F7)', marginBottom:24, cursor:'pointer' }}>
            <div style={{ fontSize:17, fontWeight:800, color:'#fff', marginBottom:4 }}>TrainWeek Pro</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,.75)' }}>Coach IA illimité · Analyses avancées</div>
            <div style={{ marginTop:10, display:'inline-block', padding:'6px 14px', borderRadius:99, background:'rgba(255,255,255,.2)', fontSize:12, fontWeight:700, color:'#fff' }}>
              Actif avec ta clé Groq
            </div>
          </motion.div>

          {/* PROFILE CARD */}
          <div style={{ padding:18, borderRadius:20, background:'var(--s1)', border:'1px solid var(--bd)', marginBottom:20, boxShadow:'var(--shadow)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{ width:60,height:60,borderRadius:'50%',overflow:'hidden',border:'2.5px solid var(--ac)',background:'#D1D4F9' }}>
                  <img src={avatarUrl(currentAvatar)} alt="" style={{ width:'100%',height:'100%' }}/>
                </div>
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:16, color:'var(--t1)' }}>{user?.firstName} {user?.lastName}</div>
                <div style={{ fontSize:13, color:'var(--t2)', marginTop:2 }}>{user?.goal} · {user?.level}</div>
                {user?.equipment && (
                  <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>
                    {user.equipment === 'bodyweight' ? 'Poids du corps' : user.equipment === 'home' ? 'Matériel maison' : 'Salle de sport'}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {[
                { label:'Séances', value:logs.length, color:'var(--ac)' },
                { label:'Streak',  value:`${streak}j`, color:'var(--orange)' },
              ].map(({label,value,color})=>(
                <div key={label} style={{ textAlign:'center', padding:'12px 8px', borderRadius:14, background:'var(--s2)', flex:1 }}>
                  <div style={{ fontWeight:900, fontSize:22, color }}>{value}</div>
                  <div style={{ fontSize:11, color:'var(--t3)', marginTop:3, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</div>
                </div>
              ))}
              {/* BMI with color indicator */}
              {bmi > 0 && bmiCat && (
                <div style={{ textAlign:'center', padding:'12px 8px', borderRadius:14, background:bmiCat.bg, flex:1, border:`1px solid ${bmiCat.color}25` }}>
                  <div style={{ fontWeight:900, fontSize:22, color:bmiCat.color }}>{bmi}</div>
                  <div style={{ fontSize:9, color:bmiCat.color, marginTop:2, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', opacity:.8 }}>{bmiCat.label}</div>
                </div>
              )}
            </div>
          </div>

          {/* COMPTE */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--t1)', marginBottom:12 }}>Compte</div>
            <div style={{ background:'var(--s1)', borderRadius:18, paddingInline:16, boxShadow:'var(--shadow)' }}>

              <div style={S.row} onClick={()=>setShowWeightEdit(v=>!v)}>
                <div style={{ display:'flex', alignItems:'center' }}>
                  <div style={{ ...S.icon, background:'rgba(124,58,237,0.1)' }}><User size={16} color="var(--ac)"/></div>
                  <span style={S.label}>Profil — {current}kg · {user?.height}cm</span>
                </div>
                <ChevronRight size={16} color="var(--t3)"/>
              </div>

              {showWeightEdit && (
                <div style={{ paddingBottom:14 }}>
                  <div style={{ display:'flex', gap:10 }}>
                    <input value={editWeight} onChange={e=>setEditWeight(e.target.value)} className="fi" type="number" placeholder={`Poids actuel: ${current}kg`} inputMode="decimal" style={{ flex:1, fontSize:14 }}/>
                    <button onClick={()=>{if(+editWeight>0){update({weight:+editWeight});setEditWeight('');setShowWeightEdit(false);}}}
                      style={{ padding:'0 16px',borderRadius:14,background:'var(--ac)',border:'none',color:'#07070d',fontWeight:700,fontSize:14,cursor:'pointer' }}>
                      OK
                    </button>
                  </div>
                </div>
              )}

              <div style={S.row}>
                <div style={{ display:'flex', alignItems:'center' }}>
                  <div style={{ ...S.icon, background:'rgba(59,130,246,0.1)' }}><Bell size={16} color="#3B82F6"/></div>
                  <span style={S.label}>Notifications</span>
                </div>
                <ChevronRight size={16} color="var(--t3)"/>
              </div>

              <div style={{ ...S.row, borderBottom:'none' }}>
                <div style={{ display:'flex', alignItems:'center' }}>
                  <div style={{ ...S.icon, background:'rgba(234,179,8,0.1)' }}><Key size={16} color="#EAB308"/></div>
                  <div>
                    <span style={S.label}>Clé API Groq</span>
                    <div style={{ fontSize:11, color:groqKey?'#22C55E':'var(--t3)', marginLeft:12, fontWeight:600 }}>{groqKey ? 'Connectée' : 'Non configurée'}</div>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--t3)"/>
              </div>

              <div style={{ paddingBottom:14 }}>
                <input type="password" value={groqKey} onChange={e=>setGroqKey(e.target.value)} className="fi" placeholder="gsk_... — console.groq.com/keys" style={{ fontSize:13 }}/>
                <div style={{ fontSize:11, color:'var(--t3)', marginTop:6 }}>Gratuite sur console.groq.com · Reste sur ton appareil</div>
              </div>
            </div>
          </div>

          {/* MORE */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--t1)', marginBottom:12 }}>Plus</div>
            <div style={{ background:'var(--s1)', borderRadius:18, paddingInline:16, boxShadow:'var(--shadow)' }}>
              <div style={S.row} onClick={()=>router.push('/dashboard')}>
                <div style={{ display:'flex', alignItems:'center' }}>
                  <div style={{ ...S.icon, background:'rgba(251,146,60,0.1)' }}><Dumbbell size={16} color="#FB923C"/></div>
                  <span style={S.label}>Mon programme</span>
                </div>
                <ChevronRight size={16} color="var(--t3)"/>
              </div>
              <div style={S.row}>
                <div style={{ display:'flex', alignItems:'center' }}>
                  <div style={{ ...S.icon, background:'rgba(234,179,8,0.1)' }}><Star size={16} color="#EAB308"/></div>
                  <span style={S.label}>Noter l&apos;application</span>
                </div>
                <ChevronRight size={16} color="var(--t3)"/>
              </div>
              <div style={{ ...S.row, borderBottom:'none' }}>
                <div style={{ display:'flex', alignItems:'center' }}>
                  <div style={{ ...S.icon, background:'rgba(99,102,241,0.1)' }}><HelpCircle size={16} color="#6366F1"/></div>
                  <span style={S.label}>Aide & Support</span>
                </div>
                <ChevronRight size={16} color="var(--t3)"/>
              </div>
            </div>
          </div>

          {/* LOGOUT */}
          <button onClick={handleLogout} className="btn-pill btn-danger" style={{ width:'100%' }}>
            <LogOut size={16}/>
            {confirmLogout ? 'Confirmer la déconnexion' : 'Se déconnecter'}
          </button>

          {/* Spacer for bottom nav */}
          <div style={{ height:20 }}/>
        </div>
      </div>
    </AppShell>
  );
}
