import { useState } from 'react';
import { z } from 'zod'; // Adicionar este import

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
}

export const useValidation = () => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validate = async <T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): Promise<ValidationResult<T>> => {
    setIsValidating(true);
    setErrors([]);

    try {
      const validatedData = await schema.parseAsync(data);
      setIsValidating(false);
      return {
        success: true,
        data: validatedData,
        errors: []
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        setErrors(validationErrors);
        setIsValidating(false);
        
        return {
          success: false,
          errors: validationErrors
        };
      }
      
      // Erro inesperado
      const unexpectedError: ValidationError[] = [{
        field: 'general',
        message: 'Erro inesperado na validação'
      }];
      
      setErrors(unexpectedError);
      setIsValidating(false);
      
      return {
        success: false,
        errors: unexpectedError
      };
    }
  };

  const validateSync = <T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): ValidationResult<T> => {
    setErrors([]);

    try {
      const validatedData = schema.parse(data);
      return {
        success: true,
        data: validatedData,
        errors: []
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        setErrors(validationErrors);
        
        return {
          success: false,
          errors: validationErrors
        };
      }
      
      const unexpectedError: ValidationError[] = [{
        field: 'general',
        message: 'Erro inesperado na validação'
      }];
      
      setErrors(unexpectedError);
      
      return {
        success: false,
        errors: unexpectedError
      };
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    const error = errors.find(err => err.field === fieldName);
    return error?.message;
  };

  const hasFieldError = (fieldName: string): boolean => {
    return errors.some(err => err.field === fieldName);
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const clearFieldError = (fieldName: string) => {
    setErrors(prev => prev.filter(err => err.field !== fieldName));
  };

  return {
    validate,
    validateSync,
    errors,
    isValidating,
    getFieldError,
    hasFieldError,
    clearErrors,
    clearFieldError
  };
};