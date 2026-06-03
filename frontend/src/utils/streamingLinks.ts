import { MediaType } from '../types';

/**
 * Geração de links "onde assistir" para a watchlist (vetor de receita —
 * marketplace/afiliados).
 *
 * Hoje os links apontam para o JustWatch (agregador de streamings) via busca.
 * Para monetizar, troque por links de afiliado:
 *   - Programas de afiliados de streamings/lojas (ex.: Amazon Associates);
 *   - Adicione seu parâmetro de afiliado em `AFFILIATE_TAG` e em `buildUrl`.
 */

const JUSTWATCH_BASE = 'https://www.justwatch.com/br/busca';

// TODO(afiliados): preencher com seu identificador de afiliado quando aprovado.
const AFFILIATE_TAG = '';

export interface StreamingProvider {
  id: string;
  label: string;
  emoji: string;
  buildUrl: (title: string, type: MediaType) => string;
}

const encode = (value: string): string => encodeURIComponent(value.trim());

const withAffiliate = (url: string): string => {
  if (!AFFILIATE_TAG) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}tag=${encodeURIComponent(AFFILIATE_TAG)}`;
};

export const STREAMING_PROVIDERS: StreamingProvider[] = [
  {
    id: 'justwatch',
    label: 'Onde assistir',
    emoji: '🔎',
    buildUrl: title => withAffiliate(`${JUSTWATCH_BASE}?q=${encode(title)}`),
  },
  {
    id: 'netflix',
    label: 'Netflix',
    emoji: '🎬',
    buildUrl: title => withAffiliate(`https://www.netflix.com/search?q=${encode(title)}`),
  },
  {
    id: 'prime',
    label: 'Prime Video',
    emoji: '📦',
    buildUrl: title =>
      withAffiliate(`https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encode(title)}`),
  },
  {
    id: 'youtube',
    label: 'Trailer',
    emoji: '▶️',
    buildUrl: (title, type) =>
      `https://www.youtube.com/results?search_query=${encode(
        `${title} ${type === 'series' ? 'série' : 'filme'} trailer`
      )}`,
  },
];

/** Link principal "onde assistir" para um título. */
export const getWhereToWatchUrl = (title: string): string =>
  STREAMING_PROVIDERS[0].buildUrl(title, 'movie');
