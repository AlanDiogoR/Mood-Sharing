import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { COLORS } from '../constants/colors';
import { MediaItem, MediaType } from '../types';
import { mediaService } from '../services/mediaService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../store/themeContext';

export const MediaScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<MediaType | 'all'>('all');

  const sortedItems = useMemo(() => {
    const hasManualOrder = items.some(item => item.orderIndex !== null && item.orderIndex !== undefined);
    const data = [...items];
    if (hasManualOrder) {
      data.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    } else {
      data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
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

  const handleStartCreate = () => {
    navigation.navigate('MediaForm' as never, { mode: 'create' } as never);
  };

  const handleEdit = (item: MediaItem) => {
    navigation.navigate('MediaForm' as never, { mode: 'edit', item } as never);
  };

  const handleDelete = (item: MediaItem) => {
    Alert.alert('Remover', `Deseja remover "${item.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const response = await mediaService.remove(item.id);
            if (response.success) {
              setItems(prev => prev.filter(current => current.id !== item.id));
            } else {
              Alert.alert('Erro', response.error || 'Não foi possível remover item');
            }
          } catch (error) {
            Alert.alert('Erro', 'Falha ao remover item');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleDragEnd = async (data: MediaItem[]) => {
    setItems(data);
    const orderedIds = data.map(item => item.id);
    const response = await mediaService.reorder(orderedIds);
    if (!response.success) {
      Alert.alert('Erro', response.error || 'Não foi possível reordenar');
      await loadItems();
    }
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<MediaItem>) => (
    <TouchableOpacity
      onLongPress={drag}
      disabled={isActive}
      style={[styles.card, isActive && styles.cardActive]}>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { color: colors.primary }, isActive && styles.cardTitleActive]}>
          {item.title}
        </Text>
        <Text style={[styles.cardSubtitle, isActive && styles.cardSubtitleActive]}>
          {item.type === 'movie' ? 'Filme' : 'Série'}
        </Text>
        {!!item.notes && (
          <Text style={[styles.cardNotes, isActive && styles.cardNotesActive]}>{item.notes}</Text>
        )}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
          <Text style={[styles.actionText, { color: colors.primary }, isActive && styles.actionTextActive]}>
            Editar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
          <Text
            style={[
              styles.actionText,
              { color: colors.primary },
              isActive && styles.actionTextActive,
              styles.deleteText,
            ]}>
            Remover
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      <View style={[styles.header, { paddingTop: 20 + insets.top }]}>
        <View>
          <Text style={styles.title}>Filmes e Séries</Text>
        </View>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleStartCreate}>
          <Text style={styles.addButtonText}>+ Adicionar</Text>
        </TouchableOpacity>
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

    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <DraggableFlatList
        data={sortedItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => handleDragEnd(data)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
      />
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardActive: {
    backgroundColor: '#E8F1FF',
    borderColor: '#A3BFFA',
  },
  cardInfo: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardTitleActive: {
    color: COLORS.primary,
  },
  cardSubtitle: {
    color: '#475569',
    fontSize: 13,
    marginBottom: 4,
  },
  cardSubtitleActive: {
    color: '#334155',
  },
  cardNotes: {
    color: '#64748B',
    fontSize: 12,
  },
  cardNotesActive: {
    color: '#475569',
  },
  cardActions: {
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  actionTextActive: {
    color: COLORS.primary,
  },
  deleteText: {
    color: COLORS.error,
  },
});
