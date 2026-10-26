import React, { useState } from 'react';
import { Submission, Exam, AppSettings } from '../../types';
import { MathRenderer } from '../common/MathRenderer';
import { sendToGoogleSheet } from '../../services/storage';
import {
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  BarChart3,
  X,
  ExternalLink,
  Check,
} from 'lucide-react';

interface GradebookProps {
  submissions: Submission[];
  exams: Exam[];
  settings: AppSettings;
  onRefresh?: () => void;
}

export const Gradebook: React.FC<GradebookProps> = ({
  submissions,
  exams,
  settings,
}) => {
  const [selectedExamId, setSelectedExamId] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectingSub, setInspectingSub] = useState<Submission | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Filter classes
  const classes = Array.from(new Set(submissions.map((s) => s.studentClass))).filter(Boolean);

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesExam = selectedExamId === 'ALL' || sub.examId === selectedExamId;
    const matchesClass = selectedClass === 'ALL' || sub.studentClass === selectedClass;
    const matchesSearch =
      sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesExam && matchesClass && matchesSearch;
  });

  // Analytics
  const totalCount = filteredSubmissions.length;
  const avgScore =
    totalCount > 0
      ? (filteredSubmissions.reduce((acc, curr) => acc + curr.score, 0) / totalCount).toFixed(2)
      : '0.0';
  const highestScore =
    totalCount > 0
      ? Math.max(...filteredSubmissions.map((s) => s.score)).toFixed(1)
      : '0.0';
  const passCount = filteredSubmissions.filter((s) => s.score >= 5.0).length;
  const passRate = totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(0) : '0';

  // Sync all to Google Sheet
  const handleSyncAllToGoogleSheet = async () => {
    const targetUrl = settings.googleSheetWebhookUrl;
    if (!targetUrl) {
      alert('Chưa cấu hình Google Sheet Webhook trong mục Cài đặt!');
      return;
    }

    setIsSyncingAll(true);
    setSyncStatusMsg('Đang đồng bộ dữ liệu vào Google Sheet...');

    let successCount = 0;
    for (const sub of filteredSubmissions) {
      const ok = await sendToGoogleSheet(sub, targetUrl);
      if (ok) successCount++;
    }

    setIsSyncingAll(false);
    setSyncStatusMsg(`Đã đồng bộ thành công ${filteredSubmissions.length} bài thi vào Google Sheet!`);
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredSubmissions.length === 0) {
      alert('Không có dữ liệu bài nộp để xuất file!');
      return;
    }

    const headers = [
      'Thời gian nộp',
      'Mã học sinh',
      'Họ và tên',
      'Lớp',
      'Tên bài thi',
      'Điểm số',
      'Số câu đúng',
      'Tổng số câu',
      'Thời gian làm (giây)',
    ];

    const rows = filteredSubmissions.map((s) => [
      `"${new Date(s.submittedAt).toLocaleString('vi-VN')}"`,
      `"${s.studentId}"`,
      `"${s.studentName}"`,
      `"${s.studentClass}"`,
      `"${s.examTitle}"`,
      s.score,
      s.correctCount,
      s.totalCount,
      s.timeSpentSeconds,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BangDiem_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Find inspected exam
  const inspectedExam = inspectingSub
    ? exams.find((e) => e.id === inspectingSub.examId)
    : null;

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>Bảng Điểm & Kết Quả Thi Trực Tuyến</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu bài nộp thời gian thực • Đồng bộ trực tiếp với Google Sheets của Giáo viên
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Xuất Excel / CSV</span>
          </button>
          <button
            onClick={handleSyncAllToGoogleSheet}
            disabled={isSyncingAll}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isSyncingAll ? 'Đang đồng bộ...' : 'Đồng Bộ Vào Google Sheet'}</span>
          </button>
        </div>
      </div>

      {syncStatusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Tổng Lượt Nộp</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Điểm Trung Bình</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{avgScore}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Điểm Cao Nhất</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{highestScore}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Tỷ Lệ Trên Trung Bình (≥5.0)</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{passRate}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Tên hoặc Mã HS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium">Đề thi:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Tất cả đề thi ({exams.length})</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium">Lớp:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Tất cả các lớp</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4">Thời Gian Nộp</th>
                <th className="py-3 px-4">Học Sinh</th>
                <th className="py-3 px-4">Lớp</th>
                <th className="py-3 px-4">Đề Thi</th>
                <th className="py-3 px-4 text-center">Thời Gian Làm</th>
                <th className="py-3 px-4 text-center">Số Câu Đúng</th>
                <th className="py-3 px-4 text-center">Điểm Số</th>
                <th className="py-3 px-4 text-center">Google Sheet</th>
                <th className="py-3 px-4 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    Chưa có bài thi nào được nộp.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(sub.submittedAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      - {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{sub.studentName}</div>
                      <div className="text-[11px] font-mono text-indigo-600 font-medium">
                        {sub.studentId}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium text-[11px]">
                        {sub.studentClass}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate font-medium text-slate-700" title={sub.examTitle}>
                      {sub.examTitle}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">
                      {Math.floor(sub.timeSpentSeconds / 60)}m {sub.timeSpentSeconds % 60}s
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      <span className="text-emerald-600 font-bold">{sub.correctCount}</span> /{' '}
                      <span className="text-slate-500">{sub.totalCount}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                          sub.score >= 8
                            ? 'bg-emerald-100 text-emerald-800'
                            : sub.score >= 5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sub.score.toFixed(1)} / 10
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {sub.syncedToSheet ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-600 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Đã ghi</span>
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            if (!settings.googleSheetWebhookUrl) {
                              alert('Chưa cấu hình Google Sheet URL!');
                              return;
                            }
                            await sendToGoogleSheet(sub, settings.googleSheetWebhookUrl);
                            alert('Đã gửi bài nộp vào Google Sheet!');
                          }}
                          className="text-[11px] text-indigo-600 hover:underline font-medium"
                        >
                          Gửi Sheet
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setInspectingSub(sub)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition inline-flex items-center space-x-1"
                        title="Xem chi tiết bài làm"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submission Detail Modal */}
      {inspectingSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Chi Tiết Bài Thi: {inspectingSub.studentName} ({inspectingSub.studentId})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lớp {inspectingSub.studentClass} • {inspectingSub.examTitle} • Điểm:{' '}
                  <strong className="text-indigo-600">{inspectingSub.score.toFixed(1)}/10</strong> (
                  {inspectingSub.correctCount}/{inspectingSub.totalCount} câu đúng)
                </p>
              </div>
              <button
                onClick={() => setInspectingSub(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {inspectedExam ? (
                inspectedExam.questions.map((q, qIdx) => {
                  const qType = q.type || 'multiple_choice';
                  const studentAns = inspectingSub.answers[q.id];
                  const earned = inspectingSub.questionScores?.[q.id];

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs bg-slate-800 text-white px-2 py-0.5 rounded">
                            Câu {qIdx + 1}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
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

                        {earned !== undefined && (
                          <span className="text-xs font-mono font-bold text-emerald-600">
                            +{earned.toFixed(2)}đ
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-medium text-slate-800 mb-2">
                        <MathRenderer content={q.text} />
                      </div>

                      {q.imageUrl && (
                        <div className="my-2 max-w-sm">
                          <img src={q.imageUrl} alt="Hình vẽ" className="rounded border max-h-48 object-contain" />
                        </div>
                      )}

                      {/* Part I: Multiple Choice */}
                      {qType === 'multiple_choice' && q.options && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                          {q.options.map((opt, optIdx) => {
                            const isStudentSelected = studentAns === optIdx;
                            const isKey = q.correctAnswer === optIdx;
                            return (
                              <div
                                key={optIdx}
                                className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                                  isKey
                                    ? 'bg-emerald-100/70 border-emerald-400 font-bold text-emerald-900'
                                    : isStudentSelected
                                    ? 'bg-rose-100/70 border-rose-400 font-bold text-rose-900'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-mono">{['A', 'B', 'C', 'D'][optIdx]}.</span>
                                  <MathRenderer content={opt} inline />
                                </div>
                                {isKey && <span className="text-[10px] text-emerald-700 font-semibold">[Đáp án đúng]</span>}
                                {isStudentSelected && !isKey && (
                                  <span className="text-[10px] text-rose-700 font-semibold">[Học sinh chọn]</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Part II: True / False */}
                      {qType === 'true_false' && q.subQuestions && (
                        <div className="border border-slate-200 rounded-lg overflow-hidden mt-2 text-xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 font-bold text-[11px] text-slate-600 border-b border-slate-200">
                              <tr>
                                <th className="p-2 w-10 text-center">Ý</th>
                                <th className="p-2">Khẳng định</th>
                                <th className="p-2 w-24 text-center">HS chọn</th>
                                <th className="p-2 w-24 text-center">Đáp án</th>
                                <th className="p-2 w-14 text-center">K.Quả</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {q.subQuestions.map((sub) => {
                                const userChoice = (studentAns as Record<string, boolean>)?.[sub.id];
                                const isSubCorrect = userChoice === sub.isCorrect;
                                return (
                                  <tr key={sub.id}>
                                    <td className="p-2 text-center font-bold">{sub.label})</td>
                                    <td className="p-2"><MathRenderer content={sub.text} /></td>
                                    <td className="p-2 text-center font-bold">
                                      {userChoice === true ? <span className="text-emerald-700">ĐÚNG</span> : userChoice === false ? <span className="text-rose-700">SAI</span> : <span className="text-slate-400">-</span>}
                                    </td>
                                    <td className="p-2 text-center font-bold">
                                      {sub.isCorrect ? <span className="text-emerald-700">ĐÚNG</span> : <span className="text-rose-700">SAI</span>}
                                    </td>
                                    <td className="p-2 text-center">
                                      {isSubCorrect ? <Check className="w-3.5 h-3.5 text-emerald-600 mx-auto" /> : <span className="text-rose-500 font-bold">✕</span>}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Part III: Short Answer */}
                      {qType === 'short_answer' && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-2 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-slate-500 mr-2">Học sinh nhập:</span>
                            <strong className="font-mono bg-white px-2 py-0.5 border rounded">
                              {studentAns !== undefined && String(studentAns).trim() !== '' ? studentAns : '(Bỏ trống)'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-emerald-700 mr-2">Đáp án:</span>
                            <strong className="font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 border border-emerald-300 rounded">
                              {q.shortAnswerKey || '-'}
                            </strong>
                          </div>
                        </div>
                      )}

                      {q.explanation && (
                        <div className="mt-3 p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900">
                          <strong className="block text-indigo-700 mb-0.5">Lời giải chi tiết:</strong>
                          <MathRenderer content={q.explanation} />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-400">
                  Đề thi này không còn tồn tại hoặc đã bị xóa.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
