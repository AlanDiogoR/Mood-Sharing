import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { MediaItem, MediaType } from '../types';
import { mediaService } from '../services/mediaService';
import { useTheme } from '../store/themeContext';

type Mode = 'create' | 'edit';

type MediaFormRoute = {
  params?: {
    mode?: Mode;
    item?: MediaItem;
  };
};

export const MediaFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<MediaFormRoute>();
  const { colors } = useTheme();
  const mode = route.params?.mode ?? 'create';
  const editingItem = route.params?.item;
  const [title, setTitle] = useState(editingItem?.title ?? '');
  const [notes, setNotes] = useState(editingItem?.notes ?? '');
  const [type, setType] = useState<MediaType>(editingItem?.type ?? 'movie');
  const [loading, setLoading] = useState(false);

  const screenTitle = useMemo(
    () => (mode === 'edit' ? 'Editar item' : 'Adicionar item'),
    [mode]
  );

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Atenção', 'Informe o título');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        const response = await mediaService.create({
          title: title.trim(),
          type,
          notes: notes.trim() || undefined,
        });
        if (response.success) {
          navigation.goBack();
        } else {
          Alert.alert('Erro', response.error || 'Não foi possível adicionar item');
        }
      } else if (editingItem?.id) {
        const response = await mediaService.update(editingItem.id, {
          title: title.trim(),
          type,
          notes: notes.trim() || undefined,
        });
        if (response.success) {
          navigation.goBack();
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{screenTitle}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeChip,
                type === 'movie' && styles.typeChipActive,
                type === 'movie' && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setType('movie')}>
              <Text style={[styles.typeChipText, type === 'movie' && styles.typeChipTextActive]}>
                Filme
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeChip,
                type === 'series' && styles.typeChipActive,
                type === 'series' && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
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
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={loading}>
              <Text style={styles.primaryButtonText}>
                {mode === 'edit' ? 'Salvar' : 'Adicionar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
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
    minHeight: 80,
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
});
