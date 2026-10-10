import { Exam, Student, Submission, AppSettings } from '../types';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, Firestore } from 'firebase/firestore';

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  googleSheetWebhookUrl: '',
  adminPassword: 'admin',
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

// High-school math sample questions with real LaTeX & one geometry diagram
const SAMPLE_EXAMS: Exam[] = [
  {
    id: 'exam_demo_1',
    title: 'Đề Khảo Sát Chất Lượng Toán 12 - Đề Số 01',
    description: 'Kiểm tra kiến thức Hàm số, Mũ - Logarit, Tích phân và Hình học không gian Oxyz',
    subject: 'Toán học 12',
    durationMinutes: 45,
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
      {
        id: 'q_1',
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
      {
        id: 'q_4',
        text: 'Trong không gian Oxyz, cho mặt phẳng $(P): 2x - y + 3z - 5 = 0$. Một vectơ pháp tuyến của $(P)$ là:',
        options: [
          '$\\vec{n} = (2; -1; 3)$',
          '$\\vec{n} = (2; 1; 3)$',
          '$\\vec{n} = (2; -1; -5)$',
          '$\\vec{n} = (-1; 3; -5)$',
        ],
        correctAnswer: 0,
        explanation: 'Mặt phẳng $(P): Ax + By + Cz + D = 0$ có một VTPT là $\\vec{n} = (A; B; C) = (2; -1; 3)$.',
      },
      {
        id: 'q_5',
        text: 'Cho hình lăng trụ đứng tam giác $ABC.A\'B\'C\'$ có đáy $ABC$ là tam giác vuông tại $A$, $AB = a, AC = a\\sqrt{3}$. Chiều cao của lăng trụ bằng $2a$. Thể tích khối lăng trụ đã cho là:',
        options: [
          '$V = a^3\\sqrt{3}$',
          '$V = 2a^3\\sqrt{3}$',
          '$V = \\frac{a^3\\sqrt{3}}{3}$',
          '$V = \\frac{2a^3\\sqrt{3}}{3}$',
        ],
        correctAnswer: 0,
        explanation: 'Diện tích đáy: $S_{ABC} = \\frac{1}{2}AB \\cdot AC = \\frac{1}{2} \\cdot a \\cdot a\\sqrt{3} = \\frac{a^2\\sqrt{3}}{2}$.\nThể tích lăng trụ: $V = S \\cdot h = \\frac{a^2\\sqrt{3}}{2} \\cdot 2a = a^3\\sqrt{3}$.',
      },
    ],
  },
];

// Firebase instances holder
let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

export const initFirebase = (config?: AppSettings['firebaseConfig']) => {
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }
  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(config);
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
      if (list.length > 0) return list;
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
      if (list.length > 0) return list;
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

  // Format detail string: 1A, 2B, 3C...
  const answerEntries = Object.entries(submission.answers)
    .map(([_, choiceIdx], idx) => {
      const letter = ['A', 'B', 'C', 'D'][choiceIdx] || '?';
      return `Câu ${idx + 1}:${letter}`;
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
