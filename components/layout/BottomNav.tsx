'use client';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Dumbbell, Bot, BarChart2, Utensils } from 'lucide-react';

const TABS = [
  { href:'/home',      icon:Home,      label:'Accueil'   },
  { href:'/dashboard', icon:Dumbbell,  label:'Séances'   },
  { href:'/coach',     icon:Bot,       label:'Coach'     },
  { href:'/stats',     icon:BarChart2, label:'Stats'     },
  { href:'/nutrition', icon:Utensils,  label:'Nutrition' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <nav style={{
      position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
      width:'100%', maxWidth:430, zIndex:200,
      padding:'10px 20px',
      paddingBottom:'max(env(safe-area-inset-bottom,0px),14px)',
      background:'var(--nav-bg)',
      backdropFilter:'blur(24px)',
      WebkitBackdropFilter:'blur(24px)',
      borderTop:'1px solid var(--bd)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-around' }}>
        {TABS.map(({ href, icon:Icon, label }) => {
          const active = pathname === href;
          return (
            <motion.button
              key={href}
              onClick={() => router.push(href)}
              whileTap={{ scale: .85 }}
              style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                padding:'6px 10px', background:'none', border:'none', cursor:'pointer',
                color: active ? 'var(--orange)' : 'var(--t2)',
                transition:'color .18s',
              }}>
              <Icon
                size={22}
                strokeWidth={active ? 2.4 : 1.7}
              />
              <span style={{
                fontSize:10, fontWeight: active ? 700 : 500,
                letterSpacing:'.03em',
                fontFamily:"'DM Sans', sans-serif",
              }}>
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
