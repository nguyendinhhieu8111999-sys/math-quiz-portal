import { Question } from '../types';

export interface GeminiExtractionResult {
  success: boolean;
  questions?: Question[];
  rawText?: string;
  error?: string;
}

export const extractQuestionsFromPdf = async (
  pdfBase64: string,
  apiKey: string
): Promise<GeminiExtractionResult> => {
  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      error: 'Vui lòng nhập Google AI Studio API Key trong mục Cài đặt trước khi xử lý PDF!',
    };
  }

  // Model endpoint - gemini-3.8-flash (Google AI Studio)
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey.trim()}`;

  const prompt = `
Bạn là một chuyên gia khảo thí và số hóa đề thi Toán học Việt Nam.
Hãy đọc tài liệu PDF này và trích xuất TOÀN BỘ các câu hỏi trắc nghiệm Toán học sang định dạng JSON.

QUY TẮC CỰC KỲ QUAN TRỌNG:
1. Tất cả các ký hiệu toán học, biến số, hàm số, phân số, tích phân, đạo hàm, căn thức, ma trận, v.v. PHẢI ĐƯỢC CHUYỂN SANG ĐỊNH DẠNG LaTeX chuẩn và đặt trong dấu $...$ (inline) hoặc $$...$$ (display).
   Ví dụ: $f(x) = x^3 - 3x^2 + 2$, $\\frac{a}{b}$, $\\int_{0}^{1} x dx$, $\\lim_{x \\to +\\infty}$, $\\sqrt{x^2+1}$, $\\vec{n} = (1; 2; 3)$.
2. Mỗi câu hỏi phải có đủ 4 phương án: A, B, C, D. Lược bỏ tiền tố "A.", "B.", "C.", "D." ở đầu mỗi lựa chọn để chỉ giữ lại nội dung.
3. Xác định đáp án đúng (correctAnswer: 0 cho A, 1 cho B, 2 cho C, 3 cho D):
   - Nếu trong file PDF có bảng đáp án (hoặc lời giải chi tiết), hãy căn cứ theo đó để lấy đáp án chuẩn 100%.
   - Nếu không có bảng đáp án, bạn hãy tự giải và chọn đáp án chính xác nhất.
4. Trường "hasFigure": Nếu câu hỏi có hình vẽ, đồ thị hàm số, bảng biến thiên, hoặc hình không gian, hãy đặt "hasFigure": true.
5. Trường "explanation": Trích xuất hoặc tóm tắt ngắn gọn các bước giải (bằng tiếng Việt, công thức bằng LaTeX).

CHỈ TRẢ VỀ DUY NHẤT MÃ JSON HỢP LỆ THEO CẤU TRÚC SAU (không kèm giải thích markdown ngoài JSON):
[
  {
    "id": "q_1",
    "orderNumber": 1,
    "text": "Cho hàm số $y=f(x)$ liên tục trên $\\mathbb{R}$ và có bảng xét dấu đạo hàm như sau...",
    "options": [
      "$x = 1$",
      "$x = 2$",
      "$x = 3$",
      "$x = 4$"
    ],
    "correctAnswer": 0,
    "hasFigure": true,
    "explanation": "Dựa vào bảng xét dấu, đạo hàm đổi dấu từ dương sang âm tại $x = 1$ nên..."
  }
]
`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: pdfBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const msg = errJson.error?.message || `Lỗi máy chủ Google (${response.status})`;
      return { success: false, error: msg };
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidate) {
      return { success: false, error: 'Không nhận được phản hồi nội dung từ Gemini.' };
    }

    // Parse JSON
    let parsed: any;
    try {
      // Clean possible markdown code fence
      const cleaned = candidate.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      return {
        success: false,
        rawText: candidate,
        error: 'Lỗi định dạng dữ liệu trả về từ AI. Vui lòng thử lại.',
      };
    }

    // Ensure array of questions
    const questionsArray = Array.isArray(parsed) ? parsed : parsed.questions || [];
    const sanitizedQuestions: Question[] = questionsArray.map((q: any, idx: number) => ({
      id: q.id || `q_${Date.now()}_${idx + 1}`,
      orderNumber: q.orderNumber || idx + 1,
      text: q.text || `Câu hỏi ${idx + 1}`,
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
      correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 ? q.correctAnswer : 0,
      explanation: q.explanation || '',
      hasFigure: Boolean(q.hasFigure),
      imageUrl: '',
    }));

    return {
      success: true,
      questions: sanitizedQuestions,
      rawText: candidate,
    };
  } catch (err: any) {
    console.error('Gemini API call failed:', err);
    return {
      success: false,
      error: err.message || 'Lỗi kết nối tới Google AI Studio.',
    };
  }
};
