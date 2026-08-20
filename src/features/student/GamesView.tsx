import React, { useState, useEffect, useRef } from 'react';
import { triggerConfetti } from '../../utils/confetti';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../../config/supabase';
import { Material, GamePlayRecord, GameFeedback } from '../../types';
import { Gamepad2, Trophy, Sparkles, RefreshCw, Award, CheckCircle2, RotateCcw, Heart, MessageSquare, ShieldCheck, Clock, Layers, Star, ExternalLink, Zap } from 'lucide-react';

type GameTabMode = 'assigned' | 'memory' | 'caro' | 'puzzle' | 'wheel' | 'leaderboard';

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
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<GameTabMode>('memory');
  const [score, setScore] = useState(0);

  // GAME-01 & GAME-02: Assigned Games list from Teacher / Supabase DB
  const [assignedGames, setAssignedGames] = useState<Material[]>([]);
  const [selectedGame, setSelectedGame] = useState<Material | null>(null);
  const [loadingGames, setLoadingGames] = useState(false);

  // GAME-05: Play duration tracking
  const [playStartTime, setPlayStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  // GAME-06 & GAME-08: Play Records & Practice Mode
  const [playRecords, setPlayRecords] = useState<GamePlayRecord[]>([]);

  // GAME-10: Like & Feedback state
  const [feedbacks, setFeedbacks] = useState<GameFeedback[]>([]);
  const [userRating, setUserRating] = useState<'easy' | 'normal' | 'hard'>('easy');
  const [userComment, setUserComment] = useState('');
  const [userLiked, setUserLiked] = useState(false);

  // ==========================================
  // FETCH ASSIGNED GAMES & GAME RECORDS
  // ==========================================
  useEffect(() => {
    fetchGamesData();
  }, []);

  // GAME-04: Auto-receive score from HTML5/Embed SDK postMessage
  useEffect(() => {
    const handleSdkMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === 'GAME_SCORE' || event.data.type === 'GAME_COMPLETE') {
        const receivedScore = Number(event.data.score) || 100;
        handleSaveGameScore(receivedScore);
      }
    };

    window.addEventListener('message', handleSdkMessage);
    return () => window.removeEventListener('message', handleSdkMessage);
  }, [selectedGame, playStartTime]);

  const fetchGamesData = async () => {
    setLoadingGames(true);
    try {
      // 1. Fetch materials of type game_iframe / game_html5
      const { data: mats } = await supabase
        .from('materials')
        .select('*')
        .in('type', ['game_iframe', 'game_html5'])
        .order('created_at', { ascending: false });

      // Fallback shared localStorage for offline/demo
      const sharedAssKey = `hanhtrinhtoanhoc_shared_assignments`;
      const sharedAssData = JSON.parse(localStorage.getItem(sharedAssKey) || '[]');
      const sharedMats = sharedAssData
        .map((ass: any) => ass.material)
        .filter((mat: any) => mat && (mat.type === 'game_iframe' || mat.type === 'game_html5'));

      const combinedGames = [...(mats || []), ...sharedMats];
      const uniqueGames = Array.from(new Map(combinedGames.map((item) => [item.id, item])).values());
      setAssignedGames(uniqueGames as Material[]);

      // 2. Load Local Play Records & Feedbacks
      const localRecords = JSON.parse(localStorage.getItem('hanhtrinhtoanhoc_game_records') || '[]');
      setPlayRecords(localRecords);

      const localFeedbacks = JSON.parse(localStorage.getItem('hanhtrinhtoanhoc_game_feedbacks') || '[]');
      setFeedbacks(localFeedbacks);
    } catch (err) {
      console.error('Error fetching games:', err);
    } finally {
      setLoadingGames(false);
    }
  };

  // Start game timer (GAME-05)
  const handleStartGame = (game: Material) => {
    setSelectedGame(game);
    setPlayStartTime(Date.now());
    setElapsedSeconds(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const handleCloseGamePlayer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedGame(null);
    setPlayStartTime(null);
  };

  // GAME-04 & GAME-06 & GAME-08: Save Game Score
  const handleSaveGameScore = async (finalScore = 100) => {
    if (!selectedGame || !user) return;

    if (timerRef.current) clearInterval(timerRef.current);
    const duration = playStartTime ? Math.floor((Date.now() - playStartTime) / 1000) : elapsedSeconds;

    // Check attempts count for GAME-06 / GAME-08
    const gameAttempts = playRecords.filter((r) => r.game_id === selectedGame.id && r.student_id === user.id);
    const maxAttempts = selectedGame.max_attempts || 1;
    const isPracticeMode = maxAttempts > 0 && gameAttempts.length >= maxAttempts;

    const newRecord: GamePlayRecord = {
      id: `rec_${Date.now()}`,
      game_id: selectedGame.id,
      student_id: user.id,
      student_name: profile?.full_name || 'Học sinh',
      avatar_url: profile?.avatar_url || '',
      score: finalScore,
      play_duration_seconds: duration,
      is_practice_mode: isPracticeMode,
      attempt_number: gameAttempts.length + 1,
      completed_at: new Date().toISOString(),
    };

    const updatedRecords = [newRecord, ...playRecords];
    setPlayRecords(updatedRecords);
    localStorage.setItem('hanhtrinhtoanhoc_game_records', JSON.stringify(updatedRecords));

    triggerConfetti();
    setScore((s) => s + finalScore);

    alert(
      isPracticeMode
        ? `🎮 CHẾ ĐỘ LUYỆN TẬP: Bạn đã hoàn thành bài chơi với ${finalScore} điểm (Thời gian: ${duration}s)! Điểm số này giúp bạn rèn luyện mà không thay đổi điểm Xếp hạng chính.`
        : `🎉 XIN CHÚC MỪNG! Bạn đã đạt ${finalScore} điểm trong ${duration} giây! Điểm đã được lưu vào Bảng Xếp Hạng!`
    );
  };

  // GAME-10: Save Feedback & Like
  const handleSendFeedback = () => {
    if (!selectedGame || !user) return;

    const newFb: GameFeedback = {
      id: `fb_${Date.now()}`,
      game_id: selectedGame.id,
      student_id: user.id,
      student_name: profile?.full_name || 'Học sinh',
      avatar_url: profile?.avatar_url,
      likes_count: userLiked ? 1 : 0,
      rating: userRating,
      comment: userComment.trim(),
      created_at: new Date().toISOString(),
    };

    const updatedFb = [newFb, ...feedbacks];
    setFeedbacks(updatedFb);
    localStorage.setItem('hanhtrinhtoanhoc_game_feedbacks', JSON.stringify(updatedFb));
    setUserComment('');
    alert('Cảm ơn em đã thả tim và gửi nhận xét đánh giá trò chơi!');
  };

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
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
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

  // ==========================================
  // 🎡 GAME 4: VÒNG QUAY MAY MẮN (LUCKY WHEEL)
  // ==========================================
  const wheelQuestions = [
    { question: '5 × 2 = ?', answer: 10, bonus: 20 },
    { question: '14 - 6 = ?', answer: 8, bonus: 15 },
    { question: '9 + 7 = ?', answer: 16, bonus: 25 },
    { question: '2 × 8 = ?', answer: 16, bonus: 30 },
    { question: '20 - 5 = ?', answer: 15, bonus: 15 },
    { question: '5 × 3 = ?', answer: 15, bonus: 20 },
  ];

  const [spinning, setSpinning] = useState(false);
  const [currentWheelQ, setCurrentWheelQ] = useState<any>(null);
  const [userWheelAns, setUserWheelAns] = useState('');

  const spinLuckyWheel = () => {
    if (spinning) return;
    setSpinning(true);
    setCurrentWheelQ(null);
    setUserWheelAns('');

    setTimeout(() => {
      const q = wheelQuestions[Math.floor(Math.random() * wheelQuestions.length)];
      setCurrentWheelQ(q);
      setSpinning(false);
    }, 1500);
  };

  const handleCheckWheelAns = () => {
    if (!currentWheelQ) return;
    if (Number(userWheelAns) === currentWheelQ.answer) {
      triggerConfetti();
      setScore((s) => s + currentWheelQ.bonus);
      alert(`🎉 CHÍNH XÁC! Bạn nhận ngay +${currentWheelQ.bonus} XP thưởng!`);
      setCurrentWheelQ(null);
    } else {
      alert(`❌ Chưa chính xác! Đáp án đúng là ${currentWheelQ.answer}. Thử quay ván mới nhé!`);
    }
  };

  useEffect(() => {
    startNewMemoryGame();
    startNewPuzzle();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
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
              Góc Trò Chơi Toán Học 3D & iFrame Embed
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm font-extrabold mt-0.5">
              Tích hợp Game Nhúng Wordwall/Quizizz, Game HTML5 ZIP, Lật thẻ 3D, Cờ Caro X-O và Bảng Xếp Hạng!
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
      <div className="flex justify-center overflow-x-auto pb-2 scrollbar-none">
        <div className="inline-flex p-2 bg-white/90 backdrop-blur-md rounded-3xl border-2 border-slate-200 shadow-lg gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer shrink-0 ${
              activeTab === 'assigned'
                ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md shadow-sky-300/50 scale-105 border-2 border-sky-300'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-base">📦</span>
            <span>Game Thầy Cô Giao ({assignedGames.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer shrink-0 ${
              activeTab === 'memory'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-300/50 scale-105 border-2 border-amber-300'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-base">🃏</span>
            <span>Lật Thẻ 3D</span>
          </button>

          <button
            onClick={() => setActiveTab('caro')}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer shrink-0 ${
              activeTab === 'caro'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-300/50 scale-105 border-2 border-sky-300'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-base">❌⭕</span>
            <span>Cờ Caro X-O</span>
          </button>

          <button
            onClick={() => setActiveTab('puzzle')}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer shrink-0 ${
              activeTab === 'puzzle'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-300/50 scale-105 border-2 border-purple-300'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-base">🧩</span>
            <span>Xếp Số Candy</span>
          </button>

          <button
            onClick={() => setActiveTab('wheel')}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer shrink-0 ${
              activeTab === 'wheel'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-300/50 scale-105 border-2 border-emerald-300'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-base">🎡</span>
            <span>Vòng Quay May Mắn</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer shrink-0 ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-300/50 scale-105 border-2 border-rose-300'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>GAME-07: Bảng Xếp Hạng</span>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 📦 TAB 0: GAME THẦY CÔ GIAO (GAME-01 & GAME-02) */}
      {/* ========================================== */}
      {activeTab === 'assigned' && (
        <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 font-display flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-amber-500" />
                <span>GAME-01 & GAME-02: Kho Game Nhúng Wordwall / Quizizz / HTML5</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chạy trong môi trường Sandbox cô lập an toàn 100% (GAME-03) & tự động ghi điểm số về hệ thống (GAME-04).
              </p>
            </div>
            <span className="bg-sky-100 text-sky-800 text-xs font-black px-3 py-1 rounded-full border border-sky-200">
              {assignedGames.length} trò chơi
            </span>
          </div>

          {loadingGames ? (
            <div className="py-12 text-center text-slate-400 text-sm">Đang tải kho game...</div>
          ) : assignedGames.length === 0 ? (
            <div className="py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl space-y-2">
              <div className="text-4xl">🎮</div>
              <div className="font-bold text-slate-700">Chưa có Game Nhúng nào được giao trong lớp học.</div>
              <p className="text-xs text-slate-400">
                Thầy Cô có thể vào mục "5. Học Liệu" ở Cổng Giáo Viên để nhúng thêm trò chơi Wordwall / Quizizz / Canva!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedGames.map((game) => {
                const gameAttempts = playRecords.filter((r) => r.game_id === game.id && r.student_id === user?.id);
                const maxAttempts = game.max_attempts || 1;
                const isPractice = maxAttempts > 0 && gameAttempts.length >= maxAttempts;
                const gameLikes = feedbacks.filter((f) => f.game_id === game.id && f.likes_count).length;

                return (
                  <div
                    key={game.id}
                    className="p-5 rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-sky-50/40 hover:border-sky-400 hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-900 text-emerald-400 border border-slate-700">
                          {game.type === 'game_iframe' ? '🎮 GAME-01: iFrame Embed' : '📦 GAME-02: HTML5 ZIP'}
                        </span>

                        {isPractice ? (
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            🎮 GAME-08: Luyện Tập
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                            🎯 {gameAttempts.length}/{maxAttempts === 0 ? '∞' : maxAttempts} Lượt Thi
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-base font-display">{game.title}</h4>
                      {game.description && <p className="text-xs text-slate-600 line-clamp-2">{game.description}</p>}
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1 text-rose-600">
                          <Heart className="w-3.5 h-3.5 fill-rose-500" /> {gameLikes} Thích
                        </span>
                      </div>

                      <button
                        onClick={() => handleStartGame(game)}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                      >
                        <Zap className="w-4 h-4 fill-amber-300" />
                        <span>BẮT ĐẦU CHƠI</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 🖥️ MODAL / PLAYER EXPERIENCING EMBEDDED GAME */}
      {/* ========================================== */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 sm:p-6 overflow-y-auto flex flex-col justify-between">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-4 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-2xl">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-400/30 uppercase">
                  GAME-03: SANDBOX CO LẬP AN TOÀN
                </span>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> GAME-05: {elapsedSeconds}s
                </span>
              </div>
              <h3 className="text-xl font-extrabold font-display text-white mt-1">{selectedGame.title}</h3>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleSaveGameScore(100)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>GAME-04: XÁC NHẬN HÒAN THÀNH (+100 XP)</span>
              </button>

              <button
                onClick={handleCloseGamePlayer}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
              >
                ❌ THOÁT
              </button>
            </div>
          </div>

          {/* GAME-03: Isolated iFrame Container */}
          <div className="my-4 flex-1 min-h-[480px] rounded-3xl overflow-hidden border-4 border-slate-700 shadow-2xl bg-black relative">
            <iframe
              src={selectedGame.file_url}
              title={selectedGame.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              className="w-full h-full border-0 rounded-3xl"
              allowFullScreen
            />
          </div>

          {/* GAME-10: Feedback & Rating Box */}
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-4 text-white space-y-3 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setUserLiked(!userLiked)}
                  className={`p-2 rounded-xl border font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                    userLiked ? 'bg-rose-600 text-white border-rose-500 shadow-md' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${userLiked ? 'fill-white' : ''}`} />
                  <span>{userLiked ? 'Đã Thả Tim ❤️' : 'Thả Tim ❤️'}</span>
                </button>

                <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 px-2">GAME-10 Đánh Giá:</span>
                  {(['easy', 'normal', 'hard'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setUserRating(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        userRating === r ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {r === 'easy' ? '😄 Dễ & Vui' : r === 'normal' ? '🙂 Vừa Vặn' : '🧠 Thử Thách'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder="Gửi nhận xét về trò chơi..."
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500 w-full sm:w-64"
                />
                <button
                  type="button"
                  onClick={handleSendFeedback}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shrink-0 cursor-pointer"
                >
                  GỬI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 🏆 TAB 6: BẢNG XẾP HẠNG GAME (GAME-07) */}
      {/* ========================================== */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-2 border-slate-200 space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                TOP GAME HIGH-SCORES
              </span>
              <h3 className="text-2xl font-black text-slate-900 font-display mt-1">
                GAME-07: Bảng Xếp Hạng Game Cao Nhất & Nhanh Nhất
              </h3>
              <p className="text-xs font-bold text-slate-500">
                Xếp hạng dựa trên Điểm số cao nhất và Thời gian hoàn thành bài chơi ngắn nhất.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-sm text-slate-700 min-w-[550px]">
              <thead className="bg-slate-900 text-white text-xs font-bold uppercase">
                <tr>
                  <th className="px-4 py-3 text-center">HẠNG</th>
                  <th className="px-4 py-3">HỌ VÀ TÊN HỌC SINH</th>
                  <th className="px-4 py-3 text-center">ĐIỂM CAO NHẤT</th>
                  <th className="px-4 py-3 text-center">THỜI GIAN</th>
                  <th className="px-4 py-3 text-center">LƯỢT THI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {playRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">Chưa có kỷ lục lượt chơi nào được ghi nhận. Hãy là người mở màn đầu tiên!</td>
                  </tr>
                ) : (
                  playRecords.slice(0, 10).map((rec, idx) => (
                    <tr key={rec.id} className="hover:bg-slate-50 font-medium">
                      <td className="px-4 py-3 text-center font-black text-base">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center font-bold text-sky-800 text-xs">
                          {rec.student_name.charAt(0).toUpperCase()}
                        </div>
                        <span>{rec.student_name}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-extrabold text-emerald-600">
                        {rec.score} XP
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-slate-500">
                        {rec.play_duration_seconds}s
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          rec.is_practice_mode ? 'bg-amber-100 text-amber-900' : 'bg-sky-100 text-sky-900'
                        }`}>
                          {rec.is_practice_mode ? 'Luyện tập' : `Lượt #${rec.attempt_number}`}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 🃏 TAB 1: LẬT THẺ TRÍ NHỚ 3D (MEMORY MATCH)  */}
      {/* ========================================== */}
      {activeTab === 'memory' && (
        <div className="bg-gradient-to-b from-amber-50/60 to-orange-50/80 p-6 sm:p-8 rounded-3xl shadow-xl border-4 border-amber-200 text-center space-y-6 max-w-3xl mx-auto relative">
          <div className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b-2 border-amber-200/80 gap-3">
            <div className="text-left">
              <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                GAME-09: THƯ VIỆN GAME TÍCH HỢP
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

      {/* ========================================== */}
      {/* 🎡 TAB 4: VÒNG QUAY MAY MẮN (LUCKY WHEEL) */}
      {/* ========================================== */}
      {activeTab === 'wheel' && (
        <div className="bg-gradient-to-b from-emerald-50/60 to-teal-50/80 p-6 sm:p-8 rounded-3xl shadow-xl border-4 border-emerald-200 text-center space-y-6 max-w-xl mx-auto relative">
          <div className="flex justify-between items-center pb-4 border-b-2 border-emerald-200/80">
            <div className="text-left">
              <span className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                VÒNG QUAY MAY MẮN
              </span>
              <h3 className="text-2xl font-black text-emerald-950 font-display mt-1">
                Quay Số & Trả Lời Nhận Thưởng XP
              </h3>
              <p className="text-xs font-bold text-emerald-800">
                Nhấp nút quay để khám phá câu hỏi toán ngẫu nhiên và giải bài nhận điểm!
              </p>
            </div>
          </div>

          <div className="py-4 space-y-4">
            <div className={`w-36 h-36 rounded-full border-8 border-emerald-400 bg-gradient-to-tr from-amber-400 via-emerald-500 to-teal-600 flex items-center justify-center text-4xl shadow-2xl mx-auto ${spinning ? 'animate-spin' : ''}`}>
              🎡
            </div>

            <button
              onClick={spinLuckyWheel}
              disabled={spinning}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black px-8 py-3.5 rounded-2xl text-sm shadow-xl active:scale-95 transition-all cursor-pointer border-2 border-emerald-300"
            >
              {spinning ? '🌀 ĐANG QUAY MẶT VÒNG QUAY...' : '⚡ BẤM QUAY VÒNG MAY MẮN'}
            </button>
          </div>

          {currentWheelQ && (
            <div className="p-5 bg-white rounded-3xl border-2 border-emerald-300 shadow-lg space-y-3">
              <div className="text-xs font-extrabold text-emerald-600 uppercase">CÂU HỎI NHẬN +{currentWheelQ.bonus} XP</div>
              <div className="text-2xl font-black text-slate-900">{currentWheelQ.question}</div>

              <div className="flex gap-2 max-w-xs mx-auto">
                <input
                  type="number"
                  value={userWheelAns}
                  onChange={(e) => setUserWheelAns(e.target.value)}
                  placeholder="Điền kết quả..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleCheckWheelAns}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs shrink-0 cursor-pointer"
                >
                  GỬI
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
