import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { COLORS } from '../constants/colors';
import { MediaItem, MediaType } from '../types';
import { mediaService } from '../services/mediaService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Mode = 'create' | 'edit';

export const MediaScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<MediaType>('movie');
  const [mode, setMode] = useState<Mode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setType('movie');
    setMode('create');
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Atenção', 'Informe o título');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        const response = await mediaService.create({ title: title.trim(), type, notes: notes.trim() || undefined });
        if (response.success && response.data) {
          setItems(prev => [...prev, response.data!]);
          resetForm();
        } else {
          Alert.alert('Erro', response.error || 'Não foi possível adicionar item');
        }
      } else if (editingId) {
        const response = await mediaService.update(editingId, {
          title: title.trim(),
          type,
          notes: notes.trim() || undefined,
        });
        if (response.success && response.data) {
          setItems(prev => prev.map(item => (item.id === editingId ? response.data! : item)));
          resetForm();
        } else {
          Alert.alert('Erro', response.error || 'Não foi possível atualizar item');
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar item');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: MediaItem) => {
    setMode('edit');
    setEditingId(item.id);
    setTitle(item.title);
    setNotes(item.notes || '');
    setType(item.type);
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
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSubtitle}>{item.type === 'movie' ? 'Filme' : 'Série'}</Text>
        {!!item.notes && <Text style={styles.cardNotes}>{item.notes}</Text>}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
          <Text style={[styles.actionText, styles.deleteText]}>Remover</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: 20 + insets.top }]}>
        <Text style={styles.title}>Filmes e Séries</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeChip, type === 'movie' && styles.typeChipActive]}
            onPress={() => setType('movie')}>
            <Text style={[styles.typeChipText, type === 'movie' && styles.typeChipTextActive]}>
              Filme
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeChip, type === 'series' && styles.typeChipActive]}
            onPress={() => setType('series')}>
            <Text style={[styles.typeChipText, type === 'series' && styles.typeChipTextActive]}>
              Série
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Título"
          placeholderTextColor={COLORS.textMuted}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Notas (opcional)"
          placeholderTextColor={COLORS.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <View style={styles.formActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.primaryButtonText}>{mode === 'create' ? 'Adicionar' : 'Salvar'}</Text>
          </TouchableOpacity>
          {mode === 'edit' && (
            <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'movie', 'series'] as const).map(option => (
          <TouchableOpacity
            key={option}
            style={[styles.filterChip, filter === option && styles.filterChipActive]}
            onPress={() => setFilter(option)}>
            <Text style={[styles.filterChipText, filter === option && styles.filterChipTextActive]}>
              {option === 'all' ? 'Todos' : option === 'movie' ? 'Filmes' : 'Séries'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <DraggableFlatList
        data={sortedItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => handleDragEnd(data)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
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
  form: {
    backgroundColor: COLORS.backgroundCard,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    alignItems: 'center',
  },
  typeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeChipText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: COLORS.background,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.background,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginLeft: 12,
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
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
    borderColor: COLORS.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: COLORS.background,
  },
  listContent: {
    paddingBottom: 140,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardActive: {
    backgroundColor: COLORS.primary,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  cardNotes: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  cardActions: {
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  deleteText: {
    color: COLORS.error,
  },
});
