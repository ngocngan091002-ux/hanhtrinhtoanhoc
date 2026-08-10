import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Smart offline question generator matching topic strictly
function generateDynamicTopicQuestions(topic: string, grade: number = 2, count: number = 5) {
  const lowerTopic = topic.toLowerCase();

  // 1. Phép cộng phạm vi 20 (Grade 1 & 2)
  if (lowerTopic.includes('cộng') && (lowerTopic.includes('20') || lowerTopic.includes('lớp 1') || lowerTopic.includes('lớp 2'))) {
    const pool = [
      { prompt: 'Phép tính 8 + 7 có kết quả bằng bao nhiêu?', options: ['15', '14', '16', '13'], correct: '15', exp: '8 + 7 = 15.' },
      { prompt: 'Tính: 9 + 6 = ?', options: ['15', '14', '16', '17'], correct: '15', exp: '9 + 6 = 15.' },
      { prompt: 'Điền số thích hợp vào chỗ chấm: 12 + 5 = ...', options: ['17', '16', '18', '19'], correct: '17', exp: '12 + 5 = 17.' },
      { prompt: 'Tính nhẩm: 7 + 8 = ?', options: ['15', '16', '14', '13'], correct: '15', exp: '7 + 8 = 15.' },
      { prompt: 'Tính: 11 + 6 = ?', options: ['17', '18', '16', '19'], correct: '17', exp: '11 + 6 = 17.' },
    ];
    return pool.slice(0, count).map((item, idx) => ({
      id: `q_${idx + 1}`,
      prompt: item.prompt,
      options: item.options,
      correct_answer: item.correct,
      explanation: item.exp,
    }));
  }

  // 2. Phép trừ phạm vi 20
  if (lowerTopic.includes('trừ') && (lowerTopic.includes('20') || lowerTopic.includes('lớp 1') || lowerTopic.includes('lớp 2'))) {
    const pool = [
      { prompt: 'Phép tính 15 - 7 có kết quả bằng bao nhiêu?', options: ['8', '7', '9', '6'], correct: '8', exp: '15 - 7 = 8.' },
      { prompt: 'Tính: 18 - 9 = ?', options: ['9', '8', '10', '7'], correct: '9', exp: '18 - 9 = 9.' },
      { prompt: 'Điền số thích hợp: 14 - 6 = ...', options: ['8', '7', '9', '6'], correct: '8', exp: '14 - 6 = 8.' },
      { prompt: 'Tính nhẩm: 13 - 5 = ?', options: ['8', '7', '9', '6'], correct: '8', exp: '13 - 5 = 8.' },
      { prompt: 'Tính: 16 - 8 = ?', options: ['8', '7', '9', '6'], correct: '8', exp: '16 - 8 = 8.' },
    ];
    return pool.slice(0, count).map((item, idx) => ({
      id: `q_${idx + 1}`,
      prompt: item.prompt,
      options: item.options,
      correct_answer: item.correct,
      explanation: item.exp,
    }));
  }

  // 3. Phép nhân / Bảng nhân
  if (lowerTopic.includes('nhân') || lowerTopic.includes('bảng nhân')) {
    const pool = [
      { prompt: 'Phép tính 5 x 7 có kết quả bằng bao nhiêu?', options: ['35', '30', '40', '25'], correct: '35', exp: '5 x 7 = 35.' },
      { prompt: 'Tính: 4 x 8 = ?', options: ['32', '28', '36', '30'], correct: '32', exp: '4 x 8 = 32.' },
      { prompt: 'Điền số thích hợp: 3 x 9 = ...', options: ['27', '24', '30', '21'], correct: '27', exp: '3 x 9 = 27.' },
      { prompt: 'Tính: 2 x 9 = ?', options: ['18', '16', '20', '14'], correct: '18', exp: '2 x 9 = 18.' },
      { prompt: 'Mỗi chiếc xe có 4 bánh. Hỏi 6 chiếc xe có tất cả bao nhiêu bánh xe?', options: ['24 bánh', '20 bánh', '28 bánh', '22 bánh'], correct: '24 bánh', exp: '4 x 6 = 24 (bánh xe).' },
    ];
    return pool.slice(0, count).map((item, idx) => ({
      id: `q_${idx + 1}`,
      prompt: item.prompt,
      options: item.options,
      correct_answer: item.correct,
      explanation: item.exp,
    }));
  }

  // 4. Default fallback matching grade level
  const genericPool = [
    { prompt: `Phép tính 14 + 5 có kết quả bằng bao nhiêu?`, options: ['19', '18', '20', '17'], correct: '19', exp: '14 + 5 = 19.' },
    { prompt: `Tính: 20 - 8 = ?`, options: ['12', '11', '13', '14'], correct: '12', exp: '20 - 8 = 12.' },
    { prompt: `Số lớn nhất có một chữ số cộng với 5 bằng bao nhiêu?`, options: ['14', '13', '15', '12'], correct: '14', exp: 'Số lớn nhất có 1 chữ số là 9. Ta có 9 + 5 = 14.' },
    { prompt: `Điền số thích hợp vào chỗ chấm: 7 + ... = 15`, options: ['8', '7', '9', '6'], correct: '8', exp: '15 - 7 = 8.' },
    { prompt: `Mẹ mua 9 quả cam, bố mua thêm 6 quả cam. Hỏi có tất cả bao nhiêu quả cam?`, options: ['15 quả', '14 quả', '16 quả', '13 quả'], correct: '15 quả', exp: '9 + 6 = 15 (quả cam).' },
  ];

  return genericPool.slice(0, count).map((item, idx) => ({
    id: `q_${idx + 1}`,
    prompt: item.prompt,
    options: item.options,
    correct_answer: item.correct,
    explanation: item.exp,
  }));
}

export async function generateAIQuestions(topic: string, grade: number = 2, count: number = 5) {
  const prompt = `Bạn là chuyên gia soạn thảo đề thi toán tiểu học Việt Nam cấp Lớp ${grade}. 
YÊU CẦU BẮT BUỘC:
1. Tạo danh sách ${count} câu hỏi trắc nghiệm toán tiểu học thuộc chính xác chủ đề: "${topic}".
2. PHẢI ĐẢM BẢO độ khó và giới hạn số tính toán NẰM ĐÚNG PHẠM VI "${topic}". 
   Ví dụ: Nếu chủ đề ghi "phạm vi 20" thì tất cả các số và kết quả PHẢI nhỏ hơn hoặc bằng 20.
3. Trả về định dạng JSON thuần túy (Array of objects), mỗi object gồm:
- id: chuỗi ngẫu nhiên (q1, q2...)
- prompt: nội dung câu hỏi ngắn gọn, vui tươi, chuẩn kiến thức Lớp ${grade}
- options: mảng 4 lựa chọn (A, B, C, D) dạng text
- correct_answer: lựa chọn đúng (trùng khớp exact 1 trong các options)
- explanation: CHỈ CHỨA LỜI GIẢI THUẦN TÚY BẰNG PHÉP TÍNH (ví dụ: 8 + 7 = 15). TUYỆT ĐỐI KHÔNG ĐÈM THEO BẤT KỲ CÂU KHEN NGỢI HAY NHẬN XÉT NÀO BÊN CẠNH!

CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG CÓ MARKDOWN HOẶC DẪN NHẬP.`;

  if (!ai) {
    return generateDynamicTopicQuestions(topic, grade, count);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return generateDynamicTopicQuestions(topic, grade, count);
  } catch (error) {
    console.error('Error generating AI questions:', error);
    return generateDynamicTopicQuestions(topic, grade, count);
  }
}

export async function suggestGrading(questions: any[], answers: Record<string, string>) {
  const prompt = `Bạn là trợ lý giáo viên toán tiểu học.
Danh sách câu hỏi: ${JSON.stringify(questions)}
Bài làm của học sinh: ${JSON.stringify(answers)}

Hãy kiểm tra bài làm, đưa ra gợi ý chấm điểm từ 0.0 đến 10.0 và nhận xét ngắn gọn, động viên học sinh (XƯNG THẦY/CÔ HOẶC GIÁO VIÊN, GỌI HỌC SINH LÀ "EM", TUYỆT ĐỐI KHÔNG DÙNG TỪ "CON").
Trả về định dạng JSON:
{
  "suggested_score": 9.0,
  "suggested_feedback": "Em làm bài rất xuất sắc! Đã làm đúng hầu hết các câu."
}
CHỈ TRẢ VỀ JSON HỢP LỆ.`;

  let correctCount = 0;
  const wrongQuestions: string[] = [];

  questions.forEach((q, idx) => {
    const userAns = answers[q.id] || answers[`q_${idx}`] || (answers ? Object.values(answers)[idx] : undefined);
    const isCorrect = userAns === q.correct_answer || (q.correct_answer && String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase());

    if (isCorrect) {
      correctCount++;
    } else {
      wrongQuestions.push(`Câu ${idx + 1}`);
    }
  });

  const calculatedScore = questions.length > 0 ? Math.round(((correctCount / questions.length) * 10) * 10) / 10 : 10;
  let defaultFeedback = '';
  if (correctCount === questions.length) {
    defaultFeedback = `Em làm bài rất xuất sắc! Đã làm đúng toàn bộ ${questions.length}/${questions.length} câu hỏi.`;
  } else if (correctCount > 0) {
    defaultFeedback = `Em làm đúng ${correctCount}/${questions.length} câu (Đạt ${calculatedScore} điểm). Cần chú ý ôn lại ${wrongQuestions.join(', ')} nhé!`;
  } else {
    defaultFeedback = `Em cần cố gắng hơn ở bài sau nhé! Hãy xem lại đáp án gợi ý để ôn tập lại.`;
  }

  if (!ai) {
    return {
      suggested_score: calculatedScore,
      suggested_feedback: defaultFeedback,
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    let fb = parsed.suggested_feedback || defaultFeedback;
    fb = fb.replace(/\bCon\b/g, 'Em').replace(/\bcon\b/g, 'em');

    return {
      suggested_score: parsed.suggested_score !== undefined ? parsed.suggested_score : calculatedScore,
      suggested_feedback: fb,
    };
  } catch (error) {
    console.error('Error suggesting grading:', error);
    return {
      suggested_score: calculatedScore,
      suggested_feedback: defaultFeedback,
    };
  }
}

export async function askMathTutorAI(question: string, contextMessage: string = '') {
  const prompt = `Bạn là Trợ Lý Toán Học dành cho học sinh tiểu học (giọng điệu tận tâm, xưng Thầy/Cô, gọi học sinh là "em", KHÔNG DÙNG TỪ "CON").
YÊU CẦU QUAN TRỌNG:
1. KHÔNG được làm bài thay hay cho ngay đáp án cuối cùng.
2. Hãy đặt câu hỏi gợi mở, hướng dẫn từng bước nhỏ để học sinh tự nghĩ ra đáp án.
3. Khen ngợi khi học sinh cố gắng. Giúp học sinh yêu thích môn toán.

Hỏi của học sinh: "${question}"
Ngữ cảnh bài toán (nếu có): "${contextMessage}"`;

  if (!ai) {
    return `Chào em! 👋 Thầy/Cô ở đây để hỗ trợ em nhé. Đối với bài toán "${question}", em thử nhớ lại quy tắc tính xem phép tính nào thực hiện trước nhỉ? Em thử tính giúp Thầy/Cô xem sao nhé! 🌟`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    let text = response.text || 'Em thử chia nhỏ bài toán ra làm 2 bước xem sao nhé!';
    text = text.replace(/\bCon\b/g, 'Em').replace(/\bcon\b/g, 'em');
    return text;
  } catch (error) {
    console.error('AI tutor error:', error);
    return 'Thầy/Cô đã nhận được câu hỏi. Em hãy thử đọc kỹ lại đề bài một lần nữa xem bài toán hỏi gì nhé!';
  }
}

export async function analyzeStudentWeaknesses(studentName: string, performanceHistory: any[]) {
  let totalQuestions = 0;
  let correctQuestions = 0;
  const wrongTopicsSet = new Set<string>();

  (performanceHistory || []).forEach((item: any) => {
    const qList = Array.isArray(item.questions_json)
      ? item.questions_json
      : typeof item.questions_json === 'string'
      ? JSON.parse(item.questions_json || '[]')
      : [];

    const ansMap = item.answers_json || {};

    qList.forEach((q: any, idx: number) => {
      totalQuestions++;
      const userAns = ansMap[q.id] ?? ansMap[`q_${idx}`] ?? ansMap[idx] ?? (ansMap ? Object.values(ansMap)[idx] : undefined);
      const isCorrect = userAns === q.correct_answer || (q.correct_answer && String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase());

      if (isCorrect) {
        correctQuestions++;
      } else {
        const topic = item.assignment_title ? `${item.assignment_title} (Câu ${idx + 1})` : q.prompt ? `Câu ${idx + 1}: ${q.prompt}` : `Câu ${idx + 1}`;
        wrongTopicsSet.add(topic);
      }
    });
  });

  const accuracyPercent = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 100;
  const weakTopics = Array.from(wrongTopicsSet);

  if (!ai) {
    let rec = '';
    if (totalQuestions === 0) {
      rec = `Học sinh ${studentName} chưa làm bài tập nào. Hãy giao bài tập để theo dõi tiến độ.`;
    } else if (accuracyPercent === 100) {
      rec = `Học sinh ${studentName} hoàn thành xuất sắc ${correctQuestions}/${totalQuestions} câu hỏi (Đạt ${accuracyPercent}%) với thời gian làm bài nhanh mượt. Học sinh đã nắm vững 100% nội dung kiến thức được giao!`;
    } else {
      rec = `Học sinh ${studentName} làm đúng ${correctQuestions}/${totalQuestions} câu (Đạt ${accuracyPercent}%). Cần chú ý rèn luyện thêm ở các câu làm sai: ${weakTopics.join(', ')}.`;
    }

    return {
      accuracy_rate: `${accuracyPercent}%`,
      completion_speed: 'Nhanh',
      weak_topics: weakTopics.length > 0 ? weakTopics : ['Không có - Đúng 100%'],
      recommendations: rec,
    };
  }

  const prompt = `Bạn là chuyên gia phân tích dữ liệu học tập tiểu học.
Dựa trên lịch sử bài nộp thực tế của học sinh ${studentName}:
${JSON.stringify(performanceHistory, null, 2)}

YÊU CẦU BẮT BUỘC:
1. Đánh giá chính xác tỉ lệ % làm đúng: ${accuracyPercent}%.
2. Nếu tỉ lệ làm đúng là 100% (hoặc không có câu sai), danh sách weak_topics PHẢI LÀ ["Không có - Đúng 100%"] (TUYỆT ĐỐI KHÔNG BỊA RA CÁC DẠNG TOÁN LỜI VĂN HAY PHÉP CỘNG NẾU HỌC SINH KHÔNG LÀM SAI!).
3. Chỉ nêu dạng toán làm sai NẾU HỌC SINH THỰC SỰ LÀM SAI TRONG DỮ LIỆU BÀI NỘP.
4. Xưng gọi học sinh là "em" (TUYỆT ĐỐI KHÔNG DÙNG TỪ "CON").

Trả về duy nhất định dạng JSON:
{
  "accuracy_rate": "${accuracyPercent}%",
  "completion_speed": "Nhanh",
  "weak_topics": ${JSON.stringify(weakTopics.length > 0 ? weakTopics : ["Không có - Đúng 100%"])},
  "recommendations": "Nhận xét phân tích dựa trên dữ liệu..."
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (parsed.recommendations) {
      parsed.recommendations = parsed.recommendations.replace(/\bCon\b/g, 'Em').replace(/\bcon\b/g, 'em');
    }
    if (accuracyPercent === 100) {
      parsed.accuracy_rate = '100%';
      parsed.weak_topics = ['Không có - Đúng 100%'];
    }
    return parsed;
  } catch (error) {
    let rec = `Học sinh ${studentName} làm đúng ${correctQuestions}/${totalQuestions} câu (${accuracyPercent}%).`;
    if (accuracyPercent === 100) {
      rec = `Học sinh ${studentName} đạt kết quả tuyệt đối ${accuracyPercent}%. Kỹ năng làm bài rất tốt!`;
    }
    return {
      accuracy_rate: `${accuracyPercent}%`,
      completion_speed: 'Tốt',
      weak_topics: weakTopics.length > 0 ? weakTopics : ['Không có - Đúng 100%'],
      recommendations: rec,
    };
  }
}
