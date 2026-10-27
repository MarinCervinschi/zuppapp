# Zuppapp — Design system

La guida viva è la pagina **`/design`**: ogni token e componente descritto qui è renderizzato dal codice vero.

## L'idea

> Zuppapp è **un manifesto di zuppe**: carta calda, inchiostro nero e macchie piatte di colore con la grana
> della stampa, come i poster di un succo di frutta. Il colore lo danno le zuppe stesse: pomodoro, zucca,
> mais, piselli, barbabietola.

Viene dalle reference Figma di un collega designer (ottobre 2026) e dalla sua moodboard: il rebrand Minute Maid
/ del Valle, con fondi crema, macchie organiche sgranate, titoli neri pesanti e parole che seguono una curva.
Sostituisce la direzione precedente, «la carta stampata del supermercato» (scontrino, timbro, cartellino, angoli
vivi), che resta nella storia di git.

**La cosa viva**: il voto. Cinque stelle su un pannello nero; quella scelta si riempie di giallo con un piccolo
rimbalzo (`animate-pop`), e i tag salgono sotto (`animate-rise`).

## Navigazione

Tre posti, sempre a portata di pollice nella **tab bar** in basso (`TabBar`): una pill flottante con la scheda
corrente in una pill più chiara.

| Tab        | Rotta         | Cosa c'è                                                                          |
| ---------- | ------------- | --------------------------------------------------------------------------------- |
| Zuppe      | `/`           | La ricerca. Con testo, filtri o «Vedi tutte» la lista; prima, «Da assaggiare»     |
| Classifica | `/classifica` | Podio e righe, filtrabili per tipo                                                |
| Profilo    | `/profilo`    | Nome, faccia e tema. Senza account rimanda ad `/accedi`, che porta alle tue zuppe |

Le pagine interne (la scheda prodotto) hanno solo il **pulsante indietro** tondo che galleggia sulla foto
(`BackButton`): torna nella cronologia, o alle zuppe se il link è stato aperto da fuori.

## Colori

Carta, inchiostro e le zuppe. I componenti usano solo i token semantici (`bg-ground`, `text-text-soft`, …), mai
i primitivi. Il tema si sceglie tra **Sistema, Chiaro e Scuro** (`ThemeSwitch`, nel piè di pagina e nel profilo),
finisce in `<html data-theme>` e resta in quel browser. Ogni regola scura usa lo stesso doppio selettore:
`[data-theme="dark"]`, oppure il sistema scuro quando non è `[data-theme="light"]`.

| Token                | Chiaro    | Scuro     | Ruolo                                                                                          |
| -------------------- | --------- | --------- | ---------------------------------------------------------------------------------------------- |
| `ground`             | `#ede3d4` | `#171411` | la carta, lo sfondo                                                                            |
| `ground-raised`      | `#f8f2ea` | `#241f1a` | il foglio sopra: pill, campi, la tab bar                                                       |
| `text`               | `#16120f` | `#f5efe6` | titoli e testo. Anche gli stati premuti (pill, filtri, pagine), che così si invertono col tema |
| `text-soft`          | `#6a5f53` | `#b5aa9c` | marca • tipo • formato, note                                                                   |
| `ink` / `on-ink`     | `#16120f` | `#0b0a08` | i pannelli neri in entrambi i temi: il voto, la tabella nutrizionale                           |
| `badge-good`         | `#9bd67a` | uguale    | il badge con la media delle stelle, sempre con inchiostro scuro                                |
| `star`               | `#ffd66b` | uguale    | la stella piena, **solo sul nero**                                                             |
| `field` / `on-field` | `#ffc93c` | uguale    | giallo mais: avvisi, la tessera, la sfumatura del foglio della scheda                          |
| `danger`             | `#a8200d` | `#ff8a73` | gli errori scritti                                                                             |
| `soup-*`             | —         | uguale    | `tomato`, `pumpkin`, `corn`, `pea`, `beet`: macchie e illustrazioni                            |

Contrasti misurati (WCAG 2):

| Coppia                                    | Chiaro      | Scuro       |
| ----------------------------------------- | ----------- | ----------- |
| `text` su `ground` / `ground-raised`      | 14,7 / 16,7 | 16,1 / 14,3 |
| `text-soft` su `ground` / `ground-raised` | 4,9 / 5,6   | 8,0 / 7,2   |
| `danger` su `ground`                      | 5,7         | 8,0         |
| `star` su `ink`                           | 13,4        | 14,2        |
| inchiostro su `badge-good` / `field`      | 10,9 / 12,1 | uguale      |

**L'arancio non è un colore per il testo**: sulla carta fa 2,5:1. Le zuppe colorano superfici (macchie,
dischi del podio, avvisi), mai parole. Il focus è un anello da 2 px nel colore del testo, staccato di 3 px.

**Le macchie** (`.blob-head`, via `PageHead blob="…"`) sono due zuppe in un gradiente radiale che parte dal bordo
alto e sfuma nella carta, con la grana sopra (`.grain`, un rumore SVG in `soft-light`). In tema scuro portano il
55% del colore (`--blob-strength`): di notte brillano, non urlano. Una macchia per schermata, solo dove la pagina
è una vetrina (classifica, errori, `/design`); la ricerca resta pulita come nel mockup.

## Carattere

- **Clash Display** (Indian Type Foundry, ITF Free Font License), 500 e 600: titoli, nomi dei prodotti,
  il marchio «ZUPPAPP» (`.wordmark`). Si carica dal **CDN di Fontshare** (`__root.tsx`): la licenza ne permette l'uso ma non
  la ridistribuzione, quindi i file non entrano in una repo pubblica.
- **Poppins** (OFL), 400, 500 e 600, da `@fontsource/poppins`, servito da noi: tutto ciò che si legge.

| Token           | Misura   | Interlinea | Uso                                   |
| --------------- | -------- | ---------- | ------------------------------------- |
| `text-small`    | 13 px    | 1,45       | marca • tipo • formato, note, crediti |
| `text-body`     | 16 px    | 1,5        | tutto ciò che si legge                |
| `text-lead`     | 20 px    | 1,2        | nome in una card, titoli di sezione   |
| `text-title`    | 28–34 px | 1,05       | il nome del prodotto sulla sua pagina |
| `text-display`  | 36–56 px | 1          | l'unico `h1` di una schermata         |
| `text-wordmark` | 17 px    | 1          | «ZUPPAPP» sopra l'`h1` (`.wordmark`)  |

Titoli in `text-wrap: balance`, paragrafi in `pretty`. Cifre che cambiano o si confrontano in `tabular-nums`.
La media si scrive all'italiana, con la virgola: «4,7» (`formatStars`).

## Forma, spazio, movimento

- **Tutto arrotondato**: card e foto `rounded-card` (28 px), pannelli neri `rounded-panel` (24 px), miniature
  `rounded-thumb` (16 px), pill, pulsanti e campi `rounded-full`.
- **Le foto stanno su un piatto bianco**, intere (`object-contain`): le foto di Open Food Facts sono scattate su
  bianco. In classifica dal 4° in giù la miniatura è un tondo.
- **Ombre solo per ciò che galleggia** (`.float-shadow`): il campo di ricerca.
- **Vetro liquido per ciò che galleggia sopra il contenuto** (`.glass`): tab bar, pulsante indietro, menu «Per
  pagina». È la versione CSS del Liquid Glass di iOS 26: velo traslucido con `backdrop-filter: blur(20px)
saturate(180%)`, una luce sul bordo alto, un bordo di luce e un riflesso in alto a sinistra. Le librerie che
  rifrangono davvero (`liquid-glass-react` e simili) usano un filtro SVG di displacement che si vede solo in
  Chromium; su Safari, cioè su iPhone, non mostrano niente. Per questo il nostro è solo CSS. Senza
  `backdrop-filter`, o con `prefers-reduced-transparency`, diventa il foglio pieno.
- **Bersagli da 44 px o più**, le stelle grandi da 56–64 px.
- **Movimento** con `--ease-out-snap`. Niente si anima al primo disegno, solo in risposta a un gesto
  (principio preso da morphin.dev):
  - pressione a 0,96 su ogni controllo;
  - le stelle si riempiono una dopo l'altra (`animate-pop`, 45 ms di scarto), e con cinque stelle, «La
    ricompro», otto gocce gialle partono dalla quinta (`.star-burst`);
  - nella tab bar la goccia chiara della scheda corrente scivola fino alla nuova con un piccolo rimbalzo;
  - una pill premuta disegna la sua spunta (`draw`);
  - i tag e l'elenco delle marche salgono dal basso (`animate-rise`);
  - le foto delle confezioni appaiono in dissolvenza; finché arrivano, il loro piatto (`.plate`) luccica
    (`shimmer`);
  - l'anello di testo del Nutri-Score gira piano, un giro ogni 24 secondi.
    Sotto `prefers-reduced-motion` restano solo le dissolvenze: niente rimbalzi, gocce, luccichio né rotazione.
- **Spazio per la tab bar**: il piè di pagina porta `.pb-tabbar`, e i toast stanno 104 px sopra il fondo.

## Componenti

In `src/components/ds/`, più quelli del catalogo in `src/components/catalog/`.

- **`PageHead`**: il marchio, `h1` e una riga, centrati; con `blob` la macchia sgranata.
- **`TabBar`**: i tre tab in vetro, link con `aria-current="page"`, così funzionano anche prima del
  JavaScript; la scheda corrente è una goccia chiara che scivola.
- **`StarPicker`**: un vero `radiogroup` di cinque stelle; le frecce spostano il voto e il nome accessibile
  è «4 stelle, Buona». Disegnato per il nero: piene in `star`, vuote a contorno. Non si disabilita durante il
  salvataggio, così il focus resta dove l'ha messo la tastiera.
- **`RatingBadge`**: la pill verde «★ 4,7»; senza voti dice «Nessun voto», mai uno zero.
- **`StarDistribution`**: da 5 a 1 stella, una barra a testa con conteggio e percentuale sempre scritti.
- **`Pill`**: un allergene, un tag, un filtro. Premuta si inchiostra e mostra una spunta: lo stato è detto due
  volte, non solo dal colore.
- **`Button`**: pill; `ink` per l'unica azione primaria della vista, `paper` per tutto il resto.
  `buttonClass()` dà lo stesso aspetto a un link.
- **`NutritionLabel`**: la dichiarazione UE per 100 g, su un foglio sotto la linguetta nera. L'energia è grande,
  in kcal e kJ. Ogni nutriente ha la sua **% AR** (la quota dell'assunzione di riferimento di un adulto, Reg. UE
  1169/2011, allegato XIII) in cifre e in una barra. Grassi, saturi, zuccheri e sale hanno anche il **livello**
  (basso, medio, alto, secondo le soglie FSA per 100 g), scritto in parole con un pallino del colore di una
  zuppa che lo ripete. Resta una tabella vera, e un lettore di schermo la legge riga per riga.
- **`NutriScore`**: il sigillo smerlato con la lettera grande e ferma al centro e «NUTRI-SCORE» che gira lungo
  il bordo, nei colori ufficiali. Sotto c'è la scala A–E con la lettera del prodotto più grande.
- **`ZoomablePhoto` / `PackPhoto`**: toccare una foto la ingrandisce in un `<dialog>`, non apre la scheda. La
  foto entra in dissolvenza e il suo piatto luccica finché non arriva.
- **`BrandPicker`**: un pannello che si apre nel flusso, con un campo con la lente e le marche come pill;
  l'elenco sfuma in basso per dire che scorre.
- **`Barcode`**: l'EAN-13 vero, nero su bianco in entrambi i temi; solo in fondo alla scheda e sulla tessera.
- **`Podium`, `Leaderboard`** (`catalog/ranking.tsx`), **`TasteTile`, `QuickVote`**: vedi sotto.

## Regole per ogni schermata

### Gerarchia: cosa conta per chi sceglie una zuppa

1. **La confezione** (foto): è così che la si riconosce allo scaffale.
2. **La media delle stelle** e quanti voti la sostengono.
3. **Il nome**, poi marca • tipo • formato (`productDetails`).
4. Tutto il resto (EAN, codice a barre, NOVA) va **in fondo alla scheda**, mai in una lista.

Niente prezzi: non li abbiamo, e la SPEC li tiene fuori dalla v1.

### La classifica

- **Podio**: tre card grandi con la confezione su un piatto bianco largo, il disco della posizione in alto a
  sinistra (mais, azzurro, zucca) e il badge in basso a destra. Sotto, nome e dettagli.
- **Dal 4° in giù**: una riga per prodotto con posizione, tondo, nome, dettagli e badge con i voti sotto.
  È un vero `<ol>` che parte da 4.
- **Accanto alla media c'è sempre il numero di voti.** Una nota sotto la lista spiega l'ordine: ogni zuppa
  parte con 5 voti nella media di tutte (`bayesMean`), così un 5 da due voti non supera un 4,7 da quaranta.
- **Da 3 voti in su si entra in classifica.** Prima il prodotto è «Da assaggiare», con l'etichetta gialla
  «Mancano N voti alla classifica».
- **«Per pagina» conta i posti, podio compreso**, e l'intestazione dice «Top 10 zuppe» solo sulla prima pagina.

### Votare deve costare un tap

- Ogni card ha le cinque stelle in una pill nera (`QuickVote`): si vota dalla lista senza aprire niente. Il
  voto rapido **non tocca i tag già scelti** (`tagIds` omesso).
- Il voto del lettore conta subito nell'etichetta della card: mai «Nessun voto» sopra le sue stelle.
- Nella scheda: il pannello nero «Com'era?» diventa «La tua valutazione»; sotto, il nome della stella scelta,
  come cambiarla e **«Togli il voto»**, un pulsante vero. Il toast «Voto tolto» con «Rimettilo» lo annulla.
- **I tag** compaiono dopo la prima stella, in tre gruppi (Pro, Contro, Com'è) con il segno davanti (+ − ·),
  al massimo tre.

### La scheda prodotto

Foto a tutta larghezza sul bianco, poi un **foglio** con gli angoli arrotondati che le sale sopra, sfumato dal
giallo mais alla carta. Nell'ordine: nome, dettagli, badge e posto in classifica; avvisi (fuori produzione,
ricetta cambiata); il voto; come l'hanno votata e cosa ne dicono; **«Senza:»**; ingredienti; valori
nutrizionali; Nutri-Score; NOVA, link, codice a barre e crediti.

**«Senza:» compare solo se conosciamo gli ingredienti**: un prodotto senza dati non è «senza glutine». Elenca
gli allergeni dei filtri che l'etichetta non dichiara, e ricorda di leggere sempre la confezione.

### Ricerca e filtri

- **Ogni filtro è un link**: un URL da condividere, il tasto indietro lo annulla, funziona prima del JavaScript.
- **Un solo pannello** (`FilterPanel`): laterale su desktop (≥ 1024 px), su telefono un foglio dal basso
  (`FilterSheet`) aperto da «Filtri». I filtri attivi stanno sopra i risultati come pill con ×.
- **Ogni opzione mostra quante zuppe trova**, calcolato senza il proprio filtro.
- **La marca ha un selettore nostro** (`BrandPicker`), con ricerca e conteggi.
- **Lo stato si annuncia con `aria-current`**, e i link usano `activeOptions={EXACT_SEARCH}`.
- **La ricerca senza testo** («Vedi tutte», `vedi=tutte`) elenca il catalogo per nome.

### Liste e pagine

- **Telefono**: una colonna di card, con il piatto della foto in 4:3, e una di righe in classifica. Da 640 px due colonne, con il piatto quadrato. **Desktop**: pannello filtri da 16rem e tre
  colonne. Contenitore massimo `max-w-6xl`.
- **Nessun nome troncato**: si va a capo.
- **Pagine numerate** (`Pagination`), mai liste infinite: «‹ Indietro 1 2 … 38 Avanti ›» e «Per pagina». Ogni
  pagina è un URL, e il componente sa su quale rotta lavora (`route`).

### Account e profilo

- **Il nome pubblico è sempre il nickname**; finché non lo scegli sei un nome da zuppa (`soupNameFor`).
- **L'avatar è Critters**, in un tondo.
- **Accedere è «prendere la tua tessera»** (`/accedi`, `LoyaltyCard`): la carta fedeltà gialla e sgranata, con
  un codice a barre interno di negozio. Chi ha già votato senza account trova lì il link alle sue zuppe.
- **Il pulsante di Google segue le sue linee guida** (`GoogleButton`), con i suoi colori e il suo bordo.

## Comportamenti

- **Il voto si salva dopo 600 ms di quiete** (`useVote`): scorrere le stelle con le frecce manda un voto solo.
- **Togliere il voto si annulla** con il toast; il focus torna alla prima stella.
- **Gli stati vuoti e di errore parlano come il resto**: «Ancora nessun voto. Il primo lo dai tu.», le pagine
  «Questa zuppa non c'è» e «Qualcosa è andato storto», con la macchia e «Tutte le zuppe».
- **Una card ha un solo link** (il nome, steso su tutta la card): un lettore di schermo sente un nome solo.

## Voce

Italiano parlato, breve, alla seconda persona, con apostrofi e virgolette tipografici (’ « »): «Com’era?»,
«Due parole in più?», «Togli il voto». Niente punti esclamativi (il mockup ne aveva uno, «scelte dagli
utenti!», ed è stato tolto), niente «Ops!».

- **Ogni errore dice cosa fare**: «Il voto non è partito. Controlla la connessione e tocca di nuovo le stelle.»
- **Annullare batte chiedere conferma** per le azioni frequenti e reversibili.
- **I conteggi passano da `count()`** (`src/lib/plural.ts`): «1 voto», «12.345 zuppe».
- **I link si capiscono anche fuori contesto**: «Vedi la scheda di <prodotto>», «Togli tutti i filtri».
- **I placeholder sono esempi**: «minestrone, ceci, Knorr…».
- **I pulsanti iniziano con un verbo**: «Togli il voto», «Chiudi la foto», «Vedi 490 zuppe».

## Controlli

```bash
node <taste-skill>/scripts/lint.mjs src                                   # 0 FAIL
node <taste-skill>/scripts/inspect.mjs http://localhost:3002/classifica --app \
  --allow font-not-dealt,palette-cream,gradient,app-title-size,colour-sprawl
```

Le regole escluse sono scelte del design system, non sviste: il carattere e la carta crema vengono dalle
reference del designer, non dal foglio di `.taste-skill/direction.json` (che è della direzione precedente); le
macchie sfumate e i titoli grandi sono la vetrina di ricerca e classifica. Nel codice, le stesse eccezioni
stanno in utility con un nome (`.blob-head`, `.sheet-tint`, `.fade-bottom`, `.glass`, `.glass-drop`, `.plate`)
e portano `taste-skill-ignore` sulla riga. Resta un avviso voluto su `/le-mie-zuppe` con pochi voti: la pagina è
corta e il piè di pagina sta in fondo allo schermo.
