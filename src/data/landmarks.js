import { toWorld } from './geo.js'

/**
 * Every landmark on the map. This array is the single source of truth:
 * World builds a Landmark for each entry, and `npm run validate` checks it.
 *
 * id        unique, kebab-case
 * name      shown on the name plate
 * kind      'monument' → culture panel (body + fact) | 'admin' → practical panel (steps)
 * region    id from regions.js
 * position  [x, 0, z]; toWorld(lon, lat) converts real coordinates
 * facing    compass degrees the front of the model looks towards (180 = south)
 * model     file name in src/models/landmarks/ (without .js)
 * params    optional, passed to the model function
 * scale     uniform scale of model and colliders
 * trigger   { radius } of the zone that opens the panel
 * panel     { title, eyebrow?, body, fact, steps, link }
 */
export const landmarks = [
  {
    id: 'tour-eiffel',
    name: 'Tour Eiffel',
    kind: 'monument',
    region: 'nord',
    position: toWorld(2.2945, 48.8584),
    facing: 180,
    model: 'eiffel',
    scale: 1,
    trigger: { radius: 10 },
    panel: {
      title: 'Tour Eiffel',
      eyebrow: 'Paris',
      body: [
        'Gustave Eiffel’s company built it for the 1889 World’s Fair, and it was only meant to stand for twenty years, until radio saved it: the top made the perfect antenna.',
        'Parisians call it la Dame de fer. Skip the lift queue and climb to the second floor on foot.'
      ],
      fact: 'Every seven years it is repainted by hand: about 60 tonnes of paint, in a shade officially called “Eiffel Tower Brown”.',
      steps: null,
      link: { label: 'toureiffel.paris', href: 'https://www.toureiffel.paris/en' }
    }
  },
  {
    id: 'mont-saint-michel',
    name: 'Mont-Saint-Michel',
    kind: 'monument',
    region: 'ouest',
    position: toWorld(-1.5115, 48.6361),
    facing: 140,
    model: 'montSaintMichel',
    scale: 1,
    trigger: { radius: 14 },
    panel: {
      title: 'Mont-Saint-Michel',
      eyebrow: 'Normandie',
      body: [
        'A Benedictine abbey stacked on a granite island, built up over eight centuries until village, ramparts and church read as one single rock.',
        'Since 2014 a light footbridge has replaced the old causeway, so the tide can surround the island again.'
      ],
      fact: 'The bay has some of the biggest tides in Europe: at spring tides the sea level swings by more than 13 metres.',
      steps: null,
      link: { label: 'abbaye-mont-saint-michel.fr', href: 'https://www.abbaye-mont-saint-michel.fr' }
    }
  },
  {
    id: 'pont-du-gard',
    name: 'Pont du Gard',
    kind: 'monument',
    region: 'sud',
    position: toWorld(4.5353, 43.9475),
    facing: 325,
    model: 'pontDuGard',
    scale: 1,
    trigger: { radius: 14 },
    panel: {
      title: 'Pont du Gard & the lavender fields',
      eyebrow: 'Gard & Provence',
      body: [
        'Roman engineers built this three-tier aqueduct about 2,000 years ago to carry water 50 km to Nîmes, dropping only around 25 cm per kilometre on the way.',
        'Further east, the lavender fields of Provence flower from mid-June to late July, just before the harvest.'
      ],
      fact: 'Its arches were built without mortar: the blocks, some weighing around six tonnes, simply hold each other up.',
      steps: null,
      link: { label: 'pontdugard.fr', href: 'https://www.pontdugard.fr' }
    }
  },
  {
    id: 'limoges',
    name: 'Limoges',
    kind: 'monument',
    region: 'centre-ouest',
    position: toWorld(1.2611, 45.8336),
    facing: 55,
    model: 'limoges',
    scale: 1,
    trigger: { radius: 12 },
    panel: {
      title: 'Limoges: cathedral & porcelain',
      eyebrow: 'Haute-Vienne',
      body: [
        'Limoges has made fine porcelain since the 1770s, soon after kaolin, the white clay it needs, was found nearby at Saint-Yrieix.',
        'The Cathédrale Saint-Étienne took more than six centuries to finish: its bell tower still stands on a Romanesque base older than the Gothic nave.'
      ],
      fact: 'Since 2017, “Porcelaine de Limoges” has been a protected geographical indication. Like a regional cheese, it has to be made here.',
      steps: null,
      link: { label: 'limoges.fr', href: 'https://www.limoges.fr' }
    }
  },
  {
    id: 'prefecture',
    name: 'Préfecture',
    kind: 'admin',
    region: 'centre-ouest',
    position: toWorld(0.75, 46.6),
    facing: 110,
    model: 'placeholder',
    scale: 1,
    trigger: { radius: 9 },
    panel: {
      title: 'Préfecture: your right to stay',
      eyebrow: 'Démarches',
      body: null,
      fact: null,
      steps: [
        'Get an attestation d’hébergement from your landlord or résidence.',
        'Validate your VLS-TS on the ANEF website within 3 months of arriving.',
        'Pay the timbre fiscal online to finish the validation.',
        'Download the confirmation and keep it with your passport.',
        'Start your titre de séjour renewal on ANEF 4 months before your visa expires.'
      ],
      link: { label: 'ANEF: administration-etrangers-en-france', href: 'https://administration-etrangers-en-france.interieur.gouv.fr' }
    }
  }
]
