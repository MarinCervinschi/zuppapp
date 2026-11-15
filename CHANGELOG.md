# Changelog

Cosa cambia per chi usa Zuppapp: schermate, voti, dati raccolti e indirizzi. Le versioni seguono semver; ognuna ha
il suo tag `v<versione>` su git.

## Non rilasciato

## 0.1.0 (2026-11-15)

La prima versione, quella in produzione su zuppapp.fun.

- **Voto**: da 1 a 5 stelle, da «Mai più» a «La ricompro», più qualche tag. Si vota senza account; il primo voto
  crea un votante anonimo, protetto da Turnstile. Il voto si salva da solo e si può togliere.
- **Zuppe** (`/`): ricerca che perdona i refusi, con suggerimenti mentre scrivi. Filtri per tipo, marca,
  Nutri-Score e allergeni: in una colonna su desktop, in un foglio su telefono. Prima di cercare, le zuppe «Da
  assaggiare».
- **Classifica** (`/classifica`): podio e righe, ordinati per la media bayesiana delle stelle. Il badge mostra la
  media semplice.
- **Scheda della zuppa**: voto, tag, distribuzione delle stelle, ingredienti, allergeni, valori nutrizionali per
  100 g o per confezione, Nutri-Score e la foto della confezione da ingrandire. Dalle liste si apre in un foglio;
  ogni zuppa ha anche la sua pagina `/prodotti/<ean>`.
- **Scansione** (`/scansiona`): il codice a barre dalla fotocamera apre la zuppa. Una zuppa che manca si cerca su
  Open Food Facts e, se è completa, entra subito come bozza; se no si segnala con un modulo e le foto.
- **Account Google**: i voti fatti in anonimo passano all'account. Profilo con nome e avatar, «Le mie zuppe» con le
  votate e i preferiti (il cuore). «Elimina l'account» toglie email, sessioni, preferiti e segnalazioni; i voti
  restano in classifica, anonimi.
- **Admin** (`/admin`): bozze da pubblicare, correzioni a nome, marca e tipo, segnalazioni da risolvere.
- **Dati**: `/dati` spiega la licenza ODbL e offre il catalogo intero in `/dati/catalogo.json`, senza voti né
  utenti. `/privacy` è l'informativa dell'art. 13 GDPR.
- **Limiti**: 60 voti l'ora per indirizzo IP, 30 ricerche dal vivo su Open Food Facts l'ora per IP, 10
  segnalazioni l'ora per account.
- **Motori di ricerca**: `robots.txt`, `sitemap.xml`, `canonical` su ogni pagina e dati strutturati `Product` per
  le zuppe già in classifica. Le pagine personali, l'admin e la scansione hanno `noindex`.
- **Indirizzo**: zuppapp.fun; `www` rimanda lì con un 301.
- Tema chiaro e scuro, icona e manifest per installarla sul telefono, analytics Umami senza cookie.
