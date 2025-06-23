
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check } from 'lucide-react';
import { z } from 'zod';

interface ValidatedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  schema: z.ZodSchema<string>;
  type?: 'text' | 'email' | 'url' | 'textarea';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  sanitizer?: (value: string) => string;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  value,
  onChange,
  schema,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  rows = 3,
  sanitizer
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const handleChange = (newValue: string) => {
    // Apply sanitizer if provided
    const sanitizedValue = sanitizer ? sanitizer(newValue) : newValue;
    onChange(sanitizedValue);

    // Validate on change
    try {
      schema.parse(sanitizedValue);
      setError(null);
      setIsValid(true);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message || 'Invalid input');
        setIsValid(false);
      }
    }
  };

  const inputClasses = `
    ${error ? 'border-red-500 focus:border-red-500' : ''}
    ${isValid ? 'border-green-500' : ''}
  `;

  const InputComponent = type === 'textarea' ? Textarea : Input;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {label}
        {required && <span className="text-red-500">*</span>}
        {isValid && <Check className="h-4 w-4 text-green-500" />}
        {error && <AlertCircle className="h-4 w-4 text-red-500" />}
      </Label>
      <InputComponent
        type={type === 'textarea' ? undefined : type}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={type === 'textarea' ? rows : undefined}
        className={inputClasses}
      />
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};
