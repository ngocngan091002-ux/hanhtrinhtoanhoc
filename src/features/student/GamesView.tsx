import React, { useState, useEffect } from 'react';
import { triggerConfetti } from '../../utils/confetti';
import { Gamepad2, Trophy, Zap, Star, RefreshCw, CheckCircle2, Flame, Sparkles, Award, Play, RotateCcw } from 'lucide-react';

type GameMode = 'race' | 'flashcard' | 'balloon';

interface QuestionItem {
  num1: number;
  num2: number;
  op: '+' | '-' | '×' | ':';
  correct: number;
  options: number[];
  topic: string;
}

export const GamesView: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>('race');
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);

  useEffect(() => {
    generateGrade2Question();
  }, [gameMode]);

  // Strictly Grade 2 Math Standards Generator:
  // 1. Addition & Subtraction within 20 and 100
  // 2. Multiplication Tables of 2 and 5 (Bảng nhân 2 & Bảng nhân 5)
  // 3. Division Tables of 2 and 5 (Bảng chia 2 & Bảng chia 5)
  const generateGrade2Question = () => {
    const categories = ['add_20', 'sub_20', 'mul_2', 'mul_5', 'div_2', 'div_5', 'add_100'];
    const chosenCat = categories[Math.floor(Math.random() * categories.length)];

    let n1 = 0;
    let n2 = 0;
    let op: '+' | '-' | '×' | ':' = '+';
    let correct = 0;
    let topic = 'Toán Lớp 2';

    if (chosenCat === 'mul_2') {
      op = '×';
      n1 = 2;
      n2 = Math.floor(Math.random() * 9) + 1; // 2x1 to 2x9
      correct = n1 * n2;
      topic = 'Bảng Nhân 2';
    } else if (chosenCat === 'mul_5') {
      op = '×';
      n1 = 5;
      n2 = Math.floor(Math.random() * 9) + 1; // 5x1 to 5x9
      correct = n1 * n2;
      topic = 'Bảng Nhân 5';
    } else if (chosenCat === 'div_2') {
      op = ':';
      n2 = 2;
      const factor = Math.floor(Math.random() * 9) + 1;
      n1 = n2 * factor;
      correct = factor;
      topic = 'Bảng Chia 2';
    } else if (chosenCat === 'div_5') {
      op = ':';
      n2 = 5;
      const factor = Math.floor(Math.random() * 9) + 1;
      n1 = n2 * factor;
      correct = factor;
      topic = 'Bảng Chia 5';
    } else if (chosenCat === 'sub_20') {
      op = '-';
      n1 = Math.floor(Math.random() * 10) + 10; // 10 to 19
      n2 = Math.floor(Math.random() * 9) + 1; // 1 to 9
      correct = n1 - n2;
      topic = 'Phép Trừ Phạm Vi 20 (Có Nhớ)';
    } else if (chosenCat === 'add_20') {
      op = '+';
      n1 = Math.floor(Math.random() * 9) + 5;
      n2 = Math.floor(Math.random() * 9) + 5;
      correct = n1 + n2;
      topic = 'Phép Cộng Phạm Vi 20 (Có Nhớ)';
    } else {
      op = '+';
      n1 = Math.floor(Math.random() * 40) + 10;
      n2 = Math.floor(Math.random() * 40) + 10;
      correct = n1 + n2;
      topic = 'Phép Cộng Phạm Vi 100';
    }

    // Generate 4 dynamic options (1 correct + 3 distinct distractors)
    const optionsSet = new Set<number>();
    optionsSet.add(correct);

    while (optionsSet.size < 4) {
      const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
      const wrongOpt = Math.max(0, correct + offset);
      optionsSet.add(wrongOpt);
    }

    const shuffledOptions = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    setCurrentQuestion({
      num1: n1,
      num2: n2,
      op,
      correct,
      options: shuffledOptions,
      topic,
    });

    setSelectedAnswer(null);
    setFeedback(null);
  };

  const handleSelectOption = (opt: number) => {
    if (!currentQuestion) return;
    setSelectedAnswer(opt);

    if (opt === currentQuestion.correct) {
      setScore((s) => s + 10);
      setStreak((st) => st + 1);
      setFeedback({ text: `🎉 Rất xuất sắc! +10 XP (${currentQuestion.topic})`, isCorrect: true });
      triggerConfetti();

      setTimeout(() => {
        generateGrade2Question();
      }, 1200);
    } else {
      setStreak(0);
      setFeedback({ text: `😅 Chưa chính xác rồi! Kết quả đúng là ${currentQuestion.correct}`, isCorrect: false });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide border border-amber-200">
            TRÒ CHƠI TOÁN LỚP 2
          </span>
          <h2 className="text-2xl font-black text-slate-900 flex items-center space-x-2 font-display mt-1">
            <Gamepad2 className="w-7 h-7 text-amber-500" />
            <span>Góc Trò Chơi Giải Trí & Tư Duy</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-1">
            Toàn bộ câu hỏi được lọc chuẩn 100% theo kiến thức <strong>Toán Lớp 2</strong> (Cộng trừ phạm vi 20/100, Bảng nhân & chia 2, 5)!
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-amber-50 text-amber-900 font-black px-4 py-2 rounded-2xl border border-amber-200 text-sm shadow-2xs">
            <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>{score} XP</span>
          </div>

          <div className="flex items-center space-x-1 bg-rose-50 text-rose-800 font-black px-3 py-2 rounded-2xl border border-rose-200 text-sm shadow-2xs">
            <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>Chuỗi: {streak}</span>
          </div>
        </div>
      </div>

      {/* Mode Selection Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-2xs gap-1">
          <button
            onClick={() => setGameMode('race')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 ${
              gameMode === 'race' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🏎️ Đua Xe Tốc Độ</span>
          </button>

          <button
            onClick={() => setGameMode('flashcard')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 ${
              gameMode === 'flashcard' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🎴 Thẻ Lật Tính Nhẩm</span>
          </button>

          <button
            onClick={() => setGameMode('balloon')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 ${
              gameMode === 'balloon' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🎈 Nổ Bóng Số Lớp 2</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Game Box */}
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100 text-center space-y-6 max-w-2xl mx-auto relative overflow-hidden">
        {currentQuestion && (
          <>
            <div className="inline-flex items-center space-x-1.5 bg-sky-50 text-sky-800 text-xs font-black px-4 py-1.5 rounded-full border border-sky-200">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Chủ đề: {currentQuestion.topic}</span>
            </div>

            {/* Question Calculation Display Box */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-600 to-sky-600 text-white border-4 border-sky-200 shadow-xl relative">
              <div className="text-5xl sm:text-6xl font-black font-display tracking-widest drop-shadow-md">
                {currentQuestion.num1} {currentQuestion.op} {currentQuestion.num2} = ?
              </div>
            </div>

            {/* 4 Interactive Choice Buttons A, B, C, D */}
            <div className="space-y-2">
              <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
                Bấm chọn đáp án đúng bên dưới:
              </div>

              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedAnswer === opt;
                  const isCorrectOpt = selectedAnswer !== null && opt === currentQuestion.correct;
                  const isWrongOpt = isSelected && opt !== currentQuestion.correct;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      disabled={selectedAnswer !== null && feedback?.isCorrect}
                      className={`py-4 px-6 rounded-2xl border-2 font-black text-2xl sm:text-3xl transition-all flex items-center justify-center space-x-2 shadow-sm transform active:scale-95 cursor-pointer ${
                        isCorrectOpt
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-200 shadow-lg scale-105'
                          : isWrongOpt
                          ? 'bg-rose-500 border-rose-600 text-white animate-shake'
                          : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-950 hover:border-amber-400'
                      }`}
                    >
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback alert box */}
            {feedback && (
              <div
                className={`p-4 rounded-2xl font-extrabold text-sm shadow-2xs ${
                  feedback.isCorrect
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {feedback.text}
              </div>
            )}

            {/* Refresh Question Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={generateGrade2Question}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-5 py-2.5 rounded-2xl text-xs transition-all inline-flex items-center space-x-1.5 shadow-2xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Đổi Câu Hỏi Khác</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
