<p align="center"><img src="public/icon-192.png" width="96" height="96" alt=""></p>

<h1 align="center">Zuppapp</h1>

<p align="center">Quale zuppa pronta è la più buona? Votala su <a href="https://zuppapp.fun">zuppapp.fun</a>.</p>

<p align="center">
  <a href="https://zuppapp.fun"><img alt="Sito: zuppapp.fun" src="https://img.shields.io/badge/sito-zuppapp.fun-ff6a13"></a>
  <a href="CHANGELOG.md"><img alt="Versione" src="https://img.shields.io/github/v/tag/MarinCervinschi/zuppapp?label=versione&color=ff6a13"></a>
  <a href="LICENSE"><img alt="Codice MIT" src="https://img.shields.io/badge/codice-MIT-ff6a13"></a>
  <a href="https://opendatacommons.org/licenses/odbl/1-0/"><img alt="Dati ODbL" src="https://img.shields.io/badge/dati-ODbL-ff6a13"></a>
  <img alt="Node 22 o successivo" src="https://img.shields.io/badge/node-22%2B-16120f">
  <img alt="TanStack Start" src="https://img.shields.io/badge/TanStack-Start-16120f">
</p>

Si vota con le stelle, da 1 «Mai più» a 5 «La ricompro», e qualche tag, senza recensioni lunghe.
Si vota anche senza account. Il catalogo viene da Open Food Facts.

- **Zuppe** (`/`): ricerca che perdona i refusi, filtri per tipo, marca, Nutri-Score e allergeni;
  prima di cercare, quelle «Da assaggiare».
- **Classifica** (`/classifica`): podio e righe, ordinati per media bayesiana delle stelle.
- **Scheda prodotto**: voto, tag, distribuzione delle stelle, ingredienti, allergeni, valori
  nutrizionali per 100 g o per confezione, Nutri-Score. Dalle liste si apre in un foglio; ogni zuppa
  ha anche la sua pagina, `/prodotti/<ean>`, quella che indicizza Google.
- **Scansione** (`/scansiona`): il codice a barre dalla fotocamera porta alla scheda; una zuppa
  che manca si segnala, con le foto.
- **Con un account Google**: i voti fatti in anonimo passano all'account, profilo con avatar,
  «Le mie zuppe» e i preferiti.
- **Admin** (`/admin`): bozze da pubblicare, correzioni ai prodotti, segnalazioni.

## Documenti

|                              |                                                                     |
| ---------------------------- | ------------------------------------------------------------------- |
| [CHANGELOG.md](CHANGELOG.md) | cosa cambia a ogni versione                                         |
| [SPEC.md](SPEC.md)           | decisioni di prodotto e modello dati                                |
| [DESIGN.md](DESIGN.md)       | design system e regole per ogni schermata; dal vivo sulla `/design` |
| [CLAUDE.md](CLAUDE.md)       | comandi e architettura del codice                                   |

## Avvio in locale

Servono Node 22+, pnpm, Docker e la CLI di Infisical: i comandi locali leggono le variabili
dall'ambiente `local` del progetto `zuppapp` (il database di `compose.yaml`, l'URL su :3002, il client
Google).

```bash
infisical login
pnpm install
pnpm db:up                  # ParadeDB su 127.0.0.1:54330
pnpm db:migrate
pnpm db:seed                # 4 zuppe d'esempio, già pubblicate
pnpm db:seed:votes          # facoltativo: 60 votanti finti, per vedere podio e classifica
pnpm dev:local              # http://localhost:3002, sul database locale
```

`pnpm dev`, `pnpm catalog:import` e `pnpm user:admin` leggono invece l'ambiente `dev` di
Infisical, cioè **il database di produzione**. Per importare zuppe vere nel database locale:

```bash
infisical run --env=local -- tsx --tsconfig tsconfig.json scripts/catalog-import.ts --limit 20 --publish
```

Tutte le variabili sono elencate in [`.env.example`](.env.example): senza accesso a Infisical, si
impostano nella shell prima di lanciare i comandi. Le facoltative spengono solo la loro parte: senza `GOOGLE_CLIENT_ID` si vota solo in anonimo, senza `TURNSTILE_SECRET_KEY` il controllo
anti-bot è spento, senza `S3_*` le foto arrivano da Open Food Facts e le segnalazioni non chiedono
foto, senza `UMAMI_*` niente analytics.

```bash
pnpm test && pnpm typecheck && pnpm build
```

## Dati

Il catalogo prodotti viene da [Open Food Facts](https://world.openfoodfacts.org) ed è
ridistribuito sotto [ODbL](https://opendatacommons.org/licenses/odbl/1-0/); le foto sono
CC BY-SA, come quelle allegate alle segnalazioni. Gli avatar sono
[Critters](https://www.dicebear.com/styles/critters/) di DiceBear (CC0).

## Licenza

Codice sotto [MIT](LICENSE).
