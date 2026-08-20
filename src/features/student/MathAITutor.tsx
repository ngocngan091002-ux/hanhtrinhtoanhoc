import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, X, MessageSquare, BookOpen, Lightbulb, FileText, Minimize2, ChevronUp } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

export const MathAITutor: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Xin chào em! Cô Trợ Giảng AI Toán Lớp 2 đây 👋 Em có câu hỏi hay bài toán nào cần cô hướng dẫn từng bước không?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    '💡 Hướng dẫn em giải phép nhân 5 × 4',
    '📘 Tóm tắt cách làm bài toán có lời văn',
    '📐 Hình chữ nhật khác hình vuông thế nào?',
    '⚡ Mẹo tính nhẩm 15 - 7 cực nhanh',
  ];

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    // AI Grade 2 Math Tutor Response Logic
    setTimeout(() => {
      let botReply = '';

      if (text.includes('5 × 4') || text.includes('phép nhân')) {
        botReply = '✨ **Phép nhân 5 × 4 nghĩa là:** lấy số 5 cộng lại 4 lần!\n👉 **Cách tính:** 5 + 5 + 5 + 5 = 20.\n🎉 Vậy **5 × 4 = 20** nhé em!';
      } else if (text.includes('lời văn') || text.includes('bài toán')) {
        botReply = '📘 **3 Bước Giải Bài Toán Có Lời Văn Lớp 2:**\n1️⃣ **Đọc kỹ đề bài:** Xem bài toán cho gì và hỏi gì.\n2️⃣ **Viết Tóm Tắt:** Ví dụ: Có 15 quả táo, cho 7 quả.\n3️⃣ **Viết Phép Tính & Đáp Số:** 15 - 7 = 8 (quả táo). Đáp số: 8 quả táo!';
      } else if (text.includes('hình') || text.includes('vuông') || text.includes('chữ nhật')) {
        botReply = '📐 **Bí quyết phân biệt:**\n• **Hình vuông:** Có 4 cạnh bằng nhau chằn chặn!\n• **Hình chữ nhật:** Có 2 cạnh dài bằng nhau và 2 cạnh ngắn bằng nhau.';
      } else if (text.includes('15 - 7') || text.includes('tính nhẩm')) {
        botReply = '⚡ **Mẹo tính nhẩm 15 - 7:**\n• Tách 7 thành 5 và 2.\n• Lấy 15 - 5 = 10.\n• Rồi lấy 10 - 2 = 8.\n👉 Vậy **15 - 7 = 8** rất dễ đúng không nào!';
      } else {
        botReply = `🤖 Cô Trợ Giảng AI đã đọc thắc mắc của em về "${text}":\n\nĐối với kiến thức Toán Lớp 2, em hãy luôn tách số tròn chục hoặc dùng sơ đồ hình ảnh để tính nhanh nhé! Em cần cô giải thích chi tiết hơn về ví dụ nào không?`;
      }

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Toggle Button (Bottom-Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[99999] bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 text-white p-4 rounded-full shadow-2xl border-4 border-amber-300 flex items-center space-x-2.5 transition-all transform hover:scale-110 active:scale-95 group cursor-pointer animate-pulse"
        >
          <div className="relative">
            <Bot className="w-7 h-7 text-amber-300 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
          </div>
          <span className="font-black text-xs tracking-wide hidden sm:inline font-display text-white drop-shadow-md">
            🤖 ADV-01: AI TRỢ GIẢNG TOÁN LỚP 2
          </span>
        </button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-[99999] w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-3xl shadow-2xl border-4 border-sky-400 overflow-hidden flex flex-col h-[540px] transition-all animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-amber-300 font-bold">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <span className="bg-emerald-400 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  ADV-01: AI TRỢ GIẢNG LỚP 2
                </span>
                <h4 className="font-extrabold text-sm font-display text-white">Cô Trợ Giảng Toán Học 🤖</h4>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-xl transition-colors text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl shadow-xs space-y-1 ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white font-medium rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none font-sans'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  <span
                    className={`text-[9px] block text-right font-mono ${
                      msg.sender === 'user' ? 'text-sky-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl text-slate-500 font-bold flex items-center space-x-2 text-xs">
                  <div className="w-2 h-2 bg-sky-500 rounded-full animate-ping"></div>
                  <span>Cô Trợ Giảng AI đang suy nghĩ câu trả lời...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2 bg-slate-100 border-t border-slate-200 flex overflow-x-auto gap-1.5 scrollbar-none">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p)}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-sky-50 text-[10px] font-bold text-sky-800 border border-slate-200 shrink-0 transition-all cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Hỏi cô bài toán hay thắc mắc..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim()}
              className="bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white p-2 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
