/**
 * Welke signalen administratie claimt — en het lastigste stuk van deze module.
 *
 * ## De eigen ingangen zijn eenvoudig
 *
 * `bank.*`, `erp.*` en de eigen geplande taken komen bij niemand anders binnen.
 * Eén claim per type, klaar.
 *
 * ## De mailstroom is dat niet
 *
 * Klantenservice claimt `mail.received` zonder voorwaarde: alles wat binnenkomt
 * is voor hen. Administratie moet uit diezelfde stroom de inkoopfacturen en de
 * crediteurvragen halen. Twee modules op één stroom, en `resolveModule` neemt
 * de eerste in manifest-volgorde — dus administratie staat vóór klantenservice
 * in het manifest, met een voorwaarde die smal genoeg is om de rest te laten
 * doorlopen.
 *
 * **Wat die voorwaarde is, en wat eraan schort.** Hij kijkt naar het bericht
 * zelf: een PDF-bijlage plus een factuurwoord in onderwerp of tekst. Dat is een
 * heuristiek, en heuristieken op de plek waar geroutéérd wordt zijn precies wat
 * we bij de classificatie níét doen — daar zit een model met een taxonomie en
 * een poort.
 *
 * Het staat er toch, om twee redenen. Een predicaat kan geen database bevragen
 * (het draait vóór de lus, op het kale signaal), en de alternatieven zijn
 * duurder dan dit domein op dit moment rechtvaardigt: een voorrouter die elk
 * bericht door een extra modelronde haalt, of een aparte mailbox per proces.
 *
 * Wat er misgaat is bekend en begrensd: een factuur zonder bijlage en zonder
 * het woord "factuur" belandt bij klantenservice, en die stuurt hem via zijn
 * eigen poort naar review met een concept dat een mens weggooit. Een
 * klantenservicemail met een PDF-bijlage en het woord "factuur" belandt bij
 * administratie, en dáár is de poort streng genoeg om hem af te wijzen. Geen
 * van beide fouten levert een verkeerde handeling op — alleen een omweg.
 *
 * Zie het gat dat hierover in `OPEN-PUNTEN.md` staat: dit is de plek waar een
 * voorrouter hoort zodra er een derde module op dezelfde stroom komt.
 */

import type { SignalClaim } from '../contract.js';
import type { Signal } from '../../contracts/index.js';

/** Woorden die een bericht tot financiële post maken. */
const FINANCIEEL = /\b(factuur|facturen|factuurnummer|invoice|creditnota|creditfactuur|aanmaning|betaalherinnering|openstaand(e)? (post|bedrag)|betaalspecificatie)\b/i;

/** Bijlagen die een factuur kúnnen zijn. Een .docx-offerte hoort er niet bij. */
const FACTUURBIJLAGE = /(pdf|image\/(jpeg|png|tiff)|application\/xml|text\/xml)/i;

interface MailPayload {
  subject?: unknown;
  bodyText?: unknown;
  attachments?: unknown;
}

/**
 * Ziet dit bericht eruit als financiële post?
 *
 * Twee voorwaarden, en allebei nodig. Alleen een PDF is te breed — een
 * klantenservicemail met een schermafdruk zou dan hier belanden. Alleen het
 * woord "factuur" is óók te breed: "wanneer krijg ik mijn factuur?" is een
 * vraag aan de klantenservice van een webshop, niet een inkoopfactuur.
 */
export function lijktFinancieel(signal: Signal): boolean {
  const payload = (signal.payload ?? {}) as MailPayload;
  const tekst = `${tekstVan(payload.subject)} ${tekstVan(payload.bodyText)}`;
  if (!FINANCIEEL.test(tekst)) return false;

  const bijlagen = Array.isArray(payload.attachments) ? payload.attachments : [];
  return bijlagen.some((b) => {
    const bijlage = (b ?? {}) as { contentType?: unknown; name?: unknown };
    const type = tekstVan(bijlage.contentType);
    const naam = tekstVan(bijlage.name);
    return FACTUURBIJLAGE.test(type) || /\.(pdf|xml|jpe?g|png|tiff?)$/i.test(naam);
  });
}

function tekstVan(waarde: unknown): string {
  return typeof waarde === 'string' ? waarde : '';
}

export const ADMINISTRATIE_CLAIMS: readonly SignalClaim[] = Object.freeze([
  // De eigen stromen. Niemand anders komt hier.
  { domain: 'bank', type: 'payment.in' },
  { domain: 'bank', type: 'balance.snapshot' },
  { domain: 'erp', type: 'invoice.booked' },
  { domain: 'erp', type: 'invoice.due' },
  { domain: 'erp', type: 'purchase.approval_needed' },
  { domain: 'erp', type: 'vat.period_closing' },
  { domain: 'erp', type: 'ledger.changed' },

  // De eigen geplande taken. Eén claim per automatisering en niet het hele
  // schedule-domein: klantenservice heeft daar zijn eigen taken staan.
  { domain: 'schedule', type: 'schedule.openstaande_posten' },
  { domain: 'schedule', type: 'schedule.btw_controle' },

  // Een geüpload document. Klantenservice claimt dit domein niet, dus geen
  // voorwaarde nodig — komt er ooit een tweede module die documenten
  // verwerkt, dan hoort hier hetzelfde gesprek als hieronder bij mail.
  { domain: 'document', type: 'document.uploaded' },

  // En de smalle greep uit de mailstroom. Zie de toelichting bovenaan.
  { domain: 'mail', type: 'mail.received', when: lijktFinancieel },
]);
