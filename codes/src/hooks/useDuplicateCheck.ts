/**
 * Hook for checking member duplicates
 * Provides real-time duplicate detection with helpful suggestions
 */

import { useState, useCallback } from 'react';
import { apiCall } from '@/config/api';

export const useDuplicateCheck = () => {
  const [duplicateStatus, setDuplicateStatus] = useState({
    exists: false,
    member: null,
    suggestion: null,
    action: null,
    isChecking: false,
    error: null,
  });

  /**
   * Check if member already exists
   * @param {string} firstName - First name to check
   * @param {string} phoneNumber - Phone number to check
   * @param {string} groupId - Optional group ID for context
   * @returns {Promise<Object>} - Duplicate check result
   */
  const checkDuplicate = useCallback(async (firstName, phoneNumber, groupId = null) => {
    if (!firstName || !phoneNumber) {
      setDuplicateStatus({
        exists: false,
        member: null,
        suggestion: null,
        action: null,
        isChecking: false,
        error: null,
      });
      return { exists: false };
    }

    setDuplicateStatus(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const response = await apiCall.post('/members/check-duplicate', {
        firstName: firstName.trim(),
        phoneNumber: phoneNumber.trim(),
        groupId: groupId || undefined,
      });

      const result = {
        exists: response.exists,
        member: response.member || null,
        suggestion: response.suggestion || null,
        action: response.action || null,
        isChecking: false,
        error: null,
      };

      setDuplicateStatus(result);
      return { exists: response.exists, ...response };
    } catch (error) {
      const errorMessage = error?.response?.data?.error || 'Failed to check for duplicates';
      const result = {
        exists: false,
        member: null,
        suggestion: null,
        action: null,
        isChecking: false,
        error: errorMessage,
      };

      setDuplicateStatus(result);
      return { exists: false, error: errorMessage };
    }
  }, []);

  /**
   * Clear duplicate status
   */
  const clear = useCallback(() => {
    setDuplicateStatus({
      exists: false,
      member: null,
      suggestion: null,
      action: null,
      isChecking: false,
      error: null,
    });
  }, []);

  return {
    duplicateStatus,
    checkDuplicate,
    clear,
  };
};

export default useDuplicateCheck;
