export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const DELIVERY_TYPES = {
  ROBOT: 'robot',
  DRONE: 'drone',
} as const;

export const SUPPORTED_LANGUAGES = {
  EN: 'en',
  ZH: 'zh',
} as const;

export const MAX_PACKAGE_WEIGHTS = {
  ROBOT: 10, // kg
  DRONE: 5,  // kg
} as const;

export const SERVICE_FEES = {
  STANDARD: 2.50,
  EXPRESS: 5.00,
  INSURANCE: 1.00,
} as const;

export const DELIVERY_TIME_RANGES = {
  ROBOT_STANDARD: '4-6 hours',
  ROBOT_EXPRESS: '2-3 hours',
  DRONE_STANDARD: '1-2 hours',
  DRONE_EXPRESS: '30-60 minutes',
} as const;

export const COLORS = {
  PRIMARY: '#007AFF',
  SECONDARY: '#F2F2F7',
  SUCCESS: '#34C759',
  WARNING: '#FF9500',
  ERROR: '#FF3B30',
  INFO: '#30B0C7',
  
  TEXT_PRIMARY: '#000000',
  TEXT_SECONDARY: '#666666',
  TEXT_TERTIARY: '#999999',
  
  BACKGROUND: '#F8F9FA',
  CARD_BACKGROUND: '#FFFFFF',
  BORDER: '#E5E5EA',
  
  STATUS_COLORS: {
    pending: '#FF9500',
    confirmed: '#007AFF',
    picked_up: '#5856D6',
    in_transit: '#30B0C7',
    delivered: '#34C759',
    cancelled: '#FF3B30',
  },
} as const;

export const DIMENSIONS = {
  HEADER_HEIGHT: 60,
  TAB_BAR_HEIGHT: 50,
  BUTTON_HEIGHT: 48,
  INPUT_HEIGHT: 48,
  
  PADDING: {
    SMALL: 8,
    MEDIUM: 16,
    LARGE: 24,
    EXTRA_LARGE: 32,
  },
  
  BORDER_RADIUS: {
    SMALL: 4,
    MEDIUM: 8,
    LARGE: 12,
    EXTRA_LARGE: 16,
  },
} as const;

export const FONTS = {
  SIZES: {
    EXTRA_SMALL: 12,
    SMALL: 14,
    MEDIUM: 16,
    LARGE: 18,
    EXTRA_LARGE: 20,
    TITLE: 24,
    LARGE_TITLE: 28,
    HERO: 32,
  },
  
  WEIGHTS: {
    LIGHT: '300',
    REGULAR: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
  },
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    GET_BY_ID: (id: string) => `/orders/${id}`,
    UPDATE_STATUS: (id: string) => `/orders/${id}/status`,
  },
  
  DELIVERY: {
    OPTIONS: '/delivery/options',
    RECOMMENDATIONS: '/delivery/recommendations',
  },
  
  TRACKING: {
    GET_INFO: (id: string) => `/tracking/${id}`,
  },
  
  SUPPORT: {
    TICKETS: '/support/tickets',
    FAQ: '/support/faq',
  },
} as const;

export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
  POSTAL_CODE_REGEX: /^[A-Za-z0-9\s\-]{3,10}$/,
  
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  ADDRESS_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 500,
} as const;