import React, { useEffect } from 'react';
import { Exam, Submission } from '../../types';
import { MathRenderer } from '../common/MathRenderer';
import { isShortAnswerCorrect } from '../../services/scoring';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  FileCheck2,
  Check,
  X as XIcon,
} from 'lucide-react';

interface ExamResultProps {
  exam: Exam;
  submission: Submission;
  onBackToDashboard: () => void;
}

export const ExamResult: React.FC<ExamResultProps> = ({
  exam,
  submission,
  onBackToDashboard,
}) => {
  useEffect(() => {
    if (submission.score >= 5.0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [submission.score]);

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Result Score Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <Trophy className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-slate-800">
            Hoàn Thành Bài Thi!
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {submission.examTitle} • Thí sinh:{' '}
            <strong className="text-slate-700">{submission.studentName}</strong> (Lớp {submission.studentClass})
          </p>

          {/* Big Score Display */}
          <div className="my-6 inline-flex flex-col items-center justify-center px-10 py-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 shadow-inner">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
              Điểm Số Đạt Được (Thang 10)
            </span>
            <div className="flex items-baseline space-x-1">
              <span className="text-5xl font-black text-indigo-700 font-mono tracking-tight">
                {submission.score.toFixed(1)}
              </span>
              <span className="text-base font-bold text-slate-400">/ 10</span>
            </div>
            <span className="text-xs text-slate-500 mt-1">
              Đúng hoàn toàn {submission.correctCount} / {submission.totalCount} câu hỏi
            </span>
          </div>

          {/* Stats Bar */}
          <div className="max-w-md mx-auto grid grid-cols-2 gap-3 mb-6 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-center space-x-1.5">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>
                Thời gian:{' '}
                <strong>
                  {Math.floor(submission.timeSpentSeconds / 60)} phút {submission.timeSpentSeconds % 60} giây
                </strong>
              </span>
            </div>
            <div className="flex items-center justify-center space-x-1.5">
              <FileCheck2 className="w-4 h-4 text-emerald-500" />
              <span>Đã lưu vào kho điểm giáo viên</span>
            </div>
          </div>

          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay Về Danh Sách Bài Thi</span>
          </button>
        </div>

        {/* Detailed Question Review */}
        {exam.showExplanations && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                Xem Lại Đáp Án & Lời Giải Chi Tiết
              </h3>
              <p className="text-xs text-slate-500">
                Đối chiếu bài làm của bạn theo từng phần thi với đáp án chuẩn và lời giải bằng $\LaTeX$
              </p>
            </div>

            <div className="space-y-6">
              {exam.questions.map((q, idx) => {
                const qType = q.type || 'multiple_choice';
                const studentAns = submission.answers[q.id];
                const earnedScore = submission.questionScores?.[q.id];

                return (
                  <div
                    key={q.id}
                    className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-slate-800 text-white text-xs font-bold px-2.5 py-0.5 rounded">
                          Câu {idx + 1}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            qType === 'multiple_choice'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : qType === 'true_false'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {qType === 'multiple_choice'
                            ? 'Phần I'
                            : qType === 'true_false'
                            ? 'Phần II: Đúng / Sai'
                            : 'Phần III: Trả lời ngắn'}
                        </span>
                      </div>

                      {earnedScore !== undefined && (
                        <div className="text-xs font-bold font-mono">
                          <span className={earnedScore > 0 ? 'text-emerald-600' : 'text-slate-400'}>
                            +{earnedScore.toFixed(2)} điểm
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Question text */}
                    <div className="text-sm font-medium text-slate-800 leading-relaxed">
                      <MathRenderer content={q.text} />
                    </div>

                    {q.imageUrl && (
                      <div className="my-2 max-w-sm">
                        <img src={q.imageUrl} alt="Hình vẽ" className="rounded-lg border max-h-48 object-contain" />
                      </div>
                    )}

                    {/* REVIEW FOR MULTIPLE CHOICE */}
                    {qType === 'multiple_choice' && q.options && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 mb-2">
                        {q.options.map((opt, optIdx) => {
                          const isStudentChoice = studentAns === optIdx;
                          const isCorrectChoice = q.correctAnswer === optIdx;

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                isCorrectChoice
                                  ? 'bg-emerald-100/70 border-emerald-400 font-bold text-emerald-900'
                                  : isStudentChoice
                                  ? 'bg-rose-100/70 border-rose-400 font-bold text-rose-900'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-mono">{['A', 'B', 'C', 'D'][optIdx]}.</span>
                                <MathRenderer content={opt} inline />
                              </div>
                              {isCorrectChoice && (
                                <span className="text-[10px] text-emerald-700 font-bold">[Đáp án đúng]</span>
                              )}
                              {isStudentChoice && !isCorrectChoice && (
                                <span className="text-[10px] text-rose-700 font-bold">[Bạn đã chọn]</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* REVIEW FOR TRUE / FALSE */}
                    {qType === 'true_false' && q.subQuestions && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3 w-10 text-center">Ý</th>
                              <th className="py-2 px-3">Khẳng định</th>
                              <th className="py-2 px-3 w-28 text-center">Bạn chọn</th>
                              <th className="py-2 px-3 w-28 text-center">Đáp án đúng</th>
                              <th className="py-2 px-3 w-16 text-center">Kết quả</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {q.subQuestions.map((sub) => {
                              const userChoice = (studentAns as Record<string, boolean>)?.[sub.id];
                              const isSubCorrect = userChoice === sub.isCorrect;

                              return (
                                <tr key={sub.id} className="hover:bg-slate-50/80">
                                  <td className="py-2 px-3 text-center font-bold text-slate-800">
                                    {sub.label})
                                  </td>
                                  <td className="py-2 px-3 text-slate-800 font-medium">
                                    <MathRenderer content={sub.text} />
                                  </td>
                                  <td className="py-2 px-3 text-center font-bold">
                                    {userChoice === true ? (
                                      <span className="text-emerald-700">ĐÚNG</span>
                                    ) : userChoice === false ? (
                                      <span className="text-rose-700">SAI</span>
                                    ) : (
                                      <span className="text-slate-400">Chưa chọn</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-center font-bold">
                                    {sub.isCorrect ? (
                                      <span className="text-emerald-800">ĐÚNG</span>
                                    ) : (
                                      <span className="text-rose-800">SAI</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    {isSubCorrect ? (
                                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                                    ) : (
                                      <XIcon className="w-4 h-4 text-rose-500 mx-auto" />
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* REVIEW FOR SHORT ANSWER */}
                    {qType === 'short_answer' && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2 flex flex-wrap items-center justify-between text-xs gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-600">Câu trả lời của bạn:</span>
                          <span className="font-mono font-bold bg-white px-2.5 py-1 rounded border border-slate-300">
                            {studentAns !== undefined && String(studentAns).trim() !== '' ? studentAns : '(Bỏ trống)'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-emerald-800">Đáp án chuẩn:</span>
                          <span className="font-mono font-bold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded border border-emerald-300">
                            {q.shortAnswerKey || '-'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900 mt-2">
                        <strong className="block text-indigo-700 mb-0.5">Lời giải chi tiết:</strong>
                        <MathRenderer content={q.explanation} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
