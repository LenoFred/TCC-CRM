import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook for checking user permissions
 * Provides convenient methods to check various permission types
 */
export const usePermission = () => {
  const { checkPermission, user } = useAuth();
  const { toast } = useToast();

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permissionKey: string): boolean => {
    return checkPermission(permissionKey);
  };

  /**
   * Check if user can view a resource
   */
  const canView = (resource: string): boolean => {
    return checkPermission(`can_view_${resource}`);
  };

  /**
   * Check if user can create a resource
   */
  const canCreate = (resource: string): boolean => {
    return checkPermission(`can_create_${resource}`);
  };

  /**
   * Check if user can edit a resource
   */
  const canEdit = (resource: string): boolean => {
    return checkPermission(`can_edit_${resource}`);
  };

  /**
   * Check if user can delete a resource
   */
  const canDelete = (resource: string): boolean => {
    return checkPermission(`can_delete_${resource}`);
  };

  /**
   * Check if current user is an admin
   */
  const isAdmin = (): boolean => {
    return user?.role?.toLowerCase() === 'admin';
  };

  /**
   * Show unauthorized toast message
   */
  const showUnauthorizedMessage = (action: string, resource: string) => {
    toast({
      title: 'Access Denied',
      description: `You don't have permission to ${action} ${resource}.`,
      variant: 'destructive',
    });
  };

  /**
   * Check permission and show toast if denied
   * Returns true if allowed, false if denied
   */
  const checkAndNotify = (permissionKey: string, action: string, resource: string): boolean => {
    const allowed = checkPermission(permissionKey);
    
    if (!allowed) {
      showUnauthorizedMessage(action, resource);
    }
    
    return allowed;
  };

  return {
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    isAdmin,
    showUnauthorizedMessage,
    enforce: (permissionKey: string, action: string, resource: string) =>
      checkAndNotify(permissionKey, action, resource),
    checkAndNotify,
  };
};
