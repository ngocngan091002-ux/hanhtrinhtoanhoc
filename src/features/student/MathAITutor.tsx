import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, X, MessageSquare, Lightbulb, HelpCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
      text: 'Xin chào em! Cô Trợ Lý AI Toán Lớp 2 đây 👋\n\nCô ở đây để **giải thích kiến thức, gợi ý cách làm và đặt câu hỏi dẫn dắt** giúp em tự làm được bài toán. Cô **không làm bài thay** và **không chấm điểm**, người chấm điểm chính thức luôn là Thầy/Cô giáo của em nhé!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    '🧭 Gợi ý cách làm phép cộng có nhớ',
    '❓ Đặt câu hỏi dẫn dắt bài toán lời văn',
    '🤝 Em chưa hiểu bài toán nhân 5',
    '📐 Phân biệt hình chữ nhật và hình vuông',
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

    // Pedagogical Socratic AI Logic
    setTimeout(() => {
      let botReply = '';
      const lower = text.toLowerCase();

      // Rule check: Request for direct answer or solving homework
      if (lower.includes('cho em đáp án') || lower.includes('giải hộ em') || lower.includes('đáp số là gì') || lower.includes('chấm điểm')) {
        botReply = '🚫 **Cô không làm bài thay hay cho đáp án trực tiếp đâu nhé!**\n\n👉 Nhưng cô có thể hướng dẫn em cách suy luận:\n1️⃣ Em hãy đọc kỹ đề bài xem người ta **cho số nào** và **hỏi gì**?\n2️⃣ Phép tính này là **Cộng (thêm vào)** hay **Trừ (bớt đi)**?\n\nEm hãy thử trả lời 2 câu hỏi trên cho cô nghe nào!';
      } else if (lower.includes('cộng có nhớ') || lower.includes('gợi ý cách làm')) {
        botReply = '💡 **Gợi ý cách làm Phép Cộng Có Nhớ Lớp 2:**\n\n1️⃣ **Bước 1:** Cộng từ hàng đơn vị trước.\n2️⃣ **Bước 2:** Nếu kết quả $\ge 10$, em giữ lại hàng đơn vị và **nhớ 1** sang hàng chục.\n3️⃣ **Bước 3:** Cộng hàng chục và nhớ thêm 1 vào!\n\n❓ **Câu hỏi dẫn dắt:** Khi tính $18 + 5$, em lấy $8 + 5 = 13$, vậy em viết số mấy và nhớ số mấy nhỉ?';
      } else if (lower.includes('lời văn') || lower.includes('dẫn dắt')) {
        botReply = '❓ **Câu Hỏi Dẫn Dắt Giải Bài Toán Có Lời Văn:**\n\n• **Đề bài có từ "tất cả", "nhiều hơn", "thêm vào":** Em thử đoán xem nên chọn phép tính **Cộng (+)** hay **Trừ (-)**?\n• **Đề bài có từ "còn lại", "ít hơn", "bớt đi":** Em sẽ dùng phép tính nào?\n\nEm đang làm bài toán nào, gõ chữ đề bài ra cô cùng phân biệt với em nhé!';
      } else if (lower.includes('chưa hiểu') || lower.includes('nhân 5')) {
        botReply = '🤝 **Đừng lo lắng! Cô giải thích lại bản chất Phép Nhân 5 nhé:**\n\nPhép nhân $5 \\times 3$ thực chất là lấy số 5 **cộng lại 3 lần**:\n$$5 + 5 + 5 = 15$$\n\n❓ **Bây giờ em thử tính giúp cô:** $5 \\times 2$ tức là lấy số 5 cộng lại mấy lần nào?';
      } else if (lower.includes('hình') || lower.includes('chữ nhật') || lower.includes('vuông')) {
        botReply = '📐 **Giải thích kiến thức Hình Học Lớp 2:**\n\n• **Hình vuông:** Cả 4 cạnh bằng nhau như chiếc bánh chưng vuông!\n• **Hình chữ nhật:** Có 2 cạnh dài bằng nhau và 2 cạnh ngắn bằng nhau giống chiếc bảng lớp học.\n\n❓ Em hãy nhìn xung quanh xem đồ vật nào có hình chữ nhật nào?';
      } else {
        botReply = `🤖 Cô Trợ Lý AI đã nhận được câu hỏi về "${text}":\n\n💡 **Gợi ý học tập:** Em hãy thử nêu phép tính hoặc từ chìa khóa đề bài toán Lớp 2. Cô sẽ đặt câu hỏi gợi ý từng bước để em tự tìm ra câu trả lời chính xác nhất nhé!`;
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
            🤖 AI TRỢ LÝ TOÁN HỌC
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
                  SƯ PHẠM DẪN DẮT LỚP 2
                </span>
                <h4 className="font-extrabold text-sm font-display text-white">AI Trợ Lý Toán Học 🤖</h4>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-xl transition-colors text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* AI Rules Banner */}
          <div className="bg-amber-50 p-2 px-3 border-b border-amber-200 text-[11px] text-amber-900 font-extrabold flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>AI không làm bài thay & không tự chấm điểm</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl shadow-xs space-y-1 ${
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
                  <span>Cô AI đang đặt câu hỏi dẫn dắt...</span>
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
              placeholder="Hỏi cô cách suy luận hay thắc mắc..."
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
