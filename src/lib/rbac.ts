// src/lib/rbac.ts

export type Role =
  | 'COORDINATOR'
  | 'TECH_LEAD'
  | 'CONTENT_LEAD'
  | 'PR_HEAD'
  | 'OPERATIONS_HEAD'
  | 'TREASURER'
  | 'MEMBER'
  | 'ALUMNI'
  | 'VISITOR';

export const PERMISSIONS = {
  MANAGE_ROLES: ['COORDINATOR'],
  MANAGE_MEMBERS: ['COORDINATOR', 'TECH_LEAD'],
  MANAGE_ALUMNI: ['COORDINATOR', 'TECH_LEAD', 'PR_HEAD'],
  MANAGE_SHELF_LIBRARY: ['COORDINATOR', 'TECH_LEAD'],
  MANAGE_GALLERY: ['COORDINATOR', 'TECH_LEAD', 'PR_HEAD'],
  MANAGE_ACHIEVEMENTS: ['COORDINATOR', 'TECH_LEAD', 'PR_HEAD'],
  MANAGE_OPERATIONS: ['COORDINATOR', 'TECH_LEAD'],
  MANAGE_HOMEPAGE_CMS: ['COORDINATOR', 'TECH_LEAD'],
  VIEW_ADMIN_EVENTS: ['COORDINATOR', 'TECH_LEAD', 'TREASURER', 'PR_HEAD'],
  MANAGE_EVENTS: ['COORDINATOR', 'TECH_LEAD'],
  VERIFY_PAYMENTS: ['COORDINATOR', 'TREASURER'],
  EDIT_REGISTRATIONS: ['COORDINATOR', 'TECH_LEAD', 'TREASURER'],
  MODERATE_PUBLICATIONS: ['COORDINATOR', 'TECH_LEAD', 'CONTENT_LEAD'],
  PUBLISH_CONTENT: ['COORDINATOR', 'TECH_LEAD', 'CONTENT_LEAD', 'PR_HEAD', 'MEMBER', 'ALUMNI'],
  INTERACT: ['COORDINATOR', 'TECH_LEAD', 'CONTENT_LEAD', 'PR_HEAD', 'TREASURER', 'MEMBER', 'ALUMNI', 'VISITOR'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export const hasPermission = (role: string | undefined | null, perm: Permission): boolean => {
  if (!role) return false;
  return (PERMISSIONS[perm] as readonly string[]).includes(role);
};

export const STAFF_ROLES: Role[] = [
  'COORDINATOR',
  'TECH_LEAD',
  'CONTENT_LEAD',
  'PR_HEAD',
  'OPERATIONS_HEAD',
  'TREASURER',
];

export const isStaff = (role: string | undefined | null): boolean => {
  if (!role) return false;
  return (STAFF_ROLES as readonly string[]).includes(role);
};

export const formatRole = (
  role?: string | null,
  user?: { branch?: string | null; batch?: string | null; rollNumber?: string | null } | null
): string => {
  if (!role) return '';
  if (role === 'VISITOR') {
    if (user?.branch || user?.batch || user?.rollNumber) {
      return 'Student';
    }
    return 'Visitor';
  }
  const mapping: Record<string, string> = {
    COORDINATOR: 'Coordinator',
    TECH_LEAD: 'Tech Lead',
    CONTENT_LEAD: 'Content Lead',
    PR_HEAD: 'PR Head',
    OPERATIONS_HEAD: 'Operations Head',
    TREASURER: 'Treasurer',
    MEMBER: 'Member',
    ALUMNI: 'Alumni',
    VISITOR: 'Visitor',
  };
  return mapping[role] || role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

