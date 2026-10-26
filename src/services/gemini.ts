import { Question, QuestionType, TrueFalseItem } from '../types';

export interface GeminiExtractionResult {
  success: boolean;
  questions?: Question[];
  rawText?: string;
  error?: string;
}

export const extractQuestionsFromPdf = async (
  pdfBase64: string,
  apiKey: string,
  modelName: string = 'gemini-3.8-pro'
): Promise<GeminiExtractionResult> => {
  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      error: 'Vui lòng nhập Google AI Studio API Key trong mục Cài đặt trước khi xử lý PDF!',
    };
  }

  const selectedModel = modelName.trim() || 'gemini-3.8-pro';
  // Model endpoint - Google AI Studio (gemini-3.8-pro / gemini-3.8-flash)
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey.trim()}`;

  const prompt = `
Bạn là một chuyên gia khảo thí và số hóa đề thi Toán học Việt Nam theo cấu trúc mới nhất của Bộ Giáo dục & Đào tạo (chuẩn thi Tốt nghiệp THPT mới từ 2025 và truyền thống).
Hãy đọc tài liệu PDF này và trích xuất TOÀN BỘ các câu hỏi Toán học sang định dạng JSON.

HÃY NHẬN DIỆN VÀ PHÂN LOẠI ĐÚNG 3 PHẦN THI NẾU CÓ:
1. "multiple_choice" (Phần I - Trắc nghiệm 4 lựa chọn A, B, C, D):
   - Có 4 phương án A, B, C, D.
   - correctAnswer: 0 (A), 1 (B), 2 (C), hoặc 3 (D).
   - part: 1.

2. "true_false" (Phần II - Trắc nghiệm Đúng/Sai):
   - Mỗi câu có 4 mệnh đề/ý nhỏ: a), b), c), d).
   - subQuestions: mảng 4 phần tử với label "a", "b", "c", "d", text là nội dung mệnh đề, isCorrect là true nếu mệnh đề Đúng, false nếu Sai.
   - part: 2.

3. "short_answer" (Phần III - Trắc nghiệm Trả lời ngắn):
   - Thí sinh tự giải và điền đáp số (số thực, số nguyên, ví dụ: "12", "-3.5", "0.25", "1/2").
   - shortAnswerKey: chuỗi kết quả chính xác (ví dụ "12" hoặc "-3.5").
   - part: 3.

NẾU ĐỀ THI LÀ ĐỀ TRUYỀN THỐNG (chỉ có trắc nghiệm A, B, C, D), hãy trích xuất toàn bộ dưới dạng "multiple_choice" (part: 1).

QUY TẮC CỰC KỲ QUAN TRỌNG:
1. Tất cả các ký hiệu toán học, biến số, hàm số, phân số, tích phân, đạo hàm, căn thức, ma trận, v.v. PHẢI ĐƯỢC CHUYỂN SANG ĐỊNH DẠNG LaTeX chuẩn và đặt trong dấu $...$ (inline) hoặc $$...$$ (display).
   Ví dụ: $f(x) = x^3 - 3x^2 + 2$, $\\frac{a}{b}$, $\\int_{0}^{1} x dx$, $\\lim_{x \\to +\\infty}$, $\\sqrt{x^2+1}$, $\\vec{n} = (1; 2; 3)$.
2. Với câu multiple_choice, lược bỏ tiền tố "A.", "B.", "C.", "D." ở đầu mỗi lựa chọn để chỉ giữ lại nội dung.
3. Căn cứ theo bảng đáp án/lời giải ở cuối PDF nếu có, hoặc tự giải chính xác.
4. Trường "hasFigure": Nếu câu hỏi có hình vẽ, đồ thị hàm số, bảng biến thiên, hoặc hình không gian, hãy đặt "hasFigure": true.
5. Trường "explanation": Trích xuất hoặc tóm tắt các bước giải (bằng tiếng Việt, công thức bằng LaTeX).

CHỈ TRẢ VỀ DUY NHẤT MÃ JSON HỢP LỆ THEO CẤU TRÚC SAU (không kèm markdown ngoài JSON):
[
  {
    "id": "q_1",
    "part": 1,
    "type": "multiple_choice",
    "orderNumber": 1,
    "text": "Cho hàm số $y=f(x)$ liên tục trên $\\mathbb{R}$...",
    "options": ["$x = 1$", "$x = 2$", "$x = 3$", "$x = 4$"],
    "correctAnswer": 0,
    "hasFigure": true,
    "explanation": "Lời giải chi tiết..."
  },
  {
    "id": "q_13",
    "part": 2,
    "type": "true_false",
    "orderNumber": 13,
    "text": "Cho hàm số $y = f(x) = x^3 - 3x$. Xét tính đúng sai của các khẳng định sau:",
    "subQuestions": [
      { "id": "sub_1", "label": "a", "text": "Hàm số đồng biến trên khoảng $(-\\infty; -1)$.", "isCorrect": true },
      { "id": "sub_2", "label": "b", "text": "Hàm số đạt cực tiểu tại điểm $x = -1$.", "isCorrect": false },
      { "id": "sub_3", "label": "c", "text": "Đồ thị hàm số đi qua gốc tọa độ $O(0; 0)$.", "isCorrect": true },
      { "id": "sub_4", "label": "d", "text": "Giá trị cực đại của hàm số bằng $2$.", "isCorrect": true }
    ],
    "hasFigure": false,
    "explanation": "Ta có $f'(x) = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$..."
  },
  {
    "id": "q_17",
    "part": 3,
    "type": "short_answer",
    "orderNumber": 17,
    "text": "Một công ty sản xuất một loại sản phẩm với chi phí... Hãy tính lợi nhuận lớn nhất (đơn vị: triệu đồng).",
    "shortAnswerKey": "120",
    "hasFigure": false,
    "explanation": "Lập hàm số lợi nhuận $L(x)$ và tìm giá trị lớn nhất..."
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
      const cleaned = candidate.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      return {
        success: false,
        rawText: candidate,
        error: 'Lỗi định dạng dữ liệu trả về từ AI. Vui lòng thử lại.',
      };
    }

    const questionsArray = Array.isArray(parsed) ? parsed : parsed.questions || [];
    const sanitizedQuestions: Question[] = questionsArray.map((q: any, idx: number) => {
      const qType: QuestionType =
        q.type === 'true_false' || q.type === 'short_answer' ? q.type : 'multiple_choice';
      
      const part = q.part || (qType === 'multiple_choice' ? 1 : qType === 'true_false' ? 2 : 3);

      let subQuestions: TrueFalseItem[] | undefined = undefined;
      if (qType === 'true_false') {
        const rawSubs = Array.isArray(q.subQuestions) ? q.subQuestions : [];
        const labels = ['a', 'b', 'c', 'd'];
        subQuestions = labels.map((lbl, sIdx) => {
          const rawItem = rawSubs[sIdx] || {};
          return {
            id: rawItem.id || `sub_${Date.now()}_${sIdx}`,
            label: lbl,
            text: rawItem.text || `Mệnh đề ${lbl}`,
            isCorrect: Boolean(rawItem.isCorrect),
          };
        });
      }

      return {
        id: q.id || `q_${Date.now()}_${idx + 1}`,
        part,
        type: qType,
        orderNumber: q.orderNumber || idx + 1,
        text: q.text || `Câu hỏi ${idx + 1}`,
        options:
          qType === 'multiple_choice'
            ? Array.isArray(q.options) && q.options.length === 4
              ? q.options
              : ['A', 'B', 'C', 'D']
            : undefined,
        correctAnswer:
          qType === 'multiple_choice'
            ? typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
              ? q.correctAnswer
              : 0
            : undefined,
        subQuestions,
        shortAnswerKey: qType === 'short_answer' ? String(q.shortAnswerKey ?? '').trim() : undefined,
        explanation: q.explanation || '',
        hasFigure: Boolean(q.hasFigure),
        imageUrl: '',
      };
    });

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
