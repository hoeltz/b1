// Basic error handling utilities (replacement for deleted complex errorHandler)
export const FIELD_STATES = {
  IDLE: 'idle',
  VALIDATING: 'validating',
  VALID: 'valid',
  INVALID: 'invalid'
};

export const getFieldStateColor = (state) => {
  switch (state) {
    case FIELD_STATES.VALID: return 'success';
    case FIELD_STATES.INVALID: return 'error';
    case FIELD_STATES.VALIDATING: return 'warning';
    default: return 'primary';
  }
};

export const getFieldStateIcon = (state) => {
  switch (state) {
    case FIELD_STATES.VALID: return '✓';
    case FIELD_STATES.INVALID: return '⚠';
    case FIELD_STATES.VALIDATING: return '⟳';
    default: return '';
  }
};

export const extendedValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  indonesianPhone: /^(?:\+?62|0)[8-9][0-9]{7,11}$/,
  indonesianTaxId: /^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/
};

export const freightValidationRules = {
  cargoValue: {
    min: 0,
    max: 1000000000
  }
};

// Simple form validation hook
export const useFormValidation = (initialValues, rules) => {
  const [values, setValues] = React.useState(initialValues || {});
  const [errors, setErrors] = React.useState({});
  const [fieldStates, setFieldStates] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateField = (name, value) => {
    const rule = rules[name];
    if (!rule) return true;

    if (rule.required && !value) {
      return rule.patternMessage || 'This field is required';
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.patternMessage || 'Invalid format';
    }

    if (rule.custom) {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        return customResult;
      }
    }

    return true;
  };

  const handleFieldChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setFieldStates(prev => ({ ...prev, [name]: FIELD_STATES.VALIDATING }));

    const validation = validateField(name, value);
    if (validation === true) {
      setErrors(prev => ({ ...prev, [name]: null }));
      setFieldStates(prev => ({ ...prev, [name]: FIELD_STATES.VALID }));
    } else {
      setErrors(prev => ({ ...prev, [name]: validation }));
      setFieldStates(prev => ({ ...prev, [name]: FIELD_STATES.INVALID }));
    }
  };

  const handleSubmit = async (onSubmit) => {
    setIsSubmitting(true);
    try {
      const formErrors = {};
      Object.keys(rules).forEach(name => {
        const validation = validateField(name, values[name]);
        if (validation !== true) {
          formErrors[name] = validation;
        }
      });

      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        Object.keys(formErrors).forEach(name => {
          setFieldStates(prev => ({ ...prev, [name]: FIELD_STATES.INVALID }));
        });
        return { success: false, errors: formErrors };
      }

      const result = await onSubmit(values);
      return { success: true, data: result };
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setValues(initialValues || {});
    setErrors({});
    setFieldStates({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    fieldStates,
    isSubmitting,
    handleFieldChange,
    handleSubmit,
    reset,
    setValues
  };
};