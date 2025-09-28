// Security utilities for iKasiLink
// Provides input validation, sanitization, and security headers

import DOMPurify from 'dompurify';

export interface SecurityConfig {
  maxInputLength: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  rateLimitWindow: number;
  rateLimitMax: number;
}

export const defaultSecurityConfig: SecurityConfig = {
  maxInputLength: 10000,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100
};

// Input sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// HTML sanitization using DOMPurify
export function sanitizeHTML(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'a'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false
  });
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Phone number validation (South African format)
export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid South African phone number
  // +27XXXXXXXXX or 0XXXXXXXXX
  const saPhoneRegex = /^(27|0)[0-9]{9}$/;
  return saPhoneRegex.test(cleaned);
}

// Password validation
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// File validation
export function validateFile(file: File, config: SecurityConfig = defaultSecurityConfig): {
  isValid: boolean;
  error?: string;
} {
  // Check file size
  if (file.size > config.maxFileSize) {
    return {
      isValid: false,
      error: `File size exceeds ${config.maxFileSize / (1024 * 1024)}MB limit`
    };
  }
  
  // Check file type
  if (!config.allowedFileTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`
    };
  }
  
  // Check file name for potentially dangerous characters
  const dangerousChars = /[<>:"/\\|?*]/;
  if (dangerousChars.test(file.name)) {
    return {
      isValid: false,
      error: 'File name contains invalid characters'
    };
  }
  
  return { isValid: true };
}

// Rate limiting
class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    // Check if under the limit
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  getRemainingTime(identifier: string): number {
    const requests = this.requests.get(identifier) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

export const rateLimiter = new RateLimiter(
  defaultSecurityConfig.rateLimitWindow,
  defaultSecurityConfig.rateLimitMax
);

// Content Security Policy headers
export const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.ikasilink.co.za wss://api.ikasilink.co.za",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
};

// SQL injection prevention (basic)
export function sanitizeSQL(input: string): string {
  return input
    .replace(/['";]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment starts
    .replace(/\*\//g, '') // Remove block comment ends
    .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, ''); // Remove SQL keywords
}

// XSS prevention
export function escapeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// URL validation
export function validateURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Safe redirect utility
export function safeRedirect(url: string, fallback: string = '/'): string {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  // Only allow relative URLs or same-origin URLs
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) {
      return fallback;
    }
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}

// Input length validation
export function validateInputLength(input: string, maxLength: number = defaultSecurityConfig.maxInputLength): boolean {
  return typeof input === 'string' && input.length <= maxLength;
}

// Content moderation helpers
export function containsProfanity(text: string): boolean {
  // Basic profanity filter (in production, use a proper service)
  const profanityWords = [
    // Add profanity words here
  ];
  
  const normalizedText = text.toLowerCase();
  return profanityWords.some(word => normalizedText.includes(word));
}

export function containsSpam(text: string): boolean {
  // Basic spam detection
  const spamPatterns = [
    /free money/i,
    /click here/i,
    /limited time/i,
    /act now/i,
    /call now/i,
    /www\./i,
    /http:\/\/|https:\/\//i
  ];
  
  return spamPatterns.some(pattern => pattern.test(text));
}

// Security audit logging
export function logSecurityEvent(event: string, details: any): void {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  console.warn('Security Event:', logData);
  
  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToSecurityService(logData)
  }
}
