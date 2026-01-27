import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../store/authContext';
import { useTheme } from '../store/themeContext';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { Input } from '../components/common/Input';

const normalizeHex = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
};

const isValidHex = (value: string): boolean => /^#?[0-9a-fA-F]{6}$/.test(value.trim());

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const { colors, setThemeColors } = useTheme();
  const [name, setName] = useState(user?.name ?? '');
  const [partnerName, setPartnerName] = useState(user?.partnerName ?? '');
  const [primaryColor, setPrimaryColor] = useState(user?.themePrimary ?? '');
  const [secondaryColor, setSecondaryColor] = useState(user?.themeSecondary ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const normalizedPrimary = useMemo(() => normalizeHex(primaryColor), [primaryColor]);
  const normalizedSecondary = useMemo(() => normalizeHex(secondaryColor), [secondaryColor]);

  const handleSaveProfile = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      Alert.alert('Atenção', 'Informe um nome válido');
      return;
    }

    if (primaryColor.trim() && !isValidHex(primaryColor)) {
      Alert.alert('Atenção', 'Cor primária inválida (use hex, ex: #1A2B3C)');
      return;
    }

    if (secondaryColor.trim() && !isValidHex(secondaryColor)) {
      Alert.alert('Atenção', 'Cor secundária inválida (use hex, ex: #1A2B3C)');
      return;
    }

    setSavingProfile(true);
    try {
      const response = await userService.updateProfile({
        name: trimmedName,
        partnerName: partnerName.trim() || null,
        themePrimary: normalizedPrimary || null,
        themeSecondary: normalizedSecondary || null,
      });

      if (response.success && response.data) {
        setThemeColors(
          response.data.themePrimary || colors.primary,
          response.data.themeSecondary || colors.secondary
        );
        await refreshUser();
        Alert.alert('Sucesso', 'Perfil atualizado');
      } else {
        Alert.alert('Erro', response.error || 'Não foi possível atualizar perfil');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Atenção', 'Preencha a senha atual e a nova senha');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não conferem');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      if (response.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('Sucesso', 'Senha atualizada');
      } else {
        Alert.alert('Erro', response.error || 'Não foi possível alterar a senha');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Editar perfil</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Voltar</Text>
        </TouchableOpacity>
      </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <Input label="Nome de usuário" value={name} onChangeText={setName} />
          <Input label="Nome do parceiro" value={partnerName} onChangeText={setPartnerName} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cores do tema</Text>
          <Input label="Cor primária" value={primaryColor} onChangeText={setPrimaryColor} autoCapitalize="characters" />
          <View style={styles.colorPreviewRow}>
            <View style={[styles.colorPreview, { backgroundColor: normalizedPrimary || colors.primary }]} />
            <Text style={styles.colorPreviewLabel}>Primária</Text>
          </View>
          <Input
            label="Cor secundária"
            value={secondaryColor}
            onChangeText={setSecondaryColor}
            autoCapitalize="characters"
          />
          <View style={styles.colorPreviewRow}>
            <View style={[styles.colorPreview, { backgroundColor: normalizedSecondary || colors.secondary }]} />
            <Text style={styles.colorPreviewLabel}>Secundária</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleSaveProfile}
            disabled={savingProfile}>
            <Text style={styles.primaryButtonText}>{savingProfile ? 'Salvando...' : 'Salvar perfil'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trocar senha</Text>
          <Input
            label="Senha atual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <Input label="Nova senha" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          <Input
            label="Confirmar nova senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={handleChangePassword}
            disabled={changingPassword}>
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
              {changingPassword ? 'Atualizando...' : 'Alterar senha'}
            </Text>
          </TouchableOpacity>
        </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  backLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: COLORS.backgroundCard,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  primaryButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontWeight: '700',
  },
  colorPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 12,
  },
  colorPreviewLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
