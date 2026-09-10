'use client';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square } from 'lucide-react';

interface VoiceInputProps {
  onResult: (text: string) => void;
  lang?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRec = any;

export default function VoiceInput({ onResult, lang = 'fr-FR' }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [error, setError]         = useState('');
  const recRef = useRef<AnyRec>(null);

  const start = useCallback(() => {
    setError('');
    const w = window as Record<string, AnyRec>;
    const SRClass = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SRClass) { setError('Non supporté — utilise Safari ou Chrome'); return; }

    const rec = new SRClass();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart  = () => setListening(true);
    rec.onend    = () => setListening(false);
    rec.onerror  = (e: AnyRec) => { setError(`Erreur : ${e.error}`); setListening(false); };
    rec.onresult = (e: AnyRec) => { onResult(e.results[0][0].transcript); };
    rec.start();
    recRef.current = rec;
  }, [lang, onResult]);

  const stop = useCallback(() => { recRef.current?.stop(); setListening(false); }, []);

  return (
    <div style={{ position:'relative', display:'inline-flex', alignItems:'center' }}>
      <motion.button
        whileTap={{ scale:.88 }}
        onClick={listening ? stop : start}
        style={{
          width:44, height:44, borderRadius:14, cursor:'pointer',
          background: listening ? 'rgba(255,98,64,0.15)' : 'var(--s2)',
          display:'flex', alignItems:'center', justifyContent:'center',
          border: `1.5px solid ${listening ? 'rgba(255,98,64,0.4)' : 'var(--bd)'}`,
          color: listening ? '#ff6240' : 'var(--t3)',
          transition: 'all .2s',
          position:'relative', flexShrink:0,
        }}
      >
        {listening && (
          <motion.div
            animate={{ scale:[1,1.6,1], opacity:[.4,0,.4] }}
            transition={{ duration:1.2, repeat:Infinity }}
            style={{ position:'absolute', inset:-4, borderRadius:18, background:'rgba(255,98,64,0.12)', pointerEvents:'none' }}
          />
        )}
        {listening ? <Square size={15} fill="#ff6240" color="#ff6240"/> : <Mic size={18}/>}
      </motion.button>

      <AnimatePresence>
        {error && (
          <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            style={{ position:'absolute', bottom:'calc(100% + 8px)', right:0, padding:'6px 10px', borderRadius:10, background:'rgba(255,69,58,0.12)', border:'1px solid rgba(255,69,58,0.25)', fontSize:11, color:'#ff453a', whiteSpace:'nowrap', zIndex:10 }}>
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
