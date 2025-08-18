import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { theme } from '../utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  variant?: 'elevated' | 'outlined' | 'filled';
  onPress?: () => void;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'medium',
  variant = 'elevated',
  onPress,
  disabled = false
}) => {
  const paddingValue = {
    none: 0,
    small: theme.spacing.sm,
    medium: theme.spacing.lg,
    large: theme.spacing.xl,
  }[padding];

  const cardStyle = [
    styles.card,
    styles[`${variant}Card`],
    { padding: paddingValue },
    disabled && styles.disabled,
    style
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    marginVertical: theme.spacing.sm,
  },
  elevatedCard: {
    ...theme.shadows.sm,
  },
  outlinedCard: {
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  filledCard: {
    backgroundColor: theme.colors.background.secondary,
  },
  disabled: {
    opacity: 0.6,
  },
});