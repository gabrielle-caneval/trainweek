'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@/hooks/useUser';
import dynamic from 'next/dynamic';

const BottomNav = dynamic(() => import('./BottomNav'), { ssr: false });

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, hydrated } = useUser();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) router.replace('/');
  }, [hydrated, isLoggedIn, router]);

  if (!hydrated) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ width:28, height:28, borderRadius:'50%', border:'2px solid var(--s3)', borderTopColor:'var(--ac)' }} className="spin"/>
    </div>
  );

  if (!isLoggedIn) return null;

  return (
    <>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ height: '100%' }}
      >
        {children}
      </motion.div>
      <BottomNav />
    </>
  );
}
