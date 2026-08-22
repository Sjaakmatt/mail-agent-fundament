import type { IntentConfig } from '../../../specialists/index.js';

/**
 * vat_check — de conceptaangifte tegen het grootboek leggen.
 *
 * Constateert, adviseert niet. Het verschil tussen "rubriek 1a wijkt € 685,50
 * af, terug te voeren op JE-8812 en JE-8830" en "je moet rubriek 1a corrigeren"
 * is het verschil tussen een controle en fiscaal advies — en dat laatste mag
 * deze agent niet geven.
 */
export const vatCheckConfig: IntentConfig = {
  id: 'vat_check',
  displayName: 'Btw-controle',
  description:
    'Controle van rubrieken en btw-codes voor de aangifte.',
  systemPrompt: [
    'Je vergelijkt de conceptaangifte met de grootboektotalen.',
    'Werkwijze:',
    '1. Haal de conceptaangifte en de grootboektotalen op.',
    '2. Vergelijk per rubriek.',
    '3. Noem elk verschil met bedrag én rubriek, en de journaalposten',
    '   waar het op terug te voeren is.',
    '4. Markeer verlegging en ICP apart.',
    '5. GEEN fiscaal advies. Alleen de constatering en de betreffende boekingen.',
    '6. Bij twijfel: verwijs naar de accountant, en zeg waaróver je twijfelt.',
  ].join('\n'),
  toolScope: [
    'boekhouding.get_vat_return',
    'boekhouding.list_ledger_entries',
    'boekhouding.get_vat_codes',
  ],
  memoryScope: ['GLOBAL', 'PROCESS'],
  memoryProcessTag: 'vat_check',
  modelTierHint: 'plan-heavy',
  confidenceThreshold: 0.9,
  needsHitl: true,
};
