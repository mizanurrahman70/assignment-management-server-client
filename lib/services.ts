import { api } from "./api";
import type {
  Assignment,
  AuthResult,
  ClassRequest,
  ClassSubject,
  ClassSubjectRequest,
  CreateAssignmentRequest,
  CreateUserRequest,
  GradeRequest,
  ListResponse,
  LoginRequest,
  PagedResult,
  RegisterRequest,
  SchoolClass,
  StatusRequest,
  Submission,
  SubmitRequest,
  Subject,
  SubjectRequest,
  UpdateAssignmentRequest,
  UpdateUserRequest,
  User,
} from "./types";

export function toList<T>(data: ListResponse<T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items;
}

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResult>("/api/auth/login", data),
  register: (data: RegisterRequest) =>
    api.post<AuthResult>("/api/auth/register", data),
};

export const usersApi = {
  me: () => api.get<User>("/api/users/me"),
  list: (params?: {
    search?: string;
    role?: string;
    classId?: string | number;
    page?: number;
    pageSize?: number;
  }) => api.get<PagedResult<User>>("/api/users", params),
  get: (id: number) => api.get<User>(`/api/users/${id}`),
  create: (data: CreateUserRequest) => api.post<User>("/api/users", data),
  update: (id: number, data: UpdateUserRequest) =>
    api.put<User>(`/api/users/${id}`, data),
  setStatus: (id: number, isActive: boolean) =>
    api.patch<User>(`/api/users/${id}/status`, { isActive }),
  remove: (id: number) => api.delete<void>(`/api/users/${id}`),
};

export const classesApi = {
  list: () =>
    api.get<ListResponse<SchoolClass>>("/api/classes").then(toList),
  get: (id: number) => api.get<SchoolClass>(`/api/classes/${id}`),
  create: (data: ClassRequest) => api.post<SchoolClass>("/api/classes", data),
  update: (id: number, data: ClassRequest) =>
    api.put<SchoolClass>(`/api/classes/${id}`, data),
  remove: (id: number) => api.delete<void>(`/api/classes/${id}`),
};

export const subjectsApi = {
  list: () =>
    api.get<ListResponse<Subject>>("/api/subjects").then(toList),
  get: (id: number) => api.get<Subject>(`/api/subjects/${id}`),
  create: (data: SubjectRequest) => api.post<Subject>("/api/subjects", data),
  update: (id: number, data: SubjectRequest) =>
    api.put<Subject>(`/api/subjects/${id}`, data),
  remove: (id: number) => api.delete<void>(`/api/subjects/${id}`),
};

export const classSubjectsApi = {
  list: (params?: { classId?: number; subjectId?: number; teacherId?: number }) =>
    api
      .get<ListResponse<ClassSubject>>("/api/class-subjects", params)
      .then(toList),
  create: (data: ClassSubjectRequest) =>
    api.post<ClassSubject>("/api/class-subjects", data),
  update: (id: number, data: ClassSubjectRequest) =>
    api.put<ClassSubject>(`/api/class-subjects/${id}`, data),
  remove: (id: number) => api.delete<void>(`/api/class-subjects/${id}`),
};

export const assignmentsApi = {
  list: (params?: {
    classId?: number;
    subjectId?: number;
    teacherId?: number;
    search?: string;
    page?: number;
    pageSize?: number;
  }) => api.get<ListResponse<Assignment>>("/api/assignments", params).then(toList),
  get: (id: number) => api.get<Assignment>(`/api/assignments/${id}`),
  create: (data: CreateAssignmentRequest) =>
    api.post<Assignment>("/api/assignments", data),
  update: (id: number, data: UpdateAssignmentRequest) =>
    api.put<Assignment>(`/api/assignments/${id}`, data),
  setPublished: (id: number, isPublished: boolean) =>
    api.patch<Assignment>(`/api/assignments/${id}/publish`, { isPublished }),
  remove: (id: number) => api.delete<void>(`/api/assignments/${id}`),
};

export const submissionsApi = {
  submit: (assignmentId: number, data: SubmitRequest) =>
    api.post<Submission>(`/api/assignments/${assignmentId}/submissions`, data),
  listByAssignment: (assignmentId: number) =>
    api
      .get<ListResponse<Submission>>(`/api/assignments/${assignmentId}/submissions`)
      .then(toList),
  mine: () => api.get<ListResponse<Submission>>("/api/submissions/my").then(toList),
  get: (id: number) => api.get<Submission>(`/api/submissions/${id}`),
  update: (id: number, data: SubmitRequest) =>
    api.put<Submission>(`/api/submissions/${id}`, data),
  grade: (id: number, data: GradeRequest) =>
    api.put<Submission>(`/api/submissions/${id}/grade`, data),
  setStatus: (id: number, data: StatusRequest) =>
    api.patch<Submission>(`/api/submissions/${id}/status`, data),
};
