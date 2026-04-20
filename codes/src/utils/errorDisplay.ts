/**
 * Error Display Utility
 * Standardizes error notification across the entire UI
 * Handles different error types (quota, validation, network, server)
 */

import { toast } from '@/components/ui/use-toast';

export const ErrorDisplay = {
  /**
   * Show generic error toast
   * @param {string} message - Error message to display
   * @param {string} title - Optional title
   */
  showError: (message, title = 'Error') => {
    toast({
      variant: 'destructive',
      title,
      description: message,
      duration: 5000,
    });
  },

  /**
   * Show success toast
   * @param {string} message - Success message to display
   */
  showSuccess: (message) => {
    toast({
      title: 'Success',
      description: message,
      duration: 3000,
    });
  },

  /**
   * Show warning toast
   * @param {string} message - Warning message to display
   */
  showWarning: (message) => {
    toast({
      title: 'Warning',
      description: message,
      variant: 'default',
      duration: 4000,
    });
  },

  /**
   * Show quota error with retry guidance
   * @param {Object} error - Error object from API
   */
  showQuotaError: (error) => {
    const retryAfterSeconds = error?.retryAfterSeconds || error?.quotaRetryAfterMs / 1000 || 60;
    const minutes = Math.ceil(retryAfterSeconds / 60);

    toast({
      variant: 'destructive',
      title: 'API Quota Exceeded',
      description: `The service is temporarily rate-limited. Please retry in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
      duration: 7000,
    });

    // Log quota error for monitoring
    console.warn('Quota Error:', {
      quotaErrorType: error?.quotaError,
      retryAfterSeconds,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Show validation error
   * @param {string|string[]} errors - Validation error(s)
   */
  showValidationError: (errors) => {
    const errorList = Array.isArray(errors) ? errors : [errors];
    const description = errorList.length === 1
      ? errorList[0]
      : `${errorList.length} validation errors found:\n${errorList.map(e => `• ${e}`).join('\n')}`;

    toast({
      variant: 'destructive',
      title: 'Validation Error',
      description,
      duration: 5000,
    });
  },

  /**
   * Show network error with helpful guidance
   * @param {Error} error - Network error object
   */
  showNetworkError: (error) => {
    const errorCode = error?.response?.status;
    let title = 'Network Error';
    let description = 'Unable to connect to server. Please check your internet connection.';

    if (errorCode === 409) {
      title = 'Conflict';
      description = error?.response?.data?.message || 'This resource already exists.';
    } else if (errorCode === 403) {
      title = 'Access Denied';
      description = error?.response?.data?.message || 'You do not have permission to perform this action.';
    } else if (errorCode === 404) {
      title = 'Not Found';
      description = error?.response?.data?.message || 'The requested resource was not found.';
    } else if (errorCode === 400) {
      title = 'Bad Request';
      description = error?.response?.data?.message || 'The request contains invalid data.';
    } else if (errorCode === 500 || errorCode === 502 || errorCode === 503) {
      title = 'Server Error';
      description = 'The server is experiencing issues. Please try again later.';
    }

    toast({
      variant: 'destructive',
      title,
      description,
      duration: 6000,
    });

    // Log network error for debugging
    console.error('Network Error:', {
      status: errorCode,
      message: error?.message,
      url: error?.config?.url,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Show bulk operation error summary
   * @param {Object} results - API response results object
   */
  showBulkOperationResults: (results) => {
    if (results.quotaErrors && results.quotaErrors.length > 0) {
      // Show quota error prominently
      const retryAfterSeconds = results.retryAfterSeconds || 60;
      const minutes = Math.ceil(retryAfterSeconds / 60);

      toast({
        variant: 'destructive',
        title: `API Rate Limit: ${results.quotaErrors.length} recipient(s) affected`,
        description: `Retry in ${minutes} minute${minutes > 1 ? 's' : ''}. Successfully sent to ${results.sent} recipient(s).`,
        duration: 8000,
      });

      return; // Show quota error as primary message
    }

    if (results.failed && results.failed.length > 0) {
      const failureRate = Math.round((results.failed.length / results.total) * 100);

      if (failureRate >= 50) {
        // More than 50% failed - show as error
        toast({
          variant: 'destructive',
          title: `${failureRate}% of messages failed`,
          description: `Sent: ${results.sent}/${results.total}. ${results.failed.length} failed.`,
          duration: 6000,
        });
      } else {
        // Less than 50% failed - show as warning
        toast({
          title: 'Partial Success',
          description: `Sent: ${results.sent}/${results.total} messages. ${results.failed.length} failed.`,
          variant: 'default',
          duration: 5000,
        });
      }
    } else if (results.sent === results.total) {
      // All succeeded
      toast({
        title: 'Success',
        description: `All ${results.total} message(s) sent successfully.`,
        duration: 3000,
      });
    }
  },

  /**
   * Handle API error response and show appropriate toast
   * @param {Error} error - Error from API call
   * @param {string} context - Context for error (e.g., "sending message")
   */
  handleApiError: (error, context = 'Operation') => {
    const errorData = error?.response?.data;
    const status = error?.response?.status;

    // Check for quota error
    if (errorData?.quotaError || status === 429) {
      ErrorDisplay.showQuotaError(errorData);
      return;
    }

    // Check for specific error messages
    if (errorData?.message) {
      // Check if it's a duplicate member error
      if (errorData.message.includes('already exists')) {
        ErrorDisplay.showWarning(errorData.message);
        return;
      }

      // Generic API error
      ErrorDisplay.showError(errorData.message, 'Error');
      return;
    }

    // Check for validation errors (array format)
    if (errorData?.errors && Array.isArray(errorData.errors)) {
      ErrorDisplay.showValidationError(errorData.errors);
      return;
    }

    // Network error
    ErrorDisplay.showNetworkError(error);
  },
};

export default ErrorDisplay;
