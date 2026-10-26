# Zuppapp

Quale zuppa pronta è la più buona? Si vota con una faccia — 🤢 😐 😋 🤤 — e qualche tag, senza
stelle e senza recensioni lunghe. Le decisioni di prodotto sono in [SPEC.md](SPEC.md).

## Avvio in locale

Servono Node 22+, pnpm e Docker.

```bash
cp .env.example .env        # poi riempi BETTER_AUTH_SECRET (openssl rand -base64 32)
pnpm install
pnpm db:up                  # ParadeDB su 127.0.0.1:54330
pnpm db:migrate
pnpm dev:local              # http://localhost:3000, sul database locale
```

Senza `GOOGLE_CLIENT_ID` si vota solo in anonimo; senza `TURNSTILE_SECRET_KEY` il controllo
anti-bot è spento.

## Dati

Il catalogo prodotti viene da [Open Food Facts](https://world.openfoodfacts.org) ed è
ridistribuito sotto [ODbL](https://opendatacommons.org/licenses/odbl/1-0/); le foto sono
CC-BY-SA. Gli avatar sono [Critters](https://www.dicebear.com/styles/critters/) di DiceBear (CC0).

## Licenza

Codice sotto [MIT](LICENSE).
