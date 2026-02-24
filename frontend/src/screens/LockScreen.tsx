import React, {useState, useEffect} from 'react';
import {View, StyleSheet, TouchableOpacity, Text, Alert, AppState, AppStateStatus} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import {LockScreenContent} from '../components/lock-screen/LockScreenContent';
import {useAuth} from '../store/authContext';
import {storage} from '../utils/storage';
import {CONFIG} from '../constants/config';
import {COLORS} from '../constants/colors';
import {Input} from '../components/common/Input';
import {Button} from '../components/common/Button';

export const LockScreen: React.FC<{onUnlock: () => void}> = ({onUnlock}) => {
  const {user} = useAuth();
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    const init = async () => {
      await checkBiometricAvailability();
      await checkLockStatus();
    };
    init();
    const subscription = setupAppStateListener();
    return () => {
      subscription?.remove();
    };
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const checkLockStatus = async () => {
    const locked = await storage.getIsLocked();
    const lastActivity = await storage.getLastActivity();
    const now = Date.now();

    if (locked || (lastActivity && now - lastActivity > CONFIG.LOCK_SCREEN_TIMEOUT)) {
      setIsLocked(true);
      // Wait a bit for biometric availability check
      setTimeout(() => {
        if (biometricAvailable) {
          attemptBiometricUnlock();
        }
      }, 500);
    } else {
      setIsLocked(false);
      onUnlock();
    }
  };

  const setupAppStateListener = () => {
    return AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        lockScreen();
      }
    });
  };

  const lockScreen = async () => {
    setIsLocked(true);
    await storage.setIsLocked(true);
    await storage.setLastActivity(Date.now());
  };

  const attemptBiometricUnlock = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear Mood Sharing',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (result.success) {
        await unlock();
      }
    } catch (error) {
      console.error('Biometric unlock error:', error);
    }
  };

  const unlock = async () => {
    setIsLocked(false);
    await storage.setIsLocked(false);
    await storage.setLastActivity(Date.now());
    onUnlock();
  };

  const handlePasswordUnlock = async () => {
    if (!password.trim()) {
      Alert.alert('Erro', 'Por favor, insira sua senha');
      return;
    }
    try {
      const {authService} = await import('../services/authService');
      const response = await authService.verifyPassword(password);
      if (response.success) {
        await unlock();
        setPassword('');
      } else {
        Alert.alert('Erro', 'Senha incorreta');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível verificar a senha. Use a biometria.');
    }
  };

  const handleBiometricPress = () => {
    if (biometricAvailable) {
      attemptBiometricUnlock();
    }
  };

  if (!isLocked) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LockScreenContent onUnlock={handleBiometricPress} />

      <View style={styles.unlockContainer}>
        {biometricAvailable && (
          <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricPress}>
            <Text style={styles.biometricText}>🔐 Usar biometria</Text>
          </TouchableOpacity>
        )}

        <Input
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="Digite sua senha"
          secureTextEntry
          containerStyle={styles.passwordInput}
        />

        <Button title="Desbloquear" onPress={handlePasswordUnlock} style={styles.unlockButton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  unlockContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  biometricButton: {
    backgroundColor: COLORS.backgroundCard,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  biometricText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  passwordInput: {
    marginBottom: 16,
  },
  unlockButton: {
    marginTop: 8,
  },
});
