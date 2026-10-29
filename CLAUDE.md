# Zuppapp

Vota le zuppe pronte con le stelle (1–5) e dei tag. Prodotto e decisioni: `SPEC.md`.
TanStack Start (React 19, Vite, Nitro) · Drizzle · Better Auth · ParadeDB. Stesse convenzioni di
TriviaMore: tab + punto e virgola (Prettier), `@/` per `src/`, testi UI in italiano.

## Comandi

|                                                    |                                                                                                                                                                                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm db:up` / `pnpm db:down`                      | ParadeDB locale (`compose.yaml`, porta 54330)                                                                                                                                                              |
| `pnpm db:generate --name x`                        | migrazione dallo schema Drizzle                                                                                                                                                                            |
| `pnpm db:migrate`                                  | applica le migrazioni                                                                                                                                                                                      |
| `pnpm dev`                                         | dev server su :3000 con l'ambiente `dev` di Infisical: **il database di produzione**, via Tailscale                                                                                                        |
| `pnpm dev:local`                                   | dev server su :3000 con `.env` e il ParadeDB locale                                                                                                                                                        |
| `pnpm infra:plan` · `infra:apply` · `infra:output` | Terraform di produzione (`infra/README.md`): Infisical, Coolify, DNS                                                                                                                                       |
| `pnpm user:admin <email>`                          | rende admin un account Google già entrato una volta (`--revoke` per togliere)                                                                                                                              |
| `pnpm db:seed`                                     | 4 prodotti d'esempio (EAN 2…, mai reali); come `db:seed:votes` e `--publish`, rifiuta un database non locale                                                                                               |
| `pnpm db:seed:votes`                               | 60 votanti finti su 45 prodotti, per vedere podio e classifica in locale                                                                                                                                   |
| `pnpm catalog:import`                              | zuppe italiane da Open Food Facts come bozze, sull'ambiente `dev` di Infisical (la produzione): `--sync` aggiorna quelle già presenti, `--ean a,b`, `--limit n`, `--dry-run`, `--publish` (solo in locale) |
| `pnpm icons`                                       | rigenera favicon e icone in `public/` (`scripts/make-icons.mjs`)                                                                                                                                           |
| `pnpm test` · `pnpm typecheck` · `pnpm build`      |                                                                                                                                                                                                            |

**Mai `drizzle-kit push`**: non conosce l'indice BM25 di `drizzle/0001_search_index.sql` e lo
cancellerebbe. Ogni modifica passa da `generate` + `migrate`.

## Produzione

Coolify su savvy (`infra/`, Terraform). L'immagine (`Dockerfile`) non legge segreti al build; all'avvio
`docker-entrypoint.sh` entra in Infisical con l'identità `zuppapp-app`, applica le migrazioni
(`scripts/migrate.mjs`) e poi avvia il server. Una sola istanza.

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
- Foto: `copyProductImage` (`src/lib/catalog/images.ts`) le copia nel bucket S3 di Garage (repo `cervinschi-infra`,
  variabili `S3_*` in Infisical) nei 4 formati di Open Food Facts, `<hash>.400.jpg`, così `sizedImage` vale per
  entrambi gli URL. `pnpm catalog:import --images` copia quelle dei prodotti già presenti; senza `S3_*` si usa l'URL
  di Open Food Facts.
- Analytics: Umami self-hosted su cervinschi-hub, senza cookie. Lo script entra nel `head` di `__root` solo se
  `UMAMI_SCRIPT_URL` e `UMAMI_WEBSITE_ID` sono impostate (solo in `prod`), lette all'avvio da `umamiFn`.
  Eventi personalizzati con `track` (`src/lib/analytics/track.ts`, nomi e proprietà tipizzati): mai id, email
  o testo scritto da chi usa l'app.
- `src/lib/catalog/import.ts`: i prodotti nuovi entrano come `draft`; le correzioni a mano stanno in
  `products.overrides` (con la stessa chiave della colonna) e il sync non le tocca; si salva uno snapshot
  nuovo solo se l'etichetta cambia, e ingredienti diversi segnano `recipeChangedAt`.
- Catalogo pubblico: `src/lib/catalog/browse.ts` (classifica, da assaggiare, ricerca, conteggi dei filtri).
  Filtri nell'URL (`browseSchema`, liste come `a,b`). Tre tab: `/` (ricerca), `/classifica`, `/profilo`.
  La classifica ordina per `bayesScore`, la media bayesiana delle stelle (`bayesMean` in `ranking/rules.ts`);
  i badge mostrano la media semplice (`meanStars`).
- I codici che iniziano per 2 (e 02, 04) sono interni dei negozi e non identificano nulla:
  `isStoreInternalCode` li tiene fuori da import e sync.
- Scansione: tasto tondo accanto alla `TabBar` → `/scansiona` (fotocamera) e `/scansiona/<codice>` (risultato). `Scanner` usa `createDetector`
  (`src/lib/barcode/detector.ts`: `BarcodeDetector` nativo o il ponyfill zxing, con il `.wasm` servito da noi, mai da
  jsDelivr). `lookupEan` (`src/lib/catalog/lookup.ts`) guarda il nostro catalogo e poi l'API prodotto di OFF dal
  vivo (timeout 4 s, niente retry, 30/ora per IP): una zuppa completa entra subito come `draft`, il resto diventa il
  modulo di segnalazione. La ricerca funziona per tutti; solo il modulo chiede un account.
- Segnalazioni: `src/lib/reports/` (tabella `product_reports`). Il modulo viaggia come `FormData`; il browser
  ricodifica ogni foto in due JPEG (`toJpeg`, 1600 e 400 px), il server toglie di nuovo i metadati
  (`stripJpegMetadata`) e le salva in `segnalazioni/<uuid>/<n>.400.jpg` e `.full.jpg`. Senza `S3_*` il modulo
  non chiede foto. In `/admin/segnalazioni` si risolvono tutte quelle di un EAN insieme, e le foto si cancellano.
- Admin: `/admin` risponde 404 a chiunque non sia admin (`isAdminFn` in `beforeLoad`), e ogni server
  function di `src/lib/admin/` ricontrolla con `adminMiddleware`. Le correzioni di nome, marca e tipo
  finiscono in `overrides`.
- Utente: `src/lib/user/` (`viewerFn` legge dal database, non dalla cache di 5 minuti della sessione, così
  nome e avatar cambiano subito; `myVotesFn` per «Le mie zuppe»). Il visitatore è precaricato nel loader di
  `__root`. Pagine `/accedi`, `/profilo`, `/le-mie-zuppe`, `/preferiti`.
- Preferiti: `src/lib/favorites/` (tabella `favorites`), solo con un account Google (`accountMiddleware`). Tutti i
  cuori leggono `favoriteQueries.ids`, precaricata in `__root`; `useSetFavorite` la cambia subito (ottimistico).
  La pagina usa `getFavoritesPage` in `catalog/browse.ts`, così le card sono le stesse del catalogo.
- Design system: `DESIGN.md` (leggi «Regole per ogni schermata» prima di toccare la UI) e la pagina `/design`.
  Clash Display arriva dal CDN di Fontshare (la licenza ITF non permette di ridistribuirne i file), Poppins da
  `@fontsource`;
  componenti in `src/components/ds/` e `src/components/catalog/`.
- `product_stats` è un rollup di `votes`: si aggiorna con `refreshProductStats` nella stessa
  transazione che cambia i voti. Il punteggio bayesiano si calcola in lettura, perché dipende
  dalla media globale.
- Un `AppError` (`src/lib/server/errors.ts`) arriva all'utente col suo messaggio; ogni altro errore
  viene sostituito da uno generico.
