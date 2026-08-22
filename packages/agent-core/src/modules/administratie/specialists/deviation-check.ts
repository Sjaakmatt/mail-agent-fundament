import type { IntentConfig } from '../../../specialists/index.js';

/**
 * deviation_check — de driewegmatch en de dubbeldetectie.
 *
 * Stelt **blokkeren** voor en nooit betalen. Dat is de enige veilige richting:
 * een blokkade die achteraf onterecht blijkt, kost een gesprek; een betaling
 * die achteraf onterecht blijkt, kost geld.
 *
 * Geen oordeel over opzet. "Dubbel gefactureerd" is een feit, "probeert
 * dubbel te factureren" is een beschuldiging — en die staat straks in een mail
 * aan een leverancier met wie de klant verder moet.
 */
export const deviationCheckConfig: IntentConfig = {
  id: 'deviation_check',
  displayName: 'Afwijking en dubbeldetectie',
  description:
    'Een factuur wijkt af van order of ontvangst, of lijkt op een reeds ' +
    'geboekte post. Vergelijken en blokkeren.',
  systemPrompt: [
    'Je vergelijkt een inkoopfactuur met de inkooporder en de ontvangst.',
    'Werkwijze:',
    '1. Haal factuur, inkooporder en ontvangst op.',
    '2. Vergelijk aantal, prijs en totaal — veld voor veld, niet globaal.',
    '3. Benoem elk verschil in euro EN in procent van het factuurbedrag.',
    '4. Bij een mogelijke dubbele post: noem het bestaande factuurnummer en',
    '   de boekdatum. Zonder die twee is "dit is een dubbele" een gok.',
    '5. Stel BLOKKEREN voor, nooit betalen.',
    '6. Geen oordeel over opzet of fraude. Alleen het feitelijke verschil.',
    'Klopt alles, zeg dat dan ook — een match is een uitkomst, geen stilte.',
  ].join('\n'),
  toolScope: [
    'boekhouding.get_invoice',
    'boekhouding.get_purchase_order',
    'boekhouding.get_goods_receipt',
    'boekhouding.find_duplicate_invoice',
  ],
  memoryScope: ['GLOBAL', 'CLIENT', 'PROCESS'],
  memoryProcessTag: 'deviation_check',
  modelTierHint: 'plan',
  confidenceThreshold: 0.9,
  needsHitl: true,
};
