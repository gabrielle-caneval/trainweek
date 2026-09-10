'use client';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <motion.button whileTap={{scale:.88}} onClick={toggle}
      style={{
        width:40, height:40, borderRadius:12,
        background:'var(--s2)', border:'1.5px solid var(--bd)',
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', color:'var(--t2)', flexShrink:0,
      }}>
      {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
    </motion.button>
  );
}
