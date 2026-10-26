import React, { useState, useEffect, useMemo } from 'react';
import { Exam, Question, Submission, Student, QuestionType } from '../../types';
import { MathRenderer } from '../common/MathRenderer';
import { calculateExamResult } from '../../services/scoring';
import {
  Clock,
  Flag,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Send,
  HelpCircle,
  Hash,
} from 'lucide-react';

interface ExamRoomProps {
  exam: Exam;
  student: Student;
  onSubmitExam: (submission: Submission) => void;
  onExit: () => void;
}

interface QuestionWithMeta extends Question {
  originalIndex: number;
  shuffledOptions?: { text: string; originalIdx: number }[];
}

export const ExamRoom: React.FC<ExamRoomProps> = ({
  exam,
  student,
  onSubmitExam,
}) => {
  // Timer state in seconds
  const [secondsLeft, setSecondsLeft] = useState<number>(() => exam.durationMinutes * 60);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  
  // answers:
  // multiple_choice -> number (0..3)
  // true_false -> Record<string, boolean> (subId -> true/false)
  // short_answer -> string
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  // Shuffled questions setup
  const preparedQuestions: QuestionWithMeta[] = useMemo(() => {
    let list = exam.questions.map((q, idx) => {
      const qType = q.type || 'multiple_choice';
      let shuffledOpts: { text: string; originalIdx: number }[] | undefined = undefined;

      if (qType === 'multiple_choice' && q.options) {
        shuffledOpts = q.options.map((opt, optIdx) => ({
          text: opt,
          originalIdx: optIdx,
        }));
        if (exam.shuffleOptions) {
          shuffledOpts = [...shuffledOpts].sort(() => Math.random() - 0.5);
        }
      }

      return {
        ...q,
        originalIndex: idx,
        shuffledOptions: shuffledOpts,
      };
    });

    // Shuffle questions within each part (or overall if parts not set)
    if (exam.shuffleQuestions) {
      // Group by parts to preserve Phần I -> Phần II -> Phần III order
      const p1 = list.filter(q => (q.part || 1) === 1).sort(() => Math.random() - 0.5);
      const p2 = list.filter(q => q.part === 2).sort(() => Math.random() - 0.5);
      const p3 = list.filter(q => q.part === 3).sort(() => Math.random() - 0.5);
      const rest = list.filter(q => !q.part).sort(() => Math.random() - 0.5);
      list = [...p1, ...p2, ...p3, ...rest];
    }

    return list;
  }, [exam]);

  // Countdown timer effect
  useEffect(() => {
    if (secondsLeft <= 0) {
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Option select for multiple choice
  const handleSelectOption = (questionId: string, originalOptionIdx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: originalOptionIdx,
    }));
  };

  // Toggle true/false for a sub-question
  const handleToggleTrueFalse = (questionId: string, subId: string, choice: boolean) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as Record<string, boolean>) || {};
      return {
        ...prev,
        [questionId]: {
          ...current,
          [subId]: choice,
        },
      };
    });
  };

  // Input for short answer
  const handleShortAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Check if a question is answered
  const isQuestionAnswered = (q: QuestionWithMeta) => {
    const ans = answers[q.id];
    if (ans === undefined || ans === null) return false;

    const qType = q.type || 'multiple_choice';
    if (qType === 'multiple_choice') {
      return typeof ans === 'number';
    } else if (qType === 'true_false') {
      const subs = q.subQuestions || [];
      if (subs.length === 0) return false;
      const userSubs = ans as Record<string, boolean>;
      return subs.every((s) => userSubs[s.id] !== undefined);
    } else if (qType === 'short_answer') {
      return typeof ans === 'string' && ans.trim().length > 0;
    }
    return false;
  };

  const handleFinalSubmit = () => {
    setIsSubmitModalOpen(false);

    // Calculate score using the standard THPTQG calculation engine
    const result = calculateExamResult(exam, answers);
    const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);

    const submission: Submission = {
      id: `sub_${Date.now()}_${student.studentId}`,
      examId: exam.id,
      examTitle: exam.title,
      studentId: student.studentId,
      studentName: student.fullName,
      studentClass: student.className,
      answers,
      score: result.score,
      correctCount: result.correctCount,
      totalCount: result.totalCount,
      questionScores: result.questionScores,
      submittedAt: new Date().toISOString(),
      timeSpentSeconds,
      syncedToSheet: false,
    };

    onSubmitExam(submission);
  };

  const currentQ = preparedQuestions[currentQIndex];
  const currentType = (currentQ?.type || 'multiple_choice') as QuestionType;
  const answeredCount = preparedQuestions.filter((q) => isQuestionAnswered(q)).length;
  const isTimeCritical = secondsLeft < 300; // Under 5 minutes

  // Group palette by parts
  const part1List = preparedQuestions.map((q, idx) => ({ q, idx })).filter(({ q }) => (q.part || 1) === 1);
  const part2List = preparedQuestions.map((q, idx) => ({ q, idx })).filter(({ q }) => q.part === 2);
  const part3List = preparedQuestions.map((q, idx) => ({ q, idx })).filter(({ q }) => q.part === 3);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Sticky Exam Room Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-extrabold text-indigo-700 text-sm hidden sm:inline">
              {exam.title}
            </span>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-medium">
              Thí sinh: <strong>{student.fullName}</strong> ({student.studentId} - {student.className})
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Countdown Badge */}
            <div
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border ${
                isTimeCritical
                  ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(secondsLeft)}</span>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp Bài ({answeredCount}/{preparedQuestions.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Columns: Active Question Card */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          {currentQ && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col flex-1">
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
                <div className="flex items-center space-x-2">
                  <span className="bg-slate-900 text-white font-extrabold text-xs px-3 py-1 rounded-lg">
                    Câu {currentQIndex + 1}
                  </span>

                  {/* Part Tag */}
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                      currentType === 'multiple_choice'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : currentType === 'true_false'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {currentType === 'multiple_choice'
                      ? 'Phần I: Trắc nghiệm 4 lựa chọn'
                      : currentType === 'true_false'
                      ? 'Phần II: Câu trắc nghiệm Đúng / Sai'
                      : 'Phần III: Câu hỏi trả lời ngắn'}
                  </span>

                  <span className="text-xs text-slate-400">
                    / {preparedQuestions.length} câu
                  </span>
                </div>

                <button
                  onClick={() => toggleFlag(currentQ.id)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium border transition ${
                    flagged[currentQ.id]
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flagged[currentQ.id] ? 'Đã cắm cờ' : 'Đặt cờ xem lại'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="text-base text-slate-800 leading-relaxed font-medium mb-4 select-none">
                <MathRenderer content={currentQ.text} />
              </div>

              {/* Attached Geometry Diagram / Image */}
              {currentQ.imageUrl && (
                <div className="my-3 max-w-lg p-2 bg-slate-50 rounded-xl border border-slate-200 self-center">
                  <img
                    src={currentQ.imageUrl}
                    alt={`Hình minh họa câu ${currentQIndex + 1}`}
                    className="max-h-72 object-contain rounded-lg"
                  />
                </div>
              )}

              {/* DẠNG 1: TRẮC NGHIỆM 4 LỰA CHỌN (A, B, C, D) */}
              {currentType === 'multiple_choice' && currentQ.shuffledOptions && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 mb-6">
                  {currentQ.shuffledOptions.map((opt, optIdx) => {
                    const letter = ['A', 'B', 'C', 'D'][optIdx];
                    const isSelected = answers[currentQ.id] === opt.originalIdx;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, opt.originalIdx)}
                        className={`p-4 rounded-xl border-2 text-left flex items-start space-x-3 transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {letter}
                        </div>
                        <div className="text-sm font-medium pt-0.5 flex-1 select-none">
                          <MathRenderer content={opt.text} inline />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* DẠNG 2: TRẮC NGHIỆM ĐÚNG / SAI (a, b, c, d) */}
              {currentType === 'true_false' && currentQ.subQuestions && (
                <div className="mt-2 mb-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 text-xs font-semibold text-amber-900 flex justify-between items-center">
                    <span>Chọn Đúng hoặc Sai cho mỗi khẳng định bên dưới:</span>
                    <span className="text-[11px] text-amber-700">1 ý: 0.1đ • 2 ý: 0.25đ • 3 ý: 0.5đ • 4 ý: 1.0đ</span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4 w-12 text-center">Ý</th>
                        <th className="py-2.5 px-4">Khẳng định</th>
                        <th className="py-2.5 px-4 w-40 text-center">Thí sinh chọn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentQ.subQuestions.map((sub, sIdx) => {
                        const userChoice = (answers[currentQ.id] as Record<string, boolean>)?.[sub.id];

                        return (
                          <tr key={sub.id || sIdx} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 text-center font-bold text-slate-800 text-sm">
                              {sub.label})
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-800 font-medium leading-relaxed">
                              <MathRenderer content={sub.text} />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex rounded-lg p-1 bg-slate-100 space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTrueFalse(currentQ.id, sub.id, true)}
                                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                                    userChoice === true
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  ĐÚNG
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleTrueFalse(currentQ.id, sub.id, false)}
                                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                                    userChoice === false
                                      ? 'bg-rose-600 text-white shadow-sm'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  SAI
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* DẠNG 3: TRẢ LỜI NGẮN (ĐIỀN ĐÁP SỐ) */}
              {currentType === 'short_answer' && (
                <div className="mt-4 mb-8 bg-emerald-50/40 p-6 rounded-2xl border border-emerald-200">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900 mb-2">
                    <Hash className="w-4 h-4 text-emerald-600" />
                    <span>Ô Nhập Đáp Số (Tối đa 0.5 điểm):</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Nhập kết quả tính toán dưới dạng số (ví dụ: <code className="bg-white px-1.5 py-0.5 rounded border">12</code>, <code className="bg-white px-1.5 py-0.5 rounded border">-3.5</code>, <code className="bg-white px-1.5 py-0.5 rounded border">0.75</code>).
                  </p>
                  
                  <div className="flex items-center space-x-3 max-w-md">
                    <input
                      type="text"
                      value={answers[currentQ.id] ?? ''}
                      onChange={(e) => handleShortAnswerChange(currentQ.id, e.target.value)}
                      placeholder="Nhập đáp số vào đây..."
                      className="flex-1 px-4 py-3 border-2 border-emerald-400 rounded-xl text-base font-mono font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white shadow-sm"
                    />
                    {answers[currentQ.id] && (
                      <button
                        type="button"
                        onClick={() => handleShortAnswerChange(currentQ.id, '')}
                        className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg border border-slate-200 transition"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Question Navigation Controls */}
              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
                  className="flex items-center space-x-1.5 px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Câu Trước</span>
                </button>

                <button
                  disabled={currentQIndex >= preparedQuestions.length - 1}
                  onClick={() =>
                    setCurrentQIndex((i) => Math.min(preparedQuestions.length - 1, i + 1))
                  }
                  className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-30 disabled:hover:bg-indigo-600 transition"
                >
                  <span>Câu Sau</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Question Palette Navigation grouped by Parts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-fit space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Bảng Câu Hỏi
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-600">
              {answeredCount}/{preparedQuestions.length} đã làm
            </span>
          </div>

          {/* Palette Legend */}
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 pb-1 border-b border-slate-100">
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Đã làm</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
              <span>Chưa làm</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Đặt cờ</span>
            </div>
          </div>

          {/* Part 1 Palette */}
          {part1List.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-indigo-700 mb-1.5 uppercase tracking-wider">
                Phần I: 4 Lựa chọn
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {part1List.map(({ q, idx }) => {
                  const isDone = isQuestionAnswered(q);
                  const isCur = currentQIndex === idx;
                  const isFlag = flagged[q.id];

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center relative transition-all ${
                        isCur ? 'ring-2 ring-indigo-600 ring-offset-2' : ''
                      } ${
                        isDone ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {isFlag && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Part 2 Palette */}
          {part2List.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-amber-800 mb-1.5 uppercase tracking-wider">
                Phần II: Đúng / Sai
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {part2List.map(({ q, idx }) => {
                  const isDone = isQuestionAnswered(q);
                  const isCur = currentQIndex === idx;
                  const isFlag = flagged[q.id];

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center relative transition-all ${
                        isCur ? 'ring-2 ring-amber-600 ring-offset-2' : ''
                      } ${
                        isDone ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {isFlag && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Part 3 Palette */}
          {part3List.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-emerald-800 mb-1.5 uppercase tracking-wider">
                Phần III: Trả lời ngắn
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {part3List.map(({ q, idx }) => {
                  const isDone = isQuestionAnswered(q);
                  const isCur = currentQIndex === idx;
                  const isFlag = flagged[q.id];

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center relative transition-all ${
                        isCur ? 'ring-2 ring-emerald-600 ring-offset-2' : ''
                      } ${
                        isDone ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {isFlag && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Submit Button */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp Bài Thi Ngay</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Before Submit */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-indigo-600" />
            </div>

            <h3 className="text-base font-bold text-slate-800 text-center mb-1">
              Xác Nhận Nộp Bài Thi
            </h3>
            <p className="text-xs text-slate-500 text-center mb-4">
              Điểm số sẽ được chấm theo chuẩn thi Tốt nghiệp THPT mới của Bộ GD&ĐT
            </p>

            <div className="bg-slate-50 rounded-xl p-3 mb-5 space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Số câu đã hoàn thành:</span>
                <strong className="text-emerald-600">
                  {answeredCount} / {preparedQuestions.length} câu
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Số câu chưa hoàn thành:</span>
                <strong className={preparedQuestions.length - answeredCount > 0 ? 'text-rose-600' : 'text-slate-600'}>
                  {preparedQuestions.length - answeredCount} câu
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Thời gian còn lại:</span>
                <strong className="font-mono text-indigo-600">{formatTime(secondsLeft)}</strong>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
              >
                Tiếp Tục Làm Bài
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 transition"
              >
                Xác Nhận Nộp Bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
