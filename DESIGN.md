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

| Tab        | Rotta         | Cosa c'è                                                                         |
| ---------- | ------------- | -------------------------------------------------------------------------------- |
| Zuppe      | `/`           | La ricerca. Con testo o filtri i risultati; prima, «Da assaggiare» o il catalogo |
| Classifica | `/classifica` | Podio e righe, filtrabili per tipo                                               |
| Profilo    | `/profilo`    | Nome, faccia, le tue zuppe e le impostazioni. Senza account rimanda ad `/accedi` |

Chi è admin ha un quarto tab, **Admin** (`/admin`, la chiave), e nella scheda prodotto un tondo con la chiave
accanto al cuore, che apre quel prodotto nella gestione (`?stato=…&q=<ean>`).

Accanto alla pill, **staccato in un tondo di vetro tutto suo**, c'è lo scanner (`/scansiona`): è un'azione,
non un posto, come la ricerca nella tab bar di iOS 26. Solo l'icona, con il nome per i lettori di schermo; su
telefoni da 360 px i tab si stringono a 80 px perché ci stia tutto.

Le pagine interne (la scheda prodotto) hanno una **barra fissa in alto** (`DetailBar`): il pulsante indietro
tondo a sinistra (`BackButton`, torna nella cronologia, o alle zuppe se il link è stato aperto da fuori) e
l'azione della pagina a destra, il cuore. Resta in alto mentre si scorre, così non serve risalire per tornare
indietro; solo i due pulsanti prendono i tocchi. Sopra la foto la barra è trasparente; appena la pagina
scorre, dietro i pulsanti entra in dissolvenza una fascia di carta smerigliata (`.glass-band`) che sfuma
in basso, così i pulsanti galleggiano su di lei e non sul testo che passa sotto.

## Colori

Carta, inchiostro e le zuppe. I componenti usano solo i token semantici (`bg-ground`, `text-text-soft`, …), mai
i primitivi. Il tema si sceglie tra **Sistema, Chiaro e Scuro** (`ThemeSwitch`: tra le impostazioni del profilo, in fondo a «Prendi la tua tessera» su telefono, nel piè di pagina su desktop),
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

**Le macchie vive** (`SoupField`, in `PageHead blob="…" shape="…"` o da sole) sono zuppa che si muove piano,
disegnata in WebGL. Ci sono due forme:

- **`gocce`**: tre gocce che pendono dal bordo alto, nate guardando Grainient di React Bits;
- **`onda`**: un sipario con l'orlo che ondeggia, nato guardando Aurora e la forma rossa del poster di del Valle.

Il bordo è **puntinato come la stampa dei poster**: vicino all'orlo ogni grano è o zuppa o carta. In più c'è una
grana leggera su tutto. Sotto il mouse la zuppa si sporge un poco verso il puntatore. Il fondo del canvas sfuma
nella carta vera (`.fade-foot`), così l'intestazione non ha bordo. In tema scuro le macchie portano il 55% del
colore (`--blob-strength`): di notte brillano, non urlano.

Il codice è nostro. Grainient e Aurora sono MIT + Commons Clause, che vieta di ridistribuire i componenti
stessi, «anche come versione portata»: in una repo pubblica non possono entrare.

Sotto il canvas resta la macchia CSS (`.blob-head`), per chi non ha WebGL e per il primo disegno; il canvas
entra in dissolvenza sopra. Con `prefers-reduced-motion` si disegna un solo fotogramma fermo. Il canvas va in
pausa fuori schermo e con la scheda nascosta, gira a 30 fotogrammi al secondo con al massimo 1,5 pixel per punto,
e segue il cambio di tema.

**Una macchia per schermata, una zuppa per posto:**

| Schermata      | Zuppa                             | Forma |
| -------------- | --------------------------------- | ----- |
| Ricerca (home) | mais                              | onda  |
| Classifica     | pomodoro                          | onda  |
| Le tue zuppe   | zucca                             | gocce |
| Profilo        | barbabietola                      | onda  |
| Accesso        | piselli, dietro la tessera gialla | gocce |
| Errori         | pomodoro                          | gocce |

La scheda prodotto non ne ha: lì il colore lo dà la foto della confezione.

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
- **Le foto stanno su un piatto bianco.** Nelle griglie e sul podio il piatto ha una forma fissa e la foto lo riempie
  (`object-cover`, tagliata se serve), così le card di una riga sono alte uguali; nella scheda e ingrandita è intera
  (`object-contain`). In classifica dal 4° in giù la miniatura è un tondo.
- **Su telefono, nelle liste la foto porta alla scheda**; nella scheda e nel foglio della zuppa un tocco la apre
  grande, larga quanto lo schermo. Col mouse si apre grande ovunque.
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
- **Entrate e uscite.** Due strumenti, scelti per costo:
  - **CSS, per ciò che arriva** (costo zero, gira anche prima del JavaScript e non lascia mai niente nascosto
    se lo script manca): `.stagger` fa salire i figli di un elenco uno dopo l'altro, 45 ms di scarto, al
    caricamento e ogni volta che ne entrano di nuovi (un filtro, la pagina dopo). Lo portano l'intestazione,
    le griglie di card, podio e classifica, «Le mie zuppe» e il foglio della scheda prodotto. Il foglio dei
    filtri sale dal basso (`animate-sheet`), la foto ingrandita si apre (`animate-zoom`), gli sfondi dei
    dialoghi sfumano (`animate-fade`).
  - **Motion** (`motion`, l'ex Framer Motion), **solo dove il CSS non arriva**: le uscite e i valori che
    cambiano. Le pill dei filtri attivi entrano e si ritirano; i tag si aprono sotto le stelle e si richiudono
    quando togli il voto; la media nel badge scorre quando cambia; le barre di stelle, % AR e calorie
    crescono quando entrano in vista. Si carica con `LazyMotion` e `domAnimation` in `__root` (i componenti
    leggeri `m.*`, `strict`), e `MotionConfig reducedMotion="user"` segue l'impostazione del sistema. Niente
    animazioni di layout: chiederebbero `domMax`, il doppio del peso.
- **Spazio per la tab bar**: su telefono la pagina stessa porta `.pb-tabbar`, su desktop il piè di pagina.
- **La tab bar c'è sempre**: non si nasconde scorrendo né scrivendo. Quello che si apre sopra la pagina, come i
  suggerimenti della ricerca, ha uno z-index più alto e la copre.
- **I toast sono pillole d'inchiostro in alto** (`AppToaster`, `ds/toaster.tsx`), lontani da tab bar, pollice e
  foglio, con un'icona oltre al colore e l'azione come pulsante crema. Si chiamano con `toast` di `lib/toast.ts`,
  mai da `sonner`: con un foglio aperto vanno al toaster dentro il foglio, perché il `<dialog>` modale sta nel top
  layer e la pagina dietro è inerte, così il toast resterebbe sotto e il suo pulsante non si toccherebbe.
- **Il piè di pagina c'è solo su desktop**: su telefono un piè da sito sotto ogni pagina è fuori posto. Tema e
  crediti stanno nel profilo e, per chi non ha un account, in fondo a «Prendi la tua tessera».
- **Il foglio della zuppa e la sua pagina sono lo stesso foglio**: su telefono la pagina ha la maniglia e si
  trascina giù per tornare indietro, come il foglio aperto del tutto.
- **`PageHead`**: il marchio, `h1` e una riga, centrati; con `blob` (e `shape`) la macchia viva.
- **`HeartButton`**: il cuore dei preferiti, un tondo di vetro. Contorno d'inchiostro; acceso, pieno pomodoro
  dentro lo stesso contorno (che lo tiene leggibile sul vetro scuro sopra una foto bianca), con un battito (`animate-pop`) solo quando lo accendi tu. Sta nella barra della scheda e in alto a
  destra sulla foto delle card e del podio (in alto a sinistra c'è il posto). Il nome accessibile resta
  uguale («Gazpacho tra i preferiti») e `aria-pressed` dice lo stato. Togliere un cuore si annulla con
  «Rimettila». **I preferiti sono di chi
  ha un account**: senza, il cuore non salva niente e un toast propone «Accedi». Aggiungendo, un toast
  «Nei preferiti» offre «Vedili». Tutti i cuori leggono un solo elenco di id (`favoriteQueries.ids`),
  precaricato in `__root` e cambiato subito, prima della risposta del server.
- **`SoupField`**: la macchia viva da sola, dietro qualunque contenitore `relative isolate overflow-hidden`.
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
- **`NutritionLabel`**: la dichiarazione UE su un foglio sotto la linguetta nera.
  - **100 g o confezione**: quando il peso è leggibile (`packGrams`, da «620 g», «1 kg», «500 ml»), un
    interruttore mostra valori e % AR per la confezione intera, perché una zuppa di solito si mangia tutta.
  - **L'energia** è grande, in kcal e kJ, e sotto c'è **da dove vengono le calorie**: grassi (9 kcal/g),
    carboidrati e proteine (4 kcal/g) in una barra divisa, con le percentuali scritte.
  - **% AR** per ogni nutriente (Reg. UE 1169/2011, allegato XIII), in cifre e in una barra; oltre il 100% la
    cifra va in grassetto e la barra diventa pomodoro.
  - **Il livello** di grassi, saturi, zuccheri e sale (basso, medio, alto, soglie FSA per 100 g, anche quando
    si guarda la confezione) è una pill con la parola, tinta del colore di una zuppa.
  - Resta una tabella vera, e un lettore di schermo la legge riga per riga.
- **`NutriScore`**: il sigillo smerlato con la lettera grande e ferma al centro e «NUTRI-SCORE» che gira lungo
  il bordo, nei colori ufficiali. Sotto c'è la scala A–E con la lettera del prodotto più grande.
- **`ZoomablePhoto` / `PackPhoto`**: toccare una foto la ingrandisce in un `<dialog>`, non apre la scheda. La
  foto entra in dissolvenza e il suo piatto luccica finché non arriva.
- **`BrandPicker`**: un pannello che si apre nel flusso, con un campo con la lente e le marche come pill;
  l'elenco sfuma in basso per dire che scorre. **Il campo non prende mai il fuoco da solo**: su telefono
  la tastiera coprirebbe l'elenco, che si vede e si scorre per primo. Il pannello scorre in cima al foglio con l'elenco in vista; toccando il campo,
  il foglio lo porta in cima sopra la tastiera, con uno spazio in fondo che c'è solo con il touch.
- **`Barcode`**: l'EAN-13 vero, nero su bianco in entrambi i temi; solo in fondo alla scheda e sulla tessera.
- **`Podium`, `Leaderboard`** (`catalog/ranking.tsx`), **`TasteTile`**: vedi sotto.
- **`TypeRail`** (`catalog/type-rail.tsx`): i tipi come tondi del colore della loro zuppa, ognuno con la sua
  icona (`SubtypeIcon`, `catalog/type-icons.tsx`), «Tutte» per primo. Scorre di lato su telefono, va a capo
  su desktop; quello scelto ha un anello del colore del testo, così si distingue anche senza colore.
- **`Sheet`** (`ds/sheet.tsx`): il foglio dal basso, un `<dialog>` modale che si trascina; su desktop un
  pannello a destra (`wide="panel"`) o un popup al centro (`"popup"`), che sfuma e sale di poco. Il pannello è
  `fixed` e il `<dialog>` non scorre mai, se no il browser lo scorre per mostrare il pannello spostato e il foglio
  salta. L'intestazione è sua, uguale in ogni foglio: maniglia, poi `title`, `subtitle`, `media` (la foto) e
  `actions` («Azzera») prima della X. Maniglia e intestazione trascinano il foglio; con `detents` (anteprima e
  foglio intero) un tocco sull'intestazione lo apre tutto. Nessun foglio si fa un'intestazione o una X da sé. Lo
  usano il foglio della zuppa (`product/soup-sheet.tsx`, vedi «Votare deve costare un tap»), i filtri, «Come si
  ordina», il profilo e l'admin. Il trascinamento è `useSheetDrag` (`ds/use-sheet-drag.ts`), lo stesso della
  pagina della zuppa.
- **I pezzi ripetuti hanno un posto solo**: `PackThumb` (la miniatura da 100 px, in righe, suggerimenti e
  intestazioni), `rowCard`/`rowCardLink` (`ds/row-card.ts`, la riga-card con il nome steso sopra),
  `segment`/`SegmentCount` (`ds/segmented.tsx`, le schede a pillola), `SimplePager` («‹ Indietro · Avanti ›»),
  `MyScoreBadge` e `MissingVotesBadge` (in `ds/stars.tsx`, con le parole di `missingVotesLabel`), i chip dei
  filtri e la X della ricerca (`ds/chip.tsx`), i crediti (`ds/credits.tsx`), numeri e date (`lib/format.ts`).

## Regole per ogni schermata

### Gerarchia: cosa conta per chi sceglie una zuppa

1. **La confezione** (foto): è così che la si riconosce allo scaffale.
2. **La media delle stelle** e quanti voti la sostengono.
3. **Il nome**, poi marca • tipo • formato (`productDetails`).
4. Tutto il resto (EAN, codice a barre, NOVA) va **in fondo alla scheda**, mai in una lista.

Niente prezzi: non li abbiamo, e la SPEC li tiene fuori dalla v1.

### La classifica

- **Podio**: tre card sul foglio rialzato. Su telefono la prima occupa tutta la larghezza e le altre due
  dividono una riga; su desktop stanno affiancate, la prima al centro e più alta. La prima ha un bordo giallo
  mais. Il disco della posizione in alto a sinistra (mais, azzurro, zucca), il badge in basso.
- **Dal 4° in giù**: una card-riga per prodotto con posizione, tondo, nome, marca e voti, badge. È un vero
  `<ol>` che parte da 4; su desktop due colonne.
- **Si filtra con gli stessi tondi dei tipi** della home, senza conteggi (la classifica conta posti, non
  zuppe).
- **Il perché dell'ordine sta in un foglio**, «Come si ordina»: ogni zuppa parte con 5 voti nella media di
  tutte (`bayesMean`), così un 5 da due voti non supera un 4,7 da quaranta. Su desktop è una card al centro.
- **Da 3 voti in su si entra in classifica.** Prima il prodotto è «Da assaggiare», con l'etichetta gialla
  «Mancano N voti alla classifica».
- **«Per pagina» conta i posti, podio compreso**, e l'intestazione dice «Top 10 zuppe» solo sulla prima pagina.
- Ogni zuppa apre il suo foglio, come nella home.

### Votare deve costare un tap

- **Le card non hanno stelle**: grandi come un post, con la foto, il voto medio (o i voti che mancano) sopra
  la foto e sotto solo nome e dettagli. Se l'hai votata, un bollino nero in alto a sinistra dice il tuo voto.
- **Toccare una zuppa apre il suo foglio** (`SoupSheet`), sopra la pagina, con due altezze su telefono:
  - **l'anteprima**, a circa metà schermo: l'intestazione (foto, nome, dettagli e la X), la riga con la media o
    i voti che mancano e il cuore, poi «Com'era?» con le stelle grandi;
  - **il foglio intero**: trascinato su da un punto qualunque dell'anteprima, con un tocco sull'intestazione o
    sulla maniglia, o con la rotella, cresce fino a riempire lo schermo con le stesse sezioni della pagina
    (`SoupSections`). Da intero scorre; tirato giù dalla maniglia, dall'intestazione o dalla cima del
    contenuto torna all'anteprima, poi si chiude.
  - Il movimento è un solo `transform` impostato dal codice: entra, si ferma e se ne va sulla stessa
    transizione, e mentre il dito trascina lo segue senza. Lasciato andare, lo slancio sceglie l'altezza.
  - Su desktop è un pannello che entra da destra e scorre fino in fondo. Con il movimento ridotto sfuma e basta.
  - Sta nello stato della cronologia della pagina sotto (`state.zuppa`): il tasto indietro lo chiude e la
    pagina resta dove era. Il link della card resta un vero link a `/prodotti/<ean>`.
  - Il voto dato nel foglio entra subito nelle card della lista sotto (`patchListVotes`), senza ricaricarla.
- Nella scheda e nel foglio: il pannello nero «Com'era?» diventa «Il tuo voto»; sotto, il nome della stella
  scelta e **«Togli il voto»**, un pulsante vero. Il toast «Voto tolto» con
  «Rimettilo» lo annulla.
- **I tag** compaiono dopo la prima stella, in tre gruppi (Pro, Contro, Com'è) con il segno davanti (+ − ·),
  al massimo tre.

### La scheda prodotto

**Da 1024 px due colonne**: la confezione sul suo piatto a sinistra, ferma (`sticky`) mentre a destra scorre tutto
il resto, nello stesso ordine. Su telefono: foto a tutta larghezza sul bianco, poi un **foglio** con gli angoli arrotondati che le sale sopra, sfumato dal
giallo mais alla carta. Nell'ordine: nome, dettagli, badge e posto in classifica; avvisi (fuori produzione,
ricetta cambiata); il voto; come l'hanno votata e cosa ne dicono; **«Senza:»**; ingredienti; valori
nutrizionali; Nutri-Score; NOVA, link, codice a barre e crediti.

**«Senza:» compare solo se conosciamo gli ingredienti**: un prodotto senza dati non è «senza glutine». Elenca
gli allergeni dei filtri che l'etichetta non dichiara, e ricorda di leggere sempre la confezione.

### Ricerca e filtri

- **La ricerca suggerisce mentre scrivi** (da due lettere): fino a cinque zuppe con foto e media, poi tipi e
  marche, poi «Tutti i risultati per…». È un combobox ARIA: frecce, Invio, Esc. Il testo diventa una ricerca
  solo con Invio o una scelta, così la lista sotto non salta a ogni lettera.
- **Il tipo si sceglie dai tondi** (`TypeRail`) sopra la lista.
- **Prima di cercare, due schede sopra la lista**: «Da assaggiare» (le zuppe a cui mancano voti per la
  classifica, senza quelle che hai già votato) e «Tutte le zuppe» (`vedi=tutte`). Il titolo della lista è il
  conteggio («446 zuppe»), senza altre righe. Con un testo o un filtro la lista è dei risultati e le schede
  spariscono.
- **Gli altri filtri** (Nutri-Score, allergeni, marca): su desktop in una colonna a sinistra della lista, su
  telefono in un foglio aperto dal tondo con l'icona accanto alla ricerca, che porta il numero dei filtri
  attivi. Nel foglio ogni opzione cambia subito la lista sotto, e «Vedi N zuppe» lo chiude su di lei. `/cerca`
  rimanda alla home con le stesse scelte.
- **Ogni filtro è un link**: un URL da condividere, il tasto indietro lo annulla, funziona prima del JavaScript.
- **Gli allergeni hanno la loro icona** (`AllergenIcon`) e un «−» davanti: è un ingrediente che togli. Le stesse
  icone stanno nel «Senza:» della zuppa.
- **Un solo pannello** (`FilterPanel`), nella colonna o nel foglio. I filtri attivi stanno sopra i risultati
  come pill con ×.
- **Ogni opzione mostra quante zuppe trova**, calcolato senza il proprio filtro.
- **La marca ha un selettore nostro** (`BrandPicker`), con ricerca e conteggi.
- **Lo stato si annuncia con `aria-current`**, e i link usano `activeOptions={EXACT_SEARCH}`.
- **La ricerca senza testo** («Tutte le zuppe», `vedi=tutte`) elenca il catalogo per nome.

### Liste e pagine

- **Telefono**: una colonna di card, con il piatto della foto in 4:5, e una di righe in classifica. Da 640 px due colonne, con il piatto quadrato. **Desktop**: colonna dei filtri da 17rem e tre
  colonne. Contenitore massimo `max-w-6xl`.
- **Nessun nome troncato**: si va a capo.
- **Pagine numerate** (`Pagination`), mai liste infinite: «‹ Indietro 1 2 … 38 Avanti ›» e «Per pagina». Ogni
  pagina è un URL, e il componente sa su quale rotta lavora (`route`).

### Account e profilo

- **Il nome pubblico è sempre il nickname**; finché non lo scegli sei un nome da zuppa (`soupNameFor`).
- **L'avatar è Critters**, in un tondo, con una matita sopra: toccarlo apre la modifica.
- **Nome e faccia si cambiano in un foglio** («Modifica profilo»; su desktop una card al centro), non in una
  sezione sempre aperta. Chi non ha ancora un nome vede «Scegli il tuo nome».
- **Sotto, due riquadri da toccare**: le zuppe votate (nero, la stella) e le preferite (carta, il cuore), che
  portano alle due schede di «Le tue zuppe».
- **Le impostazioni sono un elenco raggruppato**, come sul telefono: righe da 56 px con icona e freccia su un
  solo foglio rialzato, separate da un filo (`.group-rows`). Tema, gestione prodotti per l'admin, crediti (in
  un foglio). «Esci dall'account» sta da solo, in rosso.
- **«Le tue zuppe» è una pagina con due schede**, Votate e Preferite (`?scheda=preferite`): sono la stessa cosa
  vista da due lati. `/preferiti` rimanda lì. Le righe sono card come in classifica e aprono il foglio della
  zuppa; nelle preferite il cuore toglie la zuppa dalla lista, con «Rimettila». Senza account la scheda dei
  preferiti spiega che servono un account e un accesso.
- **Accedere è «prendere la tua tessera»** (`/accedi`, `LoyaltyCard`): la carta fedeltà gialla e sgranata, con
  un codice a barre interno di negozio. Chi ha già votato senza account trova lì il link alle sue zuppe.
- **Il pulsante di Google segue le sue linee guida** (`GoogleButton`), con i suoi colori e il suo bordo.

### Gestione prodotti (admin)

Uno strumento di lavoro, nella stessa direzione delle altre pagine ma più fitto.

- **Intestazione con la chiave** e le quattro code (Bozze, Pubblicati, Archiviati, Segnalazioni) in una barra a
  pill che scorre di lato su telefono; le segnalazioni aperte hanno il conteggio in giallo.
- **Ricerca come nella home** (nome, marca o inizio dell'EAN) e **«Filtri» in un foglio**: tipo (anche «Senza
  tipo»), foto, voti, correzioni e ordine come opzioni da toccare, ognuna un link. Quelli attivi stanno sotto la
  ricerca come pill con ×, e il pulsante ne dice il numero.
- **Ogni prodotto è una card-riga**: toccarla apre il suo foglio (su desktop il pannello a destra) con stato,
  azioni su quel prodotto, link alla scheda e a Open Food Facts, e la correzione, dove il tipo si sceglie dai
  tondi con le icone.
- **La casella a sinistra seleziona**, e appena c'è una selezione sale una barra nera sopra la tab bar: quanti,
  l'azione principale in giallo, le altre come icone su telefono, e la × per annullare. Ogni cambio di stato si
  annulla dal toast.

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
  --allow font-not-dealt,palette-cream,gradient,app-title-size,colour-sprawl,icon-chips
```

Le regole escluse sono scelte del design system, non sviste: `icon-chips` sono i tondi colorati dei tipi
(`TypeRail`), e su `/` e `/classifica` resta un `edge-text` voluto: la riga dei tipi scorre di lato ed è tagliata
dal bordo dello schermo apposta, con la sfumatura, per far capire che continua. Per il resto: il carattere e la carta crema vengono dalle
reference del designer, non dal foglio di `.taste-skill/direction.json` (che è della direzione precedente); le
macchie sfumate e i titoli grandi sono la vetrina di ricerca e classifica. Nel codice, le stesse eccezioni
stanno in utility con un nome (`.blob-head`, `.sheet-tint`, `.fade-bottom`, `.glass`, `.glass-drop`, `.plate`)
e portano `taste-skill-ignore` sulla riga. Resta un avviso voluto su `/le-mie-zuppe` con pochi voti: la pagina è
corta e il piè di pagina sta in fondo allo schermo.
