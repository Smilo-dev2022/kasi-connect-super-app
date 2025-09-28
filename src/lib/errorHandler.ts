// Centralized error handling for iKasiLink
// Provides consistent error responses and logging

export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export class CustomError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly requestId?: string;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    details?: any,
    requestId?: string
  ) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, CustomError);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string, details?: any, requestId?: string) {
    super(message, 'VALIDATION_ERROR', 400, details, requestId);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication required', requestId?: string) {
    super(message, 'AUTHENTICATION_ERROR', 401, undefined, requestId);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Insufficient permissions', requestId?: string) {
    super(message, 'AUTHORIZATION_ERROR', 403, undefined, requestId);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found', requestId?: string) {
    super(message, 'NOT_FOUND_ERROR', 404, undefined, requestId);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict', details?: any, requestId?: string) {
    super(message, 'CONFLICT_ERROR', 409, details, requestId);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded', requestId?: string) {
    super(message, 'RATE_LIMIT_ERROR', 429, undefined, requestId);
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends CustomError {
  constructor(message: string = 'Service temporarily unavailable', requestId?: string) {
    super(message, 'SERVICE_UNAVAILABLE_ERROR', 503, undefined, requestId);
    this.name = 'ServiceUnavailableError';
  }
}

// Error handler for API responses
export function handleApiError(error: any): AppError {
  const timestamp = new Date().toISOString();
  
  if (error instanceof CustomError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      timestamp,
      requestId: error.requestId
    };
  }

  // Handle fetch API errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network connection failed',
      statusCode: 503,
      timestamp,
      details: { originalError: error.message }
    };
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return {
      code: 'VALIDATION_ERROR',
      message: error.message || 'Invalid input data',
      statusCode: 400,
      timestamp,
      details: error.details
    };
  }

  // Handle generic errors
  return {
    code: 'INTERNAL_ERROR',
    message: error.message || 'An unexpected error occurred',
    statusCode: 500,
    timestamp,
    details: process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
  };
}

// Async error wrapper for API calls
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`Error in ${context || 'operation'}:`, error);
    throw handleApiError(error);
  }
}

// Error boundary for React components
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ComponentType<{ error: AppError }> }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ fallback?: React.ComponentType<{ error: AppError }> }>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error: handleApiError(error)
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: AppError }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
        </div>
      </div>
      <div className="mt-2">
        <p className="text-sm text-gray-500">{error.message}</p>
        {error.details && process.env.NODE_ENV === 'development' && (
          <pre className="mt-2 text-xs text-gray-400 overflow-auto">
            {JSON.stringify(error.details, null, 2)}
          </pre>
        )}
      </div>
      <div className="mt-4">
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
);

// Utility functions for common error scenarios
export const createValidationError = (field: string, message: string) => 
  new ValidationError(`${field}: ${message}`, { field });

export const createNotFoundError = (resource: string, id: string) => 
  new NotFoundError(`${resource} with ID '${id}' not found`);

export const createConflictError = (resource: string, reason: string) => 
  new ConflictError(`${resource} conflict: ${reason}`);

// Logging utility
export function logError(error: AppError, context?: string) {
  const logData = {
    timestamp: error.timestamp,
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    requestId: error.requestId,
    context,
    details: error.details
  };

  if (error.statusCode >= 500) {
    console.error('Server Error:', logData);
  } else {
    console.warn('Client Error:', logData);
  }

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error)
  }
}
