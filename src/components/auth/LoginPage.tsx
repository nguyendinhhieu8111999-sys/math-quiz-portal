import React, { useState } from 'react';
import { Student, AppSettings } from '../../types';
import {
  GraduationCap,
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface LoginPageProps {
  students: Student[];
  settings: AppSettings;
  onStudentLogin: (student: Student) => void;
  onTeacherLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  students,
  settings,
  onStudentLogin,
  onTeacherLogin,
}) => {
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  // Student Form
  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Teacher Form
  const [teacherPassword, setTeacherPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const found = students.find(
      (s) =>
        s.studentId.trim().toUpperCase() === studentId.trim().toUpperCase() &&
        s.password.trim() === studentPassword.trim()
    );

    if (found) {
      onStudentLogin(found);
    } else {
      setErrorMsg('Mã học sinh hoặc Mật khẩu không chính xác! Vui lòng liên hệ giáo viên.');
    }
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const expected = settings.adminPassword || 'admin';
    if (teacherPassword.trim() === expected.trim()) {
      onTeacherLogin();
    } else {
      setErrorMsg('Mật khẩu quản trị viên không chính xác!');
    }
  };

  const quickFillStudent = (std: Student) => {
    setStudentId(std.studentId);
    setStudentPassword(std.password);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative background circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-xl shadow-indigo-500/30 mb-3">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            MathQuiz Pro
          </h1>
          <p className="text-xs text-indigo-200/70 mt-1">
            Hệ thống Khảo thí & Tạo đề trắc nghiệm Toán học trực tuyến
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-100">
          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setRole('student');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                role === 'student'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Học Sinh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('teacher');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                role === 'teacher'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Giáo Viên (Admin)</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Student Form */}
          {role === 'student' ? (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã Học Sinh *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="VD: HS1201"
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật Khẩu Cấp *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="Mật khẩu do giáo viên cấp"
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center space-x-1.5 mt-2"
              >
                <span>Đăng Nhập Làm Bài</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Quick Fill Test Demo */}
              {students.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-2 text-center">
                    ⚡ Thử nhanh tài khoản mẫu:
                  </span>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {students.slice(0, 3).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => quickFillStudent(s)}
                        className="text-[11px] font-mono px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-md text-slate-600 border border-slate-200 transition"
                      >
                        {s.studentId} ({s.fullName})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          ) : (
            /* Teacher Form */
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật Khẩu Quản Trị Viên (Giáo Viên) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="Mật khẩu quản trị..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mật khẩu mặc định: <strong className="font-mono text-slate-600">admin</strong> (Có thể đổi trong Cài đặt)
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition flex items-center justify-center space-x-1.5 mt-2"
              >
                <span>Vào Trang Quản Trị Đề Thi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400/80 mt-6">
          Hỗ trợ công thức Toán KaTeX • Tích hợp Google Gemini AI & Google Sheets
        </p>
      </div>
    </div>
  );
};
