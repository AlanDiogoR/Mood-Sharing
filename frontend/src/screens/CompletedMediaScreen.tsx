import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mediaService } from '../services/mediaService';
import { MediaItem, MediaType } from '../types';
import { COLORS } from '../constants/colors';
import { useTheme } from '../store/themeContext';

export const CompletedMediaScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<MediaType | 'all'>('all');

  const completedItems = useMemo(() => {
    const data = items.filter(item => item.completed);
    return filter === 'all' ? data : data.filter(item => item.type === filter);
  }, [items, filter]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await mediaService.list();
      if (response.success && response.data) {
        setItems(response.data);
      } else {
        Alert.alert('Erro', response.error || 'Não foi possível carregar a lista');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar itens');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const renderStars = (rating?: number | null) => {
    const value = typeof rating === 'number' ? rating : 0;
    return (
      <View style={styles.starsRow}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Ionicons
            key={index}
            name={value >= index + 1 ? 'star' : 'star-outline'}
            size={16}
            color={value >= index + 1 ? colors.primary : COLORS.textMuted}
          />
        ))}
        <Text style={styles.ratingValue}>{value.toFixed(1).replace('.0', '')}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: MediaItem }) => (
    <View style={styles.card}>
      <Text style={[styles.cardTitle, { color: colors.primary }]}>{item.title}</Text>
      <Text style={styles.cardSubtitle}>{item.type === 'movie' ? 'Filme' : 'Série'}</Text>
      {renderStars(item.rating)}
      {!!item.review && <Text style={styles.cardReview}>{item.review}</Text>}
    </View>
  );

  const renderHeader = () => (
    <View>
      <View style={[styles.header, { paddingTop: 20 + insets.top }]}>
        <Text style={styles.title}>Concluídos</Text>
      </View>
      <View style={styles.filterRow}>
        {(['all', 'movie', 'series'] as const).map(option => (
          <TouchableOpacity
            key={option}
            style={[
              styles.filterChip,
              filter === option && styles.filterChipActive,
              filter === option && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setFilter(option)}>
            <Text
              style={[
                styles.filterChipText,
                { color: colors.primary },
                filter === option && styles.filterChipTextActive,
              ]}>
              {option === 'all' ? 'Todos' : option === 'movie' ? 'Filmes' : 'Séries'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {!loading && completedItems.length === 0 && (
        <Text style={styles.emptyText}>Nenhum item concluído ainda.</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={completedItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 140,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#475569',
    fontSize: 13,
    marginBottom: 6,
  },
  cardReview: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 12,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    marginLeft: 6,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 16,
    color: COLORS.textSecondary,
  },
});
