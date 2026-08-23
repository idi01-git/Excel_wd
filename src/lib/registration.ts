import { z } from 'zod';

export const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'moderator',
  'mod',
  'excelsior',
  'editorial',
  'editor',
  'system',
  'root',
  'api',
  'auth',
  'login',
  'register',
  'logout',
  'dashboard',
  'settings',
  'profile',
  'user',
  'users',
  'events',
  'publications',
  'shelf',
  'community',
  'library',
  'alumni',
  'members',
  'search',
  'help',
  'support',
  'null',
  'undefined',
]);

export function validateUsername(username: string): { valid: boolean; error?: string } {
  const clean = username.trim().toLowerCase();
  if (clean.length < 3) return { valid: false, error: 'Username must be at least 3 characters' };
  if (clean.length > 20) return { valid: false, error: 'Username cannot exceed 20 characters' };
  if (!/^[a-z0-9](?:[a-z0-9_]{0,18}[a-z0-9])?$/.test(clean)) {
    return { valid: false, error: 'Username must use letters, numbers, or underscores, and cannot start/end with an underscore' };
  }
  if (!/[a-z]/.test(clean)) {
    return { valid: false, error: 'Username must contain at least one letter' };
  }
  if (RESERVED_USERNAMES.has(clean)) {
    return { valid: false, error: 'This username is reserved and cannot be claimed' };
  }
  return { valid: true };
}

export function validatePassword(
  password: string
): {
  valid: boolean;
  error?: string;
  score: number; // 0 to 4
  checks: { length: boolean; letter: boolean; number: boolean; special: boolean };
} {
  const length = password.length >= 8 && password.length <= 128;
  const letter = /[a-zA-Z]/.test(password);
  const number = /\d/.test(password);
  const special = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

  const checks = { length, letter, number, special };

  let score = 0;
  if (length) score += 1;
  if (letter && number) score += 2;
  else if (letter || number) score += 1;
  if (special) score += 1;

  if (!length) return { valid: false, error: 'Password must be at least 8 characters', score, checks };
  if (!letter || !number) return { valid: false, error: 'Password must contain both letters and numbers', score, checks };

  return { valid: true, score: Math.min(4, score), checks };
}

export const socialLinkSchema = z.object({
  platform: z.enum(['github', 'linkedin', 'twitter', 'instagram', 'website', 'email', 'other']),
  url: z.string().trim().url('Invalid URL format').max(2048).optional(),
  handle: z.string().trim().max(100).optional(),
  enabled: z.boolean().optional(),
  showEmail: z.boolean().optional(),
});

export const affiliationEnum = z.enum(['STUDENT', 'ALUMNI', 'VISITOR']);
export type AffiliationType = z.infer<typeof affiliationEnum>;

export const registrationSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username cannot exceed 20 characters')
      .regex(/^[a-z0-9](?:[a-z0-9_]{0,18}[a-z0-9])?$/, 'Username must start & end with alphanumeric characters and can contain underscores')
      .refine((u) => /[a-z]/.test(u), 'Username must contain at least one letter')
      .refine((u) => !RESERVED_USERNAMES.has(u), 'This username is reserved by the system'),
    email: z.string().trim().email('Invalid email address').max(254),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters')
      .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'Password must contain both letters and numbers'),
    affiliation: affiliationEnum.default('STUDENT'),
    
    // Academic fields (required for campus student)
    rollNumber: z.string().trim().max(50).optional().nullable(),
    branch: z.string().trim().max(100).optional().nullable(),
    batch: z.string().trim().max(100).optional().nullable(),
    
    // Alumni specific fields
    alumniBatch: z.string().trim().max(100).optional().nullable(),
    alumniDegree: z.string().trim().max(100).optional().nullable(),
    alumniOrganization: z.string().trim().max(150).optional().nullable(),
    alumniDesignation: z.string().trim().max(100).optional().nullable(),
    linkedAlumniProfileId: z.string().trim().max(100).optional().nullable(),

    // General author & social profile fields
    bio: z.string().trim().max(400).optional().nullable(),
    profilePhoto: z.string().trim().url().max(2048).or(z.literal('')).optional().nullable(),
    socialLinks: z.array(socialLinkSchema).max(10).default([]),
    readingInterests: z.array(z.string()).max(10).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.affiliation === 'STUDENT' && !data.rollNumber?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['rollNumber'],
        message: 'University Roll Number is required for campus students.',
      });
    }
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;