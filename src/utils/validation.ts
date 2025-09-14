import { z } from 'zod';
import { SecurityUtils } from './security';

/**
 * Comprehensive validation schemas using Zod for consistent client and server-side validation
 */

// Common validation patterns
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .max(254, 'Email is too long')
  .email('Invalid email format')
  .refine((email) => SecurityUtils.isValidEmail(email), 'Invalid email format');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .transform((name) => SecurityUtils.validateAndSanitizeInput(name, 100));

// Project validation schemas
export const projectCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name is too long')
    .regex(/^[a-zA-Z0-9\s'-]+$/, 'Project name contains invalid characters')
    .transform((name) => SecurityUtils.validateAndSanitizeInput(name, 100)),
  
  description: z
    .string()
    .max(1000, 'Description is too long')
    .optional()
    .transform((desc) => desc ? SecurityUtils.validateAndSanitizeInput(desc, 1000) : ''),
  
  status: z.enum(['draft', 'active', 'completed', 'archived'], {
    errorMap: () => ({ message: 'Invalid project status' }),
  }),
});

export const projectUpdateSchema = projectCreateSchema.partial();

// Task validation schemas
export const taskCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(200, 'Task title is too long')
    .transform((title) => SecurityUtils.validateAndSanitizeInput(title, 200)),
  
  description: z
    .string()
    .max(2000, 'Task description is too long')
    .optional()
    .transform((desc) => desc ? SecurityUtils.validateAndSanitizeInput(desc, 2000) : ''),
  
  status: z.enum(['todo', 'progress', 'done'], {
    errorMap: () => ({ message: 'Invalid task status' }),
  }),
  
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Invalid priority level' }),
  }),
  
  dueDate: z
    .date()
    .optional()
    .refine((date) => !date || date > new Date(), 'Due date must be in the future'),
  
  projectId: z
    .number()
    .positive('Invalid project ID'),
  
  assignee: z
    .string()
    .max(100, 'Assignee name is too long')
    .optional()
    .transform((assignee) => assignee ? SecurityUtils.validateAndSanitizeInput(assignee, 100) : ''),
});

export const taskUpdateSchema = taskCreateSchema.partial().omit({ projectId: true });

// Authentication validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Search and filter schemas
export const searchSchema = z.object({
  query: z
    .string()
    .max(100, 'Search query is too long')
    .optional()
    .transform((query) => query ? SecurityUtils.validateAndSanitizeInput(query, 100) : ''),
  
  filters: z.object({
    status: z.array(z.string()).optional(),
    priority: z.array(z.string()).optional(),
    dateRange: z.object({
      from: z.date().optional(),
      to: z.date().optional(),
    }).optional(),
  }).optional(),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/gif', 'application/pdf']),
}).refine((data) => data.file.size <= data.maxSize, {
  message: 'File size exceeds maximum limit',
  path: ['file'],
}).refine((data) => data.allowedTypes.includes(data.file.type), {
  message: 'File type not allowed',
  path: ['file'],
});

// URL validation
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .refine((url) => SecurityUtils.isValidUrl(url), 'URL is not safe');

// Comment validation
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment is too long')
    .transform((content) => SecurityUtils.validateAndSanitizeInput(content, 1000)),
  
  entityId: z.number().positive('Invalid entity ID'),
  entityType: z.enum(['project', 'task'], {
    errorMap: () => ({ message: 'Invalid entity type' }),
  }),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').default(1),
  perPage: z.number().min(1, 'Items per page must be at least 1').max(100, 'Too many items per page').default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Generic validation helper
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: string[];
};

/**
 * Validates data against a Zod schema and returns a consistent result format
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(issue => issue.message),
      };
    }
    return {
      success: false,
      errors: ['Validation failed'],
    };
  }
}

/**
 * Async validation for forms with debouncing
 */
export function createAsyncValidator<T>(
  schema: z.ZodSchema<T>,
  debounceMs: number = 300
) {
  let timeoutId: NodeJS.Timeout;
  
  return (data: unknown): Promise<ValidationResult<T>> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        resolve(validateData(schema, data));
      }, debounceMs);
    });
  };
}

// Export schema types for TypeScript
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;