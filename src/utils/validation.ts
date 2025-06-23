
import { z } from 'zod';

// Email validation schema
export const emailSchema = z.string()
  .email('Invalid email format')
  .min(1, 'Email is required');

// Name validation schema
export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Location validation schema
export const locationSchema = z.string()
  .min(1, 'Location is required')
  .max(100, 'Location must be less than 100 characters');

// Session validation schemas
export const sessionTitleSchema = z.string()
  .min(1, 'Session title is required')
  .max(200, 'Session title must be less than 200 characters');

export const sessionDurationSchema = z.number()
  .min(15, 'Session must be at least 15 minutes')
  .max(180, 'Session cannot exceed 180 minutes');

export const ratingSchema = z.number()
  .min(1, 'Rating must be at least 1')
  .max(5, 'Rating cannot exceed 5');

// Goal validation schemas
export const goalTitleSchema = z.string()
  .min(1, 'Goal title is required')
  .max(200, 'Goal title must be less than 200 characters');

export const progressSchema = z.number()
  .min(0, 'Progress cannot be negative')
  .max(100, 'Progress cannot exceed 100%');

// Message validation schema
export const messageContentSchema = z.string()
  .min(1, 'Message content is required')
  .max(5000, 'Message must be less than 5000 characters');

// Application validation schemas
export const founderApplicationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  location: locationSchema,
  startup_name: z.string().min(1, 'Startup name is required').max(100, 'Startup name too long'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  sector: z.string().min(1, 'Sector is required').max(50, 'Sector too long'),
  stage: z.string().min(1, 'Stage is required').max(200, 'Stage description too long'),
  challenge: z.string().min(10, 'Challenge description must be at least 10 characters').max(2000, 'Challenge description too long'),
  win_definition: z.string().min(10, 'Win definition must be at least 10 characters').max(1000, 'Win definition too long'),
  video_link: z.string().url('Invalid video URL').optional().or(z.literal('')),
  case_study_consent: z.boolean()
});

export const advisorApplicationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  location: locationSchema,
  linkedin: z.string().url('Invalid LinkedIn URL'),
  expertise: z.array(z.string()).min(1, 'At least one expertise area is required'),
  experience_level: z.string().min(10, 'Experience description must be at least 10 characters').max(1000, 'Experience description too long'),
  timezone: z.string().min(1, 'Timezone information is required').max(100, 'Timezone description too long'),
  challenge_preference: z.string().min(10, 'Challenge preference must be at least 10 characters').max(500, 'Challenge preference too long'),
  public_profile_consent: z.boolean()
});

// Sanitization functions
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Remove potential HTML tags
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

// Validation helper functions
export const validateAndSanitize = <T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  sanitizers?: Record<string, (value: any) => any>
): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    // Apply sanitizers if provided
    let sanitizedData = data;
    if (sanitizers && typeof data === 'object' && data !== null) {
      sanitizedData = { ...data };
      Object.entries(sanitizers).forEach(([key, sanitizer]) => {
        if (key in (sanitizedData as any)) {
          (sanitizedData as any)[key] = sanitizer((sanitizedData as any)[key]);
        }
      });
    }

    const result = schema.parse(sanitizedData);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => err.message)
      };
    }
    return {
      success: false,
      errors: ['Validation failed']
    };
  }
};

// Security validation
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const isValidRole = (role: string): boolean => {
  return ['admin', 'advisor', 'founder'].includes(role);
};

export const isValidStatus = (status: string): boolean => {
  return ['pending_activation', 'active', 'inactive', 'suspended'].includes(status);
};
