import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, User, Bot, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransactions, useAccounts, useCategories, useBudgets } from '../lib/hooks/useFinanceData';
import { formatCurrency, formatCurrencyShort } from "../lib/utils";
import { Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';


export default function AIAdvisorPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hi! I'm your AI money advisor. Ask me anything about your spending, budgets, or savings and I'll help you out." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { transactions } = useTransactions();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { budgets } = useBudgets();

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const context = `
        Current Financial Context:
        - Total Accounts: ${accounts.length}
        - Total Balance: ${formatCurrencyShort(totalBalance)}
        - Recent Transactions: ${transactions.slice(0, 10).map(tx => `${tx.description}: ${formatCurrencyShort(Math.abs(tx.amount))} (${tx.type})`).join(', ')}
        - Active Budgets: ${budgets.length}
        - Categories: ${categories.map(c => c.name).join(', ')}
      `;

      const response = await fetch(`${API_URL}/api/ai/advisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, message: userMessage })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.text || "I'm sorry, I couldn't generate a response." }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col gap-10 pb-12 overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />

      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-widest border border-brand/20">
              AI Powered
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-display font-bold text-white tracking-tighter leading-none">
            Your <span className="text-brand italic">AI Advisor</span>
          </h2>
          <p className="text-sm text-white/72 max-w-md font-medium leading-relaxed">
            Ask questions about your money, spending habits, or savings goals and get simple, helpful advice.
          </p>
        </div>
        
        {/* Context Badge */}
        <div className="px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] bg-brand/20 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-brand" />
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/55 uppercase tracking-widest">Your Data Loaded</p>
            <p className="text-xs font-bold text-white/84 tracking-tight">{transactions.length} transactions loaded</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full bg-[#141414]/50 backdrop-blur-3xl border border-white/[0.05] rounded-[40px] overflow-hidden shadow-2xl relative">
        {/* Chat Header */}
        <div className="px-8 py-6 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shadow-2xl">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg tracking-tight">Chat</h3>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                <span className="text-[10px] font-bold text-white/55 uppercase tracking-widest">Ready</span>
              </div>
            </div>
          </div>
          <Link to="/" className="p-3 text-white/45 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl ${
                    msg.role === 'user' 
                      ? 'bg-brand/10 border border-brand/20 text-brand' 
                      : 'bg-white/[0.03] border border-white/[0.05] text-white/72'
                  }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`p-6 rounded-[32px] text-sm leading-relaxed shadow-2xl relative overflow-hidden ${
                    msg.role === 'user' 
                      ? 'bg-brand text-black font-medium rounded-tr-none' 
                      : 'bg-white/[0.03] text-white/90 border border-white/[0.05] rounded-tl-none backdrop-blur-xl'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -z-10" />
                    )}
                    <div className="markdown-body prose prose-invert prose-sm max-w-none">
                      <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-5">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-brand">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] px-6 py-4 rounded-[24px] rounded-tl-none backdrop-blur-xl">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-brand"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-8 bg-white/[0.02] border-t border-white/[0.05]">
          <div className="relative max-w-4xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand/20 to-blue-500/20 rounded-[28px] blur opacity-0 group-focus-within:opacity-100 transition duration-1000" />
            <div className="relative flex items-center gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask me anything about your money..."
                className="w-full pl-8 pr-20 py-6 bg-[#0a0a0a] border border-white/[0.05] rounded-[24px] text-white placeholder:text-white/55 focus:outline-none focus:border-brand/30 transition-all shadow-2xl"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="absolute right-3 p-4 bg-brand text-black rounded-2xl hover:bg-brand-dark disabled:opacity-50 transition-all shadow-2xl active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex justify-center gap-8 mt-6">
            <button 
              onClick={() => setInput("How am I spending my money?")}
              className="text-[10px] font-bold text-white/55 uppercase tracking-widest hover:text-brand transition-colors"
            >
              Spending Analysis
            </button>
            <button 
              onClick={() => setInput("How am I doing with my budgets?")}
              className="text-[10px] font-bold text-white/55 uppercase tracking-widest hover:text-brand transition-colors"
            >
              Budget Audit
            </button>
            <button 
              onClick={() => setInput("Give me 3 tips to save more")}
              className="text-[10px] font-bold text-white/55 uppercase tracking-widest hover:text-brand transition-colors"
            >
              Saving Strategy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
