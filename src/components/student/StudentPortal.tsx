import React, { useState } from 'react';
import { Exam, Student, Submission } from '../../types';
import { ExamRoom } from './ExamRoom';
import { ExamResult } from './ExamResult';
import {
  GraduationCap,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Play,
  LogOut,
  FileCheck2,
  Trophy,
  History,
} from 'lucide-react';

interface StudentPortalProps {
  student: Student;
  exams: Exam[];
  submissions: Submission[];
  onSubmitExam: (submission: Submission, exam: Exam) => void;
  onLogout: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  exams,
  submissions,
  onSubmitExam,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');
  const [takingExam, setTakingExam] = useState<Exam | null>(null);
  const [viewingResult, setViewingResult] = useState<{ exam: Exam; sub: Submission } | null>(
    null
  );
  const [confirmExam, setConfirmExam] = useState<Exam | null>(null);

  // Filter exams assigned to this student's class or "ALL"
  const assignedExams = exams.filter(
    (e) =>
      e.status === 'active' &&
      (e.assignedClasses.includes('ALL') || e.assignedClasses.includes(student.className))
  );

  // Student's submissions
  const mySubmissions = submissions.filter((s) => s.studentId === student.studentId);
  const submittedExamIds = new Set(mySubmissions.map((s) => s.examId));

  // Available vs completed
  const availableExams = assignedExams.filter((e) => !submittedExamIds.has(e.id));
  const completedExams = assignedExams.filter((e) => submittedExamIds.has(e.id));

  // If currently taking an exam
  if (takingExam) {
    return (
      <ExamRoom
        exam={takingExam}
        student={student}
        onSubmitExam={(sub) => {
          onSubmitExam(sub, takingExam);
          setViewingResult({ exam: takingExam, sub });
          setTakingExam(null);
        }}
        onExit={() => setTakingExam(null)}
      />
    );
  }

  // If currently viewing a result
  if (viewingResult) {
    return (
      <ExamResult
        exam={viewingResult.exam}
        submission={viewingResult.sub}
        onBackToDashboard={() => setViewingResult(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Student Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-800 text-sm">
                  MathQuiz Online
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Học Sinh
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Thí sinh: <strong>{student.fullName}</strong> (Mã: {student.studentId} • Lớp: {student.className})
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition border border-rose-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng Xuất</span>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="max-w-6xl mx-auto px-4 flex space-x-6">
          <button
            onClick={() => setActiveTab('available')}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'available'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Bài Thi Cần Làm ({availableExams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'completed'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Bài Thi Đã Nộp ({completedExams.length})</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* TAB 1: Available Exams */}
        {activeTab === 'available' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Danh Sách Bài Thi Mở Cho Lớp {student.className}</h2>
                <p className="text-xs text-slate-500">
                  Chọn bài thi để bắt đầu làm. Lưu ý kiểm tra thời gian làm bài trước khi nhấn Bắt đầu.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableExams.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                  <FileCheck2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">Tuyệt vời! Bạn không còn bài thi nào tồn đọng</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Khi giáo viên giao thêm đề thi mới, đề sẽ tự động hiển thị tại đây.
                  </p>
                </div>
              ) : (
                availableExams.map((exam) => {
                  const isExpired = new Date(exam.deadline).getTime() < Date.now();

                  return (
                    <div
                      key={exam.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                            {exam.subject}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isExpired ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isExpired ? 'Đã hết hạn' : 'Đang mở'}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-800 mb-2 line-clamp-2">
                          {exam.title}
                        </h3>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                          {exam.description || 'Không có mô tả chi tiết'}
                        </p>

                        <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 mb-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Thời gian làm bài: <strong>{exam.durationMinutes} phút</strong></span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Hạn chót: {new Date(exam.deadline).toLocaleDateString('vi-VN')}{' '}
                              {new Date(exam.deadline).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Số lượng: <strong>{exam.questions.length} câu trắc nghiệm</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <button
                          disabled={isExpired}
                          onClick={() => setConfirmExam(exam)}
                          className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:hover:bg-indigo-600 transition"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>{isExpired ? 'Đã Quá Hạn Nộp' : 'Bắt Đầu Làm Bài'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Completed Exams */}
        {activeTab === 'completed' && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-800">Lịch Sử Bài Thi Đã Hoàn Thành</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedExams.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-600">Bạn chưa nộp bài thi nào</p>
                </div>
              ) : (
                completedExams.map((exam) => {
                  const sub = mySubmissions.find((s) => s.examId === exam.id);
                  if (!sub) return null;

                  return (
                    <div
                      key={exam.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                            Đã nộp bài
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-800 mb-2">{exam.title}</h3>

                        {/* Score Banner */}
                        <div className="my-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] text-slate-500 block">Điểm số của bạn</span>
                            <span className="text-2xl font-black text-indigo-700 font-mono">
                              {sub.score.toFixed(1)} / 10
                            </span>
                          </div>
                          <div className="text-right text-xs text-slate-600">
                            <span className="block font-semibold text-emerald-600">
                              {sub.correctCount}/{sub.totalCount} câu đúng
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {Math.floor(sub.timeSpentSeconds / 60)}p {sub.timeSpentSeconds % 60}s
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <button
                          onClick={() => setViewingResult({ exam, sub })}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
                        >
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          <span>Xem Lại Đáp Án & Lời Giải</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Dialog Before Starting Exam */}
      {confirmExam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-2">
              Sẵn Sàng Làm Bài Thi?
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Bạn chuẩn bị bắt đầu bài thi{' '}
              <strong className="text-indigo-600">{confirmExam.title}</strong>.
            </p>

            <div className="bg-slate-50 rounded-xl p-3 mb-5 space-y-2 text-xs text-slate-700 border border-slate-200">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>
                  Thời gian làm bài: <strong>{confirmExam.durationMinutes} phút</strong>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>
                  Số lượng câu hỏi: <strong>{confirmExam.questions.length} câu</strong>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Đồng hồ sẽ đếm ngược ngay khi bấm Bắt đầu. Hết giờ hệ thống sẽ tự nộp.</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setConfirmExam(null)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
              >
                Để Sau
              </button>
              <button
                onClick={() => {
                  const target = confirmExam;
                  setConfirmExam(null);
                  setTakingExam(target);
                }}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/20 transition"
              >
                Bắt Đầu Làm Bài Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
