/**
 * Het modulepakket van administratie — de tweede module op dit fundament.
 *
 * Dit bestand is de toets op het contract uit fase 1 tot 4: als de kern klopt,
 * is een tweede domein een map met bestanden en een regel in het manifest, en
 * verandert er niets aan de lus, de werkbak of de rechten.
 *
 * Wat er onderweg níét bleek te passen, staat in `OPEN-PUNTEN.md` onder
 * "Uit fase 5". Die punten zijn niet stilzwijgend opgelost door een kernbestand
 * te bewerken; ze staan er als gat, met de reden erbij.
 */

import type { ModulePack } from '../contract.js';
import { ADMINISTRATIE_MODULE } from './descriptor.js';
import { ADMINISTRATIE_CLAIMS } from './claims.js';
import { ADMINISTRATIE_GATE } from './gate.js';
import { ADMINISTRATIE_TAXONOMY } from './taxonomy.js';
import { ADMINISTRATIE_SPECIALISTS } from './specialists/index.js';
import { ADMINISTRATIE_FACTS } from './facts.js';
import { ADMINISTRATIE_OUTCOMES } from './outcomes.js';

export const administratiePack: ModulePack = {
  descriptor: ADMINISTRATIE_MODULE,
  claims: ADMINISTRATIE_CLAIMS,
  gate: ADMINISTRATIE_GATE,
  taxonomy: ADMINISTRATIE_TAXONOMY,
  specialists: ADMINISTRATIE_SPECIALISTS,
  facts: ADMINISTRATIE_FACTS,

  // Stap 4 van de fase vult dit. Zolang het leeg is, stelt de module wel
  // concepten voor maar geen schrijfoperaties — en dat is een veilige
  // tussenstand, geen halve functie.
  actions: [],

  outcomes: ADMINISTRATIE_OUTCOMES,

  review: {
    // Een boekingsvoorstel is de meest voorkomende vorm in dit domein. De
    // andere kinds zet de specialist expliciet.
    defaultKind: 'invoice_booking',
  },

  memory: {
    // Lopen gelijk met de `memoryProcessTag` van de specialisten. Een SOP over
    // aanmanen hoort niet opgehaald te worden bij een btw-controle.
    processTags: [
      'invoice_intake',
      'deviation_check',
      'receivables',
      'payables',
      'reconciliation',
      'vat_check',
      'cashflow',
    ],
  },
};

export { ADMINISTRATIE_MODULE };
