// Input validation utilities for enhanced security

const MAX_INPUT_LENGTH = 1000;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
}

// Validate and sanitize chat input
export function validateChatInput(input: unknown): ValidationResult {
  // Type check
  if (typeof input !== 'string') {
    return {
      isValid: false,
      errors: ['Input must be a string']
    };
  }

  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { isValid: false, errors: ['Question cannot be empty'] };
  }

  // Hard bail-out before any regex work (defense-in-depth against ReDoS on pathological input).
  if (trimmed.length > MAX_INPUT_LENGTH) {
    return { isValid: false, errors: [`Question is too long (max ${MAX_INPUT_LENGTH} characters)`] };
  }

  const errors: string[] = [];

  // Rejection gate: detect presence of dangerous tags (not a sanitizer — input is never rendered as HTML).
  const dangerousPatterns = [
    /<script\b/gi,
    /<iframe\b/gi,
    /javascript:/gi,
    // \w and \s are disjoint classes so no backtracking ambiguity; input is capped to 1000 chars above.
    /on\w+\s*=/gi,
    /<object\b/gi,
    /<embed\b/gi,
    /<link\b/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      errors.push('Input contains potentially harmful content');
      break;
    }
  }

  // Basic profanity filter (extend as needed)
  const profanityPatterns: RegExp[] = [
    // Add patterns as needed
  ];

  for (const pattern of profanityPatterns) {
    if (pattern.test(trimmed.toLowerCase())) {
      errors.push('Input contains inappropriate content');
      break;
    }
  }

  // Sanitize by removing extra whitespace and normalizing
  const sanitized = trimmed
    .replace(/\s+/g, ' ')
    .slice(0, MAX_INPUT_LENGTH);

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined
  };
}

// Validate session ID format
export function validateSessionId(sessionId: unknown): boolean {
  if (typeof sessionId !== 'string') {
    return false;
  }

  // Session ID should match our expected format: session_timestamp
  const sessionPattern = /^session_\d{13,}$/;
  return sessionPattern.test(sessionId);
}

// Sanitize output to prevent XSS in responses
export function sanitizeOutput(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
} 