/**
 * Wanneer administratie iets automatisch mag, en wat "geïdentificeerd" hier
 * betekent.
 *
 * Strenger dan bij klantenservice, en dat verschil is de kern van dit bestand.
 * Bij klantenservice volstaat het afzenderadres van een mail: elk antwoord gaat
 * langs een mens, en een verkeerde match wordt daar gezien. Hier gaat het over
 * bedragen en betaalgegevens, en dan is "de mail kwam van dit adres" te weinig
 * — een gespoofte afzender is precies de aanvalsvorm die in dit domein
 * voorkomt.
 *
 * Daarom: het adres moet terug te vinden zijn bij de relatie in het pakket, én
 * er moet een factuurnummer bij. Zonder allebei worden er geen bedragen
 * getoond.
 */

import type { OutcomePolicy } from '../contract.js';
import type { Outcome } from '../../outcomes/index.js';

export const ADMINISTRATIE_OUTCOMES: OutcomePolicy = {
  identification: {
    /**
     * Mail: het afzenderadres volstaat **niet**. Een factuurmail met een
     * gewijzigd rekeningnummer komt per definitie van een adres dat er goed
     * uitziet; daar is het adres zelf dus geen bewijs.
     */
    mail: { senderAddressSuffices: false, requiresOrderReference: true },
    /**
     * Chat: idem, en om dezelfde reden strenger dan bij klantenservice — de
     * bezoeker is anoniem en het gaat over geld.
     */
    chat: { senderAddressSuffices: false, requiresOrderReference: true },
    /**
     * Klok en documenten hebben geen afzender. De identificatie is daar
     * systeemzijdig: de relatie komt uit het pakket, en het adres waar iets
     * heen gaat ook. `requiresOrderReference` blijft aan, want een aanmaning
     * zonder factuurnummer bestaat niet.
     */
    schedule: { senderAddressSuffices: false, requiresOrderReference: true },
    document: { senderAddressSuffices: false, requiresOrderReference: true },
  },

  /**
   * De uitkomst als de router er zelf geen noemt.
   *
   * Elke specialist die iets voorstelt wat geld raakt, levert `taak` — er is in
   * dit domein geen enkele schrijfoperatie die zonder mens mag. `kennis` blijft
   * over voor wat uit de kennisbasis komt zonder bedragen: een betaaltermijn,
   * een btw-nummer, het aanmaningsbeleid.
   */
  fallbackOutcome({ specialist, extracted }): Outcome {
    const factuur = extracted?.invoiceNumber;
    const heeftFactuur = typeof factuur === 'string' && factuur.trim().length > 0;

    switch (specialist) {
      case 'receivables':
      case 'payables':
        // Mét een factuurnummer valt er iets op te zoeken; zonder is het een
        // vraag over beleid.
        return heeftFactuur ? 'systeem' : 'kennis';
      case 'finance_escalate':
        // De router kon het niet plaatsen. Doorvragen of overdragen, geen
        // voorstel en geen ticket.
        return 'onbekend';
      case 'invoice_intake':
      case 'deviation_check':
      case 'reconciliation':
      case 'vat_check':
      case 'cashflow':
        return 'taak';
      default:
        return 'taak';
    }
  },

  /**
   * Het adres waar een bericht heen mag, uit de relatie in het pakket.
   *
   * **Nooit uit het binnengekomen bericht.** Dat is de regel die factuurfraude
   * via een gespoofte mail bij de bron afsluit: wie ook mailt over factuur
   * VF-2026-0912, het antwoord gaat naar het adres dat bij die relatie staat.
   */
  sourceEmail(results) {
    const relatie = results['boekhouding.get_relation'] as
      | { contactEmail?: unknown }
      | undefined;
    const adres = relatie?.contactEmail;
    return typeof adres === 'string' && adres.trim() ? adres : null;
  },
};
