import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { SpecialHomeScreen } from './SpecialHomeScreen';
import { WorkoutScreen } from './WorkoutScreen';
import { DietScreen } from './DietScreen';

type TabKey = 'home' | 'workout' | 'diet';

export const SpecialAreaScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  const content = useMemo(() => {
    if (activeTab === 'workout') {
      return <WorkoutScreen onBackToResumo={() => setActiveTab('home')} />;
    }
    if (activeTab === 'diet') {
      return <DietScreen onBackToResumo={() => setActiveTab('home')} />;
    }
    return <SpecialHomeScreen onGoToTreino={() => setActiveTab('workout')} />;
  }, [activeTab]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>{content}</View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.goBack()}>
          <Text style={styles.tabLabel}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'workout' && styles.tabItemActive]}
          onPress={() => setActiveTab('workout')}>
          <Text style={[styles.tabLabel, activeTab === 'workout' && styles.tabLabelActive]}>
            Treino
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'diet' && styles.tabItemActive]}
          onPress={() => setActiveTab('diet')}>
          <Text style={[styles.tabLabel, activeTab === 'diet' && styles.tabLabelActive]}>Dieta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingBottom: 80,
  },
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundCard,
    height: 64,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabItemActive: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    marginHorizontal: 6,
    height: 48,
  },
  tabLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
});
