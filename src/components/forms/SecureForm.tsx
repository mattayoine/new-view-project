
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Shield, CheckCircle } from 'lucide-react';
import { validateAndSanitize } from '@/utils/validation';
import { z } from 'zod';

interface SecureFormProps<T> {
  title: string;
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void>;
  children: React.ReactNode;
  submitText?: string;
  sanitizers?: Record<string, (value: any) => any>;
}

export const SecureForm = <T,>({
  title,
  schema,
  onSubmit,
  children,
  submitText = 'Submit',
  sanitizers
}: SecureFormProps<T>) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());

      // Validate and sanitize data
      const validation = validateAndSanitize(data, schema, sanitizers);
      
      if (!validation.success) {
        setErrors(validation.errors);
        return;
      }

      await onSubmit(validation.data);
      setSuccess(true);
      
      // Reset form after successful submission
      (e.target as HTMLFormElement).reset();
      
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors(['An error occurred while submitting the form. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {children}

          {errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Validation Errors</h4>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-green-800">Form submitted successfully!</p>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : submitText}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
