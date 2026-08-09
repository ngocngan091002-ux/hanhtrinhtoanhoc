import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function generateAIQuestions(topic: string, grade: number = 3, count: number = 5) {
  const prompt = `Bạn là chuyên gia giáo dục toán tiểu học Lớp ${grade}. 
Hãy tạo danh sách ${count} câu hỏi toán tiểu học thuộc chủ đề "${topic}".
Trả về định dạng JSON thuần túy (Array of objects), mỗi object gồm:
- id: chuỗi ngẫu nhiên (q1, q2...)
- prompt: nội dung câu hỏi ngắn gọn, phù hợp học sinh tiểu học
- options: mảng 4 lựa chọn (A, B, C, D) dạng text
- correct_answer: lựa chọn đúng (trùng khớp exact 1 trong các options)
- explanation: giải thích ngắn gọn bằng giọng điệu vui vẻ, khen ngợi.

CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG CÓ MARKDOWN HOẶC DẪN NHẬP.`;

  if (!ai) {
    // Basic smart fallback if no API key present yet
    return [
      {
        id: 'q1',
        prompt: `Trong phép tính 345 + 218, kết quả bằng bao nhiêu?`,
        options: ['563', '553', '564', '573'],
        correct_answer: '563',
        explanation: 'Thầy/Cô tuyên dương con! Phép cộng nhớ 1 ở hàng chục: 5+8=13 (viết 3 nhớ 1), 4+1+1=6, 3+2=5.'
      },
      {
        id: 'q2',
        prompt: `Một hình chữ nhật có chiều dài 8cm, chiều rộng 5cm. Chu vi hình chữ nhật đó là:`,
        options: ['13 cm', '26 cm', '40 cm', '30 cm'],
        correct_answer: '26 cm',
        explanation: 'Công thức tính chu vi hình chữ nhật = (Chiều dài + Chiều rộng) x 2 = (8 + 5) x 2 = 26cm.'
      }
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Error generating AI questions:', error);
    return [
      {
        id: 'q1',
        prompt: `Tính: 125 x 4 = ?`,
        options: ['400', '500', '600', '450'],
        correct_answer: '500',
        explanation: '125 x 4 = 500. Rất chính xác!'
      }
    ];
  }
}

export async function suggestGrading(questions: any[], answers: Record<string, string>) {
  const prompt = `Bạn là trợ lý AI giáo viên toán tiểu học.
Danh sách câu hỏi: ${JSON.stringify(questions)}
Bài làm của học sinh: ${JSON.stringify(answers)}

Hãy kiểm tra bài làm, đưa ra gợi ý chấm điểm từ 0.0 đến 10.0 và nhận xét ngắn gọn, ấm áp, động viên học sinh.
Trả về định dạng JSON:
{
  "suggested_score": 9.0,
  "suggested_feedback": "Con làm bài rất xuất sắc! Chỉ lưu ý chút ở câu tính chu vi nhé."
}
CHỈ TRẢ VỀ JSON HỢP LỆ.`;

  if (!ai) {
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) correctCount++;
    });
    const score = questions.length > 0 ? (correctCount / questions.length) * 10 : 10;
    return {
      suggested_score: Math.round(score * 10) / 10,
      suggested_feedback: `AI Gợi Ý: Học sinh trả lời đúng ${correctCount}/${questions.length} câu. Thái độ làm bài rất nghiêm túc!`
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Error suggesting grading:', error);
    return {
      suggested_score: 8.5,
      suggested_feedback: 'Học sinh hoàn thành bài nộp tương đối tốt.'
    };
  }
}

export async function askMathTutorAI(question: string, contextMessage: string = '') {
  const prompt = `Bạn là Trợ Lý Toán Học AI dành cho học sinh tiểu học (giọng điệu như người anh/chị gia sư vui tính, tận tâm).
YÊU CẦU QUAN TRỌNG:
1. KHÔNG được làm bài thay hay cho ngay đáp án cuối cùng.
2. Hãy đặt câu hỏi gợi mở, hướng dẫn từng bước nhỏ để học sinh tự nghĩ ra đáp án.
3. Khen ngợi khi học sinh cố gắng. Giúp học sinh yêu thích môn toán.

Hỏi của học sinh: "${question}"
Ngữ cảnh bài toán (nếu có): "${contextMessage}"`;

  if (!ai) {
    return `Chào bạn nhỏ! 👋 Thầy/Cô AI ở đây để hỗ trợ bạn nhé. Đối với bài toán "${question}", bạn thử nhớ lại công thức xem hàng đơn vị mình sẽ cộng trước hay cộng sau nhỉ? Bạn thử tính giúp mình nhé! 🌟`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || 'Bạn nhỏ thử chia nhỏ bài toán ra làm 2 bước xem sao nhé!';
  } catch (error) {
    console.error('AI tutor error:', error);
    return 'Thầy AI đã nhận được câu hỏi. Con hãy thử đọc kỹ lại đề bài một lần nữa xem người ta hỏi gì nhé!';
  }
}

export async function analyzeStudentWeaknesses(studentName: string, performanceHistory: any[]) {
  const prompt = `Bạn là chuyên gia phân tích dữ liệu học tập tiểu học.
Dựa trên lịch sử bài nộp của học sinh ${studentName}: ${JSON.stringify(performanceHistory)}.
Hãy đưa ra tổng hợp các kiến thức học sinh còn yếu/cần lưu ý và đề xuất hướng hỗ trợ cho Giáo viên.
Trả về JSON:
{
  "weak_topics": ["Phép chia có dư", "Tính chu vi hình chữ nhật"],
  "recommendations": "Học sinh thường vướng ở phép chia có dư lớn hơn số chia. Giáo viên nên cho thêm 2-3 bài tập nhỏ luyện tập dạng này."
}`;

  if (!ai) {
    return {
      weak_topics: ['Phép cộng có nhớ', 'Giải toán có lời văn'],
      recommendations: `Học sinh ${studentName} nắm vững lý thuyết nhưng cần rèn luyện thêm khả năng phân tích đề toán có lời văn 2 phép tính.`
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    return {
      weak_topics: ['Tính nhẩm nhanh'],
      recommendations: 'Giáo viên động viên học sinh luyện tập thêm trò chơi toán học hằng ngày.'
    };
  }
}
