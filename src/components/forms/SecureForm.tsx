
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSecurity } from '@/hooks/useSecurityContext';

interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

interface SecureFormProps<T> {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'advisor' | 'founder';
  onSubmit?: (data: T) => Promise<void>;
  validateData?: (data: any) => ValidationResult<T>;
  className?: string;
}

export function SecureForm<T = any>({
  children,
  requiredRole,
  onSubmit,
  validateData,
  className = ''
}: SecureFormProps<T>) {
  const { user, session } = useAuth();
  const { userRole, canAccess } = useSecurity();

  // Check authentication
  if (!user || !session) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">Please log in to access this form.</p>
      </div>
    );
  }

  // Check role authorization
  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">You don't have permission to access this form.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!onSubmit || !validateData) return;

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const validation = validateData(data);
    
    // Type guard to check if validation failed
    if (!validation.success) {
      console.error('Validation errors:', validation.errors);
      return;
    }

    // Now TypeScript knows validation.data exists
    try {
      await onSubmit(validation.data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
}
