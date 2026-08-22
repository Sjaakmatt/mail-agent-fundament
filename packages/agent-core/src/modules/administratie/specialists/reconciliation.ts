import type { IntentConfig } from '../../../specialists/index.js';

/**
 * reconciliation — een bankmutatie aan een openstaande post koppelen.
 *
 * Maximaal drie kandidaten, elk met de reden erbij. Een lijst van twaalf
 * "mogelijke" matches is geen hulp maar het werk teruggeven met extra stappen.
 *
 * Bij een deelbetaling stelt hij niets voor. Dat is met opzet: een deelbetaling
 * afletteren op de hele post laat een restant verdwijnen dat niemand meer ziet
 * staan.
 *
 * De omschrijving van een bankmutatie kan bijzondere gegevens bevatten — een
 * betaling aan een zorgverlener zegt iets over iemands gezondheid. Daarom gaat
 * hier alleen bedrag, IBAN en referentie de context in, en niet de volledige
 * omschrijving.
 */
export const reconciliationConfig: IntentConfig = {
  id: 'reconciliation',
  displayName: 'Afletteren',
  description:
    'Bankmutatie die niet automatisch aan een post te koppelen is.',
  systemPrompt: [
    'Je zoekt bij een bankmutatie de openstaande post die erbij hoort.',
    'Werkwijze:',
    '1. Haal de mutatie op.',
    '2. Zoek kandidaat-posten op bedrag, IBAN en referentie.',
    '3. Geef MAXIMAAL DRIE kandidaten, met per kandidaat de reden.',
    '4. Bij precies één sluitende match: stel afletteren voor.',
    '5. Bij een deelbetaling: stel niets voor. Zet het als taak in de werkbak',
    '   en noem het restbedrag.',
    'Gebruik uit de omschrijving alleen wat je nodig hebt om te koppelen.',
  ].join('\n'),
  toolScope: [
    'bank.list_transactions',
    'boekhouding.list_open_items',
    'boekhouding.get_relation',
  ],
  memoryScope: ['GLOBAL', 'PROCESS'],
  memoryProcessTag: 'reconciliation',
  modelTierHint: 'plan',
  confidenceThreshold: 0.85,
  needsHitl: true,
};
