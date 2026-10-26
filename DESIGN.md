# Zuppapp — Design system

La guida viva è la pagina **`/design`**: ogni token e componente qui descritto è renderizzato dal codice vero.

## L'idea

> In Zuppapp, **la carta stampata del supermercato** (il cartellino dello scaffale, lo scontrino, la
> dichiarazione nutrizionale) diventa **l'interfaccia**, e il tuo voto è **un timbro rosso** sopra il cartellino.

Il test del concorrente: messo al posto di Zuppapp, Vivino (stelle sulla bottiglia) o Yuka (cerchio colorato) non
regge la frase. Il cartellino con il codice a barre vero del prodotto, lo scontrino dei voti e il timbro esistono
solo perché qui si votano prodotti presi da uno scaffale.

**La cosa viva**: il voto. Un tap su una delle quattro scodelle e il cartellino viene timbrato, con una pressione
breve (`animate-stamp`, 240 ms). Ogni codice a barre è l'EAN-13 reale del prodotto, disegnato da
`src/lib/barcode/ean13.ts`: si può scansionare.

Direzione presa da **taste-skill** (`page-is-the-object`, seed 2007314790, in `.taste-skill/direction.json`), con
due cambi motivati:

- **Carattere**: il foglio proponeva STIX Two Text. Lo scaffale e lo scontrino si stampano in grottesco stretto, e
  il foglio stesso dice «a blunt condensed face for tickets and posters». Quindi uso **Archivo**. L'ispettore
  segnala `font-not-dealt` per questa scelta, che è voluta.
- **Colori**: rosa e melanzana non appartengono al supermercato. Ho tenuto le proporzioni del foglio (carta,
  inchiostro, un solo accento, un campo) e ho preso i colori dal soggetto: carta termica, inchiostro nero, rosso
  timbro, giallo scaffale.

Da **ui-ux-pro-max** ho preso le regole UX (target da 44 px, niente emoji come icone, feedback entro 100 ms,
`prefers-reduced-motion`, un'azione primaria per vista). Non ho preso il suo stile generato (claymorphism, blu,
Press Start 2P), perché è generico e lontano dal soggetto.

## Riferimenti e ricerca

- **HappyOrNot**: quattro facce e nessun punto neutro, nato in un supermercato di Tampere. Il suo limite è che
  dice _come_ ma non _perché_; da noi il perché lo danno i tag.
- **Netflix, dalle stelle ai pollici (2017)**: con un voto più semplice le valutazioni sono cresciute di circa il
  200%.
- **Emoji**: tra una piattaforma e l'altra si leggono in modo diverso (GroupLens 2016: disaccordo sul sentimento
  nel 25% dei casi), e i lettori di schermo ne pronunciano il nome Unicode. Per questo le facce sono **disegnate in
  SVG**, con il nome accessibile preso dall'etichetta.
- **Pochi voti**: la media bayesiana ordina la classifica, mentre la vetrina mostra la quota di «la ricompro»
  (come il Tomatometer) solo da 3 voti in su. Prima compare il cartellino giallo «Da votare».
- **Burkey Belser**, autore della Nutrition Facts label (1994): la tabella nutrizionale come oggetto tipografico,
  con regole spesse e grottesco.
- **Risograph / Fishwife**: due inchiostri piatti e un oggetto stampato invece di un'interfaccia «da SaaS».

## Colori

Due inchiostri su carta, più un giallo. I componenti usano solo i token semantici (`bg-ground`, `text-text-soft`,
…), mai i primitivi. Il tema si sceglie tra **Sistema, Chiaro e Scuro** (`ThemeSwitch`, nel piè di pagina di ogni pagina e nel
profilo). La scelta finisce in `<html data-theme>` e resta in quel browser (`localStorage`): è una
preferenza dello schermo, non dell'account. Con «Sistema», o senza scelta, decide `prefers-color-scheme`.
Uno script nell'`<head>` applica la scelta prima del primo disegno, così non si vede il tema sbagliato; al
cambio le transizioni di colore si spengono per un fotogramma, altrimenti la pagina sfumerebbe a pezzi. Ogni
regola scura (token, pulsante Google, la variante `dark:` di Tailwind) usa lo stesso doppio selettore:
`[data-theme="dark"]`, oppure il sistema scuro quando non è `[data-theme="light"]`.

| Token                | Chiaro                | Scuro                 | Ruolo                                                                                          |
| -------------------- | --------------------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| `ground`             | `#f2f2f0`             | `#191816`             | carta termica, lo sfondo                                                                       |
| `ground-raised`      | `#e4e4e1`             | `#26241f`             | il secondo foglio: cartellini, scontrini, controlli                                            |
| `text`               | `#1d1b19`             | `#edebe6`             | inchiostro dello scontrino                                                                     |
| `text-soft`          | `#5e5a55`             | `#b3aea6`             | inchiostro sbiadito: dettagli, note                                                            |
| `accent`             | `#be241b`             | `#ff6b5b`             | rosso timbro: il voto, «La ricompro», le ragioni a favore e l'anello di focus; **nient'altro** |
| `field` / `on-field` | `#ffd21f` / `#1d1b19` | `#e8be14` / `#1d1b19` | giallo scaffale: un campo per schermata, e il «Da votare»                                      |

**Sul campo giallo si stampa sempre con il tema chiaro**, anche in modalità scura: ogni contenitore `bg-field` porta la classe `.on-field`, che rimette inchiostro, rosso e carta ai valori chiari. Senza, in modalità scura la barra dei voti del 1° posto e l'anello di focus della ricerca sparirebbero sul giallo (1,5:1).

Contrasti misurati con culori (WCAG 2):

| Coppia                                    | Chiaro      | Scuro       |
| ----------------------------------------- | ----------- | ----------- |
| `text` su `ground` / `ground-raised`      | 15,3 / 13,5 | 14,9 / 13,0 |
| `text-soft` su `ground` / `ground-raised` | 6,1 / 5,4   | 8,0 / 7,0   |
| `accent` su `ground` / `ground-raised`    | 5,4 / 4,8   | 6,3 / 5,5   |
| `on-field` su `field`                     | 11,9        | 9,7         |

**Le zuppe nelle scodelle** (`--soup-1…4`: pisello andato a male, brodo, zucca, pomodoro) sono colori di
illustrazione, uguali nei due temi perché una scodella è un oggetto. **Non sono colori per i dati**: il
validatore dataviz le boccia come palette categoriale (luminosità e croma troppo vicini). Per questo la
distribuzione dei voti è una serie sola in inchiostro, con il rosso solo su «La ricompro».

**Il sentimento dei tag non è affidato al colore**: positivo, negativo e neutro si distinguono dal segno
(`+`, `−`, `·`). Il rosso resta del timbro, e la lettura regge anche con il daltonismo e in stampa.

## Carattere

**Archivo** variabile (Omnibus-Type, OFL), installato da `@fontsource-variable/archivo`, quindi niente chiamate a
Google Fonts. È una sola famiglia e l'asse della larghezza fa tutto il lavoro:

- `font-condensed` (larghezza 62%), da nero a extra-grassetto: tutto ciò che è stampato come un prezzo (verdetto,
  titoli di sezione in maiuscolo, il marchio).
- `font-semicondensed` (80%): i nomi dei prodotti e le etichette dei tag.
- Larghezza normale, 400 o 600: tutto ciò che si legge.

Cinque misure, ognuna con la sua interlinea, in `rem`:

| Token            | Misura    | Interlinea | Uso                                             |
| ---------------- | --------- | ---------- | ----------------------------------------------- |
| `text-small`     | 13 px     | 1,4        | EAN, crediti, note. È il minimo                 |
| `text-body`      | 16 px     | 1,5        | tutto ciò che si legge                          |
| `text-lead`      | 20 px     | 1,2        | titoli di sezione, nome sul cartellino in lista |
| `text-title`     | 28–32 px  | 0,95       | nome del prodotto sulla sua pagina              |
| `text-figure`    | 64–104 px | 0,85       | il verdetto, come un prezzo a scaffale          |
| `text-figure-sm` | 52 px     | 0,85       | il verdetto sul cartellino in lista             |

Fuori dalla scala ci sono solo misure da esposizione con un nome e un compito: `text-wordmark` (il marchio),
`text-rank-hero` (il 1° posto) e `text-rank` (2° e 3°). Le etichette maiuscole piccole usano `.label-caps`:
stretto, nero, maiuscolo e **0,05 em di spaziatura**, perché a 13 px il maiuscolo senza aria non si legge. I
paragrafi vanno a capo con `text-wrap: pretty`, così non resta una parola sola sull'ultima riga.

Le cifre che cambiano o si confrontano (percentuali, conteggi, EAN, valori nutrizionali) usano `tabular-nums`.

## Oggetti (componenti)

Tutti in `src/components/ds/`, più le facce in `src/components/brand/`.

- **`ShelfLabel`, il cartellino.** Ha la striscia gialla del bordo scaffale, il nome a sinistra, il verdetto dove
  starebbe il prezzo e il codice a barre in basso. In lista tutto il cartellino è il link; sulla pagina del
  prodotto contiene l'`h1` e riceve il timbro.
- **`Verdict`, il verdetto.** È la percentuale di «la ricompro» in una cifra enorme e stretta. Sotto i 3 voti
  diventa il cartellino giallo «Da votare» con il conteggio: mai un 100% fuorviante.
- **`Stamp`, il timbro.** Rosso, stretto, inclinato di −6°, con la doppia cornice dei timbri veri. Si posa a
  cavallo del bordo inferiore del cartellino.
- **`BowlFace`, le quattro facce.** Scodelle viste dall'alto con la faccia che galleggia nella zuppa: ✕✕ e bocca
  ondulata; punti e riga; sorriso; occhi chiusi, lingua e goccia. Sono decorative accanto alla loro etichetta e
  ricevono `title` quando stanno da sole.
- **`FacePicker`.** Un vero `radiogroup`: le frecce spostano la scelta, il nome accessibile è l'etichetta e la
  faccia scelta è in negativo (inchiostro pieno).
- **`Sticker`.** L'etichetta della prezzatrice, con le estremità a punta (`clip-path`) e il segno davanti. Quando è
  premuto diventa inchiostro pieno. Se ne scelgono al massimo 3: gli altri si disattivano e la legenda lo dice.
- **`Receipt`, `ReceiptRow`, `ReceiptTotal`: lo scontrino.** Foglio rialzato con il bordo inferiore strappato a
  zig-zag, righe «etichetta · puntini · valore» e il totale in negativo.
- **`VoteDistribution`.** Le quattro facce come righe dello scontrino, con conteggio e percentuale sempre
  stampati e una barra sottile sotto ciascuna: una serie sola, la barra non è mai l'unica portatrice del numero.
- **`NutritionLabel`.** La dichiarazione nutrizionale UE come sta sulla confezione. È una tabella vera, quindi
  tiene le sue righe: spessa sotto il titolo, sottili tra i nutrienti.
- **`PackPhoto`.** La foto della confezione, mai ritagliata (`object-contain`), con il contorno neutro da 1 px. Sulla pagina sta sopra il cartellino, come il prodotto sullo scaffale; in lista è una miniatura accanto al nome, con `alt` vuoto perché il nome la dice già.
- **`Barcode`.** EAN-13 vero con zona di rispetto, **sempre nero su bianco in entrambi i temi**, perché uno scanner non legge un codice al contrario; un codice non valido mostra solo il testo. Compare **solo in fondo alla scheda prodotto**, piccolo: serve a uno scanner o a chi cerca quella confezione precisa, non a chi sceglie una zuppa (vedi «Regole»).
- **Filtri e schede di stato** (home e `/admin`). Sono link, non pulsanti: ogni filtro è un URL che si può
  condividere e che funziona anche senza JavaScript. Quello attivo è in negativo e ha `aria-current`, il
  conteggio è in cifre tabulari. Marca e ordinamento usano `<select>` nativi con etichetta visibile, perché
  le liste sono lunghe.
- **Campo di ricerca.** Foglio rialzato con una riga d'inchiostro da 3 px sotto, come lo spazio da compilare
  su un modulo; etichetta visibile e 16 px, così iOS non ingrandisce la pagina.
- **`Podium`, `Leaderboard`** (`src/components/catalog/ranking.tsx`). Vedi «La classifica è un volantino».
- **`ScoreSpread` e `SpreadLegend`.** Come si sono divisi i voti, in una barra: rosso per «La ricompro»,
  inchiostro pieno per «Buona», inchiostro al 55% per «Si mangia» (almeno 3:1 sulla carta) e lo stesso
  inchiostro tratteggiato a 45° per «Mai più» (`.hatch`), così non si devono distinguere due grigi. Segmenti
  separati da 2 px di carta. Il nome accessibile è la frase con le percentuali. La legenda si stampa una volta sopra una lista di barre.
- **`TasteTile` e `QuickVote`.** La scheda di un prodotto da assaggiare: confezione, nome, quanti voti mancano e
  quattro scodelle. Ogni scodella è un pulsante da 48 px con `aria-pressed` e il nome della faccia, dentro un
  gruppo «Vota <prodotto>».
- **`FilterPanel`, `FilterSheet`, `ActiveFilters`.** Vedi «Filtri».
- **`Button`.** Quadrato, piatto, un solo riempimento: `ink` per l'unica azione primaria della vista, `paper` per
  tutto il resto.
- **`SiteFooter`.** La chiusura di ogni pagina, un tono sotto la carta: il marchio, i crediti che le licenze chiedono (Open Food Facts in ODbL, Critters di DiceBear in CC0), il link al codice e l'interruttore del tema.
- **`AppBar`.** Il marchio e la via di ritorno, senza cromature.
- **Icona.** La scodella fumante in `ink-900` su un quadrato pieno di `shelf-400`, angoli vivi: è un cartellino
  giallo, come il bordo dello scaffale. Da 48 px in su è il disegno CC0 di svgrepo.com/svg/453/soup a tratto; a
  16 e 32 px (`favicon.svg`, `favicon.ico`) è ridisegnata sulla griglia da 16, piena, perché il tratto sottile
  sparisce nel giallo. La versione `maskable` lascia la scodella nel cerchio sicuro dell'80%. Tutti i file in
  `public/` nascono da un solo script; per cambiarli si rigenera, non si ritocca un PNG.

## Regole per ogni schermata

Valgono per ogni funzione nuova. Sono nate dalla revisione della home: una lista di cartellini tutti
uguali non sembrava una classifica, e il codice a barre in primo piano non diceva niente a chi vota.

### Gerarchia: cosa conta per chi sceglie una zuppa

1. **La confezione** (foto): è così che la si riconosce allo scaffale.
2. **Il verdetto**: la percentuale di «la ricompro» e quanti voti la sostengono.
3. **Il nome**, poi marca, tipo e formato.
4. **Come si sono divisi i voti** (`ScoreSpread`).
5. Tutto il resto (EAN, codice a barre, NOVA, dati tecnici) va **in fondo alla scheda**, mai in una lista.

Prima di aggiungere un'informazione a una lista bisogna chiedersi se aiuta a scegliere. Se non aiuta, va nella
scheda.

### La classifica è un volantino

La home si impagina come la copertina di un volantino del supermercato. Dove il volantino stampa il prezzo,
Zuppapp stampa la quota di «la ricompro».

- **Podio** (`Podium`): il 1° è la copertina, sul campo giallo, con la confezione grande su un piatto bianco e la
  posizione in cifre enormi. 2° e 3° stanno accanto, sul foglio rialzato. Su desktop la griglia è a 12 colonne
  (7 + 5), e i tre riquadri condividono le stesse linee.
- **Dal 4° in giù** (`Leaderboard`): una riga per prodotto con posizione in cifre grandi, miniatura, nome,
  barra della distribuzione e percentuale. È un vero `<ol>` che parte da 4.
- **Accanto a ogni percentuale c'è sempre il numero di voti**, con lo stesso peso («su 18 voti»): è questo che spiega l'ordine.
- **L'ordine non deve mai smentire i numeri**: la classifica ordina per stima bayesiana della stessa quota che
  si vede (`bayesRebuyShare`, 5 voti fittizi alla quota generale). Una riga sotto il titolo spiega perché pochi
  voti salgono piano.
- **Da 3 voti in su si entra in classifica.** Prima il prodotto sta in «Da assaggiare», con l'etichetta gialla
  «Mancano N voti alla classifica».
- **La posizione** si scrive «1° in classifica», con una cifra sola. Mai numeri decorativi come 01 o 02.

### Votare deve costare un tap

- Ogni scheda «Da assaggiare» ha le quattro scodelle (`QuickVote`): si vota dalla lista senza aprire niente. In una scheda stretta le scodelle vanno 2×2 con il nome sotto ciascuna; in riga, sotto stanno scritti i due estremi «Mai più» e «La ricompro», così nessuno vota la scala al contrario. Ogni scodella è alta almeno 48 px.
- Il voto del lettore conta subito nell'etichetta della scheda: mai «Nessun voto» sopra «Hai votato».
  Tag, scontrino e ripensamenti stanno nella scheda prodotto, a un link di distanza («Aggiungi due parole»).
- Il voto rapido **non tocca i tag già scelti** (`tagIds` omesso).
- Dopo il voto la scheda resta dov'era: si aggiorna la classifica, non la griglia sotto il pollice. Se il voto
  è quello che fa entrare il prodotto in classifica, la scheda lo dice.

### Il voto nella scheda prodotto

- **Togliere il voto è un pulsante vero** («× Togli il voto»), accanto al titolo «Il tuo voto», mai un link
  sbiadito. Il toast «Voto tolto» con «Rimettilo» lo annulla.
- Sotto le facce una riga ricorda che si cambia idea toccando un'altra faccia.
- **I tag si scelgono per significato**, in tre gruppi con un'etichetta: **Pro**, **Contro**, **Com'è**. Il
  significato si legge in tre modi, così nessuno deve portarlo da solo: il gruppo, il segno (+ − ·) e
  l'inchiostro. **Il rosso timbro vuol dire «a favore»** (è il rosso di «La ricompro»): il + dei Pro è rosso e un
  Pro scelto si inchiostra di rosso; Contro e Com'è scelti si inchiostrano di nero. Lo scontrino elenca i tag
  nello stesso ordine e con gli stessi segni.

### Account e profilo

- **In alto a destra di ogni pagina c'è chi sei** (`UserChip`). Con un account: la tua faccia Critters e il tuo
  nome, che portano a `/profilo`. Senza account: «Accedi», più «Le mie zuppe» appena hai votato una volta.
- **Il nome pubblico è sempre il nickname**, mai il nome che arriva da Google. Finché non lo scegli sei un nome
  da zuppa («Ribollita Anonimo #7277»), sempre lo stesso per lo stesso account (`soupNameFor`).
- **L'avatar è Critters, quadrato sul foglio rialzato**, come ogni oggetto del sistema. Si sceglie tra dodici
  facce generate dall'id («Altre facce» ne mostra altre dodici): toccarne una la salva subito.
- **Accedere è «prendere la tua tessera»** (`/accedi`). La pagina mostra la carta fedeltà di Zuppapp
  (`LoyaltyCard`): proporzioni di una carta di credito, giallo scaffale, la tua faccia, il tuo nome, i voti
  già dati e un codice a barre vero. È un codice interno di negozio (prefisso 2), come quelli delle carte
  fedeltà, ricavato dall'id (`loyaltyCode`). Su telefono la tessera viene prima, su desktop sta accanto al
  testo, leggermente inclinata.
- **Il pulsante di Google segue le sue linee guida** (`GoogleButton`): la «G» ufficiale nei quattro colori,
  fondo bianco e bordo `#747775` nel tema chiaro, `#131314` e `#8e918f` nello scuro. Sono colori del marchio,
  non nostri: è l'unico bordo da 1 px fuori dalle tabelle. Di nostro tiene solo gli angoli vivi.
- **`/accedi` promette solo quello che esiste.** Le funzioni future si aggiungono all'elenco quando ci sono.
- **«Le mie zuppe»** elenca i tuoi voti dal più recente, con faccia, tag e data. Per chi è anonimo, un avviso
  giallo ricorda che i voti sono legati a quel browser e invita ad accedere. Lo stato vuoto porta a «Da
  assaggiare».

### Filtri

- **Ogni filtro è un link**: è un URL che si può condividere, il tasto indietro lo annulla e funziona prima che
  arrivi il JavaScript. Fa eccezione la marca, che è un `<select>` nativo perché la lista è lunga.
- **Un solo pannello** (`FilterPanel`): laterale e fisso su desktop (≥ 1024 px), su telefono in un foglio dal
  basso (`FilterSheet`, un `<dialog>` nativo) aperto da «Filtri (n)». Il foglio si chiude con «Mostra N zuppe».
- **I filtri attivi** stanno sopra i risultati come chip in negativo, ciascuna con ×, più «Togli tutti».
- **Ogni opzione mostra quante zuppe trova**, calcolato senza il proprio filtro, così le opzioni non spariscono.
- **La marca ha un selettore nostro** (`BrandPicker`), mai il `<select>` nativo: un pulsante che apre nel flusso del pannello un campo «Cerca una marca» e l'elenco delle marche come link, con i conteggi, le più presenti prima. Esc lo chiude e riporta il focus sul pulsante.
- **Lo stato si annuncia con `aria-current`**: ogni link che riscrive l'URL della home usa `activeOptions={EXACT_SEARCH}`, altrimenti il router segna come correnti anche «Tutte» e le chip da togliere.
- **I filtri utili sono quelli di chi mangia**: tipo, Nutri-Score, «Senza» un allergene, marca. «Senza»
  esclude chi dichiara l'allergene e ricorda di leggere sempre l'etichetta.

### Liste e griglie

- **Telefono**: una colonna per la classifica, due per le schede da assaggiare. **Desktop**: pannello filtri
  da 16rem più contenuto, griglia a tre colonne. Contenitore massimo `max-w-6xl`.
- **Le foto delle confezioni** stanno su un piatto bianco quadrato, intere (`object-contain`), e si chiedono
  alla misura che si disegna (`sizedImage`: 100, 200 o 400 px da Open Food Facts).
- **Nessun nome troncato**: si va a capo.
- **Toccare una foto la ingrandisce, non apre la scheda** (`ZoomablePhoto`): le persone toccano una foto per leggere la confezione. Il resto della scheda resta il link al dettaglio, con un unico link «esteso» (`after:absolute after:inset-0` sul nome) e la foto sopra.
- **Tutte le liste lunghe usano pagine numerate** (`Pagination`), mai liste infinite, in **una riga sola** sotto
  la lista. A sinistra «‹ Indietro 1 2 … 38 Avanti ›»: numeri semplici sulla carta, la pagina corrente in
  inchiostro pieno, «Indietro» e «Avanti» sbiaditi ma al loro posto quando non servono, così i numeri non
  saltano; su telefono restano solo le frecce, e la parola resta per i lettori di schermo. A destra, in
  piccolo, cosa mostra la pagina («49–72 di 446 zuppe», nella classifica «Posti 1–10 di 44») e «Per pagina
  12 ▾»: un menu di link che si apre verso l'alto (12, 24, 48 schede; 10, 20, 50 righe). Ogni pagina e ogni
  misura è un URL (`pagina` e `mostra` per «Da assaggiare» e per la ricerca, `posti` e `righe` per la
  classifica). Il link riporta alla propria sezione, e cambiare misura riparte dalla pagina 1.
- **Nella classifica «per pagina» conta i posti, podio compreso**: con 10 per pagina, pagina 1 mostra i posti
  1–10 (il podio più le righe dal 4° al 10°), pagina 2 i posti 11–20. Il podio sta solo nella prima pagina,
  così il numero scelto e i numeri sullo schermo dicono la stessa cosa.
- **La ricerca cambia modo**: con un testo la home mostra i risultati per pertinenza, senza podio.

## Forma, spazio, movimento

- **Angoli vivi ovunque** (`radius-none`). Le uniche curve sono le scodelle.
- **Nessuna ombra, nessun gradiente visibile, nessun bordo sottile decorativo.** L'unica ombra è di ciò che
  galleggia davvero sopra il contenuto: il menu «Per pagina». I fogli si separano con un passo
  di tono (`ground` → `ground-raised`). I bordi esistono solo nella tabella nutrizionale e nel timbro, dove sono
  l'oggetto stesso.
- **Bordi sagomati**: lo zig-zag dello scontrino e le punte dello sticker sono maschere e `clip-path`, non
  riquadri disegnati.
- **Bersagli da 44 px o più** (`min-h-11`, `min-h-12`, le scodelle a 112 px) con almeno 8 px tra l'uno e l'altro.
- **Movimento** con `--ease-out-snap: cubic-bezier(0.2, 0, 0, 1)`:
  - pressione a `0.96` in 150 ms su ogni controllo, mai sui disabilitati;
  - `animate-stamp`, il timbro (240 ms), riparte solo quando cambi faccia, non al caricamento;
  - `animate-print`, una riga di scontrino che esce (300 ms).
    Sotto `prefers-reduced-motion` restano solo le dissolvenze. Ogni cambio di stato ha anche un segno statico:
    inchiostro pieno, il timbro, il testo.
- **Focus**: anello rosso timbro da 3 px, distanziato di 2 px.

## Comportamenti

- **Il voto si salva dopo 600 ms di quiete** (`useVote` in `src/components/product/vote-panel.tsx`). Si
  vede subito, ma scorrere le facce con le frecce o cambiare tag in fretta manda un solo voto. Il timbro si
  posa quando il voto è salvato. Le scodelle non si disabilitano mai durante il salvataggio, così il focus
  resta dove l’ha messo la tastiera.
- **Togliere il voto si annulla**: compare il toast «Voto tolto» con «Rimettilo», che ripristina faccia e
  tag. Il focus torna alla prima faccia, perché il pulsante sparisce insieme al voto.
- **Gli stati vuoti e di errore parlano come il resto**: «Ancora nessun voto. Il primo scontrino lo stampi
  tu.», «Lo scaffale è vuoto, per ora.» e le pagine «Questa zuppa non c’è» e «Qualcosa è andato storto», con
  la scodella «Mai più» e il pulsante «Tutte le zuppe» (`src/components/error/error-pages.tsx`).
- **Il cartellino in lista** ha come nome accessibile solo il nome del prodotto. Dettagli e verdetto sono la
  descrizione, e l’EAN non viene letto su ogni link.
- **L’anello di focus non viene mai tagliato**: la sagoma a punta dello sticker è uno strato di sfondo, e
  il pulsante resta rettangolare.
- **Le scale di pressione** sono `motion-safe:`, quindi spariscono con `prefers-reduced-motion`.
- **Con il testo molto grande** il selettore passa da quattro scodelle in fila a due per due (container
  query a 19rem).

## Voce

Italiano parlato da banco del supermercato, breve, alla seconda persona, con apostrofi e virgolette tipografici (’ « »): «Com’era?», «Due parole in più?»,
«Togli il mio voto», «Da votare», «Lo scontrino dei voti». Niente punti esclamativi, niente «Ops!».

Regole dei testi (da better-writing):

- **Ogni errore dice cosa fare**: «Il codice EAN ha da 8 a 14 cifre.», «Il voto non è partito. Controlla la
  connessione e tocca di nuovo la faccia.», «Uno dei tag non c'è più: ricarica la pagina e sceglilo di nuovo.»
  Mai solo «non valido» o «non trovato».
- **Annullare batte chiedere conferma** per le azioni frequenti e reversibili: togliere un voto, archiviare o
  pubblicare prodotti in admin. Il toast offre «Annulla» o «Rimettilo».
- **I conteggi passano da `count()`** (`src/lib/plural.ts`), che usa le regole del plurale e dei numeri
  italiani: «1 voto», «12.345 zuppe». In italiano i numeri a quattro cifre non hanno il punto: «1234». Mai
  costruire un plurale con `=== 1`.
- **I link si capiscono anche fuori contesto**: «Vedi la scheda di <prodotto>», «Aggiungi due parole su
  <prodotto>» (la parte col nome può essere solo per i lettori di schermo), «Togli tutti i filtri».
- **I placeholder sono esempi, non istruzioni**: «minestrone, ceci, Knorr…», «Esselunga, Knorr…».
- **Gli stati vuoti dicono cos'è quel posto e come riempirlo**, per esempio «Nessuna bozza da approvare. I
  prodotti nuovi arrivano con l'import da Open Food Facts.»
- **I pulsanti iniziano con un verbo**: «Togli il voto», «Chiudi la foto», «Mostra 47 zuppe», «Salva la
  correzione».

## Controlli

```bash
node <taste-skill>/scripts/lint.mjs src                                   # 0 FAIL
node <taste-skill>/scripts/inspect.mjs http://localhost:3000/prodotti/<ean> --app
```

Le eccezioni alle regole della skill portano un commento `taste-skill-ignore` sulla stessa riga e un motivo: i
puntini guida dello scontrino, la maschera a zig-zag e le righe della tabella nutrizionale. Restano due avvisi
voluti sulla home: il marchio a 128 px e il campo giallo che occupa circa il 30% della prima schermata. La home è
la vetrina del marchio, e il giallo è l'unico campo di colore della schermata.
