# Zuppapp

Vota le zuppe pronte con le stelle (1–5) e dei tag. Prodotto e decisioni: `SPEC.md`.
TanStack Start (React 19, Vite, Nitro) · Drizzle · Better Auth · ParadeDB. Stesse convenzioni di
TriviaMore: tab + punto e virgola (Prettier), `@/` per `src/`, testi UI in italiano.
Stack: web-ts 3 (plugin `stack-web-ts`), più ParadeDB per la ricerca; le migrazioni si applicano all'avvio
(vedi «Produzione»).

## Comandi

|                                               |                                                                                                                                                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm db:up` / `pnpm db:down`                 | ParadeDB locale (`compose.yaml`, porta 54330)                                                                                                                                                              |
| `pnpm db:generate --name x`                   | migrazione dallo schema Drizzle                                                                                                                                                                            |
| `pnpm db:migrate`                             | applica le migrazioni                                                                                                                                                                                      |
| `pnpm dev`                                    | dev server su :3002 con l'ambiente `dev` di Infisical: **il database di produzione**, via Tailscale                                                                                                        |
| `pnpm dev:local`                              | dev server su :3002 con l'ambiente `local` di Infisical: il ParadeDB locale, il client Google di `dev` per riferimento, nessun bucket                                                                      |
| `pnpm user:admin <email>`                     | rende admin un account Google già entrato una volta (`--revoke` per togliere)                                                                                                                              |
| `pnpm db:seed`                                | 4 prodotti d'esempio (EAN 2…, mai reali); come `db:seed:votes` e `--publish`, rifiuta un database non locale                                                                                               |
| `pnpm db:seed:votes`                          | 60 votanti finti su 45 prodotti, per vedere podio e classifica in locale                                                                                                                                   |
| `pnpm catalog:import`                         | zuppe italiane da Open Food Facts come bozze, sull'ambiente `dev` di Infisical (la produzione): `--sync` aggiorna quelle già presenti, `--ean a,b`, `--limit n`, `--dry-run`, `--publish` (solo in locale) |
| `pnpm icons`                                  | rigenera favicon e icone in `public/` (`scripts/make-icons.mjs`)                                                                                                                                           |
| `pnpm test` · `pnpm typecheck` · `pnpm build` |                                                                                                                                                                                                            |

**Mai `drizzle-kit push`**: non conosce l'indice BM25 di `drizzle/0001_search_index.sql` e lo
cancellerebbe. Ogni modifica passa da `generate` + `migrate`.

## Produzione

Coolify, con il deploy in Terraform in una repo privata, che gestisce anche il progetto Infisical (`prod`, `dev`,
`local`). L'immagine (`Dockerfile`) non legge segreti al build; all'avvio
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
- Foto: `copyProductImage` (`src/lib/catalog/images.ts`) le copia nel bucket S3 di Garage (variabili
  `S3_*` in Infisical) nei 4 formati di Open Food Facts, `<hash>.400.jpg`, così `sizedImage` vale per
  entrambi gli URL. `pnpm catalog:import --images` copia quelle dei prodotti già presenti; senza `S3_*` si usa l'URL
  di Open Food Facts.
- Analytics: Umami self-hosted, senza cookie. Lo script entra nel `head` di `__root` solo se
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
  finiscono in `overrides`. Ricerca (testo o inizio dell'EAN) e filtri (`tipo`, `foto`, `voti`, `corretti`,
  `ordine`) stanno nell'URL (`adminListSchema`).
- Cache: dopo un voto o un voto tolto, `refreshAfterVote` (`src/lib/voting/mutations.ts`) segna vecchie tutte le
  query `catalog` (non `lookup`) e `viewer`. Le pagine personali e la scheda caricano con `fetchQuery`, non
  `ensureQueryData`, così una query vecchia si riprende prima di mostrarla.
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

## Controllo di una feature

Il giro dopo una feature o una modifica alla UI è `method:feature-review`. In Zuppapp si fa così:

- Server: `preview_start` con `zuppapp-local-3002` (`.claude/launch.json`: `pnpm dev:local`, cioè Infisical
  `local`, il ParadeDB locale sulla 3002, dove punta anche il redirect di Google). Se manca, si aggiunge con
  `"runtimeArgs": ["dev:local"]`, `"port": 3002` e `"autoPort": false`. **Mai `pnpm dev` né la configurazione
  `zuppapp`**: leggono Infisical `dev`, cioè il database di produzione. Prima `pnpm db:up`,
  poi `pnpm db:migrate` se ci sono migrazioni nuove.
- taste-skill (`taste-skill:design-taste-frontend`, solo revisione: niente draw, niente redesign): i comandi di
  `DESIGN.md` § «Controlli», con `--out .taste-skill/inspect-<rotta>`, una rotta per volta, comprese quelle con
  parametri (`/scansiona/8009999999991`). La rotta di riferimento è `/classifica`. Le eccezioni volute sono
  utility con un nome in `src/styles/globals.css` con `taste-skill-ignore` sulla riga, mai stili inline nei
  componenti.
- ui-ux-pro-max: nessun design system da generare, c'è già `DESIGN.md`. I testi seguono la sua «Voce».
- Le correzioni usano il codice del progetto (token, `buttonClass`, `paperOnRaised`, `cn`), poi
  `pnpm exec prettier --write` sui file toccati. Verifica: `pnpm typecheck` e `pnpm test`; `pnpm build` se
  cambiano dipendenze, import di asset o configurazione.
- Flussi con login o admin: un utente di prova, promosso solo nel database locale e solo per la prova, poi
  rimesso com'era, cancellando i dati di prova:

  ```sql
  update users set is_anonymous=false, role='admin' where id='<id>';  -- prima
  update users set is_anonymous=true,  role='user'  where id='<id>';  -- dopo
  ```

  Dopo ogni cambio, `/api/auth/get-session?disableCookieCache=true` dal browser, se no la sessione resta in cache
  per 5 minuti. `docker exec zuppapp-db-1 psql …` conferma che l'host è quello locale.

- Il resoconto è in italiano. Di solito restano da provare la fotocamera vera e le foto senza bucket S3.

## Skill

Le skill arrivano dai plugin abilitati in `.claude/settings.json` e si chiamano `plugin:skill`. Su una macchina
nuova ogni plugin si installa una volta: `claude plugin install <plugin>@<marketplace> --scope project`.

- Tabelle, colonne, enum, indici, relazioni, migrazioni → `stack-web-ts:drizzle-schema` (e mai `drizzle-kit push`)
- Server function, servizi, query, middleware, errori → `stack-web-ts:server-functions`
- Una migrazione o un input che non deve rompere la versione in produzione → `method:safe-changes`
- Commenti → `method:code-comments`
- Testi che legge qualcun altro (UI, errori, commit, documenti) → `method:plain-writing`, con la «Voce» di
  `DESIGN.md`
- Struttura del codice, «dove va questo?», «è troppo?» → `method:design-principles`
- Una feature grande da decidere prima di scriverla → `method:spec-interview`
- Giro di controllo dopo una feature o una modifica alla UI («il solito giro di check») → `method:feature-review`,
  con le regole di «Controllo di una feature» qui sopra
- Prima di un commit → `method:pre-pr-checklist`

## Scansione pubblica

Ogni push passa `scripts/check-public.sh` da `.githooks/pre-push` (da abilitare una volta per clone:
`git config core.hooksPath .githooks`). Blocca segreti, indirizzi, id e nomi privati in ogni file che il push
porta, e si ferma con exit code 2 se `CLAUDE_KIT_DENYLIST` non punta alla deny list privata. Le impostazioni sono
in `.check-public`, dove una riga `allow` copre un valore pubblicato apposta; lo script è una copia di quello di
`claude-kit`, e le modifiche si fanno lì.
