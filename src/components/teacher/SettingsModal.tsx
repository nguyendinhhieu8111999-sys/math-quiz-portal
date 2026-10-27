import React, { useState } from 'react';
import { AppSettings } from '../../types';
import { AVAILABLE_GEMINI_MODELS, isHighDemandError } from '../../services/gemini';
import {
  Settings,
  Sparkles,
  FileSpreadsheet,
  Flame,
  Lock,
  Check,
  Copy,
  ExternalLink,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSave,
}) => {
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');
  const [geminiModel, setGeminiModel] = useState(settings.geminiModel || 'gemini-3.8-pro');
  const [autoFallbackGemini, setAutoFallbackGemini] = useState(settings.autoFallbackGemini ?? true);
  const [googleSheetWebhookUrl, setGoogleSheetWebhookUrl] = useState(
    settings.googleSheetWebhookUrl || ''
  );
  const [adminPassword, setAdminPassword] = useState(settings.adminPassword || 'admin');
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Firebase config
  const [firebaseApiKey, setFirebaseApiKey] = useState(
    settings.firebaseConfig?.apiKey || ''
  );
  const [firebaseProjectId, setFirebaseProjectId] = useState(
    settings.firebaseConfig?.projectId || ''
  );
  const [firebaseStorageBucket, setFirebaseStorageBucket] = useState(
    settings.firebaseConfig?.storageBucket || ''
  );

  const [testGeminiStatus, setTestGeminiStatus] = useState<string | null>(null);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const handleTestGemini = async () => {
    if (!geminiApiKey.trim()) {
      setTestGeminiStatus('Vui lòng nhập API Key trước!');
      return;
    }

    setIsTestingGemini(true);
    setTestGeminiStatus(`Đang kiểm tra kết nối API (${geminiModel})...`);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Kiểm tra kết nối toán học: 1+1 bằng mấy?' }] }],
          }),
        }
      );

      if (res.ok) {
        setTestGeminiStatus(`✅ Kết nối mô hình ${geminiModel} thành công!`);
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err.error?.message || res.statusText;
        if (isHighDemandError(res.status, msg)) {
          setTestGeminiStatus(
            `⚠️ Mô hình ${geminiModel} đang có lượng truy cập cao (High Demand) trên Google. API Key của bạn hoàn toàn hợp lệ! Bạn có thể chọn mô hình Flash hoặc bật chế độ tự động chuyển đổi bên dưới.`
          );
        } else {
          setTestGeminiStatus(`❌ Lỗi kết nối (${geminiModel}): ${msg}`);
        }
      }
    } catch (e: any) {
      setTestGeminiStatus(`❌ Lỗi mạng: ${e.message}`);
    } finally {
      setIsTestingGemini(false);
    }
  };

  const googleAppsScriptCode = `// GOOGLE APPS SCRIPT CHO GOOGLE SHEETS
// Hướng dẫn cài đặt:
// 1. Mở file Google Sheet của bạn -> Vào menu "Tiện ích mở rộng" (Extensions) -> "Apps Script"
// 2. Xóa hết mã cũ và dán toàn bộ đoạn code dưới đây vào
// 3. Bấm "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment)
// 4. Chọn loại "Ứng dụng web" (Web app)
// 5. Mục "Ai có quyền truy cập" (Who has access) chọn: "Bất kỳ ai" (Anyone)
// 6. Nhấn "Triển khai" và sao chép link Web App dán vào cài đặt web này!

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Tạo tiêu đề cột nếu sheet còn trống
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Thời Gian Nộp",
        "Mã Học Sinh",
        "Họ Và Tên",
        "Lớp",
        "Tên Bài Thi",
        "Điểm Số",
        "Số Câu Đúng",
        "Tổng Số Câu",
        "Thời Gian Làm",
        "Chi Tiết Đáp Án"
      ]);
      sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#e0f2fe");
    }

    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString("vi-VN"),
      data.studentId || "",
      data.studentName || "",
      data.studentClass || "",
      data.examTitle || "",
      data.score !== undefined ? data.score : "",
      data.correctCount !== undefined ? data.correctCount : "",
      data.totalCount !== undefined ? data.totalCount : "",
      data.timeSpent || "",
      data.answersDetail || ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleSaveAll = () => {
    const newSettings: AppSettings = {
      geminiApiKey: geminiApiKey.trim(),
      geminiModel: geminiModel,
      autoFallbackGemini: autoFallbackGemini,
      googleSheetWebhookUrl: googleSheetWebhookUrl.trim(),
      adminPassword: adminPassword.trim() || 'admin',
      firebaseConfig: firebaseApiKey
        ? {
            apiKey: firebaseApiKey.trim(),
            authDomain: `${firebaseProjectId}.firebaseapp.com`,
            projectId: firebaseProjectId.trim(),
            storageBucket: firebaseStorageBucket.trim() || `${firebaseProjectId}.appspot.com`,
            messagingSenderId: '',
            appId: '',
          }
        : undefined,
    };
    onSave(newSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-800">
              Cài Đặt Hệ Thống & Kết Nối API
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
          {/* Section 1: Gemini API */}
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Google AI Studio API Key (Bóc tách PDF Toán)</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 hover:underline flex items-center space-x-1"
              >
                <span>Lấy API Key miễn phí</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleTestGemini}
                disabled={isTestingGemini}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold whitespace-nowrap transition"
              >
                {isTestingGemini ? 'Đang thử...' : 'Kiểm Tra Key'}
              </button>
            </div>

            {/* Model Selection */}
            <div className="pt-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Mô Hình AI Mặc Định (Model):
                </label>
                <span className="text-[11px] text-slate-400">Nhiều phiên bản dự phòng</span>
              </div>

              {/* Dropdown with all versions */}
              <div>
                <select
                  value={AVAILABLE_GEMINI_MODELS.some((m) => m.id === geminiModel) ? geminiModel : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setGeminiModel(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <optgroup label="🌟 Thế Hệ 3.8 (Mới Nhất)">
                    <option value="gemini-3.8-pro">👑 Gemini 3.8 Pro - Thông minh nhất cho Toán & Đề 3 phần</option>
                    <option value="gemini-3.8-flash">⚡ Gemini 3.8 Flash - Cực nhanh & Ít quá tải máy chủ</option>
                    <option value="gemini-3.8-flash-lite">🍃 Gemini 3.8 Flash Lite - Siêu nhẹ, chống nghẽn tải</option>
                  </optgroup>
                  <optgroup label="🛡️ Thế Hệ 2.5 (Ổn Định Cao)">
                    <option value="gemini-2.5-flash">🛡️ Gemini 2.5 Flash - Tốc độ cao, tỷ lệ nghẽn thấp</option>
                    <option value="gemini-2.5-pro">🧠 Gemini 2.5 Pro - Suy luận logic chi tiết</option>
                  </optgroup>
                  <optgroup label="📦 Thế Hệ 1.5 & 2.0 (Kinh Điển - Chống Quá Tải Tuyệt Đối)">
                    <option value="gemini-1.5-flash">📦 Gemini 1.5 Flash - Hạ tầng rộng lớn, không lo quá tải</option>
                    <option value="gemini-2.0-flash">🚀 Gemini 2.0 Flash - Tốc độ cao thế hệ 2.0</option>
                    <option value="gemini-1.5-pro">📚 Gemini 1.5 Pro - Xử lý ngữ cảnh lớn</option>
                  </optgroup>
                  <optgroup label="Khác">
                    <option value="custom">✏️ Nhập model tùy chỉnh khác...</option>
                  </optgroup>
                </select>
              </div>

              {/* Custom input if custom */}
              {(!AVAILABLE_GEMINI_MODELS.some((m) => m.id === geminiModel) || geminiModel === 'custom') && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={geminiModel === 'custom' ? '' : geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value.trim())}
                    placeholder="Nhập tên mã model Google AI Studio..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              )}

              {/* Description card */}
              {(() => {
                const info = AVAILABLE_GEMINI_MODELS.find((m) => m.id === geminiModel);
                return info ? (
                  <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 flex items-start space-x-2">
                    <span className="text-sm shrink-0">💡</span>
                    <div>
                      <span className="font-bold">{info.badge}:</span>{' '}
                      <span className="text-slate-600">{info.desc}</span>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Auto Fallback Toggle */}
              <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50 transition">
                <input
                  type="checkbox"
                  checked={autoFallbackGemini}
                  onChange={(e) => setAutoFallbackGemini(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-emerald-300 mt-0.5 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                    <span>🛡️ Tự động chuyển sang mô hình ổn định hơn khi máy chủ quá tải</span>
                    <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded font-bold">Khuyên dùng</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                    Nếu model bạn chọn (như Gemini 3.8 Pro) gặp lỗi quá tải máy chủ (High demand / 503), hệ thống sẽ tự động dùng Gemini Flash hoặc 1.5 Flash để bóc tách ngay mà không báo lỗi gián đoạn.
                  </p>
                </div>
              </label>
            </div>

            {testGeminiStatus && (
              <p className="text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                {testGeminiStatus}
              </p>
            )}
          </div>

          {/* Section 2: Google Sheets Sync */}
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Liên Kết Google Sheets (Apps Script Webhook)</span>
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Đường Dẫn Webhook URL Của Bạn:
              </label>
              <input
                type="url"
                value={googleSheetWebhookUrl}
                onChange={(e) => setGoogleSheetWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Instruction Accordion */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900">
                  📋 Mã Google Apps Script để copy vào Google Sheet:
                </span>
                <button
                  type="button"
                  onClick={copyScriptToClipboard}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Đã Sao Chép!' : 'Sao Chép Mã'}</span>
                </button>
              </div>
              <pre className="text-[10px] font-mono bg-white p-2.5 rounded border border-emerald-100 max-h-36 overflow-y-auto text-slate-700">
                {googleAppsScriptCode}
              </pre>
            </div>
          </div>

          {/* Section 3: Firebase Config (Optional Cloud Sync) */}
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Cấu Hình Firebase (Tùy chọn - Lưu trữ Cloud & Ảnh)</span>
            </label>
            <p className="text-[11px] text-slate-500">
              Nếu để trống, web vẫn hoạt động trọn vẹn và lưu trữ an toàn trong máy (LocalStorage + Google Sheets)!
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Firebase API Key
                </label>
                <input
                  type="text"
                  value={firebaseApiKey}
                  onChange={(e) => setFirebaseApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Project ID
                </label>
                <input
                  type="text"
                  value={firebaseProjectId}
                  onChange={(e) => setFirebaseProjectId(e.target.value)}
                  placeholder="my-math-quiz"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Admin Password */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Mật Khẩu Quản Trị Viên (Giáo Viên)</span>
            </label>

            <div className="relative max-w-sm">
              <input
                type={showPassword ? 'text' : 'password'}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-white transition"
          >
            Đóng
          </button>
          <button
            onClick={handleSaveAll}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md transition"
          >
            Lưu Cài Đặt
          </button>
        </div>
      </div>
    </div>
  );
};
