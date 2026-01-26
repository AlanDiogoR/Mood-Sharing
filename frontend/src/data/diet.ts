export type DietSubstitution = {
  name: string;
  portion: string;
};

export type DietItem = {
  name: string;
  grams: string;
  portionHint: string;
  substitutions: DietSubstitution[];
};

export type DietMeal = {
  id: 'lunch' | 'snack' | 'dinner';
  title: string;
  timeLabel: string;
  items: DietItem[];
};

export const DIET_MEALS: DietMeal[] = [
  {
    id: 'lunch',
    title: 'Almoco',
    timeLabel: 'Ate 14:00',
    items: [
      {
        name: 'Folhas variadas',
        grams: '150g',
        portionHint: '1 prato raso cheio',
        substitutions: [
          { name: 'Mix de legumes crus', portion: '1 prato raso' },
          { name: 'Legumes cozidos', portion: '1 prato raso' },
          { name: 'Salada verde com tomate', portion: '1 prato raso' },
        ],
      },
      {
        name: 'Bisteca de porco grelhada',
        grams: '150g',
        portionHint: '1 bisteca media',
        substitutions: [
          { name: 'Peito de frango grelhado', portion: '1 filé medio (150g)' },
          { name: 'Carne bovina magra', portion: '1 bife medio (150g)' },
          { name: 'Peixe grelhado', portion: '1 filé medio (150g)' },
        ],
      },
      {
        name: 'Arroz branco cozido',
        grams: '225g',
        portionHint: '9 colheres de sopa rasas',
        substitutions: [
          { name: 'Batata cozida', portion: '2 unidades medias (200-250g)' },
          { name: 'Macarrao cozido', portion: '2 conchas medias (200-250g)' },
          { name: 'Mandioca cozida', portion: '1 prato raso (200-250g)' },
        ],
      },
      {
        name: 'Feijao preto cozido',
        grams: '130g',
        portionHint: '2 conchas pequenas cheias',
        substitutions: [
          { name: 'Feijao carioca cozido', portion: '2 conchas pequenas' },
          { name: 'Lentilha cozida', portion: '1 concha e meia' },
          { name: 'Grao-de-bico cozido', portion: '1 concha e meia' },
        ],
      },
    ],
  },
  {
    id: 'snack',
    title: 'Lanche',
    timeLabel: '14:00 a 17:30',
    items: [
      {
        name: 'Ovos mexidos',
        grams: '3 ovos',
        portionHint: '3 unidades',
        substitutions: [
          { name: 'Omelete simples', portion: '3 ovos' },
          { name: 'Claras com 1 gema', portion: '4 claras + 1 gema' },
          { name: 'Frango desfiado', portion: '120g' },
        ],
      },
      {
        name: 'Melao',
        grams: '150g',
        portionHint: '1 fatia grande',
        substitutions: [
          { name: 'Melancia', portion: '2 fatias medias' },
          { name: 'Abacaxi', portion: '2 fatias medias' },
          { name: 'Manga', portion: '1 unidade media' },
        ],
      },
      {
        name: 'Pao de forma integral',
        grams: '460g',
        portionHint: '18 fatias (aprox.)',
        substitutions: [
          { name: 'Pao frances', portion: '3 unidades medias' },
          { name: 'Pao integral caseiro', portion: '6 fatias grossas' },
          { name: 'Tapioca', portion: '2 unidades medias' },
        ],
      },
      {
        name: 'Queijo mussarela',
        grams: '75g',
        portionHint: '3 fatias medias',
        substitutions: [
          { name: 'Queijo minas', portion: '3 fatias medias' },
          { name: 'Ricota', portion: '4 colheres de sopa' },
          { name: 'Requeijao light', portion: '2 colheres de sopa cheias' },
        ],
      },
    ],
  },
  {
    id: 'dinner',
    title: 'Janta',
    timeLabel: 'Apos 17:30',
    items: [
      {
        name: 'Legumes variados e folhas',
        grams: '150g',
        portionHint: '1 prato raso a vontade',
        substitutions: [
          { name: 'Salada verde completa', portion: '1 prato raso' },
          { name: 'Legumes cozidos no vapor', portion: '1 prato raso' },
          { name: 'Sopa de legumes', portion: '1 tigela media' },
        ],
      },
      {
        name: 'Asa de frango',
        grams: '180g',
        portionHint: '2 a 3 asas',
        substitutions: [
          { name: 'Coxa de frango assada', portion: '1 unidade media' },
          { name: 'Peito de frango grelhado', portion: '1 filé medio' },
          { name: 'Carne magra grelhada', portion: '1 bife medio' },
        ],
      },
      {
        name: 'Arroz branco cozido',
        grams: '225g',
        portionHint: '9 colheres de sopa rasas',
        substitutions: [
          { name: 'Batata cozida', portion: '2 unidades medias' },
          { name: 'Macarrao cozido', portion: '2 conchas medias' },
          { name: 'Mandioca cozida', portion: '1 prato raso' },
        ],
      },
      {
        name: 'Feijao preto cozido',
        grams: '130g',
        portionHint: '2 conchas pequenas cheias',
        substitutions: [
          { name: 'Feijao carioca cozido', portion: '2 conchas pequenas' },
          { name: 'Lentilha cozida', portion: '1 concha e meia' },
          { name: 'Grao-de-bico cozido', portion: '1 concha e meia' },
        ],
      },
      {
        name: 'Requeijao light',
        grams: '30g',
        portionHint: '2 colheres de sopa rasas',
        substitutions: [
          { name: 'Ricota', portion: '3 colheres de sopa' },
          { name: 'Queijo minas', portion: '2 fatias finas' },
          { name: 'Iogurte natural', portion: '1 copo pequeno' },
        ],
      },
    ],
  },
];

export const getMealByTime = (date = new Date()): DietMeal => {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes < 14 * 60) {
    return DIET_MEALS[0];
  }
  if (minutes < 17 * 60 + 30) {
    return DIET_MEALS[1];
  }
  return DIET_MEALS[2];
};
