/**
 * Conteúdo premium para casais (vetor de receita — expansão de produto).
 *
 * O conteúdo é estático e versionado no app. Itens marcados com `premium: true`
 * ficam bloqueados atrás do paywall; alguns itens gratuitos servem de "isca"
 * para demonstrar valor antes da assinatura.
 *
 * TODO(escala): mover este catálogo para o backend para permitir atualizar o
 * conteúdo sem publicar nova versão do app (e habilitar pacotes pagos avulsos).
 */

export interface QuestionTrack {
  id: string;
  title: string;
  emoji: string;
  description: string;
  premium: boolean;
  questions: string[];
}

export interface DateIdea {
  id: string;
  title: string;
  emoji: string;
  category: 'em-casa' | 'fora' | 'aventura' | 'economico';
  estimatedCost: 'gratis' | 'baixo' | 'medio' | 'alto';
  description: string;
  premium: boolean;
}

export interface WeeklyChallenge {
  id: string;
  week: number;
  title: string;
  emoji: string;
  description: string;
  premium: boolean;
}

export const QUESTION_TRACKS: QuestionTrack[] = [
  {
    id: 'track-conhecendo',
    title: 'Nos conhecendo',
    emoji: '💬',
    description: 'Perguntas leves para começar uma boa conversa.',
    premium: false,
    questions: [
      'Qual foi o melhor momento do nosso relacionamento até agora?',
      'O que te fez sorrir hoje?',
      'Qual lugar você sonha em visitar comigo?',
      'Qual música te lembra de mim?',
      'O que você mais admira em si mesmo?',
    ],
  },
  {
    id: 'track-sonhos',
    title: 'Sonhos e futuro',
    emoji: '🌟',
    description: 'Alinhem expectativas e planos a dois.',
    premium: true,
    questions: [
      'Onde você se vê daqui a 5 anos?',
      'Qual sonho ainda não realizamos juntos?',
      'Como é o nosso dia perfeito no futuro?',
      'O que significa "lar" para você?',
      'Que tradição você gostaria de criar como casal?',
      'O que você precisa de mim para se sentir seguro(a)?',
    ],
  },
  {
    id: 'track-intimidade',
    title: 'Conexão profunda',
    emoji: '🔥',
    description: 'Perguntas para fortalecer a intimidade emocional.',
    premium: true,
    questions: [
      'Quando você se sente mais amado(a) por mim?',
      'Qual foi um momento em que se sentiu vulnerável comigo?',
      'O que eu faço que te faz sentir especial?',
      'Existe algo que você gostaria de fazer mais vezes comigo?',
      'Como posso te apoiar melhor nos dias difíceis?',
    ],
  },
];

export const DATE_IDEAS: DateIdea[] = [
  {
    id: 'date-piquenique',
    title: 'Piquenique no parque',
    emoji: '🧺',
    category: 'fora',
    estimatedCost: 'baixo',
    description: 'Levem comidinhas favoritas e um cobertor. Sem celular por 1 hora.',
    premium: false,
  },
  {
    id: 'date-cozinhar',
    title: 'Noite de cozinhar juntos',
    emoji: '🍝',
    category: 'em-casa',
    estimatedCost: 'baixo',
    description: 'Escolham uma receita nova e cozinhem em dupla, sem pressa.',
    premium: false,
  },
  {
    id: 'date-estrelas',
    title: 'Observar as estrelas',
    emoji: '🌌',
    category: 'aventura',
    estimatedCost: 'gratis',
    description: 'Achem um lugar escuro, levem um cobertor e conversem sobre tudo.',
    premium: true,
  },
  {
    id: 'date-spa',
    title: 'Spa em casa',
    emoji: '🛁',
    category: 'em-casa',
    estimatedCost: 'baixo',
    description: 'Massagem, velas e música. Cuidem um do outro por uma noite.',
    premium: true,
  },
  {
    id: 'date-roteiro',
    title: 'Maratona temática',
    emoji: '🎬',
    category: 'em-casa',
    estimatedCost: 'gratis',
    description: 'Escolham um tema e usem sua lista de filmes/séries do app.',
    premium: true,
  },
  {
    id: 'date-trilha',
    title: 'Trilha ao amanhecer',
    emoji: '🥾',
    category: 'aventura',
    estimatedCost: 'gratis',
    description: 'Acordem cedo, peguem uma trilha leve e vejam o nascer do sol.',
    premium: true,
  },
];

export const WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'challenge-1',
    week: 1,
    title: 'Elogio diário',
    emoji: '💛',
    description: 'Todo dia desta semana, envie um elogio sincero ao seu parceiro.',
    premium: false,
  },
  {
    id: 'challenge-2',
    week: 2,
    title: 'Sem telas por 1h',
    emoji: '📵',
    description: 'Reservem 1 hora por dia, juntos e longe das telas.',
    premium: true,
  },
  {
    id: 'challenge-3',
    week: 3,
    title: 'Surpresa pequena',
    emoji: '🎁',
    description: 'Faça uma surpresa simples e inesperada em algum dia da semana.',
    premium: true,
  },
  {
    id: 'challenge-4',
    week: 4,
    title: 'Carta de gratidão',
    emoji: '✉️',
    description: 'Escreva uma carta dizendo por que é grato(a) por ter essa pessoa.',
    premium: true,
  },
];
