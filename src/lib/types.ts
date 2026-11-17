export type UserRole = 'user' | 'admin';

export type PublicUser = {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  interests: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type Note = {
  _id: string;
  title: string;
  content: string;
  owner: string | { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
};

export type Post = {
  _id: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  updatedAt: string;
};

export type Paginated<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
