// ParcelPilot Design System
export const theme = {
  colors: {
    // Primary colors
    primary: '#4CAF50', // Green primary
    secondary: '#66BB6A', // Light green
    tertiary: '#2E7D32', // Dark green
    
    // Background colors
    background: {
      primary: '#FFFFFF',
      secondary: '#F7F7F7',
      tertiary: '#EEEEEE',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    
    // Text colors
    text: {
      primary: '#000000',
      secondary: '#545454',
      tertiary: '#8E8E93',
      inverse: '#FFFFFF',
      disabled: '#C7C7CC',
    },
    
    // Accent colors
    accent: {
      success: '#4CAF50', // Green for success
      warning: '#FF9800',
      error: '#F44336',
      info: '#2196F3',
    },
    
    // Border colors
    border: {
      light: '#E8E8E8',
      medium: '#D1D1D6',
      dark: '#C7C7CC',
    },
    
    // Status colors
    status: {
      active: '#4CAF50',
      pending: '#9E9E9E',
      completed: '#2E7D32',
      cancelled: '#F44336',
    },
  },
  
  typography: {
    // Font families
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },
    
    // Font sizes
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 34,
      '5xl': 40,
    },
    
    // Line heights
    lineHeight: {
      tight: 1.1,
      snug: 1.2,
      normal: 1.4,
      relaxed: 1.6,
      loose: 2,
    },
    
    // Font weights
    fontWeight: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 64,
  },
  
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    full: 9999,
  },
  
  shadows: {
    none: {},
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      in: 'ease-in',
      out: 'ease-out',
      inOut: 'ease-in-out',
    },
  },
};

// Common styles
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  
  button: {
    primary: {
      backgroundColor: '#4CAF50',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    secondary: {
      backgroundColor: theme.colors.background.secondary,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
    },
    text: {
      primary: {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
      },
      secondary: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
      },
    },
  },
  
  card: {
    container: {
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      ...theme.shadows.sm,
    },
  },
  
  input: {
    container: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.primary,
    },
    focused: {
      borderWidth: 2,
      borderColor: '#4CAF50',
    },
  },
  
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginVertical: theme.spacing.md,
  },
};

export default theme;