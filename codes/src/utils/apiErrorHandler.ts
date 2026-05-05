/**
 * API Error Handler Utility
 * Unified error handling across all components with group context support
 * Provides consistent error messages and logging
 */

import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessibleGroups, formatGroupAccessDisplay } from '@/utils/permissionCache';
import { User } from '@/types';

export interface ApiErrorResponse {
  status?: number;
  message?: string;
  error?: string;
  details?: Record<string, any>;
}

export interface ErrorContext {
  operation?: string;
  resource?: string;
  userId?: string;
  timestamp?: string;
}

/**
 * Parse error response from API
 */
const parseErrorResponse = (error: any): ApiErrorResponse => {
  if (!error) {
    return { message: 'An unknown error occurred' };
  }

  // Handle response object from fetch/axios
  if (error.response) {
    return {
      status: error.response.status,
      message: error.response.data?.message || error.message,
      error: error.response.data?.error,
      details: error.response.data,
    };
  }

  // Handle error message string
  if (typeof error === 'string') {
    return { message: error };
  }

  // Handle Error object
  if (error instanceof Error) {
    return { message: error.message };
  }

  // Default
  return { message: String(error) };
};

/**
 * Build group context message for 403 errors
 */
const buildGroupContextMessage = (user: User | undefined): string => {
  if (!user) {
    return 'You need to be logged in to access this resource.';
  }

  const accessible = getAccessibleGroups(user);

  // Admin has full access
  if (accessible === null) {
    return '';
  }

  // No groups assigned
  if (!accessible || accessible.length === 0) {
    return 'You have not been assigned to any groups.';
  }

  // Show assigned groups
  return `Your assigned groups: ${accessible.join(', ')}`;
};

/**
 * Build error toast notification content
 */
const buildErrorNotification = (
  error: ApiErrorResponse,
  context?: ErrorContext,
  user?: User
): { title: string; description: string; variant: 'destructive' | 'default' } => {
  const status = error.status || 0;

  // Handle specific error codes
  switch (status) {
    case 403:
      const groupContext = buildGroupContextMessage(user);
      return {
        title: 'Access Denied',
        description: error.message || 'You do not have permission to perform this action.' +
          (groupContext ? ` ${groupContext}` : ''),
        variant: 'destructive',
      };

    case 401:
      return {
        title: 'Authentication Required',
        description: error.message || 'Your session has expired. Please log in again.',
        variant: 'destructive',
      };

    case 404:
      return {
        title: 'Not Found',
        description: error.message || `${context?.resource || 'The requested resource'} was not found.`,
        variant: 'destructive',
      };

    case 400:
      return {
        title: 'Invalid Request',
        description: error.message || 'Please check your input and try again.',
        variant: 'destructive',
      };

    case 409:
      return {
        title: 'Conflict',
        description: error.message || 'This action conflicts with existing data.',
        variant: 'destructive',
      };

    case 500:
      return {
        title: 'Server Error',
        description: error.message || 'An unexpected error occurred. Please try again later.',
        variant: 'destructive',
      };

    case 503:
      return {
        title: 'Service Unavailable',
        description: error.message || 'The service is temporarily unavailable. Please try again later.',
        variant: 'destructive',
      };

    default:
      return {
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      };
  }
};

/**
 * Log error for debugging and audit trail
 */
const logError = (error: ApiErrorResponse, context?: ErrorContext): void => {
  const logEntry = {
    timestamp: context?.timestamp || new Date().toISOString(),
    operation: context?.operation,
    resource: context?.resource,
    userId: context?.userId,
    status: error.status,
    message: error.message,
    error: error.error,
    fullError: error.details,
  };

  console.error('[API Error]', logEntry);

  // In production, you might send this to a logging service
  // Example: logToSentry(logEntry);
};

/**
 * Hook for unified error handling
 * Usage in components:
 * const { handleError } = useApiErrorHandler();
 * try { ... } catch (err) { handleError(err, { operation: 'fetch members' }); }
 */
export const useApiErrorHandler = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleError = (error: any, context?: ErrorContext): void => {
    const parsed = parseErrorResponse(error);
    const notification = buildErrorNotification(parsed, context, user);

    // Log for debugging
    logError(parsed, context);

    // Show toast
    toast({
      title: notification.title,
      description: notification.description,
      variant: notification.variant,
    });
  };

  const handle403 = (error: any, context?: ErrorContext): void => {
    const parsed = parseErrorResponse(error);

    // Ensure it's treated as 403
    if (parsed.status !== 403) {
      parsed.status = 403;
    }

    handleError(parsed, context);
  };

  const handle404 = (error: any, context?: ErrorContext): void => {
    const parsed = parseErrorResponse(error);

    // Ensure it's treated as 404
    if (parsed.status !== 404) {
      parsed.status = 404;
    }

    handleError(parsed, context);
  };

  const handleValidation = (message: string): void => {
    toast({
      title: 'Validation Error',
      description: message,
      variant: 'destructive',
    });
  };

  const handleSuccess = (message: string, title: string = 'Success'): void => {
    toast({
      title,
      description: message,
      variant: 'default',
    });
  };

  return {
    handleError,
    handle403,
    handle404,
    handleValidation,
    handleSuccess,
  };
};

/**
 * Standalone error handler (without hook)
 * Useful in utility functions or outside React components
 */
export const handleApiError = (
  error: any,
  onNotification?: (notification: { title: string; description: string }) => void,
  user?: User
): void => {
  const parsed = parseErrorResponse(error);
  const notification = buildErrorNotification(parsed, undefined, user);

  // Log for debugging
  logError(parsed);

  // Trigger notification callback if provided
  if (onNotification) {
    onNotification(notification);
  } else {
    console.error(notification);
  }
};

/**
 * Check if error is a permission/access error
 */
export const isAccessError = (error: any): boolean => {
  const parsed = parseErrorResponse(error);
  return parsed.status === 403 || parsed.status === 401;
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: any): boolean => {
  const parsed = parseErrorResponse(error);
  return parsed.status === 400 || error.message?.includes('validation');
};

/**
 * Check if error is a not found error
 */
export const isNotFoundError = (error: any): boolean => {
  const parsed = parseErrorResponse(error);
  return parsed.status === 404;
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: any): string => {
  const parsed = parseErrorResponse(error);
  return parsed.message || 'An unexpected error occurred';
};
