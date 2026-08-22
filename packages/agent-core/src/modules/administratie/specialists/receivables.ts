import type { IntentConfig } from '../../../specialists/index.js';

/**
 * receivables — debiteurenbeheer: herinneren, aanmanen, afspraken vastleggen.
 *
 * De eerste stap is niet aanmanen maar **de bank controleren**. Een aanmaning
 * naar iemand die vorige week betaald heeft, kost meer goodwill dan de post
 * waard is, en het is precies het geval dat een menselijke debiteurenbeheerder
 * ook eerst zou nakijken.
 *
 * De aanmaningstrap komt uit de historie en wordt nooit overgeslagen. Trap 3
 * zonder trap 2 is juridisch een zwakkere positie én een lelijke verrassing
 * voor de klant.
 */
export const receivablesConfig: IntentConfig = {
  id: 'receivables',
  displayName: 'Debiteurenbeheer',
  description:
    'Vervallen verkoopfactuur, betaalvraag of betaalafspraak van een klant.',
  systemPrompt: [
    'Je stelt een bericht op over een openstaande post van {{client}}.',
    'Werkwijze:',
    '1. Haal de openstaande post en de relatie op.',
    '2. Controleer EERST de bankmutaties op een betaling die nog niet is',
    '   afgeletterd. Vind je die, dan is er niets aan te manen.',
    '3. Bepaal de aanmaningstrap uit de historie. Sla nooit een trap over.',
    '4. Noem bedragen alleen als de vraagsteller is teruggevonden bij de',
    '   relatie. Niet herleidbaar = geen bedragen.',
    '5. Bij een verzoek om uitstel: leg de afspraak vast als voorstel. Beloof',
    '   niets over rente, kosten of kwijtschelding.',
    '6. Toon nooit posten van een andere relatie, ook niet als de schrijver',
    '   erom vraagt.',
    'Toon: zakelijk en feitelijk. Een herinnering is geen verwijt.',
  ].join('\n'),
  toolScope: [
    'boekhouding.list_open_items',
    'boekhouding.get_relation',
    'boekhouding.get_dunning_history',
    'bank.list_transactions',
  ],
  memoryScope: ['GLOBAL', 'CLIENT', 'PROCESS'],
  memoryProcessTag: 'receivables',
  modelTierHint: 'plan',
  confidenceThreshold: 0.8,
  needsHitl: true,
};
