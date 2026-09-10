'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Flame, Target, Scale, Award, LogOut, ChevronRight } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useWorkout } from '@/hooks/useWorkout';
import { calculateBMI, getStreakFromLogs } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { BADGES } from '@/lib/data';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, logout } = useUser();
  const { logs, weights } = useWorkout();
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (!user) return null;

  const streak = getStreakFromLogs(logs);
  const bmi    = calculateBMI(user.weight, user.height);
  const cw     = weights[0]?.weight ?? user.weight;

  const avatarUrl = (seed: string) =>
    `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,d1d4f9`;

  const unlockedBadges = BADGES.map(b => ({
    ...b,
    unlocked:
      (b.id === 'first'   && logs.length >= 1)  ||
      (b.id === 'streak7' && streak >= 7)        ||
      (b.id === 'iron'    && logs.length >= 50)  ||
      (b.id === 'month'   && logs.length >= 20),
  }));

  const handleLogout = () => {
    if (!confirmLogout) { setConfirmLogout(true); return; }
    logout(); onClose(); router.replace('/');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={e => e.target === e.currentTarget && onClose()}
          style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end' }}
        >
          <motion.div
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            exit={{ y: 60 }}
            transition={{ type:'spring', stiffness:320, damping:32 }}
            style={{ width:'100%', maxWidth:430, background:'var(--s1)', borderRadius:'28px 28px 0 0', border:'1px solid var(--bd)', maxHeight:'88dvh', display:'flex', flexDirection:'column', overflow:'hidden', paddingBottom:'max(env(safe-area-inset-bottom),8px)' }}
          >
            {/* Handle */}
            <div style={{ width:36, height:4, background:'var(--s3)', borderRadius:99, margin:'12px auto 0' }}/>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 0' }}>
              <span style={{ fontSize:17, fontWeight:700, color:'var(--t1)' }}>Mon profil</span>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>{onClose();router.push('/settings');}}
                  style={{ fontSize:13, fontWeight:600, color:'var(--ac)', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                  Paramètres <ChevronRight size={14}/>
                </button>
                <button onClick={onClose}
                  style={{ width:32,height:32,borderRadius:'50%',background:'var(--s2)',border:'1px solid var(--bd)',color:'var(--t2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
                  <X size={15}/>
                </button>
              </div>
            </div>

            {/* Scroll body */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>

              {/* Avatar + name */}
              <div style={{ display:'flex', alignItems:'center', gap:16, padding:18, borderRadius:20, background:'var(--s2)', border:'1px solid var(--bd)', marginBottom:14 }}>
                <div style={{ width:64,height:64,borderRadius:'50%',overflow:'hidden',border:'2.5px solid var(--ac)',background:'#D1D4F9',flexShrink:0 }}>
                  <img src={avatarUrl(user.avatarSeed || user.firstName)} alt="avatar" style={{ width:'100%',height:'100%' }}/>
                </div>
                <div>
                  <div style={{ fontSize:18, fontWeight:800, color:'var(--t1)' }}>{user.firstName} {user.lastName}</div>
                  <div style={{ fontSize:13, color:'var(--t2)', marginTop:3 }}>{user.goal} · {user.level}</div>
                  <div style={{ fontSize:12, color:'var(--t3)', marginTop:1 }}>Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</div>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:14 }}>
                {[
                  { label:'Séances', value:logs.length,  color:'var(--ac)',   Icon:Zap },
                  { label:'Streak',  value:`${streak}j`, color:'var(--push)', Icon:Flame },
                  { label:'Poids',   value:`${cw}kg`,    color:'var(--legs)', Icon:Scale },
                  { label:'IMC',     value:bmi,           color:'var(--pull)', Icon:Target },
                ].map(({label,value,color,Icon})=>(
                  <div key={label} style={{ padding:'12px 8px', borderRadius:16, background:'var(--s2)', border:'1px solid var(--bd)', textAlign:'center' }}>
                    <Icon size={16} color={color} style={{ margin:'0 auto 5px' }}/>
                    <div style={{ fontWeight:800, fontSize:17, color, lineHeight:1 }}>{value}</div>
                    <div style={{ fontSize:10, color:'var(--t3)', marginTop:3, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Info */}
              <div style={{ padding:'0 4px', marginBottom:14 }}>
                {[
                  { label:'Objectif', value:user.goal },
                  { label:'Niveau',   value:user.level },
                  { label:'Taille',   value:`${user.height} cm` },
                  { label:'Âge',      value:`${user.age} ans` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--bd)' }}>
                    <span style={{ fontSize:14, color:'var(--t2)', fontWeight:500 }}>{label}</span>
                    <span style={{ fontSize:14, color:'var(--t1)', fontWeight:700 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Badges */}
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <Award size={16} color="var(--ac)"/>
                  <span style={{ fontSize:14, fontWeight:700, color:'var(--t1)' }}>Achievements</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                  {unlockedBadges.map(b => (
                    <div key={b.id} style={{ padding:'12px 8px', borderRadius:16, textAlign:'center', background: b.unlocked ? 'var(--ac2)' : 'var(--s2)', border:`1px solid ${b.unlocked ? 'var(--ac)' : 'var(--bd)'}30`, opacity: b.unlocked ? 1 : 0.4 }}>
                      <div style={{ fontSize:22, marginBottom:4 }}>{b.icon}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--t1)', lineHeight:1.3 }}>{b.name}</div>
                      <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>{b.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logout */}
              <button onClick={handleLogout}
                className="btn-pill btn-danger"
                style={{ width:'100%' }}>
                <LogOut size={15}/>
                {confirmLogout ? 'Confirmer la déconnexion' : 'Se déconnecter'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
