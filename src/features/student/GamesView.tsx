import React, { useState, useEffect } from 'react';
import { triggerConfetti } from '../../utils/confetti';
import { Gamepad2, Trophy, Sparkles, RefreshCw, Flame, Award, Lock, CheckCircle2, RotateCcw, Zap, Smile, Star, Rocket, Layers } from 'lucide-react';

type GameMode = 'memory' | 'caro' | 'puzzle';

// --- GAME 1: MEMORY MATCH CARD TYPES ---
interface MemoryCard {
  id: number;
  content: string;
  matchId: number;
  isFlipped: boolean;
  isMatched: boolean;
  color: string;
  badge: string;
}

export const GamesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GameMode>('memory');
  const [score, setScore] = useState(0);

  // ==========================================
  // 🃏 GAME 1: LẬT THẺ TRÍ NHỚ 3D (MEMORY MATCH)
  // ==========================================
  const initialMemoryPairs = [
    { content: '2 × 5', matchId: 1, color: 'from-rose-500 to-pink-500 border-pink-300 text-white shadow-rose-200', badge: '🍎' },
    { content: '10', matchId: 1, color: 'from-rose-500 to-pink-500 border-pink-300 text-white shadow-rose-200', badge: '🍎' },
    { content: '5 × 4', matchId: 2, color: 'from-sky-500 to-blue-600 border-sky-300 text-white shadow-sky-200', badge: '⚽' },
    { content: '20', matchId: 2, color: 'from-sky-500 to-blue-600 border-sky-300 text-white shadow-sky-200', badge: '⚽' },
    { content: '15 - 7', matchId: 3, color: 'from-amber-500 to-orange-500 border-amber-300 text-white shadow-amber-200', badge: '🦁' },
    { content: '8', matchId: 3, color: 'from-amber-500 to-orange-500 border-amber-300 text-white shadow-amber-200', badge: '🦁' },
    { content: '9 + 6', matchId: 4, color: 'from-emerald-500 to-teal-600 border-emerald-300 text-white shadow-emerald-200', badge: '🐸' },
    { content: '15', matchId: 4, color: 'from-emerald-500 to-teal-600 border-emerald-300 text-white shadow-emerald-200', badge: '🐸' },
    { content: '14 - 6', matchId: 5, color: 'from-purple-500 to-indigo-600 border-purple-300 text-white shadow-purple-200', badge: '🍇' },
    { content: '8', matchId: 5, color: 'from-purple-500 to-indigo-600 border-purple-300 text-white shadow-purple-200', badge: '🍇' },
    { content: '2 × 8', matchId: 6, color: 'from-fuchsia-500 to-pink-600 border-pink-300 text-white shadow-fuchsia-200', badge: '🚀' },
    { content: '16', matchId: 6, color: 'from-fuchsia-500 to-pink-600 border-pink-300 text-white shadow-fuchsia-200', badge: '🚀' },
  ];

  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [memoryMatchesCount, setMemoryMatchesCount] = useState(0);

  const startNewMemoryGame = () => {
    const shuffled = initialMemoryPairs
      .map((item, index) => ({
        id: index,
        content: item.content,
        matchId: item.matchId,
        isFlipped: false,
        isMatched: false,
        color: item.color,
        badge: item.badge,
      }))
      .sort(() => Math.random() - 0.5);

    setMemoryCards(shuffled);
    setFlippedIndices([]);
    setMemoryMatchesCount(0);
  };

  const handleCardClick = (index: number) => {
    if (flippedIndices.length === 2 || memoryCards[index].isFlipped || memoryCards[index].isMatched) return;

    const newCards = [...memoryCards];
    newCards[index].isFlipped = true;
    const newFlipped = [...flippedIndices, index];

    setMemoryCards(newCards);
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const idx1 = newFlipped[0];
      const idx2 = newFlipped[1];

      if (newCards[idx1].matchId === newCards[idx2].matchId) {
        // MATCHED!
        setTimeout(() => {
          setMemoryCards((prev) => {
            const updated = [...prev];
            updated[idx1].isMatched = true;
            updated[idx2].isMatched = true;
            return updated;
          });
          setFlippedIndices([]);
          setMemoryMatchesCount((c) => {
            const nextCount = c + 1;
            if (nextCount === initialMemoryPairs.length / 2) {
              triggerConfetti();
              setScore((s) => s + 50);
            } else {
              setScore((s) => s + 15);
            }
            return nextCount;
          });
        }, 400);
      } else {
        // NOT MATCHED -> FLIP BACK
        setTimeout(() => {
          setMemoryCards((prev) => {
            const updated = [...prev];
            updated[idx1].isFlipped = false;
            updated[idx2].isFlipped = false;
            return updated;
          });
          setFlippedIndices([]);
        }, 800);
      }
    }
  };

  // ==========================================
  // ❌⭕ GAME 2: CỜ CARO ARCADE 3D
  // ==========================================
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [caroWinner, setCaroWinner] = useState<string | null>(null);
  const [caroStats, setCaroStats] = useState({ wins: 0, losses: 0, draws: 0 });

  const calculateCaroWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (squares.every((sq) => sq !== null)) return 'Draw';
    return null;
  };

  const handleCaroClick = (index: number) => {
    if (board[index] || caroWinner || !isXNext) return;

    const newBoard = [...board];
    newBoard[index] = '❌';
    setBoard(newBoard);

    const win = calculateCaroWinner(newBoard);
    if (win) {
      handleCaroEnd(win);
    } else {
      setIsXNext(false);
      setTimeout(() => {
        makeMachineMove(newBoard);
      }, 500);
    }
  };

  const makeMachineMove = (currentBoard: (string | null)[]) => {
    const emptyIndices: number[] = [];
    currentBoard.forEach((sq, i) => {
      if (sq === null) emptyIndices.push(i);
    });

    if (emptyIndices.length === 0) return;

    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const newBoard = [...currentBoard];
    newBoard[randomIndex] = '⭕';
    setBoard(newBoard);

    const win = calculateCaroWinner(newBoard);
    if (win) {
      handleCaroEnd(win);
    } else {
      setIsXNext(true);
    }
  };

  const handleCaroEnd = (win: string) => {
    setCaroWinner(win);
    if (win === '❌') {
      triggerConfetti();
      setScore((s) => s + 30);
      setCaroStats((s) => ({ ...s, wins: s.wins + 1 }));
    } else if (win === '⭕') {
      setCaroStats((s) => ({ ...s, losses: s.losses + 1 }));
    } else {
      setCaroStats((s) => ({ ...s, draws: s.draws + 1 }));
    }
  };

  const restartCaroGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setCaroWinner(null);
  };

  // ==========================================
  // 🧩 GAME 3: XẾP SỐ CANDY 3D (SLIDING PUZZLE)
  // ==========================================
  const initialPuzzleState = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  const tileColors = [
    '',
    'from-amber-400 to-orange-500 border-amber-300 text-white shadow-amber-300',
    'from-sky-400 to-blue-500 border-sky-300 text-white shadow-sky-300',
    'from-emerald-400 to-teal-500 border-emerald-300 text-white shadow-emerald-300',
    'from-purple-400 to-indigo-500 border-purple-300 text-white shadow-purple-300',
    'from-pink-400 to-rose-500 border-pink-300 text-white shadow-pink-300',
    'from-fuchsia-400 to-pink-600 border-fuchsia-300 text-white shadow-fuchsia-300',
    'from-cyan-400 to-teal-500 border-cyan-300 text-white shadow-cyan-300',
    'from-yellow-400 to-amber-500 border-yellow-300 text-amber-950 shadow-yellow-300',
  ];

  const [puzzleTiles, setPuzzleTiles] = useState<number[]>(initialPuzzleState);
  const [puzzleSolved, setPuzzleSolved] = useState(false);

  const startNewPuzzle = () => {
    let arr = [...initialPuzzleState];
    for (let i = 0; i < 30; i++) {
      const emptyIdx = arr.indexOf(0);
      const validMoves: number[] = [];
      const row = Math.floor(emptyIdx / 3);
      const col = emptyIdx % 3;

      if (row > 0) validMoves.push(emptyIdx - 3);
      if (row < 2) validMoves.push(emptyIdx + 3);
      if (col > 0) validMoves.push(emptyIdx - 1);
      if (col < 2) validMoves.push(emptyIdx + 1);

      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      arr[emptyIdx] = arr[randomMove];
      arr[randomMove] = 0;
    }

    setPuzzleTiles(arr);
    setPuzzleSolved(false);
  };

  const handleTileClick = (index: number) => {
    if (puzzleSolved) return;
    const emptyIdx = puzzleTiles.indexOf(0);

    const rowIdx = Math.floor(index / 3);
    const colIdx = index % 3;
    const emptyRow = Math.floor(emptyIdx / 3);
    const emptyCol = emptyIdx % 3;

    const isAdjacent = Math.abs(rowIdx - emptyRow) + Math.abs(colIdx - emptyCol) === 1;

    if (isAdjacent) {
      const newTiles = [...puzzleTiles];
      newTiles[emptyIdx] = newTiles[index];
      newTiles[index] = 0;
      setPuzzleTiles(newTiles);

      const isWon = newTiles.every((val, i) => val === initialPuzzleState[i]);
      if (isWon) {
        setPuzzleSolved(true);
        triggerConfetti();
        setScore((s) => s + 40);
      }
    }
  };

  useEffect(() => {
    startNewMemoryGame();
    startNewPuzzle();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 🌟 3D ARCADE TOP BANNER HEADER */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 p-6 sm:p-8 rounded-3xl text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 border-4 border-amber-200 relative overflow-hidden">
        <div className="flex items-center space-x-4 z-10">
          <div className="w-16 h-16 rounded-2xl bg-white text-amber-500 flex items-center justify-center text-3xl shadow-lg border-2 border-amber-200 transform hover:rotate-6 transition-transform">
            🎮
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-white/30 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase border border-white/40 tracking-wider">
                KIDSMIND MATH ARCADE LỚP 2
              </span>
            </div>
            <h2 className="text-3xl font-black font-display tracking-tight text-white drop-shadow-md mt-1">
              Góc Trò Chơi Giải Trí 3D
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm font-extrabold mt-0.5">
              Lật thẻ trí nhớ, đấu Cờ Caro X-O và Xếp số Candy 3D vui nhộn cho học sinh!
            </p>
          </div>
        </div>

        {/* XP Score Badge */}
        <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-white/40 flex items-center space-x-3 shadow-lg z-10">
          <Trophy className="w-7 h-7 text-amber-300 fill-amber-300 drop-shadow-xs" />
          <div className="text-left">
            <div className="text-[10px] font-black text-amber-100 uppercase tracking-widest">ĐIỂM XP THƯỞNG</div>
            <div className="text-2xl font-black text-white">{score} XP</div>
          </div>
        </div>
      </div>

      {/* 🎮 3D ARCADE MODE TAB SELECTOR */}
      <div className="flex justify-center">
        <div className="inline-flex p-2 bg-white/90 backdrop-blur-md rounded-3xl border-2 border-slate-200 shadow-lg gap-2">
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer ${
              activeTab === 'memory'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-300/50 scale-105 border-2 border-amber-300'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">🃏</span>
            <span>Lật Thẻ Trí Nhớ 3D</span>
          </button>

          <button
            onClick={() => setActiveTab('caro')}
            className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer ${
              activeTab === 'caro'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-300/50 scale-105 border-2 border-sky-300'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">❌⭕</span>
            <span>Cờ Caro X-O</span>
          </button>

          <button
            onClick={() => setActiveTab('puzzle')}
            className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer ${
              activeTab === 'puzzle'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-300/50 scale-105 border-2 border-purple-300'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">🧩</span>
            <span>Xếp Số Candy 3D</span>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 🃏 TAB 1: LẬT THẺ TRÍ NHỚ 3D (MEMORY MATCH)  */}
      {/* ========================================== */}
      {activeTab === 'memory' && (
        <div className="bg-gradient-to-b from-amber-50/60 to-orange-50/80 p-6 sm:p-8 rounded-3xl shadow-xl border-4 border-amber-200 text-center space-y-6 max-w-3xl mx-auto relative">
          <div className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b-2 border-amber-200/80 gap-3">
            <div className="text-left">
              <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                THỬ THÁCH TRÍ NHỚ
              </span>
              <h3 className="text-2xl font-black text-amber-950 font-display mt-1">
                Lật Thẻ Tìm Cặp Số & Phép Tính Trùng Nhau
              </h3>
              <p className="text-xs font-bold text-amber-800">
                Ghép đúng 6 cặp bài kết quả Lớp 2 để rinh ngay pháo hoa chúc mừng!
              </p>
            </div>

            <button
              onClick={startNewMemoryGame}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black px-5 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 shadow-md border border-amber-300 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>CHƠI LẠI TRẬN MỚI</span>
            </button>
          </div>

          {/* 3D Cards Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 p-2">
            {memoryCards.map((card, idx) => {
              const isOpen = card.isFlipped || card.isMatched;

              return (
                <div
                  key={idx}
                  onClick={() => handleCardClick(idx)}
                  className={`h-28 sm:h-32 rounded-3xl border-4 flex flex-col items-center justify-center font-black text-xl sm:text-2xl cursor-pointer transition-all duration-300 transform active:scale-95 relative overflow-hidden select-none ${
                    isOpen
                      ? `bg-gradient-to-br ${card.color} shadow-xl scale-100 border-white/60`
                      : 'bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 border-amber-200 text-white hover:-translate-y-1.5 hover:shadow-2xl shadow-lg hover:border-white'
                  }`}
                >
                  {isOpen ? (
                    <div className="space-y-1 text-center">
                      <div className="text-2xl drop-shadow-xs">{card.badge}</div>
                      <div className="text-lg sm:text-xl font-black tracking-wide drop-shadow-xs">{card.content}</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-1">
                      <div className="text-3xl drop-shadow-md animate-bounce">❓</div>
                      <span className="text-[10px] font-black text-amber-100 uppercase tracking-widest">TOÁN LỚP 2</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {memoryMatchesCount === initialMemoryPairs.length / 2 && (
            <div className="p-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl border-4 border-emerald-200 font-black text-lg flex items-center justify-center space-x-3 shadow-xl animate-pulse">
              <CheckCircle2 className="w-8 h-8 text-amber-300 fill-emerald-700" />
              <span>🎉 TUYỆT VỜI! Em đã hoàn thành lật mở tất cả các cặp thẻ trí nhớ (+50 XP)!</span>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* ❌⭕ TAB 2: CỜ CARO TIC-TAC-TOE 3D          */}
      {/* ========================================== */}
      {activeTab === 'caro' && (
        <div className="bg-gradient-to-b from-sky-50/60 to-blue-50/80 p-6 sm:p-8 rounded-3xl shadow-xl border-4 border-sky-200 text-center space-y-6 max-w-xl mx-auto relative">
          <div className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b-2 border-sky-200/80 gap-3">
            <div className="text-left">
              <span className="bg-sky-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                ĐẤU CỜ CARO X-O
              </span>
              <h3 className="text-2xl font-black text-sky-950 font-display mt-1">
                Thi Đấu Cờ Caro Với Máy Vui Nhộn
              </h3>
              <p className="text-xs font-bold text-sky-800">
                Em là ❌ (Đỏ), Máy là ⭕ (Xanh). Xếp 3 ô thẳng hàng để chiến thắng!
              </p>
            </div>

            <button
              onClick={restartCaroGame}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black px-5 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 shadow-md border border-sky-300 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>VÁN CỜ MỚI</span>
            </button>
          </div>

          {/* Arcade Score Counter */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs font-black">
            <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-2xl shadow-md border-2 border-rose-300">
              <div className="text-[10px] uppercase text-rose-100">HỌC SINH THẮNG</div>
              <div className="text-xl font-black">{caroStats.wins} trận</div>
            </div>
            <div className="p-3 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-2xl shadow-md border-2 border-sky-300">
              <div className="text-[10px] uppercase text-sky-100">MÁY THẮNG</div>
              <div className="text-xl font-black">{caroStats.losses} trận</div>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 text-amber-950 rounded-2xl shadow-md border-2 border-amber-300">
              <div className="text-[10px] uppercase text-amber-900">VÁN HÒA</div>
              <div className="text-xl font-black">{caroStats.draws} trận</div>
            </div>
          </div>

          {/* 3D Board Grid */}
          <div className="grid grid-cols-3 gap-3 bg-sky-200/60 p-4 rounded-3xl border-4 border-sky-300 max-w-xs mx-auto shadow-inner">
            {board.map((sq, idx) => (
              <button
                key={idx}
                onClick={() => handleCaroClick(idx)}
                className="w-20 h-20 bg-white rounded-2xl border-4 border-sky-200 flex items-center justify-center text-4xl shadow-md font-black hover:border-sky-500 hover:scale-105 transition-all active:scale-95 cursor-pointer"
              >
                {sq}
              </button>
            ))}
          </div>

          {caroWinner && (
            <div
              className={`p-4 rounded-2xl font-black text-base shadow-lg border-2 ${
                caroWinner === '❌'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-300'
                  : caroWinner === '⭕'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white border-rose-300'
                  : 'bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 border-amber-300'
              }`}
            >
              <span>
                {caroWinner === '❌'
                  ? '🎉 CHÚC MỪNG EM ĐÃ THẮNG VÁN CỜ CARO (+30 XP)!'
                  : caroWinner === '⭕'
                  ? '😅 Máy đã thắng rồi! Thử bấm Ván Cờ Mới để đấu lại nhé!'
                  : '🤝 Ván cờ hòa! Cả hai bên đều thi đấu rất giỏi!'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 🧩 TAB 3: XẾP SỐ CANDY 3D (SLIDING PUZZLE) */}
      {/* ========================================== */}
      {activeTab === 'puzzle' && (
        <div className="bg-gradient-to-b from-purple-50/60 to-indigo-50/80 p-6 sm:p-8 rounded-3xl shadow-xl border-4 border-purple-200 text-center space-y-6 max-w-xl mx-auto relative">
          <div className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b-2 border-purple-200/80 gap-3">
            <div className="text-left">
              <span className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                TRƯỢT XẾP SỐ CANDY 3D
              </span>
              <h3 className="text-2xl font-black text-purple-950 font-display mt-1">
                Trò Chơi Trượt Xếp Dãy Số 1 Đến 8
              </h3>
              <p className="text-xs font-bold text-purple-800">
                Bấm trượt các ô số vào ô trống để xếp lại đúng thứ tự từ 1 đến 8!
              </p>
            </div>

            <button
              onClick={startNewPuzzle}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black px-5 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 shadow-md border border-purple-300 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>XÁO TRỘN LẠI</span>
            </button>
          </div>

          {/* 3D Candy Sliding Grid */}
          <div className="grid grid-cols-3 gap-3.5 bg-purple-200/60 p-4 rounded-3xl border-4 border-purple-300 max-w-xs mx-auto shadow-inner">
            {puzzleTiles.map((tile, idx) => (
              <button
                key={idx}
                onClick={() => handleTileClick(idx)}
                className={`w-20 h-20 rounded-2xl font-black text-3xl flex items-center justify-center transition-all shadow-md border-4 cursor-pointer transform active:scale-95 ${
                  tile === 0
                    ? 'bg-purple-100/50 border-dashed border-purple-300 shadow-none'
                    : `bg-gradient-to-br ${tileColors[tile]} hover:scale-105`
                }`}
              >
                {tile !== 0 ? tile : ''}
              </button>
            ))}
          </div>

          {puzzleSolved && (
            <div className="p-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl border-4 border-emerald-200 font-black text-base flex items-center justify-center space-x-3 shadow-xl animate-pulse">
              <Sparkles className="w-7 h-7 text-amber-300 fill-emerald-700" />
              <span>🎉 HOÀN HẢO! Em đã trượt xếp đúng dãy số từ 1 đến 8 (+40 XP)!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
