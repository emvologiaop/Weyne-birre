import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Loader2, Sparkles, User, Bot, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTransactions, useAccounts, useCategories, useBudgets } from '../lib/hooks/useFinanceData';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default function AIAdvisorPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hello! I'm your ወይኔ ብሬ AI Advisor. How can I help you with your finances today? I can analyze your spending, help you set budgets, or give you tips on saving." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { transactions } = useTransactions();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { budgets } = useBudgets();

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
        - Total Balance: ${formatCurrency(accounts.reduce((sum, acc) => sum + acc.balance, 0))}
        - Recent Transactions: ${transactions.slice(0, 10).map(tx => `${tx.name}: ${formatCurrency(tx.amount)} (${tx.type})`).join(', ')}
        - Active Budgets: ${budgets.length}
        - Categories: ${categories.map(c => c.name).join(', ')}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: `You are a professional financial advisor for an app called "ወይኔ ብሬ". Use the following context to help the user: ${context}. User question: ${userMessage}` }] }
        ]
      });

      const responseText = response.text;
      setMessages(prev => [...prev, { role: 'assistant', content: responseText || "I'm sorry, I couldn't generate a response." }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-[#141414] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-emerald-500/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">AI Financial Advisor</h2>
            <p className="text-sm text-white/40">Powered by Gemini AI</p>
          </div>
        </div>
        <Link to="/" className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-500 text-white rounded-tr-none' 
                  : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none">
                <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-white/10 bg-black/20">
        <div className="relative max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about your finances..."
            className="w-full pl-6 pr-16 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-emerald-500/50 transition-colors shadow-inner"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-white/20 text-center mt-4">
          Your AI Advisor analyzes your local data to provide personalized insights.
        </p>
      </div>
    </motion.div>
  );
}
