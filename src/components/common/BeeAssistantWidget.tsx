import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  Languages,
  RotateCcw,
  Bot,
  User,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const BeeAssistantWidget: React.FC = () => {
  const { language: appLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [chatLang, setChatLang] = useState<'en' | 'hi'>(appLang === 'hi' ? 'hi' : 'en');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: 'assistant',
      content:
        appLang === 'hi'
          ? 'नमस्ते! मैं मधुमित्र (Madhubot) हूँ — हनी चेन का विशेषज्ञ एआई सहायक। शहद की शुद्धता, FSSAI मानकों, छत्ते के रख-रखाव या ब्लॉकचेन क्यूआर कोड के बारे में कुछ भी पूछें!'
          : 'Hello! I am Madhubot, your expert AI Bee Assistant for Honey Chain. Ask me about honey purity, FSSAI regulations, brood temperature, or blockchain QR verification!',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickPrompts = {
    en: [
      'What are FSSAI honey purity limits?',
      'Ideal brood chamber temperature?',
      'How to verify jar QR code on blockchain?',
      'Explain 88% direct beekeeper payout',
    ],
    hi: [
      'FSSAI शहद शुद्धता के मानक क्या हैं?',
      'छत्ते का आदर्श तापमान और आर्द्रता कितनी होनी चाहिए?',
      'जार का क्यूआर कोड कैसे सत्यापित करें?',
      'मधुमक्खी पालकों को 88% सीधा भुगतान कैसे मिलता है?',
    ],
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      const res = await fetch('/api/ai/bee-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language: chatLang,
          history: historyPayload,
        }),
      });

      const data = await res.json();
      if (data && data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error(data?.error || 'No reply from Madhubot');
      }
    } catch (err) {
      console.warn('Bee assistant note:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            chatLang === 'hi'
              ? 'नमस्ते! मैं मधुमित्र हूँ। शुद्ध शहद में FSSAI मानक अनुसार नमी अधिकतम 20% होनी चाहिए। छत्ते का तापमान 32°C-36°C उत्तम होता है। कोई अन्य प्रश्न पूछें।'
              : 'Hello! I am Madhubot. According to FSSAI guidelines, pure honey must have ≤20% moisture and pass C4 sugar screening. How else may I assist you?',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          chatLang === 'hi'
            ? 'चर्चा रीसेट हो गई है। आप शहद और छत्ते की देखभाल से जुड़ा कोई भी नया प्रश्न पूछ सकते हैं!'
            : 'Conversation cleared! How can I assist you with apiculture or traceability today?',
      },
    ]);
  };

  return (
    <>
      {/* Floating launcher button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 p-3.5 rounded-full bg-linear-to-tr from-amber-600 via-amber-500 to-yellow-400 text-slate-950 shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition flex items-center gap-2 cursor-pointer border border-amber-300 group"
          title="Open Madhubot (Bee Assistant)"
          aria-label="Open Madhubot Bee Assistant"
        >
          <span className="text-xl leading-none">🐝</span>
          <span className="text-xs font-black tracking-tight hidden md:inline">
            {chatLang === 'hi' ? 'मधुमित्र' : 'Bee AI Assistant'}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-slate-950 group-hover:rotate-12 transition shrink-0" />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-50 w-[94vw] sm:w-[400px] h-[520px] max-h-[82vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-500/30 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="p-4 bg-linear-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/90 flex items-center justify-center text-lg shadow-xs">
                🐝
              </div>
              <div>
                <h3 className="font-black text-sm tracking-tight flex items-center gap-1.5">
                  <span>{chatLang === 'hi' ? 'मधुमित्र (Madhubot)' : 'Madhubot AI'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-950 text-amber-300 font-bold">
                    3.8 Flash
                  </span>
                </h3>
                <p className="text-[11px] font-medium text-slate-800">
                  {chatLang === 'hi' ? 'द्विभाषी शहद व छत्ता सहायक' : 'Bilingual Apiculture & Purity AI'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Language toggle */}
              <button
                onClick={() => setChatLang(chatLang === 'en' ? 'hi' : 'en')}
                className="px-2 py-1 rounded-xl bg-white/70 hover:bg-white text-slate-900 font-bold text-[11px] transition flex items-center gap-1"
                title="Switch Chat Language"
              >
                <Languages className="w-3 h-3 text-amber-800" />
                <span>{chatLang === 'en' ? 'EN' : 'हिंदी'}</span>
              </button>

              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-xl hover:bg-white/40 text-slate-900 transition"
                title="Clear Chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/40 text-slate-900 transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-amber-50/20 dark:bg-slate-950/40 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-sm">
                    🐝
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-amber-500 text-slate-950 font-semibold rounded-br-xs shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200 dark:border-slate-700 shadow-xs whitespace-pre-wrap'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-sm">
                  🐝
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] ml-1">Madhubot is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto flex gap-1.5 no-scrollbar">
            {quickPrompts[chatLang].map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/15 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-400 text-slate-600 dark:text-slate-300 text-[11px] font-medium whitespace-nowrap transition cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={chatLang === 'hi' ? 'मधुमित्र से पूछें...' : 'Ask Madhubot anything...'}
              disabled={loading}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs focus:ring-2 focus:ring-amber-500 dark:text-white"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition disabled:opacity-40 cursor-pointer shadow-xs"
              aria-label="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
