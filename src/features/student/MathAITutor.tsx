import React, { useState } from 'react';
import { askMathTutorAI } from '../../config/gemini';
import { Bot, Send, Sparkles, User, RefreshCw, HelpCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'student' | 'ai';
  text: string;
  timestamp: string;
}

export const MathAITutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Chào con! 👋 Thầy AI Gia Sư Toán ở đây để hỗ trợ con nè. Hôm nay con có bài toán nào chưa hiểu hoặc muốn thầy gợi ý hướng suy nghĩ không?',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'student',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentQuestion = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      const aiAnswer = await askMathTutorAI(currentQuestion);

      const aiMsg: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: aiAnswer,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    'Thầy ơi, tính chu vi hình chữ nhật làm thế nào ạ?',
    'Giúp con phân biệt phép nhân và phép cộng với ạ!',
    'Làm sao để biết phép chia có dư vậy thầy?',
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2 font-display">
            <Bot className="w-7 h-7 text-sky-600" />
            <span>🤖 Trợ Lý Toán Học AI</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gia sư AI luôn đồng hành cùng con: gợi ý hướng suy nghĩ, giải thích từng bước (không giải hộ bài).
          </p>
        </div>

        <div className="bg-sky-50 text-sky-700 text-xs font-bold px-3 py-1.5 rounded-full border border-sky-100 flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span>Sẵn sàng 24/7</span>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[520px]">
        {/* Chat History */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${msg.sender === 'student' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                  msg.sender === 'student' ? 'bg-amber-500 text-white' : 'bg-sky-600 text-white'
                }`}
              >
                {msg.sender === 'student' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={`max-w-lg p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'student'
                    ? 'bg-sky-600 text-white rounded-tr-none shadow-md font-semibold'
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
                <div
                  className={`text-[10px] mt-1.5 ${
                    msg.sender === 'student' ? 'text-sky-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs italic bg-white p-3 rounded-xl border border-slate-100 w-fit">
              <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
              <span>Thầy AI đang suy nghĩ gợi ý cho con...</span>
            </div>
          )}
        </div>

        {/* Quick Sample Questions */}
        <div className="p-3 bg-white border-t border-slate-100 flex flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Gợi ý câu hỏi:
          </span>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(q)}
              className="text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 px-3 py-1 rounded-full border border-sky-100 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập câu hỏi toán học của con vào đây..."
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl shadow-md transition-all flex items-center space-x-1 shrink-0 active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Hỏi AI</span>
          </button>
        </form>
      </div>
    </div>
  );
};
