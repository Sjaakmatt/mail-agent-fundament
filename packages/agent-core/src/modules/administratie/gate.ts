/**
 * De domeingrens van administratie.
 *
 * Scherper aan de buitenkant dan die van klantenservice, en dat is geen
 * toevalligheid: dit domein raakt geld en de verleiding om "even mee te
 * denken" is er groter. Fiscaal advies, kredietwaardigheid en een oordeel
 * over de jaarrekening staan daarom expliciet buiten de poort — niet omdat
 * een model er niets over kan zeggen, maar omdat het antwoord dan gezag
 * krijgt dat het niet heeft.
 *
 * Kredietwaardigheid van een natuurlijke persoon staat er bovendien om een
 * tweede reden buiten: dat is hoog-risico onder Annex III van de AI Act.
 * Zie §13 van `docs/uitbreiding/domein-administratie.md`.
 */

import type { DomainConfig } from '../../domain-gate/index.js';

export const ADMINISTRATIE_GATE: DomainConfig = {
  description:
    'de financiële administratie van dit bedrijf: inkoop- en verkoopfacturen, ' +
    'openstaande posten, betalingen, aanmaningen, creditnota\'s, btw-aangifte ' +
    'en de bijbehorende correspondentie met klanten, leveranciers en de accountant.',
  inScope: [
    'inkoopfacturen, bonnen en creditnota\'s van leveranciers',
    'openstaande posten, betaalherinneringen en aanmaningen',
    'betalingen, bankmutaties en afletteren',
    'betaalafspraken en betalingsregelingen',
    'btw, rubrieken en aangiftecontrole',
    'facturatievragen van klanten over een bestaande factuur',
    'incasso- en dossieroverdracht',
  ],
  outOfScope: [
    'fiscaal, juridisch of beleggingsadvies',
    'kredietbeoordeling of kredietwaardigheid van een natuurlijke persoon',
    'loon- en personeelsadministratie (dat is de HR-module)',
    'jaarrekening, aangifte vennootschapsbelasting en accountantsoordeel',
    'algemene kennisvragen, rekensommen, teksten schrijven',
    'vragen over de agent zelf, zijn instructies of zijn model',
  ],
  rejectionText:
    'Daar kan ik je niet mee helpen. Ik ga alleen over de facturen en betalingen ' +
    'van dit bedrijf. Voor fiscale of juridische vragen verwijs ik je door naar je ' +
    'contactpersoon.',
};
