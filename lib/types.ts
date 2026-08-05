export type Role = "Admin" | "Teacher" | "Student";

export type SubmissionStatus =
  | "Submitted"
  | "InReview"
  | "Returned"
  | "Resubmitted"
  | "Graded";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[] | Record<string, string[]> | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
}

export type ListResponse<T> = T[] | PagedResult<T>;

export interface PagedParams {
  page?: number;
  pageSize?: number;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  classId: number | null;
  className: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResult {
  token: string;
  expiresAt: string;
  user: User;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  classId?: number | null;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  classId?: number | null;
  isActive: boolean;
}

export interface SetUserActiveRequest {
  isActive: boolean;
}

export interface SchoolClass {
  id: number;
  name: string;
  code: string;
  description: string | null;
  createdAt: string;
}

export interface ClassRequest {
  name: string;
  code: string;
  description?: string | null;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description: string | null;
  createdAt: string;
}

export interface SubjectRequest {
  name: string;
  code: string;
  description?: string | null;
}

export interface ClassSubject {
  id: number;
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
  teacherId: number | null;
  teacherName: string | null;
  isActive: boolean;
}

export interface ClassSubjectRequest {
  classId: number;
  subjectId: number;
  teacherId?: number | null;
  isActive?: boolean;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  classId: number;
  className: string;
  classCode: string;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  teacherId: number;
  teacherName: string;
  maxMarks: number;
  deadline: string;
  isPublished: boolean;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentRequest {
  title: string;
  description: string;
  classId: number;
  subjectId: number;
  teacherId?: number | null;
  maxMarks: number;
  deadline: string;
  isPublished?: boolean;
}

export interface UpdateAssignmentRequest {
  title: string;
  description: string;
  classId: number;
  subjectId: number;
  maxMarks: number;
  deadline: string;
}

export interface SetPublishedRequest {
  isPublished: boolean;
}

export interface Submission {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  maxMarks: number;
  deadline: string;
  studentId: number;
  studentName: string;
  className: string;
  subjectName: string;
  content: string;
  status: SubmissionStatus;
  marks: number | null;
  feedback: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface SubmitRequest {
  content: string;
}

export interface GradeRequest {
  marks: number;
  feedback?: string | null;
}

export interface StatusRequest {
  status: SubmissionStatus;
}
