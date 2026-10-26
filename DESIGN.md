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
…), mai i primitivi. Il tema segue `prefers-color-scheme`, un solo meccanismo.

| Token                | Chiaro                | Scuro                 | Ruolo                                                      |
| -------------------- | --------------------- | --------------------- | ---------------------------------------------------------- |
| `ground`             | `#f2f2f0`             | `#191816`             | carta termica, lo sfondo                                   |
| `ground-raised`      | `#e4e4e1`             | `#26241f`             | il secondo foglio: cartellini, scontrini, controlli        |
| `text`               | `#1d1b19`             | `#edebe6`             | inchiostro dello scontrino                                 |
| `text-soft`          | `#5e5a55`             | `#b3aea6`             | inchiostro sbiadito: dettagli, note                        |
| `accent`             | `#be241b`             | `#ff6b5b`             | rosso timbro: il voto e l'anello di focus, **nient'altro** |
| `field` / `on-field` | `#ffd21f` / `#1d1b19` | `#e8be14` / `#1d1b19` | giallo scaffale: un campo per schermata, e il «Da votare»  |

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
- **`Barcode`.** EAN-13 vero con zona di rispetto; un codice non valido mostra solo il testo.
- **`Button`.** Quadrato, piatto, un solo riempimento: `ink` per l'unica azione primaria della vista, `paper` per
  tutto il resto.
- **`AppBar`.** Il marchio e la via di ritorno, senza cromature.

## Forma, spazio, movimento

- **Angoli vivi ovunque** (`radius-none`). Le uniche curve sono le scodelle.
- **Nessuna ombra, nessun gradiente visibile, nessun bordo sottile decorativo.** I fogli si separano con un passo
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

## Controlli

```bash
node <taste-skill>/scripts/lint.mjs src                                   # 0 FAIL
node <taste-skill>/scripts/inspect.mjs http://localhost:3000/prodotti/<ean> --app
```

Le eccezioni alle regole della skill portano un commento `taste-skill-ignore` sulla stessa riga e un motivo: i
puntini guida dello scontrino, la maschera a zig-zag e le righe della tabella nutrizionale. Restano due avvisi
voluti sulla home: il marchio a 128 px e il campo giallo che occupa circa il 30% della prima schermata. La home è
la vetrina del marchio, e il giallo è l'unico campo di colore della schermata.
