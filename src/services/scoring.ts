import { Exam, Question } from '../types';

export interface QuestionScoreResult {
  questionId: string;
  earnedScore: number;
  maxScore: number;
  isFullyCorrect: boolean;
  details?: {
    correctSubCount?: number;
    totalSubCount?: number;
  };
}

export interface ScoreCalculationResult {
  score: number; // Thang điểm 10
  correctCount: number; // Số câu đúng hoàn toàn
  totalCount: number;
  questionScores: Record<string, number>;
  part1Score: number;
  part2Score: number;
  part3Score: number;
}

// Chuẩn hóa chuỗi số trả lời ngắn để so sánh chính xác (hỗ trợ dấu phẩy, phân số, số âm)
export const normalizeAnswer = (val: any): string => {
  if (val === undefined || val === null) return '';
  return String(val)
    .trim()
    .replace(/\s+/g, '')
    .replace(/,/g, '.') // thay dấu phẩy bằng dấu chấm
    .toLowerCase();
};

export const isShortAnswerCorrect = (userAns: any, correctKey: any): boolean => {
  const normUser = normalizeAnswer(userAns);
  const normKey = normalizeAnswer(correctKey);
  if (!normUser || !normKey) return false;

  if (normUser === normKey) return true;

  // Thử so sánh dạng số thực (tránh lệch do 0.5 vs .5 hoặc 2 vs 2.0)
  const numUser = parseFloat(normUser);
  const numKey = parseFloat(normKey);
  if (!isNaN(numUser) && !isNaN(numKey)) {
    return Math.abs(numUser - numKey) < 1e-4;
  }

  return false;
};

// Tính điểm câu hỏi Đúng/Sai theo chuẩn Bộ Giáo Dục & Đào Tạo:
// Đúng 1 ý: 0.1 điểm
// Đúng 2 ý: 0.25 điểm
// Đúng 3 ý: 0.5 điểm
// Đúng 4 ý: 1.0 điểm
export const calculateTrueFalseScore = (
  userChoices: Record<string, boolean> | undefined,
  subQuestions: Question['subQuestions']
): { earned: number; correctCount: number; totalCount: number } => {
  if (!subQuestions || subQuestions.length === 0) return { earned: 0, correctCount: 0, totalCount: 0 };
  if (!userChoices) return { earned: 0, correctCount: 0, totalCount: subQuestions.length };

  let correctCount = 0;
  subQuestions.forEach((sub) => {
    if (userChoices[sub.id] === sub.isCorrect) {
      correctCount++;
    }
  });

  let earned = 0;
  if (correctCount === 1) earned = 0.1;
  else if (correctCount === 2) earned = 0.25;
  else if (correctCount === 3) earned = 0.5;
  else if (correctCount === 4) earned = 1.0;

  return { earned, correctCount, totalCount: subQuestions.length };
};

export const calculateExamResult = (
  exam: Exam,
  answers: Record<string, any>
): ScoreCalculationResult => {
  const questions = exam.questions;
  let totalScore = 0;
  let fullyCorrectCount = 0;
  const questionScores: Record<string, number> = {};

  let part1Score = 0;
  let part2Score = 0;
  let part3Score = 0;

  // Phân loại câu hỏi theo 3 phần thi
  const part1Questions = questions.filter((q) => (q.type || 'multiple_choice') === 'multiple_choice');
  const part2Questions = questions.filter((q) => q.type === 'true_false');
  const part3Questions = questions.filter((q) => q.type === 'short_answer');

  // Tính điểm Phần 1 (Trắc nghiệm nhiều lựa chọn: mặc định 0.25đ/câu)
  const p1Weight = part1Questions.length > 0 ? (exam.questions.some(q => q.type && q.type !== 'multiple_choice') ? 0.25 : 10 / questions.length) : 0.25;

  part1Questions.forEach((q) => {
    const userChoice = answers[q.id];
    const isCorrect = userChoice !== undefined && userChoice === q.correctAnswer;
    const earned = isCorrect ? (q.points ?? p1Weight) : 0;
    questionScores[q.id] = earned;
    part1Score += earned;
    if (isCorrect) fullyCorrectCount++;
  });

  // Tính điểm Phần 2 (Đúng / Sai: thang điểm 0.1 - 0.25 - 0.5 - 1.0)
  part2Questions.forEach((q) => {
    const userChoices = answers[q.id];
    const { earned, correctCount, totalCount } = calculateTrueFalseScore(userChoices, q.subQuestions);
    questionScores[q.id] = earned;
    part2Score += earned;
    if (correctCount === totalCount && totalCount > 0) fullyCorrectCount++;
  });

  // Tính điểm Phần 3 (Trả lời ngắn: mặc định 0.5đ/câu)
  const p3Weight = 0.5;
  part3Questions.forEach((q) => {
    const userAns = answers[q.id];
    const isCorrect = isShortAnswerCorrect(userAns, q.shortAnswerKey);
    const earned = isCorrect ? (q.points ?? p3Weight) : 0;
    questionScores[q.id] = earned;
    part3Score += earned;
    if (isCorrect) fullyCorrectCount++;
  });

  totalScore = part1Score + part2Score + part3Score;

  // Giới hạn tối đa 10.0 và làm tròn 2 chữ số thập phân
  const finalScore = Math.min(10, Math.round(totalScore * 100) / 100);

  return {
    score: finalScore,
    correctCount: fullyCorrectCount,
    totalCount: questions.length,
    questionScores,
    part1Score: Math.round(part1Score * 100) / 100,
    part2Score: Math.round(part2Score * 100) / 100,
    part3Score: Math.round(part3Score * 100) / 100,
  };
};
