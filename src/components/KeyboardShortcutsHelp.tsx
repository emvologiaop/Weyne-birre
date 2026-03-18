import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

const shortcuts = [
  { keys: ['G'], description: 'Go to Dashboard' },
  { keys: ['T'], description: 'Go to Transactions' },
  { keys: ['A'], description: 'Go to Accounts' },
  { keys: ['B'], description: 'Go to Budgets' },
  { keys: ['S'], description: 'Go to Subscriptions' },
  { keys: ['R'], description: 'Go to Reports' },
  { keys: ['I'], description: 'Import Bank Statement' },
  { keys: ['W'], description: 'Net Worth Timeline' },
  { keys: ['N'], description: 'Quick Add Transaction' },
  { keys: ['Shift', 'T'], description: 'Transfer Between Accounts' },
  { keys: ['?'], description: 'Show/hide this help' },
  { keys: ['Esc'], description: 'Close any modal' },
];

export function KeyboardShortcutsHelp() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === '?') { e.preventDefault(); setVisible(v => !v); }
      if (e.key === 'Escape') setVisible(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Help trigger */}
      <button onClick={() => setVisible(true)}
        className="fixed bottom-6 right-24 z-50 w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/20 transition-all shadow-lg"
        title="Keyboard shortcuts (?)">
        <Keyboard className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {visible && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" onClick={() => setVisible(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[95] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-[#141414] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto">
                <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <Keyboard className="w-5 h-5 text-brand" />
                    <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
                  </div>
                  <button onClick={() => setVisible(false)} className="text-white/30 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 grid grid-cols-1 gap-2">
                  {shortcuts.map(sc => (
                    <div key={sc.description} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                      <span className="text-sm text-white/60">{sc.description}</span>
                      <div className="flex items-center gap-1">
                        {sc.keys.map(k => (
                          <kbd key={k} className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] font-mono font-bold text-white/60">{k}</kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-6 pb-4 text-center">
                  <p className="text-xs text-white/20">Press <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-white/40 font-mono text-[10px]">?</kbd> to toggle this panel</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
