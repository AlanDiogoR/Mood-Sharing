import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './authContext';
import { analytics, ANALYTICS_EVENTS } from '../services/analyticsService';

/**
 * Controle de acesso premium (entitlement).
 *
 * IMPORTANTE: este contexto é a fonte única de verdade para "o usuário é
 * premium?" no app. Hoje o status vem do perfil do usuário (`user.isPremium` /
 * `user.plan`), com um override local apenas para desenvolvimento.
 *
 * TODO(monetização): conectar ao RevenueCat (`react-native-purchases`):
 *   - inicializar o SDK no boot do app;
 *   - derivar `isPremium` de `customerInfo.entitlements.active['premium']`;
 *   - chamar `Purchases.purchasePackage(...)` em `subscribe()`.
 * O restante do app (gates de conteúdo, cosméticos) não precisa mudar.
 */

interface PremiumContextType {
  isPremium: boolean;
  /** Abre o paywall. `feature` identifica o ponto de origem para analytics. */
  showPaywall: (feature?: string) => void;
  /** Placeholder do fluxo de assinatura (substituir por RevenueCat). */
  subscribe: () => Promise<void>;
  /** Override local para testar telas premium em desenvolvimento. */
  setDevPremiumOverride: (value: boolean) => void;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [devOverride, setDevOverride] = useState(false);

  const isPremium = useMemo(
    () => devOverride || !!user?.isPremium || user?.plan === 'premium',
    [devOverride, user?.isPremium, user?.plan]
  );

  const showPaywall = useCallback((feature?: string) => {
    analytics.track(ANALYTICS_EVENTS.PAYWALL_VIEWED, { feature: feature ?? 'unknown' });
    Alert.alert(
      'Recurso Premium 💛',
      'Desbloqueie trilhas de perguntas, ideias de encontro, desafios semanais, temas exclusivos e muito mais com o Premium do Casal.',
      [
        { text: 'Agora não', style: 'cancel' },
        {
          text: 'Assinar',
          onPress: () => {
            analytics.track(ANALYTICS_EVENTS.CHECKOUT_STARTED, { feature: feature ?? 'unknown' });
            Alert.alert(
              'Em breve',
              'A assinatura ainda não está disponível nesta versão. Integração de pagamento (RevenueCat) pendente.'
            );
          },
        },
      ]
    );
  }, []);

  const subscribe = useCallback(async () => {
    analytics.track(ANALYTICS_EVENTS.CHECKOUT_STARTED, { feature: 'direct' });
    // TODO(monetização): await Purchases.purchasePackage(premiumPackage);
  }, []);

  const value = useMemo(
    () => ({
      isPremium,
      showPaywall,
      subscribe,
      setDevPremiumOverride: setDevOverride,
    }),
    [isPremium, showPaywall, subscribe]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
};

export const usePremium = (): PremiumContextType => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};
