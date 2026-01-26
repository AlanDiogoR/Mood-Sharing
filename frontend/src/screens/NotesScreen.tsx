import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { SharedNote } from '../types';
import { notesService } from '../services/notesService';

type Mode = 'create' | 'edit';

export const NotesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<SharedNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<Mode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notesService.list();
      if (response.success && response.data) {
        setItems(response.data);
      } else {
        Alert.alert('Erro', response.error || 'Não foi possível carregar notas');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar notas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const resetForm = () => {
    setContent('');
    setMode('create');
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Atenção', 'Escreva uma nota');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        const response = await notesService.create(content.trim());
        if (response.success && response.data) {
          setItems(prev => [response.data!, ...prev]);
          resetForm();
        } else {
          Alert.alert('Erro', response.error || 'Não foi possível criar nota');
        }
      } else if (editingId) {
        const response = await notesService.update(editingId, content.trim());
        if (response.success && response.data) {
          setItems(prev => prev.map(item => (item.id === editingId ? response.data! : item)));
          resetForm();
        } else {
          Alert.alert('Erro', response.error || 'Não foi possível atualizar nota');
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar nota');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: SharedNote) => {
    setMode('edit');
    setEditingId(item.id);
    setContent(item.content);
  };

  const handleDelete = (item: SharedNote) => {
    Alert.alert('Remover', 'Deseja remover esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const response = await notesService.remove(item.id);
            if (response.success) {
              setItems(prev => prev.filter(current => current.id !== item.id));
            } else {
              Alert.alert('Erro', response.error || 'Não foi possível remover nota');
            }
          } catch (error) {
            Alert.alert('Erro', 'Falha ao remover nota');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: SharedNote }) => (
    <View style={styles.card}>
      <Text style={styles.cardText}>{item.content}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
          <Text style={[styles.actionText, styles.deleteText]}>Remover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={[styles.header, { paddingTop: 20 + insets.top }]}>
              <Text style={styles.title}>Notas</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Escreva algo importante..."
                placeholderTextColor={COLORS.textMuted}
                value={content}
                onChangeText={setContent}
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

            {!items.length && !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Nenhuma nota ainda</Text>
              </View>
            )}
          </View>
        }
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
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardText: {
    color: COLORS.text,
    fontSize: 15,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    marginRight: 16,
  },
  actionText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  deleteText: {
    color: COLORS.error,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});
