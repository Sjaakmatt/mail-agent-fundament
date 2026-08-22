/**
 * De vormen van `proposed` bij een administratie-item.
 *
 * Zeven kinds, en dat is geen wildgroei maar het domein: een boekingsvoorstel,
 * een aanmaning en een btw-rapport zijn drie verschillende dingen om naar te
 * kijken. Ze delen alleen dát er een mens naar kijkt — precies de reden dat het
 * detailscherm van een module komt en niet uit een gedeeld viewmodel (zie
 * `docs/MODULES.md`).
 *
 * Alle bedragen zijn getallen in euro's, zoals het pakket ze teruggeeft. Niet
 * geformatteerd: opmaak is een keuze van het scherm, en een bedrag dat als
 * tekst door de lus reist, is niet meer te vergelijken met wat de bron zei.
 */

import type { ReviewItemRow } from "@/lib/review";

export interface FinRelatie {
  relationId?: string;
  name?: string;
  contactEmail?: string;
  isConsumer?: boolean;
}

export interface FinClassificatie {
  category?: string;
  confidence?: number;
  specialist?: string | null;
  extracted?: Record<string, unknown>;
}

/** Wat elk voorstel in dit domein draagt. */
interface FinBasis {
  classification?: FinClassificatie;
  /** Concept-tekst waar er een naar buiten gaat (herinnering, aanmaning). */
  subject?: string;
  body?: string;
  /** Het ruwe bewijsstuk zoals het domein het aanleverde. */
  original?: Record<string, unknown>;
  /** Wat de agent niet heeft kunnen vaststellen. Altijd tonen. */
  ontbreekt?: string[];
  [key: string]: unknown;
}

export interface InvoiceBookingProposed extends FinBasis {
  supplier?: FinRelatie;
  invoice?: {
    number?: string;
    date?: string;
    dueDate?: string;
    netAmount?: number;
    vatAmount?: number;
    totalAmount?: number;
  };
  booking?: { ledgerAccount?: string; vatCode?: string; costCenter?: string };
  match?: {
    poNumber?: string;
    status?: "match" | "afwijking" | "geen_po";
    differences?: Array<{ field: string; po?: number; invoice?: number }>;
  };
  duplicateCheck?: { checked?: boolean; matches?: Array<Record<string, unknown>> };
  extractionConfidence?: Record<string, number>;
}

export interface ReminderProposed extends FinBasis {
  relation?: FinRelatie;
  items?: Array<{
    invoiceNumber?: string;
    openAmount?: number;
    dueDate?: string;
    daysOverdue?: number;
  }>;
  totalOpen?: number;
  dunning?: { stage?: number; previousStage?: number; previousSentAt?: string };
  paymentCheck?: { bankChecked?: boolean; matchingTransactions?: unknown[] };
}

export interface ReconciliationProposed extends FinBasis {
  transaction?: {
    transactionId?: string;
    amount?: number;
    counterpartyName?: string;
    counterpartyIban?: string;
    valueDate?: string;
  };
  candidates?: Array<{ invoiceNumber?: string; openAmount?: number; reason?: string }>;
}

export interface VatReportProposed extends FinBasis {
  period?: string;
  differences?: Array<{
    rubriek?: string;
    aangifte?: number;
    grootboek?: number;
    verschil?: number;
    entries?: string[];
  }>;
  icp?: { count?: number; total?: number };
}

export type AdministratieProposed = InvoiceBookingProposed &
  ReminderProposed &
  ReconciliationProposed &
  VatReportProposed;

export function finProposed(
  row: Pick<ReviewItemRow, "proposed">,
): AdministratieProposed {
  return (row.proposed ?? {}) as AdministratieProposed;
}

/**
 * Een bedrag zoals de administratie het leest.
 *
 * Nederlandse notatie met twee decimalen, ook bij ronde bedragen: "€ 3.410,00"
 * leest als geld en "€ 3410" als een aantal.
 */
export function euro(bedrag: unknown): string | null {
  if (typeof bedrag !== "number" || !Number.isFinite(bedrag)) return null;
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(bedrag);
}

/** De specialisten van dit domein, leesbaar. */
export const FIN_SPECIALIST_LABELS: Record<string, string> = {
  invoice_intake: "Inkoopfactuur",
  deviation_check: "Afwijking",
  receivables: "Debiteuren",
  payables: "Crediteuren",
  reconciliation: "Afletteren",
  vat_check: "Btw-controle",
  cashflow: "Cashflow",
  finance_escalate: "Escalatie",
};

export function finSpecialistLabel(slug?: string | null): string | null {
  if (!slug) return null;
  return FIN_SPECIALIST_LABELS[slug] ?? slug;
}
