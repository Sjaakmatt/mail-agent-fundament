# Administratie — gebouwd, nog niet aangezet

De schil-helft van de tweede module. Wat hier staat werkt en compileert:

- `proposed.ts` — de vormen van `proposed` per kind, plus `euro()` en de
  specialist-labels.
- `detail/DetailView.tsx` — het detailscherm voor de zeven kinds.

**Wat er ontbreekt is `index.ts`**, de registratie zelf. Die kan er nog niet
staan, en dat is geen vergetelheid maar de uitkomst van fase 5.

`index.ts` moet de descriptor importeren:

```ts
import { ADMINISTRATIE_MODULE } from "@factumai/agent-core/modules/administratie";
```

Dat subpad bestaat niet. De exports-map in `packages/agent-core/package.json`
noemt alleen `./modules/klantenservice`, en die map staat buiten de vier
plekken die een nieuwe module volgens de fase-opdracht mag aanraken. De
volledige registratie staat klaar in `OPEN-PUNTEN.md` onder "Uit fase 5" —
zodra het gat gerepareerd is, is dit bestand een kopieeractie.

Zie `OPEN-PUNTEN.md` voor de vijf gaten die aanzetten blokkeren.
