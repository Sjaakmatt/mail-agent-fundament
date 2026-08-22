/**
 * De categorie-taxonomie van administratie.
 *
 * Veertien categorieën, en de scheidslijnen zitten waar het beleid verschilt:
 * een inkoopfactuur wordt geboekt, een afwijking wordt geblokkeerd, een
 * openstaande post wordt aangemaand. Drie processen die met dezelfde woorden
 * over geld gaan en drie keer een ander vervolg hebben.
 *
 * Wat opvalt tegenover klantenservice: het merendeel begint **niet bij een
 * mail**. `openstaande_post` komt uit de dagelijkse cron, `bankmutatie_onbekend`
 * uit de bankfeed, `btw_controle` uit een kwartaaltrigger. Dat is precies
 * waarom de triggerlaag uit fase 2 er moest zijn.
 */

import type { CategoryDef } from '../../taxonomy/index.js';

export const ADMINISTRATIE_TAXONOMY: readonly CategoryDef[] = Object.freeze([
  // --- Inkoopstroom: wat er binnenkomt van leveranciers -------------------
  {
    slug: 'inkoopfactuur',
    label: 'Inkoopfactuur',
    specialist: 'invoice_intake',
    hint: 'een factuur van een leverancier, als PDF of in de mailtekst. Ook bonnen en facturen zonder ordernummer',
  },
  {
    slug: 'inkoop_creditnota',
    label: 'Inkoopcreditnota',
    specialist: 'invoice_intake',
    hint: 'creditnota van een leverancier op een eerder ontvangen factuur',
  },
  {
    slug: 'factuurafwijking',
    label: 'Factuurafwijking',
    specialist: 'deviation_check',
    hint: 'bedrag, aantal of prijs wijkt af van de inkooporder of de ontvangst. Ook ontbrekende inkooporder',
  },
  {
    slug: 'dubbele_factuur',
    label: 'Dubbele factuur',
    specialist: 'deviation_check',
    hint: 'zelfde leverancier, zelfde bedrag of zelfde factuurnummer als een reeds geboekte post',
  },

  // --- Debiteuren: wat er binnen moet komen ------------------------------
  {
    slug: 'openstaande_post',
    label: 'Openstaande post',
    specialist: 'receivables',
    hint: 'een verkoopfactuur is vervallen en nog niet betaald. Komt uit de dagelijkse cron, niet uit een mail',
  },
  {
    slug: 'betaalafspraak',
    label: 'Betaalafspraak',
    specialist: 'receivables',
    hint: 'klant vraagt uitstel, termijnen of een regeling. ALLEEN als de klant er zelf om vraagt',
  },
  {
    slug: 'betaalbewijs',
    label: 'Betaalbewijs',
    specialist: 'receivables',
    hint: 'klant stuurt een betaalbewijs of stelt dat er al betaald is',
  },
  {
    slug: 'factuurvraag_klant',
    label: 'Factuurvraag klant',
    specialist: 'receivables',
    hint: 'vraag over een verstuurde factuur: kopie, adressering, btw-nummer, referentie',
  },

  // --- Crediteuren: wat eruit moet ---------------------------------------
  {
    slug: 'crediteurvraag',
    label: 'Crediteurvraag',
    specialist: 'payables',
    hint: 'leverancier vraagt wanneer er betaald wordt, of stuurt zelf een herinnering',
  },
  {
    slug: 'betaalbatch',
    label: 'Betaalbatch',
    specialist: 'payables',
    hint: 'facturen klaarzetten voor betaling, vervaldata en kortingstermijnen',
  },

  // --- Aansluiten en controleren ----------------------------------------
  {
    slug: 'bankmutatie_onbekend',
    label: 'Onbekende bankmutatie',
    specialist: 'reconciliation',
    hint: 'ontvangst of afschrijving die niet aan een openstaande post te koppelen is',
  },
  {
    slug: 'btw_controle',
    label: 'Btw-controle',
    specialist: 'vat_check',
    hint: 'rubriekcontrole, ICP, verlegging, afwijking tussen grootboek en aangifte',
  },
  {
    slug: 'cashflow_signaal',
    label: 'Cashflowsignaal',
    specialist: 'cashflow',
    hint: 'verwachte tekorten of pieken op basis van openstaande posten en saldi',
  },

  // --- Vangnet ------------------------------------------------------------
  {
    slug: 'overig_finance',
    label: 'Overig',
    specialist: 'finance_escalate',
    hint: 'te vaag om te routeren, of raakt meerdere processen tegelijk',
  },
]);
