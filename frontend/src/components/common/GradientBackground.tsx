import React, { ReactNode, useEffect, useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getTimeGradientColors } from '../../utils/timeGradient';

interface GradientBackgroundProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({ children, style }) => {
  const [colors, setColors] = useState<string[]>(getTimeGradientColors());

  useEffect(() => {
    const interval = setInterval(() => {
      setColors(getTimeGradientColors());
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <LinearGradient colors={colors} style={[styles.container, style]}>
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
