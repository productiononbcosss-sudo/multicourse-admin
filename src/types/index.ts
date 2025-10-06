// Firebase Timestamp type
export interface FirebaseTimestamp {
  toDate(): Date;
  seconds: number;
  nanoseconds: number;
}

// Question statuses
export type QuestionStatus = 'pending' | 'approved' | 'answered';

// User roles
export type UserRole = 'client_support' | 'instructor';

// Question interface
export interface Question {
  id: string;
  firestoreDocId?: string;
  courseId: string;
  questionText: string;
  variableUsed: string;
  chapterNumber: number;
  lessonNumber: number;
  status: QuestionStatus;
  dateSubmitted: string;
  timeSubmitted: string;
  timestamp: FirebaseTimestamp | Date;
  approvedAt?: FirebaseTimestamp | Date;
  approvedBy?: string;
  assignedInstructorId?: string | null;
  answer?: string;
  answeredAt?: FirebaseTimestamp | Date;
  answeredBy?: string;
  telegramMessageId?: number;
  comments?: Comment[];
}

// Course structure
export interface CourseStructure {
  [chapterKey: string]: {
    title: string;
    lessons: {
      [lessonKey: string]: string;
    };
  };
}

// Course interface
export interface Course {
  id?: string;
  courseId: string;
  courseName: string;
  courseStructure: CourseStructure;
  instructorIds: string[];
  telegramChannelId: string;
  telegramBotToken: string;
  active: boolean;
  autoCreated: boolean;
  createdAt: FirebaseTimestamp | Date;
  totalQuestions?: number;
}

// User interface
export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
  assignedCourses: string[];
  active: boolean;
  createdAt: FirebaseTimestamp | Date;
  lastLoginAt?: FirebaseTimestamp | Date;
}

// Comment interface
export interface Comment {
  commentId: string;
  questionId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: FirebaseTimestamp | Date;
  mentions?: string[];
  resolved: boolean;
}

// Lesson info helper
export interface LessonInfo {
  chapterTitle: string;
  lessonTitle: string;
  fullTitle: string;
}

// Filter types
export type FilterType = 'all' | 'pending' | 'approved' | 'answered';

// Language type
export type Language = 'en' | 'fr';

// Statistics interface
export interface Statistics {
  totalQuestions: number;
  pendingCount: number;
  approvedCount: number;
  answeredCount: number;
  avgResponseTime: number;
  activeInstructors: number;
  todayQuestions: number;
  completionRate: number;
}