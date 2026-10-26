# Zuppapp

Vota le zuppe pronte con una faccia (1–4) e dei tag. Prodotto e decisioni: `SPEC.md`.
TanStack Start (React 19, Vite, Nitro) · Drizzle · Better Auth · ParadeDB. Stesse convenzioni di
TriviaMore: tab + punto e virgola (Prettier), `@/` per `src/`, testi UI in italiano.

## Comandi

|                                               |                                                                                                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm db:up` / `pnpm db:down`                 | ParadeDB locale (`compose.yaml`, porta 54330)                                                                                                            |
| `pnpm db:generate --name x`                   | migrazione dallo schema Drizzle                                                                                                                          |
| `pnpm db:migrate`                             | applica le migrazioni                                                                                                                                    |
| `pnpm dev`                                    | dev server su :3000, legge `.env`                                                                                                                        |
| `pnpm user:admin <email>`                     | rende admin un account Google già entrato una volta (`--revoke` per togliere)                                                                            |
| `pnpm db:seed`                                | 4 prodotti d'esempio (EAN 2…, mai reali)                                                                                                                 |
| `pnpm db:seed:votes`                          | 60 votanti finti su 45 prodotti, per vedere podio e classifica in locale                                                                                 |
| `pnpm catalog:import`                         | zuppe italiane da Open Food Facts come bozze: `--sync` aggiorna quelle già presenti, `--ean a,b`, `--limit n`, `--dry-run`, `--publish` (solo in locale) |
| `pnpm test` · `pnpm typecheck` · `pnpm build` |                                                                                                                                                          |

**Mai `drizzle-kit push`**: non conosce l'indice BM25 di `drizzle/0001_search_index.sql` e lo
cancellerebbe. Ogni modifica passa da `generate` + `migrate`.

## Architettura

- `src/db/schema/entities/` — tabelle per area: `auth`, `catalog`, `voting`, `community`.
- `src/lib/<dominio>/service.ts` — casi d'uso; `db/<tabella>.ts` solo per query usate da più moduli,
  con `db: DbOrTx` come primo argomento.
- `src/lib/search/` — l'unico modulo che sa di ParadeDB (SQL grezzo: Drizzle non ha gli operatori
  `|||`, `pdb.fuzzy`, `pdb.score`).
- `src/lib/ranking/rules.ts` — formula della classifica, senza database.
- `src/lib/auth/server.ts` — Better Auth: Google + plugin `anonymous`; al login `onLinkAccount`
  sposta i voti con `moveVotes`.
- `src/lib/<dominio>/api/<endpoint>.ts` — una server function per file, `.validator(zodSchema)`
  (in questa versione di TanStack Start non è più `inputValidator`).
- Il primo voto di chi non ha sessione crea l'utente anonimo lato client (`ensureVoter` in
  `src/lib/voting/mutations.ts`), passando il token Turnstile se `VITE_TURNSTILE_SITE_KEY` è impostata.
  Il voto si salva dopo 600 ms di quiete (`useVote`).
- Limite voti per IP in memoria (`src/lib/server/rate-limit.ts`): basta finché l'app è un solo processo.
- `src/lib/off/` legge Open Food Facts: Search-a-licious solo per scoprire i codici (la ricerca classica
  risponde 503 e le sue copie sono vecchie), l'API prodotto per i dati, al massimo 100 letture al minuto,
  con uno User-Agent che identifica l'app. `map.ts` è puro e testato.
- `src/lib/catalog/import.ts`: i prodotti nuovi entrano come `draft`; le correzioni a mano stanno in
  `products.overrides` (con la stessa chiave della colonna) e il sync non le tocca; si salva uno snapshot
  nuovo solo se l'etichetta cambia, e ingredienti diversi segnano `recipeChangedAt`.
- Catalogo pubblico: `src/lib/catalog/browse.ts` (classifica, da assaggiare, ricerca, conteggi dei filtri).
  Filtri nell'URL (`browseSchema`, liste come `a,b`). La classifica ordina per `bayesRebuyShare`, la stessa
  quota che i cartellini mostrano.
- I codici che iniziano per 2 (e 02, 04) sono interni dei negozi e non identificano nulla:
  `isStoreInternalCode` li tiene fuori da import e sync.
- Admin: `/admin` risponde 404 a chiunque non sia admin (`isAdminFn` in `beforeLoad`), e ogni server
  function di `src/lib/admin/` ricontrolla con `adminMiddleware`. Le correzioni di nome, marca e tipo
  finiscono in `overrides`.
- Design system: `DESIGN.md` (leggi «Regole per ogni schermata» prima di toccare la UI) e la pagina `/design`;
  componenti in `src/components/ds/` e `src/components/catalog/`.
- `product_stats` è un rollup di `votes`: si aggiorna con `refreshProductStats` nella stessa
  transazione che cambia i voti. Il punteggio bayesiano si calcola in lettura, perché dipende
  dalla media globale.
- Un `AppError` (`src/lib/server/errors.ts`) arriva all'utente col suo messaggio; ogni altro errore
  viene sostituito da uno generico.
