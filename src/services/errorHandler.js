// Error Handling Utility for FreightFlow Application
import React from 'react';

export class FreightFlowError extends Error {
  constructor(message, code = 'GENERIC_ERROR', details = null) {
    super(message);
    this.name = 'FreightFlowError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export const ERROR_CODES = {
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PHONE: 'INVALID_PHONE',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',

  // CRUD Operation Errors
  CREATE_FAILED: 'CREATE_FAILED',
  READ_FAILED: 'READ_FAILED',
  UPDATE_FAILED: 'UPDATE_FAILED',
  DELETE_FAILED: 'DELETE_FAILED',

  // Data Errors
  NOT_FOUND: 'NOT_FOUND',
  STORAGE_ERROR: 'STORAGE_ERROR',
  DATA_INTEGRITY_ERROR: 'DATA_INTEGRITY_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // Business Logic Errors
  INSUFFICIENT_CREDIT: 'INSUFFICIENT_CREDIT',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  DUPLICATE_DATA: 'DUPLICATE_DATA',

  // System Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};

export const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ERROR_CODES.REQUIRED_FIELD]: 'This field is required.',
  [ERROR_CODES.INVALID_FORMAT]: 'The format is invalid.',
  [ERROR_CODES.INVALID_EMAIL]: 'Please enter a valid email address.',
  [ERROR_CODES.INVALID_PHONE]: 'Please enter a valid phone number.',
  [ERROR_CODES.INVALID_DATE_RANGE]: 'The date range is invalid.',
  [ERROR_CODES.DUPLICATE_ENTRY]: 'This entry already exists.',
  [ERROR_CODES.NOT_FOUND]: 'The requested item was not found.',
  [ERROR_CODES.STORAGE_ERROR]: 'Failed to save data. Please try again.',
  [ERROR_CODES.DATA_INTEGRITY_ERROR]: 'Data integrity check failed.',
  [ERROR_CODES.QUOTA_EXCEEDED]: 'Maximum limit reached. Please remove some items first.',
  [ERROR_CODES.INSUFFICIENT_CREDIT]: 'Insufficient credit limit for this operation.',
  [ERROR_CODES.INVALID_STATUS_TRANSITION]: 'This status change is not allowed.',
  [ERROR_CODES.BUSINESS_RULE_VIOLATION]: 'This operation violates business rules.',
  [ERROR_CODES.DUPLICATE_DATA]: 'This data conflicts with existing records.',
  [ERROR_CODES.NETWORK_ERROR]: 'Network error occurred. Please check your connection.',
  [ERROR_CODES.PERMISSION_DENIED]: 'You do not have permission to perform this action.',
  [ERROR_CODES.SYSTEM_ERROR]: 'A system error occurred. Please contact support.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Operation timed out. Please try again.',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
  [ERROR_CODES.CREATE_FAILED]: 'Failed to create item. Please check your input and try again.',
  [ERROR_CODES.READ_FAILED]: 'Failed to load data. Please refresh the page.',
  [ERROR_CODES.UPDATE_FAILED]: 'Failed to update item. Please try again.',
  [ERROR_CODES.DELETE_FAILED]: 'Failed to delete item. Please try again.',
};

export const handleError = (error, context = '') => {
  console.error(`Error in ${context}:`, error);

  // If it's already a FreightFlowError, return as is
  if (error instanceof FreightFlowError) {
    return error;
  }

  // Handle localStorage errors
  if (error.message?.includes('localStorage')) {
    return new FreightFlowError(
      ERROR_MESSAGES[ERROR_CODES.STORAGE_ERROR],
      ERROR_CODES.STORAGE_ERROR,
      { originalError: error.message }
    );
  }

  // Handle validation errors
  if (error.message?.includes('required') || error.message?.includes('Invalid')) {
    return new FreightFlowError(
      error.message,
      ERROR_CODES.VALIDATION_ERROR,
      { originalError: error.message }
    );
  }

  // Default to system error
  return new FreightFlowError(
    ERROR_MESSAGES[ERROR_CODES.SYSTEM_ERROR],
    ERROR_CODES.SYSTEM_ERROR,
    { originalError: error.message, context }
  );
};

export const showErrorToast = (error, toastFunction) => {
  const freightFlowError = handleError(error);

  toastFunction({
    message: freightFlowError.message,
    type: 'error',
    duration: 5000,
  });
};

export const showSuccessToast = (message, toastFunction) => {
  toastFunction({
    message,
    type: 'success',
    duration: 3000,
  });
};

export const validateForm = (formData, validationRules) => {
  const errors = {};

  Object.keys(validationRules).forEach(field => {
    const value = formData[field];
    const rules = validationRules[field];

    // Check required
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[field] = `${field} is required`;
      return;
    }

    // Skip other validations if field is empty and not required
    if (!value && !rules.required) return;

    // Check minimum length
    if (rules.minLength && value.length < rules.minLength) {
      errors[field] = `${field} must be at least ${rules.minLength} characters`;
    }

    // Check maximum length
    if (rules.maxLength && value.length > rules.maxLength) {
      errors[field] = `${field} must be no more than ${rules.maxLength} characters`;
    }

    // Check pattern
    if (rules.pattern && !rules.pattern.test(value)) {
      errors[field] = rules.patternMessage || `${field} format is invalid`;
    }

    // Check custom validation
    if (rules.custom && typeof rules.custom === 'function') {
      const customResult = rules.custom(value);
      if (customResult !== true) {
        errors[field] = customResult || `${field} is invalid`;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const formatErrorMessage = (error) => {
  if (error instanceof FreightFlowError) {
    return error.message;
  }

  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

// Enhanced CRUD operation wrapper with error handling
export const withErrorHandling = (operation, context = '') => {
  return async (...args) => {
    try {
      const result = await operation(...args);
      return result;
    } catch (error) {
      const freightFlowError = handleError(error, context);
      console.error(`Error in ${context}:`, freightFlowError);
      throw freightFlowError;
    }
  };
};

// Validation utilities for common patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(\+62|62|0)[8-9][0-9]{7,11}$/,
  taxId: /^[0-9]{15}$/,
  currency: /^\d+(\.\d{1,2})?$/,
  trackingNumber: /^[A-Z0-9]{10,}$/,
  hsCode: /^\d{4}\.\d{2}\.\d{4}$/,
};

// Enhanced form validation with detailed error messages
export const validateField = (fieldName, value, rules) => {
  // Check required
  if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return `${fieldName} is required`;
  }

  // Skip other validations if field is empty and not required
  if (!value && !rules.required) return '';

  // Check minimum length
  if (rules.minLength && value.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`;
  }

  // Check maximum length
  if (rules.maxLength && value.length > rules.maxLength) {
    return `${fieldName} must be no more than ${rules.maxLength} characters`;
  }

  // Check pattern
  if (rules.pattern && !rules.pattern.test(value)) {
    return rules.patternMessage || `${fieldName} format is invalid`;
  }

  // Check custom validation
  if (rules.custom && typeof rules.custom === 'function') {
    const customResult = rules.custom(value);
    if (customResult !== true) {
      return customResult || `${fieldName} is invalid`;
    }
  }

  // Check against predefined patterns
  if (rules.patternType) {
    const pattern = validationPatterns[rules.patternType];
    if (pattern && !pattern.test(value)) {
      const patternMessages = {
        email: 'Please enter a valid email address',
        phone: 'Please enter a valid Indonesian phone number',
        taxId: 'Tax ID must be 15 digits',
        currency: 'Please enter a valid amount',
        trackingNumber: 'Tracking number must contain letters and numbers only',
        hsCode: 'HS Code must be in format: 1234.56.7890'
      };
      return patternMessages[rules.patternType] || `${fieldName} format is invalid`;
    }
  }

  return '';
};

// Batch validation for multiple fields
export const validateMultipleFields = (formData, validationRules) => {
  const errors = {};

  Object.keys(validationRules).forEach(field => {
    const error = validateField(field, formData[field], validationRules[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Error recovery utilities
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

// Safe operation wrapper that won't throw errors
export const safeOperation = (operation, fallback = null) => {
  return (...args) => {
    try {
      return operation(...args);
    } catch (error) {
      console.warn('Safe operation failed:', error);
      return fallback;
    }
  };
};

// Enhanced validation utilities for real-time form validation
export const FIELD_STATES = {
  IDLE: 'idle',
  VALIDATING: 'validating',
  VALID: 'valid',
  INVALID: 'invalid',
  WARNING: 'warning'
};

export const VALIDATION_MODES = {
  IMMEDIATE: 'immediate',
  ON_BLUR: 'onBlur',
  ON_CHANGE: 'onChange',
  ON_SUBMIT: 'onSubmit'
};

// Real-time field validation with state management
export const useFieldValidation = (initialValue = '', validationRules = {}, mode = VALIDATION_MODES.ON_BLUR) => {
  const [value, setValue] = React.useState(initialValue);
  const [state, setState] = React.useState(FIELD_STATES.IDLE);
  const [error, setError] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const debounceTimer = React.useRef(null);

  // Real-time validation function
  const validate = React.useCallback((val) => {
    if (!validationRules || Object.keys(validationRules).length === 0) {
      setState(FIELD_STATES.VALID);
      setError('');
      return;
    }

    const errorMessage = validateField('field', val, validationRules);
    const hasError = errorMessage.length > 0;

    if (hasError) {
      setState(FIELD_STATES.INVALID);
      setError(errorMessage);
    } else {
      setState(FIELD_STATES.VALID);
      setError('');
    }
  }, [validationRules]);

  // Handle value change with debouncing for real-time validation
  const handleChange = React.useCallback((newValue) => {
    setValue(newValue);
    setTouched(true);

    if (mode === VALIDATION_MODES.ON_CHANGE) {
      // Clear previous timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      setState(FIELD_STATES.VALIDATING);

      // Debounce validation to avoid excessive calls
      debounceTimer.current = setTimeout(() => {
        validate(newValue);
      }, 300);
    } else if (mode === VALIDATION_MODES.IMMEDIATE) {
      validate(newValue);
    }
  }, [mode, validate]);

  // Handle blur event
  const handleBlur = React.useCallback(() => {
    setTouched(true);
    if (mode === VALIDATION_MODES.ON_BLUR) {
      validate(value);
    }
  }, [value, mode, validate]);

  // Handle focus event
  const handleFocus = React.useCallback(() => {
    if (mode === VALIDATION_MODES.ON_BLUR && error) {
      setState(FIELD_STATES.IDLE);
      setError('');
    }
  }, [mode, error]);

  // Reset field state
  const reset = React.useCallback(() => {
    setValue(initialValue);
    setState(FIELD_STATES.IDLE);
    setError('');
    setTouched(false);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  }, [initialValue]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    value,
    state,
    error,
    touched,
    isValid: state === FIELD_STATES.VALID,
    hasError: state === FIELD_STATES.INVALID,
    isValidating: state === FIELD_STATES.VALIDATING,
    handleChange,
    handleBlur,
    handleFocus,
    reset,
    setValue
  };
};

// Form validation hook with real-time capabilities
export const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const [fieldStates, setFieldStates] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitCount, setSubmitCount] = React.useState(0);

  // Initialize field states
  React.useEffect(() => {
    const initialStates = {};
    Object.keys(validationRules).forEach(field => {
      initialStates[field] = FIELD_STATES.IDLE;
    });
    setFieldStates(initialStates);
  }, [validationRules]);

  // Handle field change
  const handleFieldChange = React.useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
      setFieldStates(prev => ({ ...prev, [field]: FIELD_STATES.IDLE }));
    }
  }, [errors]);

  // Handle field blur for validation
  const handleFieldBlur = React.useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    const rules = validationRules[field];
    if (rules) {
      setFieldStates(prev => ({ ...prev, [field]: FIELD_STATES.VALIDATING }));

      // Simulate async validation delay for better UX
      setTimeout(() => {
        const error = validateField(field, values[field], rules);
        setErrors(prev => ({ ...prev, [field]: error }));
        setFieldStates(prev => ({
          ...prev,
          [field]: error ? FIELD_STATES.INVALID : FIELD_STATES.VALID
        }));
      }, 200);
    }
  }, [validationRules, values]);

  // Validate entire form
  const validateForm = React.useCallback(() => {
    const validation = validateMultipleFields(values, validationRules);
    setErrors(validation.errors);

    // Update field states
    const newFieldStates = {};
    Object.keys(validationRules).forEach(field => {
      newFieldStates[field] = validation.errors[field] ? FIELD_STATES.INVALID : FIELD_STATES.VALID;
    });
    setFieldStates(newFieldStates);

    return validation;
  }, [values, validationRules]);

  // Handle form submission
  const handleSubmit = React.useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    setSubmitCount(prev => prev + 1);

    // Mark all fields as touched
    const allTouched = {};
    Object.keys(validationRules).forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    // Validate form using current values directly to avoid circular dependency
    const validation = validateMultipleFields(values, validationRules);

    // Update field states based on validation
    const newFieldStates = {};
    Object.keys(validationRules).forEach(field => {
      newFieldStates[field] = validation.errors[field] ? FIELD_STATES.INVALID : FIELD_STATES.VALID;
    });
    setFieldStates(newFieldStates);
    setErrors(validation.errors);

    if (validation.isValid) {
      try {
        await onSubmit(values);
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    } else {
      return { success: false, errors: validation.errors };
    }
  }, [values, validationRules]);

  // Reset form
  const reset = React.useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);

    const resetStates = {};
    Object.keys(validationRules).forEach(field => {
      resetStates[field] = FIELD_STATES.IDLE;
    });
    setFieldStates(resetStates);
  }, [initialValues, validationRules]);

  // Get field props for easy integration with form components
  const getFieldProps = React.useCallback((field) => {
    const rules = validationRules[field];
    return {
      name: field,
      value: values[field] || '',
      onChange: (e) => handleFieldChange(field, e.target.value),
      onBlur: () => handleFieldBlur(field),
      error: touched[field] && !!errors[field],
      helperText: touched[field] ? errors[field] : '',
      state: fieldStates[field] || FIELD_STATES.IDLE,
      required: rules?.required || false
    };
  }, [values, errors, touched, fieldStates, validationRules, handleFieldChange, handleFieldBlur]);

  return {
    values,
    errors,
    touched,
    fieldStates,
    isSubmitting,
    submitCount,
    isValid: Object.keys(errors).length === 0,
    hasErrors: Object.keys(errors).length > 0,
    handleFieldChange,
    handleFieldBlur,
    handleSubmit,
    validateForm,
    reset,
    getFieldProps,
    setValues
  };
};

// Visual feedback utilities
export const getFieldStateColor = (state) => {
  switch (state) {
    case FIELD_STATES.VALID:
      return 'success';
    case FIELD_STATES.INVALID:
      return 'error';
    case FIELD_STATES.WARNING:
      return 'warning';
    case FIELD_STATES.VALIDATING:
      return 'info';
    default:
      return 'primary';
  }
};

export const getFieldStateIcon = (state) => {
  switch (state) {
    case FIELD_STATES.VALID:
      return '✓';
    case FIELD_STATES.INVALID:
      return '⚠';
    case FIELD_STATES.WARNING:
      return '⚡';
    case FIELD_STATES.VALIDATING:
      return '⟳';
    default:
      return '';
  }
};

// Enhanced validation patterns for Indonesian business context
export const extendedValidationPatterns = {
  ...validationPatterns,
  // Indonesian phone: accepts +62XXXXXXXXX, 62XXXXXXXXX, or 0XXXXXXXXX (more flexible)
  indonesianPhone: /^(\+62|62|0)[1-9][0-9]{7,11}$/,
  // Indonesian NPWP: accepts XX.XXX.XXX.X-XXX.XXX format (15 digits with dots and dash)
  indonesianTaxId: /^([0-9]{2})\.([0-9]{3})\.([0-9]{3})\.([0-9]{1})\-([0-9]{3})\.([0-9]{3})$/,
  indonesianPostalCode: /^[0-9]{5}$/,
  businessRegistrationNumber: /^[0-9]{13}$/,
  invoiceNumber: /^[A-Z0-9]{3,4}-[0-9]{6,8}$/,
  containerNumber: /^[A-Z]{3}[UJMZ][0-9]{6}$/,
  billOfLading: /^[A-Z0-9]{12,15}$/,
  currency: {
    idr: /^\d+(\.\d{1,2})?$/,
    usd: /^\d+(\.\d{1,2})?$/,
    eur: /^\d+(\.\d{1,2})?$/,
    sgd: /^\d+(\.\d{1,2})?$/
  }
};

// Custom validation rules for freight/logistics industry
export const freightValidationRules = {
  weight: {
    pattern: /^\d+(\.\d{1,3})?$/,
    patternMessage: 'Weight must be a valid number (e.g., 1500.500 kg)',
    custom: (value) => {
      const num = parseFloat(value);
      if (num < 0) return 'Weight cannot be negative';
      if (num > 50000) return 'Weight cannot exceed 50,000 kg';
      return true;
    }
  },
  volume: {
    pattern: /^\d+(\.\d{1,3})?$/,
    patternMessage: 'Volume must be a valid number (e.g., 2.500 cbm)',
    custom: (value) => {
      const num = parseFloat(value);
      if (num < 0) return 'Volume cannot be negative';
      if (num > 1000) return 'Volume cannot exceed 1,000 cbm';
      return true;
    }
  },
  cargoValue: {
    pattern: /^\d+(\.\d{1,2})?$/,
    patternMessage: 'Cargo value must be a valid amount',
    custom: (value) => {
      const num = parseFloat(value);
      if (num < 0) return 'Value cannot be negative';
      if (num > 1000000000) return 'Value cannot exceed 1 billion IDR';
      return true;
    }
  },
  trackingNumber: {
    pattern: /^[A-Z0-9]{10,}$/,
    patternMessage: 'Tracking number must contain at least 10 alphanumeric characters'
  },
  hsCode: {
    pattern: /^\d{4}\.\d{2}\.\d{4}$/,
    patternMessage: 'HS Code must be in format: 1234.56.7890'
  }
};

export default {
  FreightFlowError,
  ERROR_CODES,
  ERROR_MESSAGES,
  handleError,
  showErrorToast,
  showSuccessToast,
  validateForm,
  formatErrorMessage,
  withErrorHandling,
  validationPatterns,
  validateField,
  validateMultipleFields,
  retryOperation,
  safeOperation,
  // Enhanced validation exports
  FIELD_STATES,
  VALIDATION_MODES,
  useFieldValidation,
  useFormValidation,
  getFieldStateColor,
  getFieldStateIcon,
  extendedValidationPatterns,
  freightValidationRules
};