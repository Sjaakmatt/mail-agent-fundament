/**
 * Het detailscherm van een administratie-item.
 *
 * Zeven kinds, één scherm, en de opbouw is steeds hetzelfde: links wát er
 * voorgesteld wordt met de cijfers erbij, rechts waar die cijfers vandaan
 * komen. Dat laatste is in dit domein niet decoratief — een boekingsvoorstel
 * zonder herleidbaar bedrag is een boekingsvoorstel dat je niet mag goedkeuren.
 *
 * Waarom dit hier staat en niet in de schil: zie de toelichting bij
 * `DetailView` in `ui/lib/modules/contract.ts`. Een boekingsvoorstel met een
 * driewegmatch en een concept-aanmaning met een aanmaningstrap zijn geen
 * varianten van één viewmodel.
 */

import Link from "next/link";
import { ArrowLeft, AlertTriangle, Clock, Receipt, ShieldAlert } from "lucide-react";
import type { ReviewItemRow } from "@/lib/review";
import type { AuthedAccess } from "@/lib/auth/access";
import { AssistantSubject } from "@/components/assistant/AssistantContext";
import { cn, timeAgoNL } from "@/lib/utils";
import { euro, finProposed, finSpecialistLabel } from "../proposed";

const STATUS_META: Record<string, { label: string; klasse: string }> = {
  PENDING: { label: "Te beoordelen", klasse: "text-accent-700 bg-accent-50 border-accent-200" },
  APPROVED: { label: "Goedgekeurd", klasse: "text-green-700 bg-green-50 border-green-200" },
  EDITED: { label: "Bewerkt & doorgezet", klasse: "text-green-700 bg-green-50 border-green-200" },
  EXECUTED: { label: "Uitgevoerd", klasse: "text-green-700 bg-green-50 border-green-200" },
  REJECTED: { label: "Afgewezen", klasse: "text-ink-muted bg-surface-muted border-line" },
};

export async function AdministratieDetail({
  row,
}: {
  row: ReviewItemRow;
  user: AuthedAccess;
}) {
  const proposed = finProposed(row);
  const meta = STATUS_META[row.status] ?? STATUS_META.PENDING;
  const titel = proposed.subject ?? row.summary;

  return (
    <>
      <AssistantSubject reviewItemId={row.id} label={`dit voorstel — ${titel}`} />

      <div className="bg-white border-b border-brand-100 px-4 sm:px-8 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-brand-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar werkbak
        </Link>
        <div className="flex items-start justify-between gap-4 mt-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold text-brand-700 leading-tight">
              {titel}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
                {row.kind.replace(/_/g, " ")}
              </span>
              <span className="text-brand-200">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                {timeAgoNL(row.created_at)}
              </span>
            </div>
          </div>
          <div className={cn("px-3 py-2 rounded-lg border text-sm font-semibold", meta.klasse)}>
            {meta.label}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <VoorstelBlok row={row} />
              {proposed.body ? (
                <Paneel titel="Concept-bericht">
                  <p className="text-xs text-ink-subtle mb-2">
                    Gaat naar het adres uit het pakket, niet naar de afzender van een
                    binnengekomen bericht.
                  </p>
                  <pre className="whitespace-pre-wrap text-sm text-ink font-sans">
                    {proposed.body}
                  </pre>
                </Paneel>
              ) : null}
              <Ontbreekt items={proposed.ontbreekt} />
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Paneel titel="Waar dit op steunt">
                <Grounding row={row} />
              </Paneel>
              <Paneel titel="Classificatie">
                <Rij label="Categorie" waarde={proposed.classification?.category ?? "—"} />
                <Rij
                  label="Specialist"
                  waarde={finSpecialistLabel(proposed.classification?.specialist) ?? "—"}
                />
                <Rij
                  label="Zekerheid"
                  waarde={
                    typeof row.confidence === "number"
                      ? `${Math.round(row.confidence * 100)}%`
                      : "—"
                  }
                />
              </Paneel>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Het inhoudelijke blok, per soort voorstel. */
function VoorstelBlok({ row }: { row: ReviewItemRow }) {
  const p = finProposed(row);

  if (row.kind === "invoice_booking") {
    return (
      <Paneel titel="Boekingsvoorstel">
        <Rij label="Leverancier" waarde={p.supplier?.name ?? "niet vastgesteld"} />
        <Rij label="Factuurnummer" waarde={p.invoice?.number ?? "—"} />
        <Rij label="Factuurdatum" waarde={p.invoice?.date ?? "—"} />
        <Rij label="Vervaldatum" waarde={p.invoice?.dueDate ?? "—"} />
        <Rij label="Netto" waarde={euro(p.invoice?.netAmount) ?? "—"} />
        <Rij label="Btw" waarde={euro(p.invoice?.vatAmount) ?? "—"} />
        <Rij label="Totaal" waarde={euro(p.invoice?.totalAmount) ?? "—"} nadruk />
        <div className="h-px bg-line my-3" />
        <Rij label="Grootboek" waarde={p.booking?.ledgerAccount ?? "leeg gelaten"} />
        <Rij label="Btw-code" waarde={p.booking?.vatCode ?? "leeg gelaten"} />
        <Rij label="Kostenplaats" waarde={p.booking?.costCenter ?? "leeg gelaten"} />
        <Match match={p.match} />
        <Dubbel check={p.duplicateCheck} />
      </Paneel>
    );
  }

  if (row.kind === "payment_reminder" || row.kind === "dunning_step") {
    return (
      <Paneel titel={row.kind === "dunning_step" ? "Aanmaning" : "Herinnering"}>
        <Rij label="Relatie" waarde={p.relation?.name ?? "—"} />
        <Rij label="Adres uit het pakket" waarde={p.relation?.contactEmail ?? "—"} />
        <Rij label="Openstaand" waarde={euro(p.totalOpen) ?? "—"} nadruk />
        <Rij
          label="Aanmaningstrap"
          waarde={
            p.dunning?.stage
              ? `trap ${p.dunning.stage}${
                  p.dunning.previousSentAt ? ` (vorige: ${p.dunning.previousSentAt})` : ""
                }`
              : "—"
          }
        />
        {p.relation?.isConsumer ? (
          <p className="mt-2 text-xs text-alert-600">
            Consument: de wettelijke termijnen en de veertiendagenbrief gelden hier.
          </p>
        ) : null}
        <BankControle check={p.paymentCheck} />
        <Posten items={p.items} />
      </Paneel>
    );
  }

  if (row.kind === "reconciliation_match") {
    return (
      <Paneel titel="Bankmutatie koppelen">
        <Rij label="Bedrag" waarde={euro(p.transaction?.amount) ?? "—"} nadruk />
        <Rij label="Tegenpartij" waarde={p.transaction?.counterpartyName ?? "—"} />
        <Rij label="IBAN" waarde={p.transaction?.counterpartyIban ?? "—"} />
        <Rij label="Boekdatum" waarde={p.transaction?.valueDate ?? "—"} />
        <div className="mt-3">
          <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">
            Kandidaten
          </h3>
          {(p.candidates ?? []).length === 0 ? (
            <p className="text-sm text-ink-muted">Geen kandidaat gevonden.</p>
          ) : (
            <ul className="space-y-1.5">
              {(p.candidates ?? []).map((k, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium">{k.invoiceNumber}</span>{" "}
                  <span className="text-ink-muted">{euro(k.openAmount)}</span>
                  {k.reason ? <span className="text-ink-subtle"> — {k.reason}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Paneel>
    );
  }

  if (row.kind === "vat_report") {
    return (
      <Paneel titel={`Btw-controle ${p.period ?? ""}`}>
        {(p.differences ?? []).length === 0 ? (
          <p className="text-sm text-ink-muted">Geen verschillen gevonden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-muted uppercase tracking-wide">
                <th className="pb-1">Rubriek</th>
                <th className="pb-1">Aangifte</th>
                <th className="pb-1">Grootboek</th>
                <th className="pb-1">Verschil</th>
              </tr>
            </thead>
            <tbody>
              {(p.differences ?? []).map((d, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="py-1.5 font-medium">{d.rubriek}</td>
                  <td className="py-1.5">{euro(d.aangifte)}</td>
                  <td className="py-1.5">{euro(d.grootboek)}</td>
                  <td className="py-1.5 text-alert-600 font-medium">{euro(d.verschil)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-3 text-xs text-ink-subtle">
          Een constatering, geen fiscaal oordeel. Stem verschillen af met de accountant.
        </p>
      </Paneel>
    );
  }

  // draft_email, task, payment_batch, credit_note: de samenvatting plus wat er staat.
  return (
    <Paneel titel="Voorstel">
      <p className="text-sm text-ink">{row.summary}</p>
    </Paneel>
  );
}

function Match({ match }: { match?: InvoiceMatch }) {
  if (!match) return null;
  if (match.status === "match") {
    return (
      <p className="mt-3 text-sm text-green-700">
        Driewegmatch klopt{match.poNumber ? ` met inkooporder ${match.poNumber}` : ""}.
      </p>
    );
  }
  if (match.status === "geen_po") {
    return (
      <p className="mt-3 text-sm text-ink-muted">
        Geen inkooporder gevonden. Boeken kan, maar zonder referentie.
      </p>
    );
  }
  return (
    <div className="mt-3 rounded-lg border border-alert-200 bg-alert-50 p-3">
      <p className="flex items-center gap-1.5 text-sm font-medium text-alert-700">
        <AlertTriangle className="w-4 h-4" aria-hidden="true" />
        Afwijking ten opzichte van inkooporder {match.poNumber}
      </p>
      <ul className="mt-1.5 space-y-1 text-sm text-alert-700">
        {(match.differences ?? []).map((d, i) => (
          <li key={i}>
            {d.field}: order {euro(d.po)} · factuur {euro(d.invoice)}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface InvoiceMatch {
  poNumber?: string;
  status?: "match" | "afwijking" | "geen_po";
  differences?: Array<{ field: string; po?: number; invoice?: number }>;
}

function Dubbel({
  check,
}: {
  check?: { checked?: boolean; matches?: Array<Record<string, unknown>> };
}) {
  if (!check?.checked) {
    return (
      <p className="mt-3 text-sm text-alert-600">
        Dubbelcontrole is niet uitgevoerd. Beoordeel handmatig voordat je boekt.
      </p>
    );
  }
  if ((check.matches ?? []).length === 0) {
    return (
      <p className="mt-3 text-sm text-ink-muted">
        Dubbelcontrole uitgevoerd: geen eerdere post met dit factuurnummer.
      </p>
    );
  }
  return (
    <div className="mt-3 rounded-lg border border-alert-200 bg-alert-50 p-3 text-sm text-alert-700">
      <p className="flex items-center gap-1.5 font-medium">
        <ShieldAlert className="w-4 h-4" aria-hidden="true" />
        Mogelijk al geboekt
      </p>
      <pre className="mt-1 whitespace-pre-wrap text-xs">
        {JSON.stringify(check.matches, null, 2)}
      </pre>
    </div>
  );
}

function BankControle({
  check,
}: {
  check?: { bankChecked?: boolean; matchingTransactions?: unknown[] };
}) {
  if (!check?.bankChecked) {
    return (
      <p className="mt-3 text-sm text-alert-600">
        De bank is niet geraadpleegd. Controleer zelf of er al betaald is voordat je
        dit verstuurt.
      </p>
    );
  }
  const treffers = check.matchingTransactions ?? [];
  return (
    <p className="mt-3 text-sm text-ink-muted">
      {treffers.length === 0
        ? "Bank gecontroleerd: geen betaling gevonden die bij deze post past."
        : `Bank gecontroleerd: ${treffers.length} mogelijke betaling(en) gevonden — kijk hier eerst naar.`}
    </p>
  );
}

function Posten({
  items,
}: {
  items?: Array<{ invoiceNumber?: string; openAmount?: number; dueDate?: string; daysOverdue?: number }>;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-3">
      <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">
        Posten
      </h3>
      <ul className="space-y-1">
        {items.map((p, i) => (
          <li key={i} className="text-sm flex items-baseline gap-2">
            <span className="font-medium">{p.invoiceNumber}</span>
            <span>{euro(p.openAmount)}</span>
            <span className="text-ink-subtle text-xs">
              vervallen {p.dueDate}
              {typeof p.daysOverdue === "number" ? ` · ${p.daysOverdue} dagen` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Wat de agent niet heeft kunnen vaststellen. Altijd tonen, ook als het leeg is. */
function Ontbreekt({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <Paneel titel="Niet vastgesteld">
      <ul className="list-disc list-inside space-y-1 text-sm text-ink">
        {items.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </Paneel>
  );
}

/** Welke bron welk cijfer dekt. In dit domein het belangrijkste paneel. */
function Grounding({ row }: { row: ReviewItemRow }) {
  const refs = row.grounding ?? [];
  if (refs.length === 0) {
    return (
      <p className="text-sm text-alert-600">
        Geen enkel cijfer in dit voorstel is herleid naar een bron. Beoordeel het
        volledig handmatig.
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {refs.map((g, i) => (
        <li key={i} className="text-sm">
          <span className="font-medium">{g.claim}</span>{" "}
          <span className="text-ink-subtle text-xs">via {g.tool}</span>
        </li>
      ))}
    </ul>
  );
}

function Paneel({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-brand-100 p-4 sm:p-5">
      <h2 className="font-display text-sm font-semibold text-brand-700 mb-3">{titel}</h2>
      {children}
    </section>
  );
}

function Rij({
  label,
  waarde,
  nadruk,
}: {
  label: string;
  waarde: string;
  nadruk?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-0.5">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className={cn("text-sm text-ink", nadruk && "font-semibold text-base")}>
        {waarde}
      </span>
    </div>
  );
}
