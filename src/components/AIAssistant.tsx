import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AIAssistant() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: 'Merhaba! Kuzularınız ve koyunlarınızın sağlığı, bakımı veya beslenmesi hakkında size nasıl yardımcı olabilirim?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Üzgünüm, şu an yanıt veremiyorum.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden mt-6">
      <div className="p-4 bg-black text-white flex items-center gap-2">
        <div className="bg-white/20 p-2 rounded-xl">
          <Sparkles size={18} />
        </div>
        <div>
          <h2 className="font-bold text-sm tracking-tight italic">Yapay Zeka Danışmanı</h2>
          <p className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Veteriner & Bakım Uzmanı</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`p-2 rounded-xl h-fit ${m.role === 'user' ? 'bg-gray-100' : 'bg-black text-white'}`}>
                {m.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-gray-50 text-gray-800' : 'bg-gray-900 text-gray-100'
              }`}>
                {m.text}
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center text-gray-400">
              <Loader2 className="animate-spin" size={18} />
              <span className="text-xs font-mono uppercase tracking-widest">Yanıt Hazırlanıyor...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Kuzular hakkında soru sorun..."
          className="flex-1 bg-white p-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-black/5 text-sm"
        />
        <button 
          disabled={isLoading}
          className="bg-black text-white p-3 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
