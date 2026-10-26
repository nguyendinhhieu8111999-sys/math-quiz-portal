export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface TrueFalseItem {
  id: string;
  label: string; // 'a', 'b', 'c', 'd'
  text: string;
  isCorrect: boolean; // true = Đúng, false = Sai
}

export interface Question {
  id: string;
  type?: QuestionType; // default 'multiple_choice'
  part?: 1 | 2 | 3; // Phần I, Phần II, Phần III
  orderNumber?: number;
  text: string;
  
  // Dành cho Phần I: Trắc nghiệm 4 phương án
  options?: string[]; // 4 options [A, B, C, D]
  correctAnswer?: number; // 0: A, 1: B, 2: C, 3: D

  // Dành cho Phần II: Đúng / Sai (4 ý a, b, c, d)
  subQuestions?: TrueFalseItem[];

  // Dành cho Phần III: Trả lời ngắn (điền đáp số)
  shortAnswerKey?: string; // Ví dụ: "12", "-2.5", "0.75"

  explanation?: string;
  imageUrl?: string; // Hình học / đồ thị cắt từ PDF
  hasFigure?: boolean;
  points?: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  durationMinutes: number; // Thời gian làm bài (phút)
  deadline: string; // ISO datetime string (Hạn chót)
  assignedClasses: string[]; // ["12A1", "12A2"] or ["ALL"]
  shuffleQuestions: boolean; // Đảo thứ tự câu hỏi (trong từng phần)
  shuffleOptions: boolean; // Đảo thứ tự đáp án A, B, C, D
  showResultsImmediately: boolean; // Hiện điểm ngay sau khi nộp
  showExplanations: boolean; // Cho xem lời giải chi tiết
  googleSheetWebhookUrl?: string; // Link Apps Script webhook
  questions: Question[];
  createdAt: string;
  status: 'active' | 'draft' | 'closed';
}

export interface Student {
  id: string;
  studentId: string; // Mã học sinh (dùng đăng nhập)
  password: string; // Mật khẩu cấp bởi giáo viên
  fullName: string;
  className: string; // Lớp học (12A1, 12A2, ...)
  phone?: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  // Answers can be:
  // multiple_choice -> number (0..3)
  // true_false -> Record<string, boolean> (subId -> true/false)
  // short_answer -> string
  answers: Record<string, any>;
  questionOrder?: string[];
  questionScores?: Record<string, number>; // Điểm đạt được của từng câu
  score: number; // Thang điểm 10
  correctCount: number;
  totalCount: number;
  submittedAt: string;
  timeSpentSeconds: number;
  syncedToSheet: boolean;
}

export interface AppSettings {
  geminiApiKey: string;
  googleSheetWebhookUrl: string;
  adminPassword: string;
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

export type UserRole = 'teacher' | 'student' | null;

export interface AuthState {
  role: UserRole;
  student?: Student | null;
  isAuthenticated: boolean;
}
