import React, {useState} from 'react';
import {View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import {useAuth} from '../store/authContext';
import {Button} from '../components/common/Button';
import {Input} from '../components/common/Input';
import {COLORS} from '../constants/colors';
import {validation} from '../utils/validation';

export const LoginScreen: React.FC = () => {
  const {login, register, isLoading} = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validation.email(email)) {
      newErrors.email = 'Email inválido';
    }

    const passwordValidation = validation.password(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message || 'Senha inválida';
    }

    if (!isLoginMode) {
      const nameValidation = validation.name(name);
      if (!nameValidation.isValid) {
        newErrors.name = nameValidation.message || 'Nome inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (isLoginMode) {
        await login({email, password});
      } else {
        await register({
          email,
          password,
          name,
          partnerEmail: partnerEmail || undefined,
        });
      }
    } catch (error: any) {
      setErrors({submit: error.message || 'Erro ao autenticar'});
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Mood Sharing</Text>
          <Text style={styles.subtitle}>
            {isLoginMode ? 'Entre na sua conta' : 'Crie sua conta'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLoginMode && (
            <Input
              label="Nome"
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              error={errors.name}
              autoCapitalize="words"
            />
          )}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="Sua senha"
            secureTextEntry
            error={errors.password}
          />

          {!isLoginMode && (
            <Input
              label="Email do Parceiro (opcional)"
              value={partnerEmail}
              onChangeText={setPartnerEmail}
              placeholder="parceiro@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}

          {errors.submit && <Text style={styles.errorText}>{errors.submit}</Text>}

          <Button
            title={isLoginMode ? 'Entrar' : 'Registrar'}
            onPress={handleSubmit}
            loading={isLoading}
            style={styles.submitButton}
          />

          <Button
            title={isLoginMode ? 'Criar conta' : 'Já tenho conta'}
            onPress={() => {
              setIsLoginMode(!isLoginMode);
              setErrors({});
            }}
            variant="outline"
            style={styles.switchButton}
          />
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: 8,
  },
  switchButton: {
    marginTop: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
});
