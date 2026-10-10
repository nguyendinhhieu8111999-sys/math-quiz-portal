import React, { useState } from 'react';
import { Exam, Student, Submission, AppSettings } from '../../types';
import { ExamEditor } from './ExamEditor';
import { StudentManager } from './StudentManager';
import { Gradebook } from './Gradebook';
import { SettingsModal } from './SettingsModal';
import {
  FileText,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
  Clock,
  Calendar,
  LogOut,
  Edit,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Eye,
} from 'lucide-react';

interface TeacherDashboardProps {
  exams: Exam[];
  students: Student[];
  submissions: Submission[];
  settings: AppSettings;
  onSaveExam: (exam: Exam) => void;
  onDeleteExam: (examId: string) => void;
  onSaveStudent: (student: Student) => void;
  onSaveBatchStudents: (students: Student[]) => void;
  onDeleteStudent: (studentId: string) => void;
  onSaveSettings: (settings: AppSettings) => void;
  onLogout: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  exams,
  students,
  submissions,
  settings,
  onSaveExam,
  onDeleteExam,
  onSaveStudent,
  onSaveBatchStudents,
  onDeleteStudent,
  onSaveSettings,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'exams' | 'students' | 'gradebook'>('exams');
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // If currently creating or editing an exam, render the ExamEditor
  if (isCreatingExam || editingExam) {
    return (
      <ExamEditor
        initialExam={editingExam}
        settings={settings}
        onSave={(savedExam) => {
          onSaveExam(savedExam);
          setIsCreatingExam(false);
          setEditingExam(null);
        }}
        onCancel={() => {
          setIsCreatingExam(false);
          setEditingExam(null);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    );
  }

  // Count submissions per exam
  const getSubmissionCount = (examId: string) => {
    return submissions.filter((s) => s.examId === examId).length;
  };

  const handleDuplicateExam = (exam: Exam) => {
    const copy: Exam = {
      ...exam,
      id: `exam_${Date.now()}`,
      title: `${exam.title} (Bản sao)`,
      createdAt: new Date().toISOString(),
    };
    onSaveExam(copy);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-slate-800">
                  MathQuiz Pro
                </span>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Giáo Viên
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Cổng Quản Trị Khảo Thí & Tạo Đề Toán</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold transition"
            >
              <SettingsIcon className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Cài Đặt API & Sheet</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition border border-rose-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng Xuất</span>
            </button>
          </div>
        </div>

        {/* Tab selection menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-6">
          <button
            onClick={() => setActiveTab('exams')}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'exams'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Quản Lý Đề Thi ({exams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'students'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tài Khoản Học Sinh ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gradebook')}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'gradebook'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Bảng Điểm & Google Sheet ({submissions.length})</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: EXAMS LIST */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Danh Sách Bài Thi Đang Có</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tải PDF lên để tạo đề tự động bằng AI, gán hình học và phân phối đề thi cho học sinh
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingExam(null);
                  setIsCreatingExam(true);
                }}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Đề Thi Mới Từ PDF</span>
              </button>
            </div>

            {/* Exams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">Chưa có bài thi nào</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Bắt đầu bằng cách tải lên một file đề thi trắc nghiệm toán học (PDF)
                  </p>
                  <button
                    onClick={() => setIsCreatingExam(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
                  >
                    Tạo Đề Thi Đầu Tiên
                  </button>
                </div>
              ) : (
                exams.map((exam) => {
                  const subCount = getSubmissionCount(exam.id);
                  const isExpired = new Date(exam.deadline).getTime() < Date.now();

                  return (
                    <div
                      key={exam.id}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Top badges */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                            {exam.subject}
                          </span>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isExpired
                                ? 'bg-slate-100 text-slate-600'
                                : exam.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isExpired ? 'Đã hết hạn' : exam.status === 'active' ? 'Đang mở' : 'Bản nháp'}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-800 mb-2 line-clamp-2">
                          {exam.title}
                        </h3>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                          {exam.description || 'Không có mô tả chi tiết'}
                        </p>

                        {/* Meta info */}
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
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Giao cho:{' '}
                              <strong>
                                {exam.assignedClasses.includes('ALL')
                                  ? 'Tất cả các lớp'
                                  : exam.assignedClasses.join(', ')}
                              </strong>
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>
                              Số câu hỏi: <strong>{exam.questions.length} câu</strong> | Đã nộp:{' '}
                              <strong className="text-indigo-600">{subCount} lượt</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setEditingExam(exam);
                              setIsCreatingExam(false);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Chỉnh sửa đề thi"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicateExam(exam)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Nhân bản đề này"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa đề thi "${exam.title}"?`)) {
                                onDeleteExam(exam.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Xóa đề thi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            setActiveTab('gradebook');
                          }}
                          className="flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                        >
                          <span>Xem Điểm</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: STUDENTS */}
        {activeTab === 'students' && (
          <StudentManager
            students={students}
            submissions={submissions}
            onSaveStudent={onSaveStudent}
            onSaveBatch={onSaveBatchStudents}
            onDeleteStudent={onDeleteStudent}
          />
        )}

        {/* TAB 3: GRADEBOOK */}
        {activeTab === 'gradebook' && (
          <Gradebook
            submissions={submissions}
            exams={exams}
            settings={settings}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={onSaveSettings}
      />
    </div>
  );
};
