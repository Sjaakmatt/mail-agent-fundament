/**
 * Hoe administratie zich bij de werkbak aanmeldt.
 *
 * Los van `pack.ts`, om dezelfde reden als bij klantenservice: de cockpit
 * importeert de descriptor, en zou hij in het pakket zitten, dan trekt elke
 * import ook de prompts en de actietypen de browserbundel in.
 */

import { ADMINISTRATIE_TAXONOMY } from './taxonomy.js';
import type { ModuleDescriptor } from '../index.js';

export const ADMINISTRATIE_MODULE: ModuleDescriptor = {
  id: 'administratie',
  label: 'Administratie',
  description:
    'Inkoopfacturen, openstaande posten, betalingen en btw — met een voorstel ' +
    'dat een mens goedkeurt.',
  // Negen vormen, tegen twee bij klantenservice. Dat is geen wildgroei maar
  // het domein: een boekingsvoorstel, een aanmaning en een btw-rapport zijn
  // drie verschillende dingen om naar te kijken, en de werkbak sorteert erop.
  kinds: [
    'invoice_booking',
    'payment_reminder',
    'dunning_step',
    'payment_batch',
    'reconciliation_match',
    'vat_report',
    'credit_note',
    'draft_email',
    'task',
  ],
  categories: ADMINISTRATIE_TAXONOMY.map((c) => ({ slug: c.slug, label: c.label })),
};
