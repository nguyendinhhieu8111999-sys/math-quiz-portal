import React, { useState, useEffect } from 'react';
import { Exam, Student, Submission, AppSettings, UserRole } from './types';
import {
  getExams,
  saveExam,
  deleteExam,
  getStudents,
  saveStudent,
  saveBatchStudents,
  deleteStudent,
  getSubmissions,
  saveSubmission,
  getAppSettings,
  saveAppSettings,
  initFirebase,
} from './services/storage';
import { LoginPage } from './components/auth/LoginPage';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentPortal } from './components/student/StudentPortal';
import { Loader2 } from 'lucide-react';

export function App() {
  const [role, setRole] = useState<UserRole>(() => {
    return (sessionStorage.getItem('math_quiz_role') as UserRole) || null;
  });
  const [currentStudent, setCurrentStudent] = useState<Student | null>(() => {
    const raw = sessionStorage.getItem('math_quiz_current_student');
    return raw ? JSON.parse(raw) : null;
  });

  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getAppSettings());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize data
  useEffect(() => {
    const loadAll = async () => {
      try {
        const appSettings = getAppSettings();
        setSettings(appSettings);
        if (appSettings.firebaseConfig) {
          initFirebase(appSettings.firebaseConfig);
        }

        const [loadedExams, loadedStudents, loadedSubs] = await Promise.all([
          getExams(),
          getStudents(),
          getSubmissions(),
        ]);

        setExams(loadedExams);
        setStudents(loadedStudents);
        setSubmissions(loadedSubs);
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();
  }, []);

  // Sync auth state to session
  useEffect(() => {
    if (role) {
      sessionStorage.setItem('math_quiz_role', role);
    } else {
      sessionStorage.removeItem('math_quiz_role');
    }

    if (currentStudent) {
      sessionStorage.setItem('math_quiz_current_student', JSON.stringify(currentStudent));
    } else {
      sessionStorage.removeItem('math_quiz_current_student');
    }
  }, [role, currentStudent]);

  // Auth Handlers
  const handleStudentLogin = (student: Student) => {
    setCurrentStudent(student);
    setRole('student');
  };

  const handleTeacherLogin = () => {
    setCurrentStudent(null);
    setRole('teacher');
  };

  const handleLogout = () => {
    setRole(null);
    setCurrentStudent(null);
  };

  // Exam Handlers
  const handleSaveExam = async (savedExam: Exam) => {
    await saveExam(savedExam);
    const updated = await getExams();
    setExams(updated);
  };

  const handleDeleteExam = async (examId: string) => {
    await deleteExam(examId);
    const updated = await getExams();
    setExams(updated);
  };

  // Student Handlers
  const handleSaveStudent = async (savedStudent: Student) => {
    await saveStudent(savedStudent);
    const updated = await getStudents();
    setStudents(updated);
  };

  const handleSaveBatchStudents = async (newStudents: Student[]) => {
    await saveBatchStudents(newStudents);
    const updated = await getStudents();
    setStudents(updated);
  };

  const handleDeleteStudent = async (studentId: string) => {
    await deleteStudent(studentId);
    const updated = await getStudents();
    setStudents(updated);
  };

  // Submission Handler
  const handleSubmitExam = async (submission: Submission, exam: Exam) => {
    const webhook = exam.googleSheetWebhookUrl || settings.googleSheetWebhookUrl;
    await saveSubmission(submission, webhook);
    const updated = await getSubmissions();
    setSubmissions(updated);
  };

  // Settings Handler
  const handleSaveSettings = (newSettings: AppSettings) => {
    saveAppSettings(newSettings);
    setSettings(newSettings);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mb-3" />
        <p className="text-sm font-medium text-slate-300">Đang khởi động hệ thống MathQuiz Pro...</p>
      </div>
    );
  }

  // Teacher portal
  if (role === 'teacher') {
    return (
      <TeacherDashboard
        exams={exams}
        students={students}
        submissions={submissions}
        settings={settings}
        onSaveExam={handleSaveExam}
        onDeleteExam={handleDeleteExam}
        onSaveStudent={handleSaveStudent}
        onSaveBatchStudents={handleSaveBatchStudents}
        onDeleteStudent={handleDeleteStudent}
        onSaveSettings={handleSaveSettings}
        onLogout={handleLogout}
      />
    );
  }

  // Student portal
  if (role === 'student' && currentStudent) {
    return (
      <StudentPortal
        student={currentStudent}
        exams={exams}
        submissions={submissions}
        onSubmitExam={handleSubmitExam}
        onLogout={handleLogout}
      />
    );
  }

  // Login page
  return (
    <LoginPage
      students={students}
      settings={settings}
      onStudentLogin={handleStudentLogin}
      onTeacherLogin={handleTeacherLogin}
    />
  );
}

export default App;
