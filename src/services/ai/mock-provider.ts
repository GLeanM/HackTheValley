import { AiError, type AiProvider, type AiRequest, type AiResponse, type Category } from './types';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const KEYWORDS: Record<Category, RegExp> = {
  food: /cook|recipe|leftover|ingredient|rice|veg|food|meal|eat|fridge|bread/i,
  sorter: /recycl|bin|plastic|compost|garbage|trash|bottle|container|can\b|dispose/i,
  lifecycle: /repair|fix|donat|old|worn|shoe|sneaker|cloth|shirt|jacket|lifespan|last|reuse/i,
};

function resolveCategory({ category, text }: AiRequest): { cat: Category; guessed: boolean } {
  if (category !== 'auto') return { cat: category, guessed: false };
  const hit = (Object.keys(KEYWORDS) as Category[]).find((c) => KEYWORDS[c].test(text));
  return { cat: hit ?? 'sorter', guessed: true };
}

const NOTE_GUESS =
  'Sample response. Relast picked the category itself, so please double-check the item.';
const NOTE_LOCAL =
  'Recycling rules vary by city. Check your municipality’s guide before putting it out.';

function build(req: AiRequest, cat: Category, guessed: boolean): AiResponse {
  const question = req.text.trim() || 'What should I do with this item?';
  const base = { category: cat, question, source: 'mock' as const };
  const level = req.imageUri || guessed ? ('medium' as const) : ('high' as const);

  if (cat === 'food') {
    return {
      ...base,
      itemName: 'Leftover rice & vegetables',
      answer:
        'Cooked rice and vegetables are a great base for a quick fried rice. Rice should have been chilled within about an hour of cooking and eaten within a day or two.',
      why: 'Cooking with leftovers within a safe window keeps good food out of the landfill, where it releases methane.',
      recommendations: [
        'Spread cold rice on a tray so it dries slightly — it crisps better.',
        'Stir-fry vegetables first, then add rice and a splash of soy sauce.',
        'Top with an egg for protein and a filling meal.',
      ],
      alternatives: ['Veggie rice bowl with a fried egg', 'Stuffed peppers', 'Vegetable soup base'],
      confidence: { level, note: guessed ? NOTE_GUESS : 'Based on the ingredients you described.' },
      recipes: [
        {
          title: 'Crispy veggie fried rice',
          time: '15 min',
          ingredients: ['Cooked rice', 'Mixed vegetables', 'Eggs', 'Soy sauce', 'Oil'],
          steps: [
            'Heat oil in a wide pan on high heat.',
            'Fry the vegetables for 2–3 minutes.',
            'Add rice and press it into the pan; let it crisp.',
            'Push to one side, scramble the eggs, then mix everything together.',
          ],
        },
      ],
    };
  }

  if (cat === 'lifecycle') {
    return {
      ...base,
      itemName: 'Everyday sneakers',
      answer:
        'Everyday sneakers typically last 1–3 years depending on use. Visible wear on the sole usually means they can still be repaired before being replaced.',
      why: 'Repairing or passing items on extends their useful life, which avoids the footprint of making a new pair.',
      recommendations: [
        'Try a cobbler for a sole repair first — it often costs far less than new shoes.',
        'If they are still wearable, donate them to a local charity or clothing bin.',
        'Worn-out shoes: look for a textile or shoe take-back program rather than the trash.',
      ],
      alternatives: ['Clean and re-lace for a refresh', 'Use as garden or work shoes', 'Swap with a friend'],
      confidence: {
        level: 'medium',
        note: 'Estimated from typical wear patterns; a closer look at the sole would help.',
      },
      lifecycle: {
        estimate: '1–3 years',
        repairs: ['Sole re-gluing or replacement', 'Replace insoles', 'Re-stitch loose seams'],
        donation: ['Local thrift store', 'Community clothing bin', 'Shoe take-back program (sample)'],
      },
    };
  }

  // The trash classifier ran (see index.ts): echo its label instead of the canned item.
  const label = req.hint?.match(/"([^"]+)"/)?.[1];
  if (label) {
    return {
      ...base,
      itemName: label.charAt(0).toUpperCase() + label.slice(1).replace(/-/g, ' '),
      answer: `Our trash classifier thinks this is ${label.replace(/-/g, ' ')}. The bin above is based on that.`,
      why: 'Putting items in the right bin keeps recycling and compost streams clean.',
      recommendations: ['Empty and rinse containers before sorting.', 'Check your city’s guide if you are unsure.'],
      alternatives: [],
      confidence: { level: 'medium', note: NOTE_LOCAL },
    };
  }

  return {
    ...base,
    itemName: 'Plastic food container',
    answer:
      'Clear plastic food containers are often accepted in curbside recycling, but it depends on the plastic type and your city’s rules. I can’t confirm that from the photo alone.',
    why: 'Reusing first keeps plastic in use longer; recycling it clean avoids contaminating the whole batch.',
    recommendations: [
      'Reuse it if it is clean and safe for its intended purpose.',
      'Check the number inside the recycling triangle and your local guidelines.',
      'If accepted locally, empty and rinse it, then place it in the recycling bin.',
    ],
    alternatives: ['Use for storing leftovers or craft supplies', 'Pass it on to a neighbour', 'Take to a depot if curbside does not accept it'],
    confidence: {
      level: guessed ? 'low' : level,
      note: guessed ? NOTE_GUESS : NOTE_LOCAL,
    },
    bin: 'recycling',
    reuse: {
      possible: true,
      ideas: ['Store leftovers or meal-prep lunches', 'Organize screws, beads or craft supplies', 'Start seedlings in it as a mini planter'],
    },
  };
}

export const mockProvider: AiProvider = {
  name: 'mock',
  async ask(request: AiRequest): Promise<AiResponse> {
    await wait(1200);
    // Dev trigger for testing the error state.
    if (/\/error/i.test(request.text)) {
      throw new AiError('Something went wrong while analyzing. Please try again.');
    }
    const { cat, guessed } = resolveCategory(request);
    return build(request, cat, guessed);
  },
};
