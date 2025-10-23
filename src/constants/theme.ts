export const theme = {
  colors: {
    primary: '#f4511e',
    secondary: '#2196F3',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    border: '#dddddd',
    error: '#ff3b30',
    success: '#34c759',
    warning: '#ffcc00',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      fontFamily: 'Poppins-Bold',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
      fontFamily: 'Poppins-Bold',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      fontFamily: 'Poppins-SemiBold',
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal',
      fontFamily: 'Poppins-Regular',
    },
    caption: {
      fontSize: 14,
      fontWeight: 'normal',
      fontFamily: 'Poppins-Regular',
    },
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
  },
} as const;

export type Theme = typeof theme; 