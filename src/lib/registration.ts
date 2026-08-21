import { z } from 'zod';

export const socialLinkSchema = z.object({
  platform: z.enum(['github', 'linkedin', 'twitter', 'instagram', 'website', 'other']),
  url: z.string().trim().url('Invalid URL format').max(2048),
  handle: z.string().trim().max(100).optional(),
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
      .regex(/^[a-z0-9_]{3,20}$/, 'Username must be 3-20 lowercase alphanumeric characters or underscores'),
    email: z.string().trim().email('Invalid email address').max(254),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128),
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

    // General author & social profile fields
    bio: z.string().trim().max(400).optional().nullable(),
    profilePhoto: z.string().trim().url().max(2048).or(z.literal('')).optional().nullable(),
    socialLinks: z.array(socialLinkSchema).max(5).default([]),
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