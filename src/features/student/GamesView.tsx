import React, { useState, useEffect } from 'react';
import { Gamepad2, Trophy, Zap, Star, RefreshCw, CheckCircle, Flame } from 'lucide-react';

export const GamesView: React.FC = () => {
  const [gameMode, setGameMode] = useState<'race' | 'flashcard'>('race');
  const [num1, setNum1] = useState(12);
  const [num2, setNum2] = useState(8);
  const [operator, setOperator] = useState<'+' | '-' | '×'>('+');
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    generateNewQuestion();
  }, [gameMode]);

  const generateNewQuestion = () => {
    const ops: ('+' | '-' | '×')[] = ['+', '-', '×'];
    const selectedOp = ops[Math.floor(Math.random() * ops.length)];
    setOperator(selectedOp);

    if (selectedOp === '×') {
      setNum1(Math.floor(Math.random() * 9) + 2);
      setNum2(Math.floor(Math.random() * 9) + 1);
    } else if (selectedOp === '-') {
      const n1 = Math.floor(Math.random() * 50) + 10;
      const n2 = Math.floor(Math.random() * n1);
      setNum1(n1);
      setNum2(n2);
    } else {
      setNum1(Math.floor(Math.random() * 45) + 5);
      setNum2(Math.floor(Math.random() * 45) + 5);
    }

    setUserAnswer('');
    setFeedback(null);
  };

  const getCorrectAnswer = () => {
    if (operator === '+') return num1 + num2;
    if (operator === '-') return num1 - num2;
    return num1 * num2;
  };

  const handleCheckAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const correct = getCorrectAnswer();
    if (parseInt(userAnswer.trim()) === correct) {
      setScore((s) => s + 10);
      setStreak((st) => st + 1);
      setFeedback('🎉 Xuất sắc! +10 điểm');
      setTimeout(() => generateNewQuestion(), 1000);
    } else {
      setStreak(0);
      setFeedback(`😅 Chưa đúng rồi! Đáp án đúng là ${correct}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2 font-display">
            <Gamepad2 className="w-7 h-7 text-amber-500" />
            <span>🎮 Trò Chơi Toán Học Tương Tác</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Vừa chơi vừa học! Tính nhanh chuẩn xác để tích điểm thưởng chuỗi thắng!
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 bg-amber-50 text-amber-700 font-extrabold px-4 py-2 rounded-2xl border border-amber-200 text-sm">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>{score} điểm</span>
          </div>

          <div className="flex items-center space-x-1 bg-rose-50 text-rose-700 font-extrabold px-3 py-2 rounded-2xl border border-rose-200 text-sm">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>Chuỗi: {streak}</span>
          </div>
        </div>
      </div>

      {/* Game Card */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-100 max-w-xl mx-auto text-center space-y-8">
        <div className="inline-flex space-x-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setGameMode('race')}
            className={`px-5 py-2 rounded-xl font-bold text-xs transition-all ${
              gameMode === 'race' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏁 Đua Tốc Độ
          </button>
          <button
            onClick={() => setGameMode('flashcard')}
            className={`px-5 py-2 rounded-xl font-bold text-xs transition-all ${
              gameMode === 'flashcard' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎴 Flashcards Toán Học
          </button>
        </div>

        {/* Calculation Visual */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-sky-50 to-amber-50 border-2 border-sky-100 shadow-inner">
          <div className="text-5xl sm:text-6xl font-black text-slate-900 font-display tracking-wider">
            {num1} {operator} {num2} = ?
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleCheckAnswer} className="space-y-4 max-w-xs mx-auto">
          <input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Nhập kết quả..."
            autoFocus
            className="w-full px-6 py-4 rounded-2xl border-2 border-amber-300 text-center font-black text-2xl focus:outline-none focus:ring-4 focus:ring-amber-200 bg-amber-50/50"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg transition-all active:scale-95 text-base"
            >
              ĐỔI ĐÁP ÁN
            </button>
            <button
              type="button"
              onClick={generateNewQuestion}
              className="p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold"
              title="Đổi câu hỏi khác"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </form>

        {feedback && (
          <div
            className={`p-4 rounded-2xl font-bold text-sm ${
              feedback.includes('Xuất sắc')
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
};
