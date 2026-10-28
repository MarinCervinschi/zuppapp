---
name: controllo-feature
description: Giro di controllo di Zuppapp dopo una feature nuova o una modifica alla UI. Passa le schermate toccate per taste-skill (lint e inspect), ui-ux-pro-max e le sei skill di interfaces, unisce i risultati in un'unica lista ordinata per gravità, corregge i problemi confermati e riverifica nel browser locale. Usala quando l'utente chiede il «solito giro di check», di cercare incongruenze, errori o problemi di design e accessibilità in una feature, o invoca /controllo-feature.
---

# Controllo di una feature

Un giro di revisione completo su quello che è cambiato, poi le correzioni. Si ferma prima dei commit: quelli
li decide l'utente.

## 1. Delimita il perimetro

- Ricava i file toccati: `git status --short` e `git diff --stat`, oppure il range che indica l'utente.
- Ricava le **rotte** che li mostrano (`src/routes/…`) e gli **stati** da vedere: vuoto, caricamento, errore,
  senza login, con login, admin, telefono a 320 e 375 px, tema scuro.
- Scrivi il perimetro in una riga e rispettalo. Quello che resta fuori lo dici, non lo dai per controllato.

## 2. Avvia il server locale, mai quello di produzione

- `preview_start` con **`zuppapp-local-3002`** (`.claude/launch.json`): `.env` e il ParadeDB locale, con
  `BETTER_AUTH_URL` sulla 3002 così l'accesso funziona. Se manca, aggiungila con `"env": {"BETTER_AUTH_URL":
"http://localhost:3002"}`, `--strictPort` e `"autoPort": false`.
- **Mai `pnpm dev` né la configurazione `zuppapp`**: leggono Infisical `dev`, cioè il database di produzione.
- Il database locale deve essere su: `pnpm db:up`, poi `pnpm db:migrate` se ci sono migrazioni nuove.

## 3. taste-skill: lint e inspect

Carica `taste-skill:design-taste-frontend` (è una revisione: niente draw, niente redesign), poi i comandi di
`DESIGN.md` § «Controlli», con la cartella della skill al posto di `<taste-skill>`:

```bash
node <taste-skill>/scripts/lint.mjs src
node <taste-skill>/scripts/inspect.mjs http://localhost:3002/<rotta> --app \
  --allow font-not-dealt,palette-cream,gradient,app-title-size,colour-sprawl --out .taste-skill/inspect-<rotta>
```

- Una rotta per volta, comprese quelle con parametri (`/scansiona/8009999999991`). Aggiungi `/classifica`
  come riferimento: se fallisce anche lì, il problema non è della feature.
- **Apri gli screenshot** che l'inspect elenca (desktop, tablet, mobile) e guardali: un problema visibile è
  reale qualunque cosa dica il codice.
- Le eccezioni volute stanno in utility con un nome in `src/styles/globals.css` con `taste-skill-ignore`
  sulla riga (`.glass`, `.viewfinder`, `.float-shadow`…), mai inline nei componenti.
- Un `WARN` resta solo se lo sai difendere in una frase (per esempio «il video è la fotocamera dal vivo, non
  ha poster»).

## 4. ui-ux-pro-max

Carica `ui-ux-pro-max:ui-ux-pro-max` e passa i file con la sua Quick Reference, in ordine di priorità: §1
accessibilità, §2 tocco e interazione, §5 layout, §8 form e feedback, §9 navigazione. Non serve generare un
design system: c'è già `DESIGN.md`. Cerca soprattutto:

- azioni distruttive senza conferma o annulla;
- pulsanti senza stato di caricamento in operazioni lente;
- campi che il browser compilerebbe con dati personali (`autoComplete`);
- colori legati a un ruolo usati per altro (per esempio `bg-text` come «nero», che nel tema scuro diventa chiaro).

## 5. interfaces

Carica `interfaces:better-interface`, poi tutte e sei le skill di dominio, in quest'ordine:
`better-accessibility`, `better-layout`, `better-writing`, `better-typography`, `better-colors`, `better-ui`.
Una skill che non hai caricato è un dominio «non controllato», non «a posto».

Gli inneschi `HIGH` da cercare sempre: controllo senza nome accessibile, niente focus visibile, azione
distruttiva senza conferma né annulla, contenuto tagliato o barra che esce dallo schermo a **320 px**, errore
che non dice come rimediare, significato affidato al solo colore, movimento senza `prefers-reduced-motion`.

I testi seguono la «Voce» di `DESIGN.md`: italiano parlato, seconda persona, ’ « », niente punti esclamativi,
pulsanti che iniziano con un verbo, conteggi con `count()` di `src/lib/plural.ts`.

## 6. Unisci, mostra, correggi

- **Una sola tabella** per tutte le skill: gravità, `file:riga`, problema, correzione. Una causa = una riga,
  con tutti i punti in cui compare. Prima i `HIGH`, poi per quanti punti sistema una correzione.
- Scarta il gusto personale: una scelta documentata in `DESIGN.md` non è un problema.
- Correggi i problemi confermati con il codice del progetto (token, `buttonClass`, `paperOnRaised`, `cn`), poi
  `pnpm exec prettier --write` sui file toccati.

## 7. Riverifica

- `pnpm typecheck` e `pnpm test`; `pnpm build` se sono cambiati dipendenze, import di asset o configurazione.
- Rilancia lint e inspect finché non sono a **0 FAIL**.
- Nel browser: ogni stato del perimetro, a 320 px (`resize_window` 320×700, e controlla che
  `document.documentElement.scrollWidth` resti 320) e a 375 px, poi rimetti `desktop`.
- **Flussi con login o admin**: in locale serve un utente di prova. Promuovilo solo nel database locale e solo
  per la prova, poi rimettilo com'era e cancella i dati di prova:

  ```sql
  update users set is_anonymous=false, role='admin' where id='<id>';  -- prima
  update users set is_anonymous=true,  role='user'  where id='<id>';  -- dopo
  ```

  Dopo ogni cambio chiama `/api/auth/get-session?disableCookieCache=true` dal browser, o la sessione resta nella
  cache per 5 minuti. Controlla con `docker exec zuppapp-db-1 psql …` che l'host sia quello locale.

## 8. Resoconto

In italiano, breve: cosa hai controllato (rotte, stati, skill caricate), la tabella dei problemi con quelli
corretti e quelli lasciati con il motivo, i numeri finali (lint, inspect, test) e cosa non hai potuto provare
(per esempio la fotocamera vera, le foto senza bucket S3). Niente commit: li chiede l'utente.
