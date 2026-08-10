import React, { useState, useEffect } from 'react';
import { triggerConfetti } from '../../utils/confetti';
import { Gamepad2, Trophy, Sparkles, RefreshCw, Flame, Award, Grid, HelpCircle, CheckCircle2, RotateCcw } from 'lucide-react';

type GameMode = 'memory' | 'caro' | 'puzzle';

// --- GAME 1: MEMORY MATCH CARD TYPES ---
interface MemoryCard {
  id: number;
  content: string;
  matchId: number; // Cards with same matchId are a pair
  isFlipped: boolean;
  isMatched: boolean;
  color: string;
}

export const GamesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GameMode>('memory');
  const [score, setScore] = useState(0);

  // ==========================================
  // 🃏 GAME 1: LẬT THẺ TRÍ NHỚ (MEMORY MATCH)
  // ==========================================
  const initialMemoryPairs = [
    { content: '2 × 5', matchId: 1, color: 'bg-rose-50 text-rose-600 border-rose-200' },
    { content: '10', matchId: 1, color: 'bg-rose-50 text-rose-600 border-rose-200' },
    { content: '5 × 4', matchId: 2, color: 'bg-sky-50 text-sky-600 border-sky-200' },
    { content: '20', matchId: 2, color: 'bg-sky-50 text-sky-600 border-sky-200' },
    { content: '15 - 7', matchId: 3, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { content: '8', matchId: 3, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { content: '9 + 6', matchId: 4, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { content: '15', matchId: 4, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { content: '14 - 6', matchId: 5, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { content: '8', matchId: 5, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { content: '2 × 8', matchId: 6, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    { content: '16', matchId: 6, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
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
        }, 500);
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
        }, 900);
      }
    }
  };

  // ==========================================
  // ❌⭕ GAME 2: CỜ CARO TIC-TAC-TOE LỚP 2
  // ==========================================
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [caroWinner, setCaroWinner] = useState<string | null>(null);
  const [caroStats, setCaroStats] = useState({ wins: 0, losses: 0, draws: 0 });

  const calculateCaroWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Columns
      [0, 4, 8],
      [2, 4, 6], // Diagonals
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
      // Machine turn after 500ms
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

    // Smart random machine move
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
  // 🧩 GAME 3: XẾP SỐ TRÍ TUỆ 3x3 (SLIDING PUZZLE)
  // ==========================================
  const initialPuzzleState = [1, 2, 3, 4, 5, 6, 7, 8, 0]; // 0 is empty tile
  const [puzzleTiles, setPuzzleTiles] = useState<number[]>(initialPuzzleState);
  const [puzzleSolved, setPuzzleSolved] = useState(false);

  const startNewPuzzle = () => {
    let arr = [...initialPuzzleState];
    // Shuffle puzzle by performing valid random moves
    for (let i = 0; i < 30; i++) {
      const emptyIdx = arr.indexOf(0);
      const validMoves: number[] = [];
      const row = Math.floor(emptyIdx / 3);
      const col = emptyIdx % 3;

      if (row > 0) validMoves.push(emptyIdx - 3); // Up
      if (row < 2) validMoves.push(emptyIdx + 3); // Down
      if (col > 0) validMoves.push(emptyIdx - 1); // Left
      if (col < 2) validMoves.push(emptyIdx + 1); // Right

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

    // Check if tile is adjacent to empty slot
    const isAdjacent = Math.abs(rowIdx - emptyRow) + Math.abs(colIdx - emptyCol) === 1;

    if (isAdjacent) {
      const newTiles = [...puzzleTiles];
      newTiles[emptyIdx] = newTiles[index];
      newTiles[index] = 0;
      setPuzzleTiles(newTiles);

      // Check if solved
      const isWon = newTiles.every((val, i) => val === initialPuzzleState[i]);
      if (isWon) {
        setPuzzleSolved(true);
        triggerConfetti();
        setScore((s) => s + 40);
      }
    }
  };

  // Initialize games on mount
  useEffect(() => {
    startNewMemoryGame();
    startNewPuzzle();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide border border-amber-200">
            GIẢI TRÍ TOÁN LỚP 2
          </span>
          <h2 className="text-2xl font-black text-slate-900 flex items-center space-x-2 font-display mt-1">
            <Gamepad2 className="w-7 h-7 text-amber-500" />
            <span>Góc Trò Chơi Giải Trí & Thư Giãn</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-1">
            Trò chơi thư giãn trí tuệ: Lật thẻ trí nhớ, Cờ Caro X-O và Xếp số trí tuệ dành riêng cho học sinh!
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-amber-50 text-amber-900 font-black px-4 py-2.5 rounded-2xl border border-amber-200 text-sm shadow-2xs">
          <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span>{score} XP Thưởng</span>
        </div>
      </div>

      {/* Mode Selection Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-2xs gap-1">
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'memory' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🃏 Lật Thẻ Trí Nhớ</span>
          </button>

          <button
            onClick={() => setActiveTab('caro')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'caro' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>❌⭕ Cờ Caro X-O</span>
          </button>

          <button
            onClick={() => setActiveTab('puzzle')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'puzzle' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🧩 Xếp Số Trí Tuệ</span>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 🃏 TAB 1: LẬT THẺ TRÍ NHỚ (MEMORY MATCH)  */}
      {/* ========================================== */}
      {activeTab === 'memory' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 text-center space-y-6 max-w-2xl mx-auto">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 font-display">Lật Thẻ Tìm Cặp Số / Phép Tính Trùng Nhau</h3>
              <p className="text-xs text-slate-500">Lật 2 thẻ ghép đúng kết quả để mở khóa nhận điểm thưởng XP!</p>
            </div>

            <button
              onClick={startNewMemoryGame}
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1 border border-amber-300 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chơi Lại</span>
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
            {memoryCards.map((card, idx) => {
              const isOpen = card.isFlipped || card.isMatched;

              return (
                <div
                  key={idx}
                  onClick={() => handleCardClick(idx)}
                  className={`h-24 sm:h-28 rounded-2xl border-2 flex items-center justify-center font-black text-xl sm:text-2xl cursor-pointer transition-all duration-300 transform active:scale-95 shadow-xs ${
                    isOpen
                      ? `${card.color} rotate-0 shadow-md scale-100`
                      : 'bg-gradient-to-br from-amber-400 to-amber-500 border-amber-300 text-white hover:scale-105'
                  }`}
                >
                  {isOpen ? (
                    <span>{card.content}</span>
                  ) : (
                    <span className="text-3xl opacity-80 select-none">❓</span>
                  )}
                </div>
              );
            })}
          </div>

          {memoryMatchesCount === initialMemoryPairs.length / 2 && (
            <div className="p-4 bg-emerald-100 text-emerald-900 rounded-2xl border border-emerald-300 font-extrabold text-base flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>🎉 Xuất sắc! Em đã hoàn thành tìm tất cả các cặp thẻ trí nhớ (+50 XP)!</span>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* ❌⭕ TAB 2: CỜ CARO TIC-TAC-TOE (X-O)      */}
      {/* ========================================== */}
      {activeTab === 'caro' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 text-center space-y-6 max-w-lg mx-auto">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 font-display">Cờ Caro X-O Đấu Với Máy Vui Nhộn</h3>
              <p className="text-xs text-slate-500">Em là ❌ (Đỏ), Máy là ⭕ (Xanh). Xếp 3 ô thẳng hàng để chiến thắng!</p>
            </div>

            <button
              onClick={restartCaroGame}
              className="bg-sky-100 hover:bg-sky-200 text-sky-900 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1 border border-sky-300 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ván Mới</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
            <div className="p-2.5 bg-rose-50 text-rose-900 rounded-xl border border-rose-200">
              Thắng: {caroStats.wins}
            </div>
            <div className="p-2.5 bg-sky-50 text-sky-900 rounded-xl border border-sky-200">
              Thua: {caroStats.losses}
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-200">
              Hòa: {caroStats.draws}
            </div>
          </div>

          {/* 3x3 Board Grid */}
          <div className="grid grid-cols-3 gap-3 bg-slate-100 p-3 rounded-3xl border border-slate-200 max-w-xs mx-auto shadow-inner">
            {board.map((sq, idx) => (
              <button
                key={idx}
                onClick={() => handleCaroClick(idx)}
                className="w-20 h-20 bg-white rounded-2xl border-2 border-slate-200 flex items-center justify-center text-4xl shadow-2xs font-black hover:border-sky-400 transition-all active:scale-95 cursor-pointer"
              >
                {sq}
              </button>
            ))}
          </div>

          {caroWinner && (
            <div
              className={`p-4 rounded-2xl font-extrabold text-base flex items-center justify-center space-x-2 ${
                caroWinner === '❌'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : caroWinner === '⭕'
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              <span>
                {caroWinner === '❌'
                  ? '🎉 CHÚC MỪNG EM ĐÃ THẮNG VÁN CỜ CARO (+30 XP)!'
                  : caroWinner === '⭕'
                  ? '😅 Máy đã thắng rồi! Thử bấm Ván Mới để thi đấu lại nhé!'
                  : '🤝 Ván cờ hòa! Cả hai bên đều chơi rất giỏi!'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 🧩 TAB 3: XẾP SỐ TRÍ TUỆ 3x3 (SLIDING)    */}
      {/* ========================================== */}
      {activeTab === 'puzzle' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 text-center space-y-6 max-w-lg mx-auto">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 font-display">Trò Chơi Trượt Xếp Số 1 Đến 8</h3>
              <p className="text-xs text-slate-500">Bấm trượt các ô số vào ô trống để sắp xếp lại theo thứ tự từ 1 đến 8!</p>
            </div>

            <button
              onClick={startNewPuzzle}
              className="bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1 border border-purple-300 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xáo Trộn Lại</span>
            </button>
          </div>

          {/* 3x3 Sliding Puzzle Grid */}
          <div className="grid grid-cols-3 gap-3 bg-purple-50/80 p-3 rounded-3xl border-2 border-purple-200 max-w-xs mx-auto shadow-inner">
            {puzzleTiles.map((tile, idx) => (
              <button
                key={idx}
                onClick={() => handleTileClick(idx)}
                className={`w-20 h-20 rounded-2xl font-black text-3xl flex items-center justify-center transition-all shadow-sm border-2 cursor-pointer ${
                  tile === 0
                    ? 'bg-purple-100/50 border-dashed border-purple-300 shadow-none'
                    : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50 active:scale-95'
                }`}
              >
                {tile !== 0 ? tile : ''}
              </button>
            ))}
          </div>

          {puzzleSolved && (
            <div className="p-4 bg-emerald-100 text-emerald-900 rounded-2xl border border-emerald-300 font-extrabold text-base flex items-center justify-center space-x-2">
              <Sparkles className="w-6 h-6 text-emerald-600" />
              <span>🎉 TUYỆT VỜI! Em đã hoàn thành xếp đúng dãy số từ 1 đến 8 (+40 XP)!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
