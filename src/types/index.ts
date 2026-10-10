export interface Question {
  id: string;
  orderNumber?: number;
  text: string;
  options: string[]; // 4 options [A, B, C, D]
  correctAnswer: number; // 0: A, 1: B, 2: C, 3: D
  explanation?: string;
  imageUrl?: string; // Cropped diagram or geometry image
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
  shuffleQuestions: boolean; // Đảo thứ tự câu hỏi
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
  answers: Record<string, number>; // questionId -> selectedOption (0, 1, 2, 3)
  questionOrder?: string[]; // Thứ tự câu hỏi học sinh đã làm (khi đảo đề)
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
