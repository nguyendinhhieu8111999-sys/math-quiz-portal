import React, { useState } from 'react';
import { Student, Submission } from '../../types';
import {
  Users,
  UserPlus,
  Trash2,
  Edit2,
  KeyRound,
  FileSpreadsheet,
  Search,
  Check,
  X,
  GraduationCap,
} from 'lucide-react';

interface StudentManagerProps {
  students: Student[];
  submissions: Submission[];
  onSaveStudent: (student: Student) => void;
  onSaveBatch: (students: Student[]) => void;
  onDeleteStudent: (studentId: string) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  submissions,
  onSaveStudent,
  onSaveBatch,
  onDeleteStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Single student form
  const [formData, setFormData] = useState({
    studentId: '',
    password: '',
    fullName: '',
    className: '12A1',
    phone: '',
  });

  // Batch import text
  const [batchText, setBatchText] = useState('');

  // Unique classes for filter
  const classes = Array.from(new Set(students.map((s) => s.className))).filter(Boolean);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'ALL' || s.className === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Calculate statistics per student
  const getStudentStats = (studentId: string) => {
    const subs = submissions.filter((sub) => sub.studentId === studentId);
    if (subs.length === 0) return { count: 0, avgScore: null };
    const totalScore = subs.reduce((acc, curr) => acc + curr.score, 0);
    return {
      count: subs.length,
      avgScore: (totalScore / subs.length).toFixed(1),
    };
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      studentId: `HS${Math.floor(1000 + Math.random() * 9000)}`,
      password: '123',
      fullName: '',
      className: classes[0] || '12A1',
      phone: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      studentId: student.studentId,
      password: student.password,
      fullName: student.fullName,
      className: student.className,
      phone: student.phone || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId.trim() || !formData.fullName.trim()) {
      alert('Vui lòng nhập đầy đủ Mã học sinh và Họ tên!');
      return;
    }

    const newStudent: Student = {
      id: editingStudent ? editingStudent.id : `std_${Date.now()}`,
      studentId: formData.studentId.trim().toUpperCase(),
      password: formData.password.trim() || '123',
      fullName: formData.fullName.trim(),
      className: formData.className.trim(),
      phone: formData.phone.trim(),
      createdAt: editingStudent ? editingStudent.createdAt : new Date().toISOString(),
    };

    onSaveStudent(newStudent);
    setIsAddModalOpen(false);
  };

  const handleBatchImport = () => {
    const lines = batchText.split('\n');
    const newStudents: Student[] = [];

    lines.forEach((line) => {
      const parts = line.split(/[,\t|]/).map((p) => p.trim());
      if (parts.length >= 3) {
        // [Mã HS, Tên, Lớp, Pass (tùy chọn)] or [Mã HS, Pass, Tên, Lớp]
        const studentId = parts[0].toUpperCase();
        let fullName = parts[1];
        let className = parts[2];
        let password = '123';

        if (parts.length >= 4) {
          // If 4 parts: parts[1]=Pass, parts[2]=Name, parts[3]=Class
          // Or parts[0]=Mã, parts[1]=Name, parts[2]=Class, parts[3]=Pass
          if (parts[1].length <= 6 && !isNaN(Number(parts[1]))) {
            password = parts[1];
            fullName = parts[2];
            className = parts[3];
          } else {
            password = parts[3];
          }
        }

        if (studentId && fullName) {
          newStudents.push({
            id: `std_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            studentId,
            password,
            fullName,
            className: className || '12A1',
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    if (newStudents.length === 0) {
      alert('Không tìm thấy dữ liệu hợp lệ! Vui lòng làm theo định dạng mẫu.');
      return;
    }

    onSaveBatch(newStudents);
    setIsBatchModalOpen(false);
    setBatchText('');
    alert(`Đã thêm thành công ${newStudents.length} học sinh vào hệ thống!`);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <span>Quản Lý Danh Sách & Tài Khoản Học Sinh</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấp tài khoản (Mã học sinh & Mật khẩu) để học sinh đăng nhập vào làm bài thi
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Nhập Nhanh Nhiều Học Sinh</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Học Sinh Mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Tên hoặc Mã học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Lọc theo Lớp:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Tất cả các lớp ({students.length})</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                Lớp {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4">Mã Học Sinh</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-4">Lớp</th>
                <th className="py-3 px-4">Mật Khẩu Cấp</th>
                <th className="py-3 px-4 text-center">Số Bài Đã Làm</th>
                <th className="py-3 px-4 text-center">Điểm Trung Bình</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Không tìm thấy học sinh nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std) => {
                  const stats = getStudentStats(std.studentId);
                  return (
                    <tr key={std.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {std.studentId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {std.fullName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium text-[11px]">
                          {std.className}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 flex items-center space-x-1">
                        <KeyRound className="w-3 h-3 text-slate-400" />
                        <span>{std.password}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        {stats.count > 0 ? (
                          <span className="text-emerald-600 font-semibold">{stats.count} bài</span>
                        ) : (
                          <span className="text-slate-400">Chưa làm</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {stats.avgScore !== null ? (
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              Number(stats.avgScore) >= 8
                                ? 'bg-emerald-100 text-emerald-800'
                                : Number(stats.avgScore) >= 5
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {stats.avgScore} / 10
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(std)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                          title="Chỉnh sửa thông tin / mật khẩu"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa học sinh ${std.fullName} (${std.studentId})?`)) {
                              onDeleteStudent(std.studentId);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Xóa học sinh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Single Student */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-800">
                {editingStudent ? 'Chỉnh Sửa Thông Tin Học Sinh' : 'Thêm Học Sinh Mới'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSingle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Mã Học Sinh (Dùng đăng nhập) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="VD: HS1201"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Mật Khẩu Cấp Cho Học Sinh *
                </label>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="VD: 123456"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Họ và Tên Học Sinh *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="VD: Nguyễn Văn An"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Lớp Học *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    placeholder="VD: 12A1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Số Điện Thoại (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md transition"
                >
                  {editingStudent ? 'Cập Nhật' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Batch Import Students */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Nhập Nhanh Danh Sách Học Sinh</span>
              </h3>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Dán danh sách học sinh từ file Excel hoặc Word. Mỗi học sinh một dòng theo cấu trúc:{' '}
              <br />
              <code className="bg-slate-100 text-indigo-700 px-1 py-0.5 rounded font-mono text-[11px]">
                Mã_HS | Họ_và_Tên | Lớp | Mật_Khẩu
              </code>
            </p>

            <textarea
              rows={8}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={`HS1201 | Nguyễn Văn An | 12A1 | 123\nHS1202 | Trần Thị Bình | 12A1 | 123\nHS1203 | Lê Hoàng Nam | 12A2 | 123`}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-4"
            />

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleBatchImport}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-md transition"
              >
                Nhập Danh Sách
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
