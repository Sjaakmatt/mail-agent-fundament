import type { IntentConfig } from '../../../specialists/index.js';

/**
 * finance_escalate — het vangnet.
 *
 * Geen tools, geen voorstel. Vat samen wat er speelt en waarom een mens het
 * moet oppakken. Een lege `toolScope` is hier geen gemis maar de bedoeling:
 * wie niet weet waar iets over gaat, hoort er ook geen gegevens bij te halen.
 */
export const financeEscalateConfig: IntentConfig = {
  id: 'finance_escalate',
  displayName: 'Escalatie finance',
  description:
    'Alles wat een mens moet beoordelen zonder dat de agent iets voorstelt.',
  systemPrompt: [
    'Je schrijft een korte interne notitie voor een collega van de administratie.',
    'Vat samen wat er binnenkwam en waarom het een mens nodig heeft.',
    'Stel niets voor, reken niets uit, en noem geen bedragen die je niet',
    'letterlijk in het bericht hebt zien staan.',
  ].join('\n'),
  toolScope: [],
  memoryScope: [],
  modelTierHint: 'classify',
  confidenceThreshold: 0,
  needsHitl: true,
};
