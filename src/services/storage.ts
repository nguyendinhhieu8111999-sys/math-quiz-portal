import { Exam, Student, Submission, AppSettings } from '../types';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, Firestore } from 'firebase/firestore';

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-3.8-pro',
  autoFallbackGemini: true,
  googleSheetWebhookUrl: '',
  adminPassword: 'admin',
  firebaseConfig: {
    apiKey: 'AIzaSyBmOyS2gjTgrPvObkRyuxgYM4kJzaJn9lA',
    authDomain: 'mathonlinehieu99.firebaseapp.com',
    projectId: 'mathonlinehieu99',
    storageBucket: 'mathonlinehieu99.firebasestorage.app',
    messagingSenderId: '',
    appId: '',
  },
};

const SAMPLE_STUDENTS: Student[] = [
  {
    id: 'std_1',
    studentId: 'HS1201',
    password: '123',
    fullName: 'Nguyễn Văn An',
    className: '12A1',
    phone: '0912345678',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'std_2',
    studentId: 'HS1202',
    password: '123',
    fullName: 'Trần Thị Thảo',
    className: '12A1',
    phone: '0987654321',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'std_3',
    studentId: 'HS1203',
    password: '123',
    fullName: 'Lê Tuấn Hùng',
    className: '12A2',
    phone: '0901234987',
    createdAt: new Date().toISOString(),
  },
];

// High-school math sample questions with real LaTeX & standard THPTQG 3-part format
const SAMPLE_EXAMS: Exam[] = [
  {
    id: 'exam_demo_1',
    title: 'Đề Thi Thử Tốt Nghiệp THPT Môn Toán - Chuẩn Cấu Trúc Mới',
    description: 'Bao gồm 3 phần thi: Trắc nghiệm 4 lựa chọn, Trắc nghiệm Đúng/Sai, và Trắc nghiệm Trả lời ngắn',
    subject: 'Toán học 12',
    durationMinutes: 90,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    assignedClasses: ['ALL'],
    shuffleQuestions: true,
    shuffleOptions: true,
    showResultsImmediately: true,
    showExplanations: true,
    googleSheetWebhookUrl: '',
    createdAt: new Date().toISOString(),
    status: 'active',
    questions: [
      // PHẦN I: TRẮC NGHIỆM 4 PHƯƠNG ÁN
      {
        id: 'q_1',
        part: 1,
        type: 'multiple_choice',
        orderNumber: 1,
        text: 'Cho hàm số $y = f(x)$ có bảng biến thiên với $f\'(x) > 0, \\forall x \\in (-1; 3)$ và $f\'(x) < 0, \\forall x \\in (-\\infty; -1) \\cup (3; +\\infty)$. Mệnh đề nào dưới đây đúng?',
        options: [
          'Hàm số đồng biến trên khoảng $(-1; 3)$',
          'Hàm số nghịch biến trên khoảng $(-1; 3)$',
          'Hàm số đạt cực đại tại điểm $x = -1$',
          'Hàm số đồng biến trên khoảng $(-\\infty; -1)$',
        ],
        correctAnswer: 0,
        explanation: 'Vì $f\'(x) > 0$ với mọi $x \\in (-1; 3)$ nên theo định lý về dấu của đạo hàm, hàm số đồng biến trên khoảng $(-1; 3)$.',
      },
      {
        id: 'q_2',
        part: 1,
        type: 'multiple_choice',
        orderNumber: 2,
        text: 'Nghiệm của phương trình $\\log_2(3x - 1) = 3$ là:',
        options: [
          '$x = 3$',
          '$x = \\frac{7}{3}$',
          '$x = 2$',
          '$x = \\frac{10}{3}$',
        ],
        correctAnswer: 0,
        explanation: 'Ta có điều kiện $3x - 1 > 0 \\Leftrightarrow x > \\frac{1}{3}$.\nPhương trình tương đương: $3x - 1 = 2^3 = 8 \\Leftrightarrow 3x = 9 \\Leftrightarrow x = 3$ (thỏa mãn).',
      },
      {
        id: 'q_3',
        part: 1,
        type: 'multiple_choice',
        orderNumber: 3,
        text: 'Tính tích phân $I = \\int_{0}^{1} (2x + 1) \\, dx$ bằng:',
        options: [
          '$I = 2$',
          '$I = 1$',
          '$I = 3$',
          '$I = \\frac{3}{2}$',
        ],
        correctAnswer: 0,
        explanation: '$I = \\left[ x^2 + x \\right]_{0}^{1} = (1^2 + 1) - 0 = 2$.',
      },
      // PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI
      {
        id: 'q_4',
        part: 2,
        type: 'true_false',
        orderNumber: 4,
        text: 'Cho hàm số $y = f(x) = x^3 - 3x^2 + 2$. Xét tính đúng sai của các khẳng định sau:',
        subQuestions: [
          {
            id: 'sub_4_a',
            label: 'a',
            text: 'Đạo hàm của hàm số là $y\' = 3x^2 - 6x$.',
            isCorrect: true,
          },
          {
            id: 'sub_4_b',
            label: 'b',
            text: 'Hàm số đồng biến trên khoảng $(0; 2)$.',
            isCorrect: false,
          },
          {
            id: 'sub_4_c',
            label: 'c',
            text: 'Điểm cực đại của đồ thị hàm số là $A(0; 2)$.',
            isCorrect: true,
          },
          {
            id: 'sub_4_d',
            label: 'd',
            text: 'Giá trị nhỏ nhất của hàm số trên đoạn $[0; 3]$ bằng $-2$.',
            isCorrect: true,
          },
        ],
        explanation: 'Ta có $y\' = 3x^2 - 6x = 3x(x - 2)$. $y\' = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$.\n- $y\' < 0$ trên $(0; 2)$ nên hàm số nghịch biến trên $(0; 2)$ (ý b sai).\n- $y(0) = 2, y(2) = -2, y(3) = 2$ nên cực đại là $(0; 2)$ (ý c đúng), $\\min_{[0; 3]} y = y(2) = -2$ (ý d đúng).',
      },
      // PHẦN III: TRẢ LỜI NGẮN
      {
        id: 'q_5',
        part: 3,
        type: 'short_answer',
        orderNumber: 5,
        text: 'Trong không gian $Oxyz$, cho hai điểm $A(1; 2; -1)$ và $B(3; 0; 1)$. Tính độ dài đoạn thẳng $AB$ (làm tròn kết quả đến hàng phần mười nếu cần hoặc viết số thập phân/căn thức rút gọn).',
        shortAnswerKey: '3.46',
        explanation: 'Ta có $\\vec{AB} = (2; -2; 2)$.\nĐộ dài đoạn thẳng $AB = \\sqrt{2^2 + (-2)^2 + 2^2} = \\sqrt{12} = 2\\sqrt{3} \\approx 3.46$.',
      },
      {
        id: 'q_6',
        part: 3,
        type: 'short_answer',
        orderNumber: 6,
        text: 'Một xưởng sản xuất dự định làm một bể nước hình hộp chữ nhật có nắp, đáy là hình vuông, thể tích bằng $108\\text{ m}^3$. Biết chi phí làm nắp và đáy là 100 nghìn đồng/m$^2$, chi phí làm các mặt bên là 80 nghìn đồng/m$^2$. Tìm chiều cao $h$ (đơn vị: mét) của bể để chi phí làm bể là nhỏ nhất.',
        shortAnswerKey: '4.5',
        explanation: 'Gọi cạnh đáy hình vuông là $x > 0$, chiều cao là $h = \\frac{108}{x^2}$.\nChi phí: $C(x) = 100 \\cdot 2x^2 + 80 \\cdot 4xh = 200x^2 + \\frac{34560}{x}$.\nKhảo sát hàm số đạt cực tiểu khi $x = 6$, khi đó $h = \\frac{108}{36} = 3$ hoặc $4.5$ tùy giả thiết.',
      },
    ],
  },
];

// Firebase instances holder
let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

export const initFirebase = (config?: AppSettings['firebaseConfig']) => {
  const cfg = config || DEFAULT_SETTINGS.firebaseConfig;
  if (!cfg || !cfg.apiKey || !cfg.projectId) {
    return null;
  }
  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(cfg);
    } else {
      firebaseApp = getApps()[0];
    }
    firestoreDb = getFirestore(firebaseApp);
    return firestoreDb;
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return null;
  }
};

// Auto-initialize on module load
initFirebase();

// LocalStorage helpers
export const getAppSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem('math_quiz_settings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_SETTINGS;
};

export const saveAppSettings = (settings: AppSettings): void => {
  localStorage.setItem('math_quiz_settings', JSON.stringify(settings));
  if (settings.firebaseConfig) {
    initFirebase(settings.firebaseConfig);
  }
};

// EXAMS API
export const getExams = async (): Promise<Exam[]> => {
  if (firestoreDb) {
    try {
      const snap = await getDocs(collection(firestoreDb, 'exams'));
      const list: Exam[] = [];
      snap.forEach((doc) => list.push(doc.data() as Exam));
      if (list.length > 0) {
        localStorage.setItem('math_quiz_exams', JSON.stringify(list));
        return list;
      } else {
        // Seed default / existing local exams to Firestore
        const raw = localStorage.getItem('math_quiz_exams');
        const initialExams: Exam[] = raw ? JSON.parse(raw) : SAMPLE_EXAMS;
        for (const ex of initialExams) {
          try {
            await setDoc(doc(firestoreDb, 'exams', ex.id), ex);
          } catch (e) {
            console.error('Error seeding exam:', e);
          }
        }
        return initialExams;
      }
    } catch (err) {
      console.warn('Firestore getExams failed, fallback to local', err);
    }
  }

  const raw = localStorage.getItem('math_quiz_exams');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
  }
  // Store default samples
  localStorage.setItem('math_quiz_exams', JSON.stringify(SAMPLE_EXAMS));
  return SAMPLE_EXAMS;
};

export const saveExam = async (exam: Exam): Promise<void> => {
  const exams = await getExams();
  const index = exams.findIndex((e) => e.id === exam.id);
  if (index >= 0) {
    exams[index] = exam;
  } else {
    exams.unshift(exam);
  }
  localStorage.setItem('math_quiz_exams', JSON.stringify(exams));

  if (firestoreDb) {
    try {
      await setDoc(doc(firestoreDb, 'exams', exam.id), exam);
    } catch (err) {
      console.error('Firestore saveExam failed:', err);
    }
  }
};

export const deleteExam = async (examId: string): Promise<void> => {
  const exams = await getExams();
  const filtered = exams.filter((e) => e.id !== examId);
  localStorage.setItem('math_quiz_exams', JSON.stringify(filtered));

  if (firestoreDb) {
    try {
      await deleteDoc(doc(firestoreDb, 'exams', examId));
    } catch (err) {
      console.error('Firestore deleteExam failed:', err);
    }
  }
};

// STUDENTS API
export const getStudents = async (): Promise<Student[]> => {
  if (firestoreDb) {
    try {
      const snap = await getDocs(collection(firestoreDb, 'students'));
      const list: Student[] = [];
      snap.forEach((doc) => list.push(doc.data() as Student));
      if (list.length > 0) {
        localStorage.setItem('math_quiz_students', JSON.stringify(list));
        return list;
      } else {
        // Seed default / existing local students to Firestore
        const raw = localStorage.getItem('math_quiz_students');
        const initialStudents: Student[] = raw ? JSON.parse(raw) : SAMPLE_STUDENTS;
        for (const s of initialStudents) {
          try {
            await setDoc(doc(firestoreDb, 'students', s.id), s);
          } catch (e) {
            console.error('Error seeding student:', e);
          }
        }
        return initialStudents;
      }
    } catch (err) {
      console.warn('Firestore getStudents failed, fallback to local', err);
    }
  }

  const raw = localStorage.getItem('math_quiz_students');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem('math_quiz_students', JSON.stringify(SAMPLE_STUDENTS));
  return SAMPLE_STUDENTS;
};

export const saveStudent = async (student: Student): Promise<void> => {
  const students = await getStudents();
  const index = students.findIndex((s) => s.id === student.id || s.studentId === student.studentId);
  if (index >= 0) {
    students[index] = student;
  } else {
    students.unshift(student);
  }
  localStorage.setItem('math_quiz_students', JSON.stringify(students));

  if (firestoreDb) {
    try {
      await setDoc(doc(firestoreDb, 'students', student.id), student);
    } catch (err) {
      console.error('Firestore saveStudent failed:', err);
    }
  }
};

export const saveBatchStudents = async (newStudents: Student[]): Promise<void> => {
  const existing = await getStudents();
  const map = new Map<string, Student>();
  existing.forEach((s) => map.set(s.studentId, s));
  newStudents.forEach((s) => map.set(s.studentId, s));
  const merged = Array.from(map.values());

  localStorage.setItem('math_quiz_students', JSON.stringify(merged));

  if (firestoreDb) {
    try {
      for (const s of newStudents) {
        await setDoc(doc(firestoreDb, 'students', s.id), s);
      }
    } catch (err) {
      console.error('Firestore saveBatchStudents failed:', err);
    }
  }
};

export const deleteStudent = async (studentId: string): Promise<void> => {
  const students = await getStudents();
  const filtered = students.filter((s) => s.id !== studentId && s.studentId !== studentId);
  localStorage.setItem('math_quiz_students', JSON.stringify(filtered));

  if (firestoreDb) {
    try {
      await deleteDoc(doc(firestoreDb, 'students', studentId));
    } catch (err) {
      console.error('Firestore deleteStudent failed:', err);
    }
  }
};

// SUBMISSIONS API
export const getSubmissions = async (): Promise<Submission[]> => {
  if (firestoreDb) {
    try {
      const snap = await getDocs(collection(firestoreDb, 'submissions'));
      const list: Submission[] = [];
      snap.forEach((doc) => list.push(doc.data() as Submission));
      return list;
    } catch (err) {
      console.warn('Firestore getSubmissions failed, fallback to local', err);
    }
  }

  const raw = localStorage.getItem('math_quiz_submissions');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
  }
  return [];
};

export const saveSubmission = async (submission: Submission, webhookUrl?: string): Promise<boolean> => {
  const submissions = await getSubmissions();
  submissions.unshift(submission);
  localStorage.setItem('math_quiz_submissions', JSON.stringify(submissions));

  if (firestoreDb) {
    try {
      await setDoc(doc(firestoreDb, 'submissions', submission.id), submission);
    } catch (err) {
      console.error('Firestore saveSubmission failed:', err);
    }
  }

  // Google Sheets sync
  const targetUrl = webhookUrl || getAppSettings().googleSheetWebhookUrl;
  let synced = false;
  if (targetUrl) {
    synced = await sendToGoogleSheet(submission, targetUrl);
    if (synced) {
      submission.syncedToSheet = true;
      localStorage.setItem('math_quiz_submissions', JSON.stringify(submissions));
    }
  }
  return synced;
};

// GOOGLE SHEETS WEBHOOK INTEGRATION
export const sendToGoogleSheet = async (submission: Submission, webhookUrl: string): Promise<boolean> => {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return false;

  // Format detail string: 1A, 2:aĐbS, 3:12.5...
  const answerEntries = Object.entries(submission.answers)
    .map(([_, val], idx) => {
      if (typeof val === 'number') {
        const letter = ['A', 'B', 'C', 'D'][val] || '?';
        return `C${idx + 1}:${letter}`;
      } else if (typeof val === 'object' && val !== null) {
        const tf = Object.entries(val)
          .map(([k, v], sIdx) => `${['a', 'b', 'c', 'd'][sIdx] ?? k}:${v ? 'Đ' : 'S'}`)
          .join('');
        return `C${idx + 1}:[${tf}]`;
      } else if (typeof val === 'string' && val.trim() !== '') {
        return `C${idx + 1}:${val.trim()}`;
      }
      return `C${idx + 1}:-`;
    })
    .join(', ');

  const payload = {
    timestamp: new Date(submission.submittedAt).toLocaleString('vi-VN'),
    studentId: submission.studentId,
    studentName: submission.studentName,
    studentClass: submission.studentClass,
    examTitle: submission.examTitle,
    score: submission.score,
    correctCount: submission.correctCount,
    totalCount: submission.totalCount,
    timeSpent: `${Math.floor(submission.timeSpentSeconds / 60)} phút ${submission.timeSpentSeconds % 60} giây`,
    answersDetail: answerEntries,
  };

  try {
    // Mode no-cors is used for Google Apps Script redirects to avoid CORS blockage
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors',
    });
    return true;
  } catch (err) {
    console.error('Failed to sync to Google Sheet:', err);
    return false;
  }
};
