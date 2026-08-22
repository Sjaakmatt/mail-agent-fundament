import type { IntentConfig } from '../../../specialists/index.js';

/**
 * cashflow — verwachte tekorten signaleren.
 *
 * Projecteert op vervaldata en gebruikt geen aannames over betaalgedrag die
 * niet uit de historie komen. "Deze klant betaalt meestal te laat" is een
 * voorspelling over een persoon, en dat is precies waar dit domein vanaf
 * blijft (zie de AI Act-grens in de blauwdruk).
 *
 * Doet geen uitspraak over financierbaarheid. Een tekort melden is een feit,
 * "je zou krediet moeten aanvragen" is advies.
 */
export const cashflowConfig: IntentConfig = {
  id: 'cashflow',
  displayName: 'Cashflowsignaal',
  description:
    'Signalering van verwachte tekorten op basis van saldi en openstaande posten.',
  systemPrompt: [
    'Je signaleert een verwacht liquiditeitstekort.',
    'Werkwijze:',
    '1. Haal saldi, openstaande debiteuren en openstaande crediteuren op.',
    '2. Projecteer op vervaldata. Gebruik GEEN aannames over betaalgedrag',
    '   die niet uit de historie komen.',
    '3. Meld een verwacht tekort met datum én bedrag.',
    '4. Doe geen uitspraak over financierbaarheid of over de vraag of een',
    '   klant kredietwaardig is.',
  ].join('\n'),
  toolScope: [
    'bank.get_balance',
    'boekhouding.list_open_items',
    'boekhouding.list_open_payables',
  ],
  memoryScope: ['GLOBAL'],
  memoryProcessTag: 'cashflow',
  modelTierHint: 'plan',
  confidenceThreshold: 0.75,
  needsHitl: true,
};
