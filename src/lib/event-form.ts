// src/lib/event-form.ts
import { type FormFieldDefinition } from '@/components/admin/FormBuilderFieldCard';

export interface StandardFieldConfig {
  nameRequired: boolean;
  nameLabel: string;
  namePlaceholder: string;
  emailRequired: boolean;
  emailLabel: string;
  emailPlaceholder: string;
  phoneRequired: boolean;
  phoneLabel: string;
  phonePlaceholder: string;
}

export interface EventFormConfig {
  access: string;
  inclusions: string;
  isOnHold?: boolean;
  holdReason?: string;
  volumeIssueLabel?: string;
  passPrefix?: string;
  standardFields: StandardFieldConfig;
  fields: FormFieldDefinition[];
}

export const ACCESS_PRESETS = [
  'ALL STUDENTS & MEMBERS',
  '1ST YEAR STUDENTS',
  '2ND YEAR STUDENTS',
  '3RD & 4TH YEAR STUDENTS',
  '1ST & 2ND YEAR STUDENTS',
  'EXCELSIOR MEMBERS ONLY',
  'OPEN TO ALL (PUBLIC)',
  'FACULTY & STUDENTS',
  'COLLEGE STUDENTS ONLY',
  'INTER-COLLEGE PARTICIPANTS',
] as const;

export const INCLUSION_PRESETS = [
  'CERTIFICATE & KIT',
  'PRIZE POOL & PASS',
  'CERTIFICATE OF PARTICIPATION',
  'FOOD & REFRESHMENTS',
  'SWAG & MERCHANDISE',
  'WORKSHOP ACCESS & CERTIFICATE',
  'NETWORKING LUNCH & GOODIES',
  'MEMENTO & HIGH TEA',
  'ACCESS PASS ONLY',
] as const;

export const DEFAULT_STANDARD_FIELDS: StandardFieldConfig = {
  nameRequired: true,
  nameLabel: 'Full Name',
  namePlaceholder: 'e.g. John Doe',
  emailRequired: true,
  emailLabel: 'Email Address',
  emailPlaceholder: 'e.g. john@example.com',
  phoneRequired: true,
  phoneLabel: 'WhatsApp / Phone Number',
  phonePlaceholder: '+91 98765 43210',
};

export const DEFAULT_EVENT_FORM_CONFIG: EventFormConfig = {
  access: 'ALL STUDENTS & MEMBERS',
  inclusions: 'CERTIFICATE & KIT',
  isOnHold: false,
  holdReason: '',
  standardFields: DEFAULT_STANDARD_FIELDS,
  fields: [],
};

/**
 * Safely normalizes and parses `customFormFields` JSON column from DB.
 * Handles both legacy array payloads and new structured EventFormConfig objects.
 */
export function parseEventFormConfig(raw: unknown, isCompetition = false): EventFormConfig {
  const defaultInclusion = isCompetition ? 'PRIZE POOL & PASS' : 'CERTIFICATE & KIT';

  if (!raw) {
    return {
      access: 'ALL STUDENTS & MEMBERS',
      inclusions: defaultInclusion,
      isOnHold: false,
      holdReason: '',
      standardFields: { ...DEFAULT_STANDARD_FIELDS },
      fields: [],
    };
  }

  // Legacy format where customFormFields was just FormFieldDefinition[]
  if (Array.isArray(raw)) {
    return {
      access: 'ALL STUDENTS & MEMBERS',
      inclusions: defaultInclusion,
      isOnHold: false,
      holdReason: '',
      standardFields: { ...DEFAULT_STANDARD_FIELDS },
      fields: raw as FormFieldDefinition[],
    };
  }

  // Structured object format
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, any>;
    const standard = obj.standardFields || {};

    return {
      access: typeof obj.access === 'string' && obj.access.trim() ? obj.access.trim() : 'ALL STUDENTS & MEMBERS',
      inclusions: typeof obj.inclusions === 'string' && obj.inclusions.trim() ? obj.inclusions.trim() : defaultInclusion,
      isOnHold: Boolean(obj.isOnHold),
      holdReason: typeof obj.holdReason === 'string' ? obj.holdReason.trim() : '',
      volumeIssueLabel: typeof obj.volumeIssueLabel === 'string' ? obj.volumeIssueLabel.trim() : '',
      passPrefix: typeof obj.passPrefix === 'string' ? obj.passPrefix.trim() : '',
      standardFields: {
        nameRequired: standard.nameRequired !== false,
        nameLabel: typeof standard.nameLabel === 'string' && standard.nameLabel.trim() ? standard.nameLabel.trim() : DEFAULT_STANDARD_FIELDS.nameLabel,
        namePlaceholder: typeof standard.namePlaceholder === 'string' && standard.namePlaceholder.trim() ? standard.namePlaceholder.trim() : DEFAULT_STANDARD_FIELDS.namePlaceholder,
        emailRequired: standard.emailRequired !== false,
        emailLabel: typeof standard.emailLabel === 'string' && standard.emailLabel.trim() ? standard.emailLabel.trim() : DEFAULT_STANDARD_FIELDS.emailLabel,
        emailPlaceholder: typeof standard.emailPlaceholder === 'string' && standard.emailPlaceholder.trim() ? standard.emailPlaceholder.trim() : DEFAULT_STANDARD_FIELDS.emailPlaceholder,
        phoneRequired: standard.phoneRequired !== false,
        phoneLabel: typeof standard.phoneLabel === 'string' && standard.phoneLabel.trim() ? standard.phoneLabel.trim() : DEFAULT_STANDARD_FIELDS.phoneLabel,
        phonePlaceholder: typeof standard.phonePlaceholder === 'string' && standard.phonePlaceholder.trim() ? standard.phonePlaceholder.trim() : DEFAULT_STANDARD_FIELDS.phonePlaceholder,
      },
      fields: Array.isArray(obj.fields) ? (obj.fields as FormFieldDefinition[]) : [],
    };
  }

  return {
    access: 'ALL STUDENTS & MEMBERS',
    inclusions: defaultInclusion,
    isOnHold: false,
    holdReason: '',
    volumeIssueLabel: '',
    passPrefix: '',
    standardFields: { ...DEFAULT_STANDARD_FIELDS },
    fields: [],
  };
}

/**
 * Prepares the payload for saving to the Prisma Event.customFormFields column
 */
export function serializeEventFormConfig(config: EventFormConfig): Record<string, any> {
  return {
    access: config.access.trim() || 'ALL STUDENTS & MEMBERS',
    inclusions: config.inclusions.trim() || 'CERTIFICATE & KIT',
    isOnHold: Boolean(config.isOnHold),
    holdReason: (config.holdReason || '').trim(),
    volumeIssueLabel: (config.volumeIssueLabel || '').trim(),
    passPrefix: (config.passPrefix || '').trim(),
    standardFields: {
      nameRequired: config.standardFields.nameRequired,
      nameLabel: config.standardFields.nameLabel.trim() || DEFAULT_STANDARD_FIELDS.nameLabel,
      namePlaceholder: config.standardFields.namePlaceholder.trim() || DEFAULT_STANDARD_FIELDS.namePlaceholder,
      emailRequired: config.standardFields.emailRequired,
      emailLabel: config.standardFields.emailLabel.trim() || DEFAULT_STANDARD_FIELDS.emailLabel,
      emailPlaceholder: config.standardFields.emailPlaceholder.trim() || DEFAULT_STANDARD_FIELDS.emailPlaceholder,
      phoneRequired: config.standardFields.phoneRequired,
      phoneLabel: config.standardFields.phoneLabel.trim() || DEFAULT_STANDARD_FIELDS.phoneLabel,
      phonePlaceholder: config.standardFields.phonePlaceholder.trim() || DEFAULT_STANDARD_FIELDS.phonePlaceholder,
    },
    fields: config.fields.map((f) => ({
      id: f.id,
      label: f.label.trim(),
      name: f.name,
      type: f.type,
      required: f.required,
      ...(f.type === 'select' || f.type === 'multiselect'
        ? { options: (f.options || []).map((o) => o.trim()).filter(Boolean) }
        : {}),
    })),
  };
}
