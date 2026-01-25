import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View, Text, ImageStyle } from 'react-native';
import { COLORS } from '../../constants/colors';

interface AvatarProps {
  uri?: string | null;
  size?: number;
  fallbackText?: string;
  style?: ImageStyle;
}

export const Avatar: React.FC<AvatarProps> = ({ uri, size = 72, fallbackText, style }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  if (!uri || hasError) {
    return (
      <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.placeholderText}>{fallbackText || '🙂'}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, style]}
      onError={() => setHasError(true)}
    />
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  placeholder: {
    backgroundColor: COLORS.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  placeholderText: {
    fontSize: 28,
    color: COLORS.textMuted,
  },
});
