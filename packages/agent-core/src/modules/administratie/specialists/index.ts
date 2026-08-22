/**
 * De specialisten van administratie.
 *
 * Acht, en de scheidslijn is steeds het vervolg: boeken, blokkeren, aanmanen,
 * klaarzetten, afletteren, controleren, signaleren, of overdragen aan een mens.
 * Twee specialisten met hetzelfde vervolg zijn er één te veel.
 */

import type { IntentConfig } from '../../../specialists/index.js';
import { invoiceIntakeConfig } from './invoice-intake.js';
import { deviationCheckConfig } from './deviation-check.js';
import { receivablesConfig } from './receivables.js';
import { payablesConfig } from './payables.js';
import { reconciliationConfig } from './reconciliation.js';
import { vatCheckConfig } from './vat-check.js';
import { cashflowConfig } from './cashflow.js';
import { financeEscalateConfig } from './finance-escalate.js';

export const ADMINISTRATIE_SPECIALISTS: readonly IntentConfig[] = Object.freeze([
  invoiceIntakeConfig,
  deviationCheckConfig,
  receivablesConfig,
  payablesConfig,
  reconciliationConfig,
  vatCheckConfig,
  cashflowConfig,
  financeEscalateConfig,
]);

export {
  invoiceIntakeConfig,
  deviationCheckConfig,
  receivablesConfig,
  payablesConfig,
  reconciliationConfig,
  vatCheckConfig,
  cashflowConfig,
  financeEscalateConfig,
};
