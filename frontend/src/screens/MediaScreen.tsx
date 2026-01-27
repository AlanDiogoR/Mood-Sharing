import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { COLORS } from '../constants/colors';
import { MediaItem, MediaType } from '../types';
import { mediaService } from '../services/mediaService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../store/themeContext';
import { Ionicons } from '@expo/vector-icons';

export const MediaScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<MediaType | 'all'>('all');
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const sortedItems = useMemo(() => {
    const pendingItems = items.filter(item => !item.completed);
    const hasManualOrder = items.some(item => item.orderIndex !== null && item.orderIndex !== undefined);
    const data = [...pendingItems];
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

  const handleOpenReview = (item: MediaItem) => {
    setSelectedItem(item);
    setRatingValue(typeof item.rating === 'number' ? item.rating : 0);
    setReviewText(item.review ?? '');
    setRatingModalVisible(true);
  };

  const handleCloseReview = () => {
    if (savingReview) {
      return;
    }
    setRatingModalVisible(false);
  };

  const handleSaveReview = async () => {
    if (!selectedItem) {
      return;
    }
    setSavingReview(true);
    try {
      const response = await mediaService.update(selectedItem.id, {
        rating: ratingValue,
        review: reviewText.trim() ? reviewText.trim() : null,
        completed: true,
      });
      if (response.success) {
        setRatingModalVisible(false);
        setSelectedItem(null);
        setRatingValue(0);
        setReviewText('');
        await loadItems();
      } else {
        Alert.alert('Erro', response.error || 'Não foi possível salvar a avaliação');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar avaliação');
    } finally {
      setSavingReview(false);
    }
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
      onPress={() => handleOpenReview(item)}
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
        <TouchableOpacity onPress={() => handleOpenReview(item)} style={styles.actionButton}>
          <Text style={[styles.actionText, { color: colors.primary }, isActive && styles.actionTextActive]}>
            Avaliar
          </Text>
        </TouchableOpacity>
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
      <Modal transparent visible={ratingModalVisible} animationType="fade" onRequestClose={handleCloseReview}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Avaliar</Text>
            {!!selectedItem && <Text style={styles.modalSubtitle}>{selectedItem.title}</Text>}
            <View style={styles.ratingRow}>
              <TouchableOpacity
                style={[
                  styles.ratingReset,
                  ratingValue === 0 && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setRatingValue(0)}>
                <Text style={[styles.ratingResetText, ratingValue === 0 && styles.ratingResetTextActive]}>0</Text>
              </TouchableOpacity>
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                return (
                  <TouchableOpacity key={value} style={styles.starButton} onPress={() => setRatingValue(value)}>
                    <Ionicons
                      name={ratingValue >= value ? 'star' : 'star-outline'}
                      size={24}
                      color={ratingValue >= value ? colors.primary : COLORS.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Comentário (opcional)"
              placeholderTextColor={COLORS.textMuted}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimaryButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveReview}
                disabled={savingReview}>
                <Text style={styles.modalPrimaryText}>Salvar avaliação</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalSecondaryButton]} onPress={handleCloseReview}>
                <Text style={styles.modalSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSubtitle: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  starButton: {
    paddingHorizontal: 4,
  },
  ratingReset: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ratingResetText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  ratingResetTextActive: {
    color: '#FFFFFF',
  },
  reviewInput: {
    marginTop: 16,
    minHeight: 80,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  modalActions: {
    marginTop: 16,
  },
  modalButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalPrimaryButton: {
    marginBottom: 10,
  },
  modalSecondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalSecondaryText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
