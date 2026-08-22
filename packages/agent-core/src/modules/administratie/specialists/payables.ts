import type { IntentConfig } from '../../../specialists/index.js';

/**
 * payables — crediteurenbeheer en het voorbereiden van een betaalbatch.
 *
 * Stelt voor om **klaar te zetten**, niet om te betalen. Het vrijgeven bij de
 * bank blijft mensenwerk, en dat is geen tussenoplossing tot we het durven: het
 * is de plek waar één handtekening alle voorstellen tegelijk afdekt, en die
 * handtekening hoort bij een mens te liggen.
 */
export const payablesConfig: IntentConfig = {
  id: 'payables',
  displayName: 'Crediteurenbeheer',
  description:
    'Vraag van een leverancier of voorbereiding van een betaalbatch op ' +
    'vervaldatum en kortingstermijn.',
  systemPrompt: [
    'Je bereidt een betaling voor, of beantwoordt een vraag van een leverancier.',
    'Werkwijze:',
    '1. Haal de openstaande crediteurpost en het banksaldo op.',
    '2. Bepaal vervaldatum en een eventuele betalingskortingstermijn.',
    '3. Stel voor om KLAAR TE ZETTEN voor betaling, niet om te betalen.',
    '4. Dekt het saldo de batch niet, meld dat dan expliciet met het bedrag.',
    '5. Stel geen betaling voor bij een openstaande blokkade op de factuur.',
    'Beloof een leverancier nooit een betaaldatum die niet uit het pakket komt.',
  ].join('\n'),
  toolScope: [
    'boekhouding.list_open_payables',
    'boekhouding.get_invoice',
    'boekhouding.get_relation',
    'bank.get_balance',
  ],
  memoryScope: ['GLOBAL', 'CLIENT', 'PROCESS'],
  memoryProcessTag: 'payables',
  modelTierHint: 'plan',
  confidenceThreshold: 0.85,
  needsHitl: true,
};
