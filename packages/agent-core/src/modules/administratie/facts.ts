/**
 * De feitenbronnen van administratie.
 *
 * ## Waar deze gegevens straks vandaan komen
 *
 * Uit `mcp-boekhouding` (Exact, AFAS, Moneybird, …), `mcp-bank` (PSD2 of een
 * CAMT.053-import) en `mcp-doc` (PDF-extractie). Die drie bestaan nog niet.
 * Tot ze er zijn, wijzen de bronnen naar tabellen in de klant-Supabase — de
 * `aios_fin_*`-tabellen die dit domein zelf bijhoudt, en `demo_fin_*` voor wat
 * straks uit het boekhoudpakket komt.
 *
 * Overstappen is per bron één veld: `source` van
 * `{ kind: 'table', table: 'demo_fin_invoices' }` naar
 * `{ kind: 'mcp', mcp: 'FACTUMAI_MCP_BOEKHOUDING_URL', tool: 'get_invoice' }`.
 * De namen, de invoer en de feiten blijven staan, en daarmee ook alles wat de
 * specialisten erover zeggen.
 *
 * ## Twee dingen die dit domein anders doet
 *
 * **Zoeken op btw-nummer of IBAN, nooit op naam.** "Bergsma B.V." en "Bergsma
 * Groothandel B.V." zijn twee relaties, en een betaling naar de verkeerde is
 * niet terug te draaien met een correctieboeking.
 *
 * **De bank vóór de aanmaning.** `bank.list_transactions` staat bij
 * `receivables` in de scope en draait vóór de aanmaningshistorie. Een
 * herinnering naar iemand die vorige week betaald heeft, kost meer goodwill
 * dan de post waard is.
 */

import type { FactContext, FactDraft, FactProvider } from '../contract.js';

/** Een tekstveld uit de classificatie, of null. */
function veld(ctx: FactContext, naam: string): string | null {
  const waarde = ctx.extracted[naam];
  return typeof waarde === 'string' && waarde.trim() ? waarde.trim() : null;
}

/** De eerste rij van een tabelantwoord. */
function eerste<T>(data: unknown): T | null {
  return Array.isArray(data) && data[0] ? (data[0] as T) : null;
}

/** Alle rijen van een tabelantwoord. */
function rijen<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

// ---------------------------------------------------------------------------
// Inkoopstroom
// ---------------------------------------------------------------------------

/**
 * De extractie van een geüpload document.
 *
 * Leest wat `mcp-doc` erin heeft gezet (`aios_fin_documents.extracted`). Zolang
 * die MCP er niet is, vult het uploadpad dit veld leeg en levert deze bron dus
 * niets — en dan kan het model geen bedrag noemen. Dat is de bedoeling: een
 * boekingsvoorstel zonder extractie is een boekingsvoorstel op basis van de
 * mailtekst, en dat is precies wat we niet willen.
 */
export const EXTRACT_INVOICE: FactProvider = {
  name: 'doc.extract_invoice',
  description: 'De velden die uit de factuur-PDF zijn gelezen, met zekerheid per veld.',
  source: { kind: 'table', table: 'aios_fin_documents' },
  dataCategories: ['financieel'],

  input(ctx) {
    const id = veld(ctx, 'fileId') ?? refOf(ctx, 'fileId');
    if (!id) return null;
    return { id: `eq.${id}`, select: 'filename,extracted,extraction_confidence', limit: '1' };
  },

  toFacts(data, ctx) {
    const rij = eerste<{
      filename: string | null;
      extracted: Record<string, unknown> | null;
      extraction_confidence: Record<string, unknown> | null;
    }>(data);
    if (!rij?.extracted) return [];
    const feiten: FactDraft[] = [
      {
        id: 'doc.extract',
        text: `Factuurextractie uit ${rij.filename ?? 'het document'}: ${JSON.stringify(rij.extracted)}`,
      },
    ];
    // De zekerheid per veld gaat als apart feit mee, zodat het model kan zeggen
    // "het ordernummer las ik met 0,61 zekerheid" in plaats van het als
    // vaststaand te presenteren.
    if (rij.extraction_confidence) {
      feiten.push({
        id: 'doc.extract_confidence',
        text: `Zekerheid per veld: ${JSON.stringify(rij.extraction_confidence)}`,
      });
    }
    void ctx;
    return feiten;
  },
};

/**
 * De leverancier bij een btw-nummer of IBAN.
 *
 * `blocked` gaat mee: een geblokkeerde relatie hoort geen betaalvoorstel op te
 * leveren, en dat is een feit uit het pakket en geen inschatting.
 */
export const FIND_SUPPLIER: FactProvider = {
  name: 'boekhouding.find_supplier',
  description: 'De leverancier bij het btw-nummer of IBAN van de factuur.',
  source: { kind: 'table', table: 'demo_fin_relations' },
  dataCategories: ['commercieel', 'financieel'],

  input(ctx) {
    // Uit de extractie als die er is, anders uit wat de classifier eruit haalde.
    const extractie = ctx.results['doc.extract_invoice'];
    const uitDoc = eerste<{ extracted: Record<string, unknown> | null }>(extractie)?.extracted;
    const btw =
      tekstVan(uitDoc?.vatNumber) ?? veld(ctx, 'vatNumber') ?? null;
    const iban = tekstVan(uitDoc?.iban) ?? veld(ctx, 'iban') ?? null;
    if (!btw && !iban) return null;
    // `or=` want één van beide volstaat, en welke van de twee de factuur
    // draagt, verschilt per leverancier.
    const voorwaarden = [
      btw ? `vat_number.eq.${btw}` : null,
      iban ? `iban.eq.${iban}` : null,
    ].filter(Boolean);
    return {
      or: `(${voorwaarden.join(',')})`,
      select: 'relation_id,name,vat_number,iban,payment_terms,default_ledger,blocked',
      limit: '2',
    };
  },

  toFacts(data) {
    const gevonden = rijen<Record<string, unknown>>(data);
    if (gevonden.length === 0) return [];
    if (gevonden.length > 1) {
      // Twee treffers op btw-nummer of IBAN hoort niet te kunnen. Als het toch
      // gebeurt, is doorgaan met de eerste precies de fout die een betaling
      // bij de verkeerde relatie legt.
      return [
        {
          id: 'boekhouding.supplier',
          text:
            `LET OP: ${gevonden.length} relaties gevonden op hetzelfde btw-nummer of IBAN: ` +
            `${JSON.stringify(gevonden)}. Stel niets voor; dit hoort een mens te bekijken.`,
        },
      ];
    }
    return [{ id: 'boekhouding.supplier', text: `Leverancier: ${JSON.stringify(gevonden[0])}` }];
  },
};

/**
 * Een reeds geboekte post die op deze factuur lijkt.
 *
 * Zonder deze call is "dit is een dubbele" een gok. Mét deze call is het een
 * factuurnummer met een boekdatum, en dat is wat er in het bericht aan de
 * leverancier moet staan.
 */
export const FIND_DUPLICATE: FactProvider = {
  name: 'boekhouding.find_duplicate_invoice',
  description: 'Reeds geboekte facturen met hetzelfde nummer of bedrag bij deze relatie.',
  source: { kind: 'table', table: 'demo_fin_invoices' },
  dataCategories: ['financieel'],

  input(ctx) {
    const relatie = relationIdUit(ctx);
    const nummer = factuurnummerUit(ctx);
    if (!relatie || !nummer) return null;
    return {
      relation_id: `eq.${relatie}`,
      invoice_number: `eq.${nummer}`,
      select: 'invoice_id,invoice_number,booked_at,total_amount,status',
      limit: '5',
    };
  },

  toFacts(data) {
    const treffers = rijen<Record<string, unknown>>(data);
    // Nul treffers is óók een feit, en een belangrijk: het is het bewijs dat de
    // controle gedraaid heeft. Zonder dit feit kan het model niet zeggen "ik
    // heb op dubbelen gecontroleerd".
    return [
      {
        id: 'boekhouding.duplicate',
        text:
          treffers.length === 0
            ? 'Dubbelcontrole uitgevoerd: geen eerder geboekte post met dit factuurnummer bij deze relatie.'
            : `Reeds geboekt met hetzelfde factuurnummer: ${JSON.stringify(treffers)}`,
      },
    ];
  },
};

/** De inkooporder waar deze factuur naar verwijst. */
export const GET_PURCHASE_ORDER: FactProvider = {
  name: 'boekhouding.get_purchase_order',
  description: 'De inkooporder bij de referentie op de factuur, met regels.',
  source: { kind: 'table', table: 'demo_fin_purchase_orders' },
  dataCategories: ['operationeel', 'financieel'],

  input(ctx) {
    const po = poNummerUit(ctx);
    if (!po) return null;
    return { po_number: `eq.${po}`, select: 'po_number,supplier_id,status,lines', limit: '1' };
  },

  toFacts(data) {
    const rij = eerste<Record<string, unknown>>(data);
    return rij ? [{ id: 'boekhouding.po', text: `Inkooporder: ${JSON.stringify(rij)}` }] : [];
  },
};

/** De ontvangstregistratie: het derde been van de driewegmatch. */
export const GET_GOODS_RECEIPT: FactProvider = {
  name: 'boekhouding.get_goods_receipt',
  description: 'Wat er van deze inkooporder daadwerkelijk ontvangen is.',
  source: { kind: 'table', table: 'demo_fin_goods_receipts' },
  dataCategories: ['operationeel'],

  input(ctx) {
    const po = poNummerUit(ctx);
    if (!po) return null;
    return { po_number: `eq.${po}`, select: 'po_number,receipts', limit: '1' };
  },

  toFacts(data) {
    const rij = eerste<Record<string, unknown>>(data);
    return rij ? [{ id: 'boekhouding.receipt', text: `Ontvangst: ${JSON.stringify(rij)}` }] : [];
  },
};

/** De grootboekrekeningen waaruit gekozen mag worden. */
export const LIST_LEDGER_ACCOUNTS: FactProvider = {
  name: 'boekhouding.list_ledger_accounts',
  description: 'De bestaande grootboekrekeningen; de agent verzint er geen.',
  source: { kind: 'table', table: 'demo_fin_ledger_accounts' },
  dataCategories: ['financieel'],

  input() {
    // Altijd van toepassing bij een boeking: zonder de lijst zou het model een
    // rekening moeten bedenken, en dat is de fout die je pas ziet in de
    // jaarrekening.
    return { select: 'code,name,vat_default', order: 'code.asc', limit: '100' };
  },

  toFacts(data) {
    const lijst = rijen<Record<string, unknown>>(data);
    if (lijst.length === 0) return [];
    return [
      {
        id: 'boekhouding.ledger_accounts',
        text: `Grootboekrekeningen (${lijst.length}): ${JSON.stringify(lijst)}`,
      },
    ];
  },
};

// ---------------------------------------------------------------------------
// Debiteuren en crediteuren
// ---------------------------------------------------------------------------

/** Eén factuur uit het pakket, met openstaand bedrag en status. */
export const GET_INVOICE: FactProvider = {
  name: 'boekhouding.get_invoice',
  description: 'De factuur bij dit nummer, met status en openstaand bedrag.',
  source: { kind: 'table', table: 'demo_fin_invoices' },
  dataCategories: ['financieel'],

  input(ctx) {
    const nummer = factuurnummerUit(ctx);
    if (!nummer) return null;
    return {
      invoice_number: `eq.${nummer}`,
      select:
        'invoice_id,invoice_number,type,status,total_amount,open_amount,due_date,relation_id,vat_code',
      limit: '1',
    };
  },

  toFacts(data) {
    const rij = eerste<Record<string, unknown>>(data);
    return rij ? [{ id: 'boekhouding.invoice', text: `Factuur: ${JSON.stringify(rij)}` }] : [];
  },
};

/**
 * De relatie: naam, contactadres, betaaltermijn, IBAN, en of het een consument
 * is.
 *
 * `contactEmail` uit deze bron is het enige adres waar een herinnering heen
 * mag. Zie `outcomes.ts` — het adres uit een binnengekomen bericht wordt nooit
 * gebruikt.
 */
export const GET_RELATION: FactProvider = {
  name: 'boekhouding.get_relation',
  description: 'De relatie bij deze post: adres uit het pakket, betaaltermijn, consument of niet.',
  source: { kind: 'table', table: 'demo_fin_relations' },
  dataCategories: ['commercieel', 'financieel'],

  input(ctx) {
    const relatie = relationIdUit(ctx);
    if (!relatie) return null;
    return {
      relation_id: `eq.${relatie}`,
      select: 'relation_id,name,contact_email,contact_name,payment_terms,iban,is_consumer',
      limit: '1',
    };
  },

  toFacts(data) {
    const rij = eerste<Record<string, unknown>>(data);
    return rij ? [{ id: 'boekhouding.relation', text: `Relatie: ${JSON.stringify(rij)}` }] : [];
  },
};

/** De openstaande debiteurposten, of die van één relatie. */
export const LIST_OPEN_ITEMS: FactProvider = {
  name: 'boekhouding.list_open_items',
  description: 'Openstaande verkoopfacturen, met vervaldatum en aanmaningstrap.',
  source: { kind: 'table', table: 'aios_fin_open_items' },
  dataCategories: ['financieel'],

  input(ctx) {
    const relatie = relationIdUit(ctx);
    const basis: Record<string, unknown> = {
      direction: 'eq.debiteur',
      select: 'invoice_number,relation_id,open_amount,due_date,dunning_stage,blocked',
      order: 'due_date.asc',
      limit: '50',
    };
    // Zonder relatie halen we de hele lijst op — dat is wat de dagelijkse cron
    // nodig heeft. Mét relatie alleen die van hem; posten van een andere
    // relatie horen nooit in de context van een bericht aan deze.
    return relatie ? { ...basis, relation_id: `eq.${relatie}` } : basis;
  },

  toFacts(data) {
    const posten = rijen<Record<string, unknown>>(data);
    if (posten.length === 0) return [];
    return [
      {
        id: 'boekhouding.open_items',
        text: `Openstaande posten (${posten.length}): ${JSON.stringify(posten)}`,
      },
    ];
  },
};

/** De openstaande crediteurposten voor een betaalbatch. */
export const LIST_OPEN_PAYABLES: FactProvider = {
  name: 'boekhouding.list_open_payables',
  description: 'Openstaande inkoopfacturen, met vervaldatum en kortingstermijn.',
  source: { kind: 'table', table: 'aios_fin_open_items' },
  dataCategories: ['financieel'],

  input() {
    return {
      direction: 'eq.crediteur',
      select: 'invoice_number,relation_id,open_amount,due_date,blocked',
      order: 'due_date.asc',
      limit: '50',
    };
  },

  toFacts(data) {
    const posten = rijen<Record<string, unknown>>(data);
    if (posten.length === 0) return [];
    return [
      {
        id: 'boekhouding.open_payables',
        text: `Openstaande crediteurposten (${posten.length}): ${JSON.stringify(posten)}`,
      },
    ];
  },
};

/**
 * De aanmaningshistorie van deze relatie.
 *
 * Voorkomt dat een trap wordt overgeslagen of herhaald. Staat op
 * `persoonsgegevens` zodra die categorie bestaat: betaalachterstand is gevoelige
 * informatie over een persoon, ook al is het geen bijzondere categorie in de zin
 * van artikel 9. Zie het gat dat hierover in OPEN-PUNTEN.md staat.
 */
export const GET_DUNNING_HISTORY: FactProvider = {
  name: 'boekhouding.get_dunning_history',
  description: 'Welke aanmaningstrappen deze relatie al gehad heeft, en wanneer.',
  source: { kind: 'table', table: 'aios_fin_dunning_log' },
  dataCategories: ['financieel'],

  input(ctx) {
    const relatie = relationIdUit(ctx);
    if (!relatie) return null;
    return {
      relation_id: `eq.${relatie}`,
      select: 'stage,channel,sent_at,invoice_number,amount_at_time',
      order: 'sent_at.desc',
      limit: '10',
    };
  },

  toFacts(data) {
    const stappen = rijen<Record<string, unknown>>(data);
    // Leeg is een feit: dan is trap 1 aan de beurt en niet trap 2.
    return [
      {
        id: 'boekhouding.dunning_history',
        text:
          stappen.length === 0
            ? 'Aanmaningshistorie: nog geen enkele trap verstuurd aan deze relatie.'
            : `Aanmaningshistorie: ${JSON.stringify(stappen)}`,
      },
    ];
  },
};

// ---------------------------------------------------------------------------
// Bank
// ---------------------------------------------------------------------------

/**
 * De bankmutaties.
 *
 * Van de omschrijving nemen we alleen wat nodig is om te koppelen. Een
 * bankomschrijving kan bijzondere gegevens bevatten — een betaling aan een
 * zorgverlener zegt iets over iemands gezondheid — en die hoort niet in de
 * context van een model terecht te komen omdat hij toevallig in dezelfde rij
 * stond.
 */
export const LIST_TRANSACTIONS: FactProvider = {
  name: 'bank.list_transactions',
  description: 'Bankmutaties, om te controleren of er al betaald is.',
  source: { kind: 'table', table: 'demo_fin_bank_transactions' },
  dataCategories: ['financieel'],

  input(ctx) {
    const relatie = relationIdUit(ctx);
    const bedrag = ctx.extracted.amount;
    if (!relatie && typeof bedrag !== 'number') return null;
    const basis: Record<string, unknown> = {
      select: 'transaction_id,amount,counterparty_iban,counterparty_name,reference,value_date,reconciled',
      order: 'value_date.desc',
      limit: '25',
    };
    return relatie ? { ...basis, relation_id: `eq.${relatie}` } : basis;
  },

  toFacts(data) {
    const mutaties = rijen<Record<string, unknown>>(data);
    if (mutaties.length === 0) {
      return [
        {
          id: 'bank.transactions',
          text: 'Bankcontrole uitgevoerd: geen ontvangst gevonden die bij deze relatie past.',
        },
      ];
    }
    return [{ id: 'bank.transactions', text: `Bankmutaties: ${JSON.stringify(mutaties)}` }];
  },
};

/** Het banksaldo, voor elke uitspraak over ruimte voor een betaalbatch. */
export const GET_BALANCE: FactProvider = {
  name: 'bank.get_balance',
  description: 'Het actuele saldo per rekening.',
  source: { kind: 'table', table: 'demo_fin_bank_balances' },
  dataCategories: ['financieel'],

  input() {
    return { select: 'iban,balance,currency,as_of', order: 'as_of.desc', limit: '5' };
  },

  toFacts(data) {
    const saldi = rijen<Record<string, unknown>>(data);
    return saldi.length > 0
      ? [{ id: 'bank.balance', text: `Saldi: ${JSON.stringify(saldi)}` }]
      : [];
  },
};

// ---------------------------------------------------------------------------
// Btw
// ---------------------------------------------------------------------------

/** De conceptaangifte van deze periode. */
export const GET_VAT_RETURN: FactProvider = {
  name: 'boekhouding.get_vat_return',
  description: 'De conceptaangifte per rubriek.',
  source: { kind: 'table', table: 'demo_fin_vat_returns' },
  dataCategories: ['financieel'],

  input(ctx) {
    const periode = veld(ctx, 'period');
    if (!periode) return null;
    return { period: `eq.${periode}`, select: 'period,rubrieken,status,due_date', limit: '1' };
  },

  toFacts(data) {
    const rij = eerste<Record<string, unknown>>(data);
    return rij ? [{ id: 'boekhouding.vat_return', text: `Conceptaangifte: ${JSON.stringify(rij)}` }] : [];
  },
};

/** De grootboekposten van deze periode, als onderbouwing per rubriekverschil. */
export const LIST_LEDGER_ENTRIES: FactProvider = {
  name: 'boekhouding.list_ledger_entries',
  description: 'De journaalposten van deze periode.',
  source: { kind: 'table', table: 'demo_fin_ledger_entries' },
  dataCategories: ['financieel'],

  input(ctx) {
    const periode = veld(ctx, 'period');
    if (!periode) return null;
    return {
      period: `eq.${periode}`,
      select: 'entry_id,account,amount,vat_code,entry_date',
      order: 'entry_date.asc',
      limit: '200',
    };
  },

  toFacts(data) {
    const posten = rijen<Record<string, unknown>>(data);
    if (posten.length === 0) return [];
    return [
      {
        id: 'boekhouding.ledger_entries',
        text: `Journaalposten (${posten.length}): ${JSON.stringify(posten)}`,
      },
    ];
  },
};

/** De geldige btw-codes; voorkomt een verzonnen code in een boeking. */
export const GET_VAT_CODES: FactProvider = {
  name: 'boekhouding.get_vat_codes',
  description: 'De btw-codes die dit pakket kent.',
  source: { kind: 'table', table: 'demo_fin_vat_codes' },
  dataCategories: ['financieel'],

  input() {
    return { select: 'code,rate,type', order: 'code.asc', limit: '50' };
  },

  toFacts(data) {
    const codes = rijen<Record<string, unknown>>(data);
    return codes.length > 0
      ? [{ id: 'boekhouding.vat_codes', text: `Btw-codes: ${JSON.stringify(codes)}` }]
      : [];
  },
};

/**
 * De bronnen van deze module, in de volgorde waarin ze draaien.
 *
 * De volgorde is niet willekeurig: de extractie komt vóór de leverancier (die
 * zoekt op het btw-nummer eruit), de leverancier vóór de dubbelcontrole (die
 * zoekt op relatie), en de bank vóór de aanmaningshistorie — eerst kijken of er
 * betaald is, dan pas bepalen welke trap aan de beurt is.
 */
export const ADMINISTRATIE_FACTS: readonly FactProvider[] = Object.freeze([
  EXTRACT_INVOICE,
  FIND_SUPPLIER,
  FIND_DUPLICATE,
  GET_PURCHASE_ORDER,
  GET_GOODS_RECEIPT,
  LIST_LEDGER_ACCOUNTS,
  GET_INVOICE,
  GET_RELATION,
  LIST_OPEN_ITEMS,
  LIST_OPEN_PAYABLES,
  LIST_TRANSACTIONS,
  GET_DUNNING_HISTORY,
  GET_BALANCE,
  GET_VAT_RETURN,
  LIST_LEDGER_ENTRIES,
  GET_VAT_CODES,
]);

// ---------------------------------------------------------------------------
// Kleine lezers
// ---------------------------------------------------------------------------

function tekstVan(waarde: unknown): string | null {
  return typeof waarde === 'string' && waarde.trim() ? waarde.trim() : null;
}

/** Een verwijzing uit de envelop. */
function refOf(ctx: FactContext, naam: string): string | null {
  return tekstVan(ctx.envelope.refs[naam]);
}

/** Het factuurnummer, uit de classificatie of uit de envelop. */
function factuurnummerUit(ctx: FactContext): string | null {
  return veld(ctx, 'invoiceNumber') ?? refOf(ctx, 'invoiceNumber');
}

/** Het inkoopordernummer, uit de extractie, de classificatie of de envelop. */
function poNummerUit(ctx: FactContext): string | null {
  const uitDoc = eerste<{ extracted: Record<string, unknown> | null }>(
    ctx.results['doc.extract_invoice'],
  )?.extracted;
  return tekstVan(uitDoc?.poReference) ?? veld(ctx, 'poNumber') ?? refOf(ctx, 'poNumber');
}

/**
 * De relatie waar dit over gaat.
 *
 * Bij voorkeur uit een eerdere bron — de leverancier die op btw-nummer is
 * gevonden, of de factuur die is opgehaald. Pas als laatste uit wat de
 * classifier eruit las: dat is het minst betrouwbare van de drie, want het
 * komt uit een bericht dat iedereen kan sturen.
 */
function relationIdUit(ctx: FactContext): string | null {
  const leverancier = eerste<{ relation_id?: unknown }>(ctx.results['boekhouding.find_supplier']);
  const factuur = eerste<{ relation_id?: unknown }>(ctx.results['boekhouding.get_invoice']);
  return (
    tekstVan(leverancier?.relation_id) ??
    tekstVan(factuur?.relation_id) ??
    veld(ctx, 'relationId') ??
    refOf(ctx, 'relationId')
  );
}
