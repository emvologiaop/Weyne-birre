import { useState } from 'react';
import { Bug, X, Send, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';

const TELEGRAM_URL = 'https://t.me/envologia';

export function ReportBugButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'menu' | 'form'>('menu');
  const [bugText, setBugText] = useState('');
  const { user } = useAuth();

  const handleSubmit = () => {
    if (!bugText.trim()) return;
    const encoded = encodeURIComponent(
      `🐛 Bug Report from Birr Tracker\n\nUser: ${user?.email ?? 'unknown'}\n\nDescription:\n${bugText}`
    );
    window.open(`https://t.me/envologia?text=${encoded}`, '_blank');
    setBugText('');
    setStep('menu');
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep('menu');
    setBugText('');
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 bg-[#1a1a1a] dark:bg-[#1a1a1a] light:bg-white/90 border border-white/10 light:border-black/10 text-white/90 light:text-black/70 hover:text-brand hover:border-brand/30 px-4 py-3 rounded-2xl shadow-2xl transition-all duration-300 backdrop-blur-xl group"
        title="Report a bug"
      >
        <Bug className="w-4 h-4 text-brand group-hover:animate-bounce" />
        <span className="text-[11px] font-bold uppercase tracking-widest hidden sm:block">Report Bug</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[70] backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed bottom-20 left-6 z-[80] w-80 bg-[#141414] light:bg-white border border-white/10 light:border-black/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] light:border-black/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                    <Bug className="w-4 h-4 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white light:text-black">Report a Bug</p>
                    <p className="text-[10px] text-white/65 light:text-black/40">Help us improve Birr Tracker</p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/5 light:hover:bg-black/5 text-white/65 light:text-black/30 hover:text-white light:hover:text-black transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {step === 'menu' ? (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="p-5 space-y-3"
                  >
                    <button
                      onClick={() => setStep('form')}
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/[0.03] light:bg-black/[0.03] hover:bg-brand/10 border border-white/[0.05] light:border-black/[0.05] hover:border-brand/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Bug className="w-4 h-4 text-white/65 light:text-black/30 group-hover:text-brand" />
                        <span className="text-sm font-medium text-white/90 light:text-black/70 group-hover:text-white light:group-hover:text-black">Describe the bug</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/55 light:text-black/20 group-hover:text-brand" />
                    </button>

                    <a
                      href={TELEGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/[0.03] light:bg-black/[0.03] hover:bg-[#229ED9]/10 border border-white/[0.05] light:border-black/[0.05] hover:border-[#229ED9]/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-white/65 light:text-black/30 group-hover:text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.018 9.51c-.148.674-.543.838-1.1.521l-3.05-2.247-1.47 1.416c-.163.163-.3.3-.614.3l.218-3.09 5.63-5.087c.245-.218-.053-.34-.38-.122l-6.953 4.375-2.995-.937c-.652-.204-.664-.652.136-.965l11.702-4.512c.543-.196 1.018.133.894.838z"/>
                        </svg>
                        <span className="text-sm font-medium text-white/90 light:text-black/70 group-hover:text-white light:group-hover:text-black">Chat on Telegram</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/55 light:text-black/20 group-hover:text-[#229ED9]" />
                    </a>

                    <p className="text-[10px] text-white/55 light:text-black/30 text-center px-2 leading-relaxed">
                      Your feedback helps make Birr Tracker better for everyone.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="p-5 space-y-4"
                  >
                    <textarea
                      autoFocus
                      value={bugText}
                      onChange={(e) => setBugText(e.target.value)}
                      placeholder="What happened? What did you expect? Which page?"
                      rows={5}
                      className="w-full px-4 py-3 bg-white/[0.03] light:bg-black/[0.03] border border-white/[0.08] light:border-black/[0.08] rounded-2xl text-sm text-white light:text-black placeholder:text-white/55 light:placeholder:text-black/30 focus:outline-none focus:border-brand/30 resize-none transition-colors leading-relaxed"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep('menu')}
                        className="flex-1 py-2.5 rounded-xl bg-white/[0.03] light:bg-black/[0.03] border border-white/[0.05] light:border-black/[0.05] text-sm font-medium text-white/78 light:text-black/50 hover:text-white light:hover:text-black transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={!bugText.trim()}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand text-black text-sm font-bold hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
