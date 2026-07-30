/**
 * Serviço de analytics agnóstico de provedor.
 *
 * O objetivo é centralizar o rastreamento do funil de produto (ativação,
 * retenção, conversão) sem acoplar o app a um provedor específico. Hoje os
 * eventos são apenas logados/bufferizados; para produção, basta plugar um
 * provedor real (Amplitude, PostHog, Firebase Analytics, Mixpanel...) dentro
 * de `dispatch` — toda a instrumentação espalhada pelo app continua igual.
 */

export const ANALYTICS_EVENTS = {
  // Ciclo de vida / aquisição
  APP_OPENED: 'app_opened',
  SIGNED_UP: 'signed_up',
  LOGGED_IN: 'logged_in',
  LOGGED_OUT: 'logged_out',

  // Ativação (o casal precisa estar conectado para o app fazer sentido)
  PARTNER_LINK_STARTED: 'partner_link_started',
  PARTNER_LINKED: 'partner_linked',

  // Núcleo do produto (humor compartilhado)
  MOOD_SHARED: 'mood_shared',
  PARTNER_MOOD_VIEWED: 'partner_mood_viewed',
  // AHA MOMENT: o parceiro reagiu/respondeu ao primeiro humor compartilhado.
  PARTNER_MOOD_RESPONDED: 'partner_mood_responded',

  // Monetização
  PAYWALL_VIEWED: 'paywall_viewed',
  PREMIUM_CONTENT_LOCKED_TAPPED: 'premium_content_locked_tapped',
  CHECKOUT_STARTED: 'checkout_started',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',

  // Expansão de produto / engajamento
  COUPLE_CONTENT_OPENED: 'couple_content_opened',
  QUESTION_TRACK_OPENED: 'question_track_opened',
  DATE_IDEA_OPENED: 'date_idea_opened',
  WEEKLY_CHALLENGE_STARTED: 'weekly_challenge_started',
  AFFILIATE_LINK_OPENED: 'affiliate_link_opened',
  THEME_PRESET_APPLIED: 'theme_preset_applied',

  // Privacidade / dados (LGPD)
  DATA_EXPORT_REQUESTED: 'data_export_requested',
  ACCOUNT_DELETION_REQUESTED: 'account_deletion_requested',
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/**
 * O "aha moment" do produto: o instante em que o usuário percebe o valor.
 * Para um app de casal, isso acontece quando o parceiro responde ao primeiro
 * humor compartilhado. Toda a ativação deve ser otimizada para chegar aqui
 * o mais rápido possível.
 */
export const AHA_MOMENT_EVENT: AnalyticsEvent = ANALYTICS_EVENTS.PARTNER_MOOD_RESPONDED;

type EventProps = Record<string, string | number | boolean | null | undefined>;

interface IdentityTraits {
  email?: string;
  name?: string;
  hasPartner?: boolean;
  isPremium?: boolean;
  plan?: string;
}

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

class AnalyticsService {
  private userId: string | null = null;
  private commonProps: EventProps = {};
  private queue: Array<{ event: AnalyticsEvent; props: EventProps; ts: number }> = [];
  private readonly maxQueueSize = 200;

  /** Associa os eventos seguintes a um usuário. Chamar após login/registro. */
  identify(userId: string, traits: IdentityTraits = {}): void {
    this.userId = userId;
    this.commonProps = { ...this.commonProps, ...this.cleanProps(traits) };
    this.dispatchIdentify(userId, traits);
  }

  /** Limpa a identidade (logout). */
  reset(): void {
    this.userId = null;
    this.commonProps = {};
  }

  /** Define propriedades enviadas junto de todos os eventos. */
  setCommonProps(props: EventProps): void {
    this.commonProps = { ...this.commonProps, ...this.cleanProps(props) };
  }

  /** Rastreia um evento do funil. */
  track(event: AnalyticsEvent, props: EventProps = {}): void {
    const entry = {
      event,
      props: { ...this.commonProps, ...this.cleanProps(props) },
      ts: Date.now(),
    };

    this.queue.push(entry);
    if (this.queue.length > this.maxQueueSize) {
      this.queue.shift();
    }

    this.dispatch(event, entry.props);

    if (event === AHA_MOMENT_EVENT) {
      this.dispatch('aha_moment_reached', entry.props);
    }
  }

  /** Eventos bufferizados (útil para depuração/inspeção). */
  getBufferedEvents(): ReadonlyArray<{ event: AnalyticsEvent; props: EventProps; ts: number }> {
    return this.queue;
  }

  private cleanProps(props: EventProps | IdentityTraits): EventProps {
    const result: EventProps = {};
    Object.entries(props).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        result[key] = value;
      }
    });
    return result;
  }

  private dispatch(event: string, props: EventProps): void {
    // TODO(produção): encaminhar para o provedor real, ex.:
    //   amplitude.logEvent(event, { userId: this.userId, ...props });
    //   posthog.capture(event, props);
    if (isDev) {
      console.log(`[analytics] ${event}`, { userId: this.userId, ...props });
    }
  }

  private dispatchIdentify(userId: string, traits: IdentityTraits): void {
    // TODO(produção): amplitude.setUserId(userId); amplitude.identify(traits);
    if (isDev) {
      console.log('[analytics] identify', { userId, ...traits });
    }
  }
}

export const analytics = new AnalyticsService();
