export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

export const validateNumeric = (value: string): boolean => {
  return !isNaN(Number(value)) && value.trim() !== '';
};

export const validatePositiveNumber = (value: string): boolean => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

export const validatePostalCode = (postalCode: string): boolean => {
  // Basic postal code validation (can be extended for specific countries)
  const postalRegex = /^[A-Za-z0-9\s\-]{3,10}$/;
  return postalRegex.test(postalCode);
};

export interface ValidationError {
  field: string;
  message: string;
}

export const validateOrderStep1 = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Sender validation
  if (!validateRequired(data.sender?.name)) {
    errors.push({ field: 'senderName', message: 'Sender name is required' });
  }
  if (!validateRequired(data.sender?.address)) {
    errors.push({ field: 'senderAddress', message: 'Sender address is required' });
  }
  if (!validateRequired(data.sender?.city)) {
    errors.push({ field: 'senderCity', message: 'Sender city is required' });
  }
  if (!validatePhone(data.sender?.phone)) {
    errors.push({ field: 'senderPhone', message: 'Valid sender phone is required' });
  }

  // Recipient validation
  if (!validateRequired(data.recipient?.name)) {
    errors.push({ field: 'recipientName', message: 'Recipient name is required' });
  }
  if (!validateRequired(data.recipient?.address)) {
    errors.push({ field: 'recipientAddress', message: 'Recipient address is required' });
  }
  if (!validateRequired(data.recipient?.city)) {
    errors.push({ field: 'recipientCity', message: 'Recipient city is required' });
  }
  if (!validatePhone(data.recipient?.phone)) {
    errors.push({ field: 'recipientPhone', message: 'Valid recipient phone is required' });
  }

  // Parcel validation
  if (!validatePositiveNumber(data.parcel?.weight?.toString())) {
    errors.push({ field: 'weight', message: 'Valid weight is required' });
  }
  if (!validatePositiveNumber(data.parcel?.value?.toString())) {
    errors.push({ field: 'value', message: 'Valid package value is required' });
  }
  if (!validateRequired(data.parcel?.description)) {
    errors.push({ field: 'description', message: 'Package description is required' });
  }

  return errors;
};

export const validateUserRegistration = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!validateRequired(data.name)) {
    errors.push({ field: 'name', message: 'Name is required' });
  }
  if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }
  if (!validateMinLength(data.password, 6)) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
  }
  if (data.password !== data.confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
  }

  return errors;
};