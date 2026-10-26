import React, { useState } from 'react';
import { Exam, Question, QuestionType, TrueFalseItem, AppSettings } from '../../types';
import { MathRenderer } from '../common/MathRenderer';
import { PdfSnipper } from './PdfSnipper';
import { extractQuestionsFromPdf } from '../../services/gemini';
import {
  Sparkles,
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Shuffle,
  Eye,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  AlertCircle,
  FileText,
  FileCheck2,
  ListFilter,
  CheckSquare,
  HelpCircle,
} from 'lucide-react';

interface ExamEditorProps {
  initialExam?: Exam | null;
  settings: AppSettings;
  onSave: (exam: Exam) => void;
  onCancel: () => void;
  onOpenSettings: () => void;
}

export const ExamEditor: React.FC<ExamEditorProps> = ({
  initialExam,
  settings,
  onSave,
  onCancel,
  onOpenSettings,
}) => {
  // Exam metadata state
  const [title, setTitle] = useState(initialExam?.title || 'Đề Thi Thử Tốt Nghiệp THPT Môn Toán');
  const [description, setDescription] = useState(
    initialExam?.description || 'Bài thi trắc nghiệm Toán học trực tuyến theo cấu trúc Bộ GD&ĐT'
  );
  const [subject, setSubject] = useState(initialExam?.subject || 'Toán học 12');
  const [durationMinutes, setDurationMinutes] = useState(initialExam?.durationMinutes || 90);
  const [deadline, setDeadline] = useState(
    initialExam?.deadline ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [assignedClasses, setAssignedClasses] = useState<string[]>(
    initialExam?.assignedClasses || ['ALL']
  );
  const [classInput, setClassInput] = useState('');
  const [shuffleQuestions, setShuffleQuestions] = useState(
    initialExam?.shuffleQuestions ?? true
  );
  const [shuffleOptions, setShuffleOptions] = useState(
    initialExam?.shuffleOptions ?? true
  );
  const [showResultsImmediately, setShowResultsImmediately] = useState(
    initialExam?.showResultsImmediately ?? true
  );
  const [showExplanations, setShowExplanations] = useState(
    initialExam?.showExplanations ?? true
  );
  const [googleSheetWebhookUrl, setGoogleSheetWebhookUrl] = useState(
    initialExam?.googleSheetWebhookUrl || settings.googleSheetWebhookUrl || ''
  );

  // Questions state
  const [questions, setQuestions] = useState<Question[]>(
    initialExam?.questions || []
  );

  // Filter questions by type in the list view
  const [filterPart, setFilterPart] = useState<'all' | '1' | '2' | '3'>('all');

  // PDF & AI State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Modal to assign cropped image
  const [pendingCropImage, setPendingCropImage] = useState<string | null>(null);
  const [selectedTargetQIndex, setSelectedTargetQIndex] = useState<number>(0);

  // Handle PDF file select
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Vui lòng chọn file có định dạng PDF!');
      return;
    }

    setPdfFile(file);
    setAiError(null);
    setAiSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setPdfBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  // Run Gemini AI extraction
  const handleRunAiExtraction = async () => {
    if (!pdfBase64) {
      alert('Vui lòng chọn file PDF trước!');
      return;
    }

    if (!settings.geminiApiKey) {
      setAiError('Chưa cấu hình Google Studio API Key. Vui lòng nhấn vào Cài đặt để nhập Key!');
      return;
    }

    setIsExtracting(true);
    setAiError(null);
    setAiSuccessMsg(null);

    try {
      const res = await extractQuestionsFromPdf(pdfBase64, settings.geminiApiKey);
      if (res.success && res.questions && res.questions.length > 0) {
        setQuestions(res.questions);
        const p1 = res.questions.filter(q => (q.type || 'multiple_choice') === 'multiple_choice').length;
        const p2 = res.questions.filter(q => q.type === 'true_false').length;
        const p3 = res.questions.filter(q => q.type === 'short_answer').length;
        setAiSuccessMsg(`Đã trích xuất thành công ${res.questions.length} câu hỏi! (Phần I: ${p1} câu, Phần II: ${p2} câu, Phần III: ${p3} câu)`);
      } else {
        setAiError(res.error || 'Không thể trích xuất câu hỏi từ file PDF này.');
      }
    } catch (err: any) {
      setAiError(err.message || 'Lỗi xử lý file PDF.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle snipping tool capture
  const handleSnippetCaptured = (imageUrl: string) => {
    setPendingCropImage(imageUrl);
    setSelectedTargetQIndex(0);
  };

  const assignImageToQuestion = (qIndex: number) => {
    if (!pendingCropImage) return;
    const updated = [...questions];
    if (updated[qIndex]) {
      updated[qIndex] = {
        ...updated[qIndex],
        imageUrl: pendingCropImage,
        hasFigure: true,
      };
      setQuestions(updated);
    }
    setPendingCropImage(null);
  };

  // Question editing helpers
  const handleUpdateQuestion = (index: number, updatedQ: Question) => {
    const updated = [...questions];
    updated[index] = updatedQ;
    setQuestions(updated);
  };

  const handleAddQuestion = (type: QuestionType = 'multiple_choice') => {
    const part = type === 'multiple_choice' ? 1 : type === 'true_false' ? 2 : 3;
    let newQ: Question;

    if (type === 'multiple_choice') {
      newQ = {
        id: `q_${Date.now()}`,
        part: 1,
        type: 'multiple_choice',
        orderNumber: questions.length + 1,
        text: 'Cho hàm số $y = f(x)$ liên tục trên $\\mathbb{R}$...',
        options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
        correctAnswer: 0,
        explanation: '',
      };
    } else if (type === 'true_false') {
      newQ = {
        id: `q_${Date.now()}`,
        part: 2,
        type: 'true_false',
        orderNumber: questions.length + 1,
        text: 'Cho hàm số $y = f(x)$. Xét tính đúng sai của các khẳng định sau:',
        subQuestions: [
          { id: `sub_${Date.now()}_a`, label: 'a', text: 'Khẳng định a...', isCorrect: true },
          { id: `sub_${Date.now()}_b`, label: 'b', text: 'Khẳng định b...', isCorrect: false },
          { id: `sub_${Date.now()}_c`, label: 'c', text: 'Khẳng định c...', isCorrect: true },
          { id: `sub_${Date.now()}_d`, label: 'd', text: 'Khẳng định d...', isCorrect: false },
        ],
        explanation: '',
      };
    } else {
      newQ = {
        id: `q_${Date.now()}`,
        part: 3,
        type: 'short_answer',
        orderNumber: questions.length + 1,
        text: 'Tính giá trị biểu thức...',
        shortAnswerKey: '12',
        explanation: '',
      };
    }

    setQuestions([...questions, newQ]);
  };

  const handleChangeType = (index: number, newType: QuestionType) => {
    const q = questions[index];
    if (!q) return;

    const part = newType === 'multiple_choice' ? 1 : newType === 'true_false' ? 2 : 3;
    const updated: Question = {
      ...q,
      type: newType,
      part,
      options: newType === 'multiple_choice' ? (q.options || ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D']) : undefined,
      correctAnswer: newType === 'multiple_choice' ? (q.correctAnswer ?? 0) : undefined,
      subQuestions: newType === 'true_false' ? (q.subQuestions || [
        { id: `sub_${Date.now()}_a`, label: 'a', text: 'Mệnh đề a...', isCorrect: true },
        { id: `sub_${Date.now()}_b`, label: 'b', text: 'Mệnh đề b...', isCorrect: false },
        { id: `sub_${Date.now()}_c`, label: 'c', text: 'Mệnh đề c...', isCorrect: true },
        { id: `sub_${Date.now()}_d`, label: 'd', text: 'Mệnh đề d...', isCorrect: false },
      ]) : undefined,
      shortAnswerKey: newType === 'short_answer' ? (q.shortAnswerKey ?? '0') : undefined,
    };

    handleUpdateQuestion(index, updated);
  };

  const handleDeleteQuestion = (index: number) => {
    if (confirm(`Bạn có chắc muốn xóa câu số ${index + 1}?`)) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  // Save exam
  const handleSaveExam = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bài thi!');
      return;
    }
    if (questions.length === 0) {
      alert('Bài thi cần có ít nhất 1 câu hỏi!');
      return;
    }

    const examData: Exam = {
      id: initialExam?.id || `exam_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      subject: subject.trim(),
      durationMinutes: Number(durationMinutes) || 90,
      deadline,
      assignedClasses: assignedClasses.length > 0 ? assignedClasses : ['ALL'],
      shuffleQuestions,
      shuffleOptions,
      showResultsImmediately,
      showExplanations,
      googleSheetWebhookUrl: googleSheetWebhookUrl.trim(),
      questions,
      createdAt: initialExam?.createdAt || new Date().toISOString(),
      status: initialExam?.status || 'active',
    };

    onSave(examData);
  };

  // Filtered list
  const filteredQuestionsWithIndex = questions
    .map((q, originalIdx) => ({ q, originalIdx }))
    .filter(({ q }) => {
      if (filterPart === 'all') return true;
      const qPart = q.part || (q.type === 'multiple_choice' ? 1 : q.type === 'true_false' ? 2 : 3);
      return String(qPart) === filterPart;
    });

  const part1Count = questions.filter(q => (q.type || 'multiple_choice') === 'multiple_choice').length;
  const part2Count = questions.filter(q => q.type === 'true_false').length;
  const part3Count = questions.filter(q => q.type === 'short_answer').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top action header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {initialExam ? 'Chỉnh Sửa Đề Thi' : 'Tạo Đề Thi Chuẩn THPT Quốc Gia'}
            </h1>
            <p className="text-xs text-slate-500">
              Hỗ trợ đầy đủ 3 dạng: Trắc nghiệm 4 lựa chọn • Đúng/Sai • Trả lời ngắn • Bóc tách bằng Gemini AI
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition"
          >
            Hủy Bỏ
          </button>
          <button
            onClick={handleSaveExam}
            className="flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-indigo-600/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>Lưu & Phát Hành Đề</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Exam Configuration & PDF AI Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column: Exam Settings */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Cấu Hình Bài Thi</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tiêu Đề Đề Thi *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Toán"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mô Tả / Hướng Dẫn</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Môn Học</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Thời Gian Làm (Phút)
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Hạn Chót Nộp Bài</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Classes Assigned */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Giao Cho Lớp</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {assignedClasses.map((cls) => (
                <span
                  key={cls}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md border border-indigo-200"
                >
                  <span>{cls === 'ALL' ? 'Tất cả các lớp' : cls}</span>
                  <button
                    onClick={() => setAssignedClasses(assignedClasses.filter((c) => c !== cls))}
                    className="hover:text-rose-600 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập tên lớp (VD: 12A1)..."
                value={classInput}
                onChange={(e) => setClassInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && classInput.trim()) {
                    e.preventDefault();
                    if (!assignedClasses.includes(classInput.trim())) {
                      setAssignedClasses([...assignedClasses, classInput.trim()]);
                    }
                    setClassInput('');
                  }
                }}
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (classInput.trim() && !assignedClasses.includes(classInput.trim())) {
                    setAssignedClasses([...assignedClasses, classInput.trim()]);
                    setClassInput('');
                  }
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
              >
                Thêm
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300"
              />
              <span className="flex items-center space-x-1">
                <Shuffle className="w-3.5 h-3.5 text-indigo-500" />
                <span>Đảo câu hỏi theo từng phần</span>
              </span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300"
              />
              <span className="flex items-center space-x-1">
                <Shuffle className="w-3.5 h-3.5 text-indigo-500" />
                <span>Đảo đáp án Phần I (A, B, C, D)</span>
              </span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showResultsImmediately}
                onChange={(e) => setShowResultsImmediately(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300"
              />
              <span className="flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Xem điểm ngay sau khi nộp</span>
              </span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showExplanations}
                onChange={(e) => setShowExplanations(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300"
              />
              <span className="flex items-center space-x-1">
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>Xem lời giải chi tiết sau nộp</span>
              </span>
            </label>
          </div>

          {/* Google Sheet Webhook */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Google Sheet Webhook (Ghi kết quả)
            </label>
            <input
              type="url"
              value={googleSheetWebhookUrl}
              onChange={(e) => setGoogleSheetWebhookUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-600"
            />
          </div>
        </div>

        {/* Right 2 Columns: PDF Upload & AI Studio Extraction */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Bóc Tách Đề THPT Quốc Gia Bằng Gemini AI</span>
            </h2>

            {!settings.geminiApiKey && (
              <button
                onClick={onOpenSettings}
                className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-medium hover:bg-amber-100 transition flex items-center space-x-1"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Chưa nhập Gemini API Key</span>
              </button>
            )}
          </div>

          {/* PDF Upload Zone */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer border border-slate-300 transition">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>{pdfFile ? `Đã chọn: ${pdfFile.name}` : 'Chọn File Đề Thi PDF'}</span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
            </label>

            {pdfFile && (
              <button
                onClick={handleRunAiExtraction}
                disabled={isExtracting}
                className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition"
              >
                <Sparkles className={`w-4 h-4 ${isExtracting ? 'animate-spin' : ''}`} />
                <span>{isExtracting ? 'Đang phân tích 3 phần đề thi...' : 'Tự Động Bóc Tách Đề (3 Phần)'}</span>
              </button>
            )}
          </div>

          {/* AI Messages */}
          {aiError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 mb-3 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong>Lỗi:</strong> {aiError}
              </div>
            </div>
          )}

          {aiSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 mb-3 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{aiSuccessMsg}</span>
            </div>
          )}

          {/* PDF Viewer & Snipper Preview if PDF selected */}
          {pdfFile ? (
            <div className="flex-1 min-h-[450px]">
              <PdfSnipper
                pdfFile={pdfFile}
                onSnippetCaptured={handleSnippetCaptured}
              />
            </div>
          ) : (
            <div className="flex-1 min-h-[250px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-50/50">
              <FileText className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">Tải lên file PDF đề thi Toán (mẫu mới THPTQG)</p>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                Gemini AI sẽ tự động phân loại: Phần I (Trắc nghiệm 4 lựa chọn), Phần II (Đúng/Sai), Phần III (Trả lời ngắn) kèm công thức $\LaTeX$ và hình vẽ.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Questions Section with Filter by Part */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <h3 className="text-base font-bold text-slate-800">
              Danh Sách Câu Hỏi ({questions.length} câu)
            </h3>
            <div className="flex items-center bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded-md transition ${
                  activeTab === 'editor' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Chỉnh Sửa
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition ${
                  activeTab === 'preview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Xem Trước KaTeX
              </button>
            </div>
          </div>

          {/* Add Question Buttons for the 3 parts */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => handleAddQuestion('multiple_choice')}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition"
              title="Thêm câu trắc nghiệm 4 phương án A, B, C, D"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Phần I (4 Lựa chọn)</span>
            </button>
            <button
              onClick={() => handleAddQuestion('true_false')}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200 transition"
              title="Thêm câu hỏi Đúng/Sai (ý a, b, c, d)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Phần II (Đúng/Sai)</span>
            </button>
            <button
              onClick={() => handleAddQuestion('short_answer')}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 transition"
              title="Thêm câu hỏi trả lời ngắn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Phần III (Trả lời ngắn)</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar for Parts */}
        <div className="px-5 py-2.5 bg-slate-100/60 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2">
            <ListFilter className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">Xem theo phần:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setFilterPart('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterPart === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Tất cả ({questions.length})
              </button>
              <button
                onClick={() => setFilterPart('1')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterPart === '1' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
                }`}
              >
                Phần I: 4 Lựa chọn ({part1Count})
              </button>
              <button
                onClick={() => setFilterPart('2')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterPart === '2' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
                }`}
              >
                Phần II: Đúng/Sai ({part2Count})
              </button>
              <button
                onClick={() => setFilterPart('3')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterPart === '3' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                Phần III: Trả lời ngắn ({part3Count})
              </button>
            </div>
          </div>
        </div>

        {/* Question List Content */}
        <div className="p-6 space-y-6">
          {questions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileCheck2 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm">Chưa có câu hỏi nào. Tải PDF lên hoặc bấm các nút thêm câu hỏi ở trên.</p>
            </div>
          ) : (
            filteredQuestionsWithIndex.map(({ q, originalIdx }) => {
              const qType = q.type || 'multiple_choice';

              return (
                <div
                  key={q.id || originalIdx}
                  className="p-5 border border-slate-200 rounded-xl hover:border-indigo-300 transition-all bg-white relative group shadow-sm"
                >
                  {/* Header of Question */}
                  <div className="flex flex-wrap items-center justify-between mb-3 border-b border-slate-100 pb-2.5 gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-slate-800 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                        Câu {originalIdx + 1}
                      </span>

                      {/* Part Badge & Type Selector */}
                      <select
                        value={qType}
                        onChange={(e) => handleChangeType(originalIdx, e.target.value as QuestionType)}
                        className={`text-xs font-bold px-2 py-0.5 rounded border focus:outline-none cursor-pointer ${
                          qType === 'multiple_choice'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                            : qType === 'true_false'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        <option value="multiple_choice">Phần I: Trắc nghiệm 4 lựa chọn</option>
                        <option value="true_false">Phần II: Đúng / Sai (a, b, c, d)</option>
                        <option value="short_answer">Phần III: Trả lời ngắn</option>
                      </select>

                      {q.imageUrl && (
                        <span className="inline-flex items-center space-x-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                          <ImageIcon className="w-3 h-3" />
                          <span>Có hình</span>
                        </span>
                      )}
                      {q.hasFigure && !q.imageUrl && (
                        <span className="inline-flex items-center space-x-1 text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-medium">
                          <span>⚠️ Cần cắt ảnh</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeleteQuestion(originalIdx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {activeTab === 'preview' ? (
                    /* Preview Mode */
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-slate-800 leading-relaxed">
                        <MathRenderer content={q.text} />
                      </div>

                      {q.imageUrl && (
                        <div className="max-w-md my-2 p-1 border border-slate-200 rounded-lg bg-slate-50">
                          <img src={q.imageUrl} alt={`Hình câu ${originalIdx + 1}`} className="max-h-60 rounded object-contain" />
                        </div>
                      )}

                      {/* Preview for Multiple Choice */}
                      {qType === 'multiple_choice' && q.options && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-lg border text-sm flex items-start space-x-2 ${
                                q.correctAnswer === optIdx
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className="font-bold shrink-0">{['A', 'B', 'C', 'D'][optIdx]}.</span>
                              <MathRenderer content={opt} />
                              {q.correctAnswer === optIdx && (
                                <CheckCircle className="w-4 h-4 text-emerald-600 ml-auto shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Preview for True / False */}
                      {qType === 'true_false' && q.subQuestions && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                              <tr>
                                <th className="p-2.5 w-12 text-center">Ý</th>
                                <th className="p-2.5">Nội dung khẳng định</th>
                                <th className="p-2.5 w-28 text-center">Đáp án Đúng/Sai</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {q.subQuestions.map((sub, sIdx) => (
                                <tr key={sub.id || sIdx} className="hover:bg-slate-50">
                                  <td className="p-2.5 text-center font-bold text-slate-800">
                                    {sub.label})
                                  </td>
                                  <td className="p-2.5 text-slate-800 font-medium">
                                    <MathRenderer content={sub.text} />
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <span
                                      className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                                        sub.isCorrect
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                                      }`}
                                    >
                                      {sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Preview for Short Answer */}
                      {qType === 'short_answer' && (
                        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 mt-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-emerald-900">
                            Đáp số chính xác (Key):
                          </span>
                          <span className="px-3 py-1 bg-white border border-emerald-400 rounded-lg font-mono font-bold text-emerald-800 text-sm">
                            {q.shortAnswerKey || '(Chưa nhập đáp số)'}
                          </span>
                        </div>
                      )}

                      {q.explanation && (
                        <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 text-xs text-indigo-900 mt-2">
                          <span className="font-bold text-indigo-700 block mb-1">Lời giải:</span>
                          <MathRenderer content={q.explanation} />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Edit Mode */
                    <div className="space-y-4">
                      {/* Question Text */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold text-slate-600">
                            Nội dung câu hỏi (dùng $công thức$ để viết LaTeX):
                          </label>
                        </div>
                        <textarea
                          rows={3}
                          value={q.text}
                          onChange={(e) => handleUpdateQuestion(originalIdx, { ...q, text: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <div className="mt-1 p-2 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                            Xem trước:
                          </span>
                          <MathRenderer content={q.text} />
                        </div>
                      </div>

                      {/* Image Attachment Preview */}
                      {q.imageUrl && (
                        <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                          <img src={q.imageUrl} alt="Attached" className="h-20 object-contain rounded border border-slate-300" />
                          <div>
                            <p className="text-xs font-medium text-slate-700">Hình vẽ đã được gán vào câu hỏi này</p>
                            <button
                              onClick={() => handleUpdateQuestion(originalIdx, { ...q, imageUrl: '', hasFigure: false })}
                              className="text-xs text-rose-600 hover:underline mt-1 font-medium"
                            >
                              Xóa ảnh này
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 1. Multiple Choice Options Edit */}
                      {qType === 'multiple_choice' && q.options && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options.map((opt, optIdx) => {
                            const letter = ['A', 'B', 'C', 'D'][optIdx];
                            const isCorrect = q.correctAnswer === optIdx;
                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-lg border transition-all ${
                                  isCorrect ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                                    <span>Phương án {letter}:</span>
                                  </label>
                                  <label className="flex items-center space-x-1 text-xs cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`correct_${q.id || originalIdx}`}
                                      checked={isCorrect}
                                      onChange={() => handleUpdateQuestion(originalIdx, { ...q, correctAnswer: optIdx })}
                                      className="w-4 h-4 text-emerald-600"
                                    />
                                    <span className={`font-semibold ${isCorrect ? 'text-emerald-700' : 'text-slate-500'}`}>
                                      {isCorrect ? 'Đáp án Đúng' : 'Chọn đúng'}
                                    </span>
                                  </label>
                                </div>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const newOpts = [...(q.options || [])];
                                    newOpts[optIdx] = e.target.value;
                                    handleUpdateQuestion(originalIdx, { ...q, options: newOpts });
                                  }}
                                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                />
                                <div className="mt-1 text-xs text-slate-600">
                                  <MathRenderer content={opt} inline />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 2. True / False Sub-Questions Edit */}
                      {qType === 'true_false' && q.subQuestions && (
                        <div className="space-y-3 bg-amber-50/30 p-4 rounded-xl border border-amber-200">
                          <label className="block text-xs font-bold text-amber-900 mb-1">
                            Các mệnh đề khẳng định (Chọn Đúng hoặc Sai cho từng ý):
                          </label>
                          {q.subQuestions.map((sub, sIdx) => (
                            <div key={sub.id || sIdx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-700">Ý {sub.label})</span>
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newSubs = [...(q.subQuestions || [])];
                                      newSubs[sIdx] = { ...newSubs[sIdx], isCorrect: true };
                                      handleUpdateQuestion(originalIdx, { ...q, subQuestions: newSubs });
                                    }}
                                    className={`px-3 py-1 rounded text-xs font-bold transition ${
                                      sub.isCorrect
                                        ? 'bg-emerald-600 text-white shadow'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    ĐÚNG
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newSubs = [...(q.subQuestions || [])];
                                      newSubs[sIdx] = { ...newSubs[sIdx], isCorrect: false };
                                      handleUpdateQuestion(originalIdx, { ...q, subQuestions: newSubs });
                                    }}
                                    className={`px-3 py-1 rounded text-xs font-bold transition ${
                                      !sub.isCorrect
                                        ? 'bg-rose-600 text-white shadow'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    SAI
                                  </button>
                                </div>
                              </div>
                              <input
                                type="text"
                                value={sub.text}
                                onChange={(e) => {
                                  const newSubs = [...(q.subQuestions || [])];
                                  newSubs[sIdx] = { ...newSubs[sIdx], text: e.target.value };
                                  handleUpdateQuestion(originalIdx, { ...q, subQuestions: newSubs });
                                }}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                              />
                              <div className="text-xs text-slate-600">
                                <MathRenderer content={sub.text} inline />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 3. Short Answer Key Edit */}
                      {qType === 'short_answer' && (
                        <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200 space-y-2">
                          <label className="block text-xs font-bold text-emerald-950">
                            Đáp số chính xác (Key trả lời ngắn):
                          </label>
                          <p className="text-[11px] text-slate-500">
                            Nhập số nguyên, số thập phân hoặc phân số (ví dụ: <code className="bg-white px-1 border rounded">12</code>, <code className="bg-white px-1 border rounded">-2.5</code>, <code className="bg-white px-1 border rounded">0.75</code>). Hệ thống sẽ tự động đối chiếu linh hoạt.
                          </p>
                          <div className="max-w-xs">
                            <input
                              type="text"
                              value={q.shortAnswerKey ?? ''}
                              onChange={(e) => handleUpdateQuestion(originalIdx, { ...q, shortAnswerKey: e.target.value })}
                              placeholder="VD: 12 hoặc -3.5"
                              className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm font-mono font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Lời giải chi tiết (tùy chọn):
                        </label>
                        <textarea
                          rows={2}
                          value={q.explanation || ''}
                          onChange={(e) => handleUpdateQuestion(originalIdx, { ...q, explanation: e.target.value })}
                          placeholder="Giải thích các bước giải bằng LaTeX..."
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Popover dialog when Snipping Tool captures an image */}
      {pendingCropImage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-2">Gán Hình Ảnh Vừa Cắt Vào Câu Hỏi</h3>
            <p className="text-xs text-slate-500 mb-4">
              Chọn câu hỏi bạn muốn đính kèm hình vẽ này:
            </p>

            <div className="bg-slate-100 p-2 rounded-xl mb-4 flex justify-center max-h-48 overflow-hidden">
              <img src={pendingCropImage} alt="Crop Preview" className="max-h-44 object-contain rounded" />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Chọn Câu Hỏi:</label>
              <select
                value={selectedTargetQIndex}
                onChange={(e) => setSelectedTargetQIndex(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {questions.map((q, i) => (
                  <option key={i} value={i}>
                    Câu {i + 1} ({q.type === 'true_false' ? 'Đúng/Sai' : q.type === 'short_answer' ? 'Trả lời ngắn' : '4 Lựa chọn'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPendingCropImage(null)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => assignImageToQuestion(selectedTargetQIndex)}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md transition"
              >
                Xác Nhận Gán Ảnh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
