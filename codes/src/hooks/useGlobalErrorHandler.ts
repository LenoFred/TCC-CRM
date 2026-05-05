/**
 * Global Error Handling Integration
 * Provides pre-configured error handler hooks for use throughout the app
 * Automatically includes user context and permission information in error messages
 * 
 * Usage in components:
 * const { handleError, handleApiError, handleSuccess } = useGlobalErrorHandler();
 * try { ... } catch (err) { handleError(err, { operation: 'fetch members' }); }
 */

import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useApiErrorHandler, 
  isAccessError, 
  isValidationError, 
  isNotFoundError,
  getErrorMessage 
} from '@/utils/apiErrorHandler';

/**
 * Context object for error tracking
 */
interface ErrorContext {
  operation?: string;
  resource?: string;
  action?: string;
  timestamp?: string;
}

/**
 * Enhanced error handler hook with app-specific context
 * Provides methods for handling different error types consistently
 */
export const useGlobalErrorHandler = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    handleError: handleApiError,
    handle403,
    handle404,
    handleValidation,
    handleSuccess
  } = useApiErrorHandler();

  /**
   * Handle any error with context
   * Automatically detects error type and provides appropriate message
   */
  const handleError = useCallback((
    error: any,
    context?: ErrorContext
  ) => {
    const enrichedContext = {
      ...context,
      timestamp: context?.timestamp || new Date().toISOString(),
      userId: user?.userId,
    };

    // Handle specific error types
    if (isAccessError(error)) {
      handle403(error, enrichedContext);
    } else if (isValidationError(error)) {
      handleValidation(getErrorMessage(error));
    } else if (isNotFoundError(error)) {
      handle404(error, enrichedContext);
    } else {
      handleApiError(error, enrichedContext);
    }

    // Log for debugging
    console.error('[Error Handler]', {
      error: getErrorMessage(error),
      context: enrichedContext,
      user: user?.userId,
    });
  }, [user, handleApiError, handle403, handle404, handleValidation]);

  /**
   * Handle API response errors
   * Specific for API calls that return error responses
   */
  const handleApiResponse = useCallback((
    response: any,
    context?: ErrorContext
  ) => {
    const error = new Error(
      response?.message || response?.error || 'API request failed'
    );
    (error as any).response = response;
    (error as any).status = response?.status;

    handleError(error, {
      ...context,
      operation: context?.operation || 'API request',
    });
  }, [handleError]);

  /**
   * Handle validation errors (form submission, input validation)
   */
  const handleValidationError = useCallback((
    message: string,
    field?: string
  ) => {
    const fullMessage = field 
      ? `${message} (Field: ${field})`
      : message;
    
    handleValidation(fullMessage);
  }, [handleValidation]);

  /**
   * Handle permission/access errors with context
   */
  const handleAccessError = useCallback((
    message?: string,
    context?: ErrorContext
  ) => {
    const error = new Error(
      message || 'You do not have permission to perform this action'
    );
    (error as any).status = 403;

    handle403(error, context);
  }, [handle403]);

  /**
   * Handle not found errors
   */
  const handleNotFoundError = useCallback((
    resource?: string,
    context?: ErrorContext
  ) => {
    const message = resource
      ? `${resource} was not found`
      : 'The requested resource was not found';
    
    const error = new Error(message);
    (error as any).status = 404;

    handle404(error, {
      ...context,
      resource,
    });
  }, [handle404]);

  /**
   * Handle success messages
   */
  const handleSuccess = useCallback((
    message: string,
    title: string = 'Success'
  ) => {
    toast({
      title,
      description: message,
      variant: 'default',
    });
  }, [toast]);

  /**
   * Handle warning messages
   */
  const handleWarning = useCallback((
    message: string,
    title: string = 'Warning'
  ) => {
    toast({
      title,
      description: message,
      variant: 'warning',
    });
  }, [toast]);

  /**
   * Handle info messages
   */
  const handleInfo = useCallback((
    message: string,
    title: string = 'Info'
  ) => {
    toast({
      title,
      description: message,
    });
  }, [toast]);

  return {
    // Main handlers
    handleError,
    handleApiResponse,
    handleApiError,
    
    // Specific error type handlers
    handleValidationError,
    handleAccessError,
    handleNotFoundError,
    
    // Success/notification handlers
    handleSuccess,
    handleWarning,
    handleInfo,
    
    // Error checking utilities
    isAccessError,
    isValidationError,
    isNotFoundError,
  };
};

/**
 * Wrapper hook for API calls with automatic error handling
 * Simplifies pattern of try-catch with error handling
 * 
 * Usage:
 * const { executeWithErrorHandling } = useApiCall();
 * const result = await executeWithErrorHandling(
 *   () => api.members.getAll(),
 *   { operation: 'fetch members' }
 * );
 */
export const useApiCall = () => {
  const { handleError } = useGlobalErrorHandler();

  /**
   * Execute a function with automatic error handling
   */
  const executeWithErrorHandling = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      context?: ErrorContext & { rethrow?: boolean }
    ): Promise<T | null> => {
      try {
        return await fn();
      } catch (error) {
        handleError(error, context);
        
        // Re-throw if requested (for component-level handling)
        if (context?.rethrow) {
          throw error;
        }
        
        return null;
      }
    },
    [handleError]
  );

  /**
   * Wrap a sync function with error handling
   */
  const executeSync = useCallback(
    <T,>(
      fn: () => T,
      context?: ErrorContext
    ): T | null => {
      try {
        return fn();
      } catch (error) {
        handleError(error, context);
        return null;
      }
    },
    [handleError]
  );

  return {
    executeWithErrorHandling,
    executeSync,
  };
};

/**
 * Error handling wrapper for form submissions
 * Provides structured error handling for form operations
 */
export const useFormErrorHandler = () => {
  const { 
    handleError,
    handleValidationError,
    handleAccessError,
    handleSuccess
  } = useGlobalErrorHandler();

  /**
   * Handle form submission with error handling
   */
  const handleFormSubmit = useCallback(
    async (
      onSubmit: (data: any) => Promise<any>,
      onSuccess?: (result: any) => void,
      formName?: string
    ) => {
      return async (data: any) => {
        try {
          const result = await onSubmit(data);
          handleSuccess(
            `${formName || 'Form'} submitted successfully`,
            'Success'
          );
          onSuccess?.(result);
          return result;
        } catch (error: any) {
          handleError(error, {
            operation: `submit ${formName || 'form'}`,
            action: 'form_submission',
          });
          throw error; // Re-throw for component handling
        }
      };
    },
    [handleError, handleSuccess]
  );

  /**
   * Validate field and handle error
   */
  const validateField = useCallback(
    (
      value: any,
      rules: Array<(val: any) => string | null>,
      fieldName: string
    ): boolean => {
      for (const rule of rules) {
        const error = rule(value);
        if (error) {
          handleValidationError(error, fieldName);
          return false;
        }
      }
      return true;
    },
    [handleValidationError]
  );

  return {
    handleFormSubmit,
    validateField,
    handleAccessError,
  };
};

/**
 * Global error boundary helper
 * Provides error logging and user-friendly messages for uncaught errors
 */
export const logError = (
  error: any,
  context?: ErrorContext & { severity?: 'error' | 'warning' | 'info' }
) => {
  const severity = context?.severity || 'error';
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    severity,
    message: getErrorMessage(error),
    context,
    stack: (error as any)?.stack,
  };

  console.error('[Global Error Logger]', logEntry);

  // In production, send to error tracking service
  // Example: Sentry.captureException(error, { tags: context });
};
