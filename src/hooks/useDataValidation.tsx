
import { useCallback } from 'react';
import { toast } from 'sonner';

interface ValidationRule<T> {
  field: keyof T;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'url' | 'date';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  errorCount: number;
}

export const useDataValidation = <T extends Record<string, any>>() => {
  const validateField = useCallback((
    value: any,
    rule: ValidationRule<T>
  ): string | null => {
    // Check if required
    if (rule.required && (value === null || value === undefined || value === '')) {
      return `${String(rule.field)} is required`;
    }

    // Skip validation if value is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return null;
    }

    // Type validation
    if (rule.type) {
      switch (rule.type) {
        case 'string':
          if (typeof value !== 'string') {
            return `${String(rule.field)} must be a string`;
          }
          break;
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            return `${String(rule.field)} must be a valid number`;
          }
          break;
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return `${String(rule.field)} must be a valid email address`;
          }
          break;
        case 'url':
          try {
            new URL(value);
          } catch {
            return `${String(rule.field)} must be a valid URL`;
          }
          break;
        case 'date':
          if (!(value instanceof Date) && isNaN(Date.parse(value))) {
            return `${String(rule.field)} must be a valid date`;
          }
          break;
      }
    }

    // Length validation for strings
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `${String(rule.field)} must be at least ${rule.minLength} characters long`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `${String(rule.field)} must be no more than ${rule.maxLength} characters long`;
      }
    }

    // Numeric range validation
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `${String(rule.field)} must be at least ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `${String(rule.field)} must be no more than ${rule.max}`;
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        return `${String(rule.field)} has invalid format`;
      }
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        return typeof customResult === 'string' ? customResult : `${String(rule.field)} is invalid`;
      }
    }

    return null;
  }, []);

  const validate = useCallback((
    data: T,
    rules: ValidationRule<T>[],
    options?: {
      showToasts?: boolean;
      stopOnFirstError?: boolean;
    }
  ): ValidationResult => {
    const errors: Record<string, string> = {};
    
    for (const rule of rules) {
      const value = data[rule.field];
      const error = validateField(value, rule);
      
      if (error) {
        errors[String(rule.field)] = error;
        
        if (options?.showToasts) {
          toast.error(error);
        }
        
        if (options?.stopOnFirstError) {
          break;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      errorCount: Object.keys(errors).length
    };
  }, [validateField]);

  const validateAsync = useCallback(async (
    data: T,
    rules: ValidationRule<T>[],
    options?: {
      showToasts?: boolean;
      stopOnFirstError?: boolean;
    }
  ): Promise<ValidationResult> => {
    // For now, just wrap sync validation in Promise
    // In the future, this could support async validation rules
    return Promise.resolve(validate(data, rules, options));
  }, [validate]);

  return {
    validate,
    validateAsync,
    validateField
  };
};

// Common validation rule presets
export const commonValidationRules = {
  email: (field: string): ValidationRule<any> => ({
    field: field as any,
    required: true,
    type: 'email'
  }),
  
  password: (field: string): ValidationRule<any> => ({
    field: field as any,
    required: true,
    type: 'string',
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    custom: (value: string) => {
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }
      return true;
    }
  }),
  
  name: (field: string): ValidationRule<any> => ({
    field: field as any,
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/
  }),
  
  url: (field: string): ValidationRule<any> => ({
    field: field as any,
    type: 'url'
  }),
  
  phoneNumber: (field: string): ValidationRule<any> => ({
    field: field as any,
    type: 'string',
    pattern: /^[\+]?[1-9][\d]{0,15}$/
  }),
  
  positiveNumber: (field: string): ValidationRule<any> => ({
    field: field as any,
    type: 'number',
    min: 0
  })
};
