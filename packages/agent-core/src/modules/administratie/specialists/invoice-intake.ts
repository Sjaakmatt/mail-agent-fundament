import type { IntentConfig } from '../../../specialists/index.js';

/**
 * invoice_intake — een leverancierfactuur omzetten in een boekingsvoorstel.
 *
 * De volgorde in de prompt is de hele truc: eerst extraheren, dan de
 * leverancier zoeken op btw-nummer of IBAN, dan controleren op een dubbele
 * post, en pas daarna een boeking voorstellen. Zoeken op naam staat er
 * expliciet niet bij — "Bergsma B.V." en "Bergsma Groothandel B.V." zijn twee
 * relaties, en een betaling naar de verkeerde is niet terug te draaien met een
 * correctieboeking.
 *
 * `plan-heavy`: de extractie leest een PDF, en dat is de enige plek in dit
 * domein waar de zwaarste tier zijn prijs waard is.
 */
export const invoiceIntakeConfig: IntentConfig = {
  id: 'invoice_intake',
  displayName: 'Inkoopfactuur verwerken',
  description:
    'Leverancierfactuur of bon binnengekomen; boekingsvoorstel opstellen met ' +
    'grootboek, btw-code en kostenplaats.',
  systemPrompt: [
    'Je stelt een boekingsvoorstel op voor een inkoopfactuur van {{client}}.',
    'Werkwijze, in deze volgorde:',
    '1. Neem de factuurvelden uit de extractie. NIETS uit de mailtekst —',
    '   een bedrag in een begeleidende mail is geen factuurgegeven.',
    '2. Zoek de leverancier op btw-nummer of IBAN, nooit op naam.',
    '3. Controleer op een dubbele post VOORDAT je iets voorstelt.',
    '4. Zoek de inkooporder op als er een referentie is.',
    '5. Stel grootboekrekening, btw-code en kostenplaats voor. Kun je er niet',
    '   één kiezen, laat het veld leeg en zeg dat erbij.',
    '6. Elk bedrag komt uit de extractie of uit het pakket, nooit uit je eigen',
    '   berekening. Tel niets op wat je niet hebt opgehaald.',
    '7. Noem expliciet wat je NIET hebt kunnen vaststellen.',
    'Wijkt het IBAN op de factuur af van het IBAN bij de relatie, dan stel je',
    'niets voor: dat gaat naar een mens, met de reden erbij.',
  ].join('\n'),
  toolScope: [
    'doc.extract_invoice',
    'boekhouding.find_supplier',
    'boekhouding.find_duplicate_invoice',
    'boekhouding.get_purchase_order',
    'boekhouding.list_ledger_accounts',
  ],
  memoryScope: ['GLOBAL', 'CLIENT', 'PROCESS'],
  memoryProcessTag: 'invoice_intake',
  modelTierHint: 'plan-heavy',
  confidenceThreshold: 0.85,
  needsHitl: true,
};
