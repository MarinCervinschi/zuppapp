# Zuppapp — Specifica v1

App per votare zuppe, vellutate e affini confezionate e scoprire quali sono le più buone.
Voto rapido e simpatico (niente stelle, niente recensioni lunghe), login facoltativo.
Solo italiano. Open source.

## Decisioni

| #   | Tema                      | Decisione                                                                                                                                                                                                                                                                                                                                                                          | Perché                                                                                                                                                       |
| --- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Identità prodotto e fonte | EAN come chiave; dati da **Open Food Facts**; mancanti inseriti da admin o segnalati da utenti loggati; verso Esselunga/produttori solo link                                                                                                                                                                                                                                       | Fatti (ingredienti, valori) liberi; foto/testi dei siti protetti; estrarre il catalogo Esselunga viola il diritto sui generis sulle banche dati e i loro ToS |
| 2   | Voto                      | Scala a 4 facce: 🤢 Mai più · 😐 Si mangia · 😋 Buona · 🤤 La ricompro (1–4) + **tag rapidi** facoltativi                                                                                                                                                                                                                                                                          | Un tap, niente valore neutro, tag aggregabili al posto del testo                                                                                             |
| 2b  | Duello                    | Feature separata, solo loggati, **non** alimenta la classifica principale                                                                                                                                                                                                                                                                                                          | Divertente, ma manipolabile e richiede ≥ 2 prodotti provati                                                                                                  |
| 3   | Anonimi e abusi           | Un voto per prodotto per votante (upsert); rate limit per IP; Cloudflare Turnstile al primo voto anonimo; niente fingerprinting; al login i voti passano all'account; voti anonimi con stesso peso, conteggio separato visibile                                                                                                                                                    | Equilibrio tra attrito zero e classifica credibile                                                                                                           |
| 4   | Classifica                | Media bayesiana `(C·m + Σvoti) / (C + n)`, C = 5, m = media globale; minimo 3 voti per entrare; in vetrina faccia + "% la ricompro"; `product_stats` (conteggi) aggiornata nella stessa transazione del voto; il punteggio bayesiano si calcola in lettura, perché dipende dalla media globale                                                                                     | Evita che 1 voto vinca; numero comprensibile per l'utente                                                                                                    |
| 5   | Catalogo                  | Verticale "zuppe" ma tabella `category` generica + attributi in `jsonb`                                                                                                                                                                                                                                                                                                            | Identità chiara oggi, estendibile (sughi, piatti pronti) domani                                                                                              |
| 6   | Scheda prodotto           | Ricostruita da OFF (nome, marca, quantità, foto, ingredienti, allergeni, valori /100 g, Nutri-Score, NOVA) + link produttore/rivenditori manuali; foto copiate nel bucket Garage di cervinschi-infra (`img.cervinschi.site`, nei 4 formati OFF) con attribuzione CC-BY-SA; sync settimanale che rispetta i campi in override; riformulazione → solo avviso "Ricetta cambiata il …" | Niente copie di pagine terze; dati sempre freschi                                                                                                            |
| 7   | Perimetro v1              | Vedi "Schermate"                                                                                                                                                                                                                                                                                                                                                                   | Pochi stati, login con valore aggiunto                                                                                                                       |
| 8   | Hosting                   | ParadeDB self-hosted (`paradedb/paradedb`) su Coolify, stesso VPS di TriviaMore; backup `pg_dump` su R2; solo prod + locale, niente staging; ricerca isolata in un modulo `search`                                                                                                                                                                                                 | Coerente con l'infra esistente; fallback a FTS + `pg_trgm` senza toccare il resto                                                                            |
| 9   | Auth                      | Better Auth, **solo Google**; plugin `anonymous` + `onLinkAccount` per il merge dei voti; nickname scelto dall'utente; avatar sempre DiceBear                                                                                                                                                                                                                                      | Zero infrastruttura email                                                                                                                                    |
| 10  | Popolamento               | Script `catalog:import` da OFF (`en:soups`, `countries_tags=en:italy`), scarto prodotti senza foto/nome o fermi da anni → stato `draft`; approvazione admin in blocco; stati `draft → published → archived`                                                                                                                                                                        | Catalogo curato; i fuori produzione restano visibili ma escono dalla classifica                                                                              |
| 11  | Legale                    | Dump catalogo in **ODbL** su `/dati` (voti esclusi); attribuzione OFF nel footer e in ogni scheda; correzioni preferibilmente caricate su OFF; solo cookie tecnici → niente banner; privacy policy (Google, Turnstile, IP per rate limit a breve conservazione); "elimina account" rende anonimi i voti; niente analytics di terze parti: solo Umami self-hosted, senza cookie     | Obblighi share-alike ODbL e GDPR                                                                                                                             |
| 12  | Codice                    | Repo pubblica, licenza **MIT**; segreti su Infisical, `.env.example` in repo; Terraform in **repo privata separata**; seed locale ridistribuibile (`docker compose up` + `pnpm dev`, senza Infisical)                                                                                                                                                                              | Open source senza esporre l'infra                                                                                                                            |
| 13  | Lingua e nome             | Solo italiano, testi in un file di messaggi; nome **Zuppapp**; tono ironico e caldo; dominio provvisorio **zuppapp.cervinschi.site** (URL base solo da env, così il cambio è indolore)                                                                                                                                                                                             | —                                                                                                                                                            |
| 14  | Avatar                    | DiceBear stile **Critters** (CC0), da `@dicebear/core` + `@dicebear/styles` (`critters.json`), non dal pacchetto per-stile usato in TriviaMore; seed = id utente                                                                                                                                                                                                                   | Coerente col tono; CC0, nessun obbligo di attribuzione                                                                                                       |
| 15  | Soglie anti-abuso         | Precauzioni ragionevoli, senza tarature fini: es. 60 voti/ora per IP, import OFF esclude prodotti non modificati da oltre 5 anni; si ritoccano solo se serve                                                                                                                                                                                                                       | Il rischio di abuso non è una priorità                                                                                                                       |

## Stack

TanStack Start (React, full stack) · Drizzle ORM · Better Auth · ParadeDB (`pg_search`) · DiceBear · Garage (S3, da cervinschi-infra) · Turnstile · Coolify · Infisical. Come TriviaMore, senza Supabase.

Note:

- Drizzle non conosce gli operatori ParadeDB (`@@@`, `paradedb.score`): query di ricerca in `sql\`\``, indice BM25 in una migrazione SQL scritta a mano.
- Indice BM25 su nome, marca, ingredienti, tag; tokenizer italiano con stemming; ricerca fuzzy per i refusi; filtri (sottotipo, formato, attributi) nella stessa query.

## Schermate

Tutti (anche anonimi):

1. **Home / classifica**: top per sottotipo, ricerca, filtri.
2. **Scheda prodotto**: voto a facce, tag, statistiche, dati nutrizionali, link.
3. **Le mie zuppe**: storico dei propri voti.

Solo loggati: 4. **Duello**. 5. **Segnala prodotto mancante** (per EAN). 6. **Profilo**: nickname, avatar DiceBear personalizzabile, badge.

Admin: 7. Coda segnalazioni e `draft`, modifica/override prodotti, gestione tag.

Fuori v1: commenti testuali, follow, scansione barcode, prezzi, inglese.

## Modello dati (bozza)

```
user              (Better Auth; isAnonymous, nickname, avatarStyle, avatarSeed, role)
category          id, slug, name, parentId, attributesSchema jsonb
product           id, ean UNIQUE, categoryId, subtype, name, brand, quantity,
                  status (draft|published|archived), attributes jsonb,
                  imageKey, producerUrl, offLastModified, overrides jsonb,
                  recipeChangedAt, createdAt, updatedAt
product_snapshot  id, productId, ingredientsText, allergens, nutriments jsonb,
                  nutriscore, nova, fetchedAt          -- storico per rilevare riformulazioni
retailer_link     id, productId, retailer, url
vote              userId, productId, score (1..4), createdAt, updatedAt
                  PK (userId, productId)
tag               id, slug, label, sentiment (pos|neg|neutral), active
vote_tag          userId, productId, tagId
product_stats     productId, votesCount, votesRegistered, sumScore,
                  rebuyCount, tagCounts jsonb
duel              id, userId, productAId, productBId, winnerId, createdAt
duel_rating       productId, elo, matches
product_report    id, userId, ean, note, status (open|done|rejected), createdAt
```

## Tag rapidi iniziali

- 👍 cremosa · saporita · tanta verdura · porzione abbondante · sa di fatta in casa
- 👎 troppo salata · acquosa · insipida · sa di confezione · porzione piccola
- ↔️ densa · piccante · da allungare
