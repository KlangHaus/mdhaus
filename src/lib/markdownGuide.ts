import type { Locale } from "../i18n/types";

export interface MarkdownGuideItem {
  title: string;
  description: string;
  syntax: string;
}

export interface MarkdownGuideSection {
  title: string;
  items: MarkdownGuideItem[];
}

type GuideByLocale = Record<Locale, MarkdownGuideSection[]>;

const guides: GuideByLocale = {
  da: [
    {
      title: "Grundlæggende",
      items: [
        {
          title: "Overskrifter",
          description: "Brug 1–6 # for niveau. Vises i indholdsfortegnelsen i preview.",
          syntax: "# Overskrift 1\n## Overskrift 2\n### Overskrift 3",
        },
        {
          title: "Fed, kursiv og gennemstregning",
          description: "Fremhæv tekst med GFM-markører.",
          syntax: "**fed tekst**\n*kursiv tekst*\n~~gennemstreget~~",
        },
        {
          title: "Punktlister",
          description: "Uordnede lister med -, * eller +.",
          syntax: "- Første punkt\n- Andet punkt\n  - Underpunkt",
        },
        {
          title: "Nummererede lister",
          description: "Ordnet liste med tal og punktum.",
          syntax: "1. Første trin\n2. Andet trin\n3. Tredje trin",
        },
        {
          title: "Opgavelister",
          description: "GFM-checkbokse. [x] er afkrydset, [ ] er tom.",
          syntax: "- [ ] Ufærdig opgave\n- [x] Færdig opgave",
        },
      ],
    },
    {
      title: "Links og billeder",
      items: [
        {
          title: "Almindelige links",
          description: "Standard markdown-link med valgfri titel.",
          syntax: "[open mdHaus](https://example.com)\n[Link med titel](https://example.com \"Værktøjstip\")",
        },
        {
          title: "Wikilinks",
          description: "Obsidian-stil. Klik i preview for at åbne filer i mappen.",
          syntax: "[[anden-note]]\n[[mappe/notat]]",
        },
        {
          title: "Wikilink med alias og overskrift",
          description: "Tilpas linktekst eller hop til en sektion i noten.",
          syntax: "[[anden-note|læs mere]]\n[[anden-note#Overskrift 2]]",
        },
        {
          title: "Billeder",
          description: "Relativ sti fra den aktuelle fil. Du kan også trække billeder ind i editoren.",
          syntax: "![Diagram](billeder/flow.png)\n![Logo](logo.png \"Valgfri titel\")",
        },
      ],
    },
    {
      title: "Kode og diagrammer",
      items: [
        {
          title: "Inline-kode",
          description: "Kort kode eller kommando i løbende tekst.",
          syntax: "Brug `npm run tauri:dev` til at starte appen.",
        },
        {
          title: "Kodeblokke",
          description: "Indrykket blok med valgfrit sprognavn.",
          syntax: "```ts\nconst navn = \"mdHaus\";\nconsole.log(navn);\n```",
        },
        {
          title: "Mermaid-diagrammer",
          description: "Renderes som SVG i preview.",
          syntax: "```mermaid\nflowchart LR\n  A[Skriv] --> B[Preview]\n  B --> C[Gem]\n```",
        },
        {
          title: "Matematik (KaTeX)",
          description: "Inline med $...$ og blok med $$...$$. Renderes i preview.",
          syntax: "Inline: $E = mc^2$\n\nBlok:\n$$\n\\int_0^1 x^2 \\, dx = \\frac{1}{3}\n$$",
        },
      ],
    },
    {
      title: "Struktur og metadata",
      items: [
        {
          title: "Citat",
          description: "Fremhæv et citat eller en note.",
          syntax: "> Dette er et citat.\n>\n> Det kan gå over flere linjer.",
        },
        {
          title: "Vandret linje",
          description: "Visuel opdeling mellem afsnit.",
          syntax: "Første afsnit.\n\n---\n\nAndet afsnit.",
        },
        {
          title: "Sektionsopdelere",
          description: "En linje med kun --- efterfulgt af tekst bliver en sektion i indholdsfortegnelsen.",
          syntax: "---\n\nDette afsnit bliver en sektion i TOC.",
        },
        {
          title: "YAML front matter",
          description: "Metadata øverst i filen. Redigeres også via Metadata-panelet.",
          syntax: "---\ntitle: Mit dokument\ndate: 2026-06-25\nauthor: Allan\ntags: noter, projekt\n---\n\nBrødtekst starter her.",
        },
        {
          title: "Tags",
          description: "YAML-tags i front matter og inline #tags. Bruges i tag-panelet til filtrering.",
          syntax: "---\ntags: noter, projekt\n---\n\nDu kan også skrive inline #ide i teksten.",
        },
      ],
    },
    {
      title: "Tabeller",
      items: [
        {
          title: "GFM-tabeller",
          description: "Kolonner adskilles med |. Anden række er kolonneoverskrifter.",
          syntax: "| Funktion | Genvej |\n| --- | --- |\n| Gem | ⌘S |\n| Genveje | ⌘/ |",
        },
      ],
    },
  ],
  en: [
    {
      title: "Basics",
      items: [
        {
          title: "Headings",
          description: "Use 1–6 # characters for levels. Shown in the preview table of contents.",
          syntax: "# Heading 1\n## Heading 2\n### Heading 3",
        },
        {
          title: "Bold, italic, and strikethrough",
          description: "Emphasize text with GFM markers.",
          syntax: "**bold text**\n*italic text*\n~~strikethrough~~",
        },
        {
          title: "Bullet lists",
          description: "Unordered lists with -, *, or +.",
          syntax: "- First item\n- Second item\n  - Nested item",
        },
        {
          title: "Numbered lists",
          description: "Ordered lists with numbers and a period.",
          syntax: "1. First step\n2. Second step\n3. Third step",
        },
        {
          title: "Task lists",
          description: "GFM checkboxes. [x] is checked, [ ] is open.",
          syntax: "- [ ] Open task\n- [x] Done task",
        },
      ],
    },
    {
      title: "Links and images",
      items: [
        {
          title: "Standard links",
          description: "Regular markdown links with an optional title.",
          syntax: "[open mdHaus](https://example.com)\n[Link with title](https://example.com \"Tooltip\")",
        },
        {
          title: "Wikilinks",
          description: "Obsidian-style links. Click in preview to open files in the workspace.",
          syntax: "[[other-note]]\n[[folder/note]]",
        },
        {
          title: "Wikilink alias and heading",
          description: "Custom link text or jump to a section in the target note.",
          syntax: "[[other-note|read more]]\n[[other-note#Heading 2]]",
        },
        {
          title: "Images",
          description: "Paths are relative to the current file. You can also drag images into the editor.",
          syntax: "![Diagram](images/flow.png)\n![Logo](logo.png \"Optional title\")",
        },
      ],
    },
    {
      title: "Code and diagrams",
      items: [
        {
          title: "Inline code",
          description: "Short code or commands inside a sentence.",
          syntax: "Run `npm run tauri:dev` to start the app.",
        },
        {
          title: "Fenced code blocks",
          description: "Indented block with an optional language tag.",
          syntax: "```ts\nconst name = \"mdHaus\";\nconsole.log(name);\n```",
        },
        {
          title: "Mermaid diagrams",
          description: "Rendered as SVG in the preview.",
          syntax: "```mermaid\nflowchart LR\n  A[Write] --> B[Preview]\n  B --> C[Save]\n```",
        },
        {
          title: "Math (KaTeX)",
          description: "Inline with $...$ and block with $$...$$. Rendered in preview.",
          syntax: "Inline: $E = mc^2$\n\nBlock:\n$$\n\\int_0^1 x^2 \\, dx = \\frac{1}{3}\n$$",
        },
      ],
    },
    {
      title: "Structure and metadata",
      items: [
        {
          title: "Blockquote",
          description: "Highlight a quote or callout.",
          syntax: "> This is a quote.\n>\n> It can span multiple lines.",
        },
        {
          title: "Horizontal rule",
          description: "Visual separator between sections.",
          syntax: "First section.\n\n---\n\nSecond section.",
        },
        {
          title: "Section dividers",
          description: "A line with only --- followed by text becomes a TOC section in preview.",
          syntax: "---\n\nThis paragraph becomes a section in the TOC.",
        },
        {
          title: "YAML front matter",
          description: "Metadata at the top of the file. Also editable in the Metadata panel.",
          syntax: "---\ntitle: My document\ndate: 2026-06-25\nauthor: Alex\ntags: notes, project\n---\n\nBody text starts here.",
        },
        {
          title: "Tags",
          description: "YAML tags in front matter and inline #tags. Shown in the tag panel for filtering.",
          syntax: "---\ntags: notes, project\n---\n\nYou can also write inline #idea in the text.",
        },
      ],
    },
    {
      title: "Tables",
      items: [
        {
          title: "GFM tables",
          description: "Columns are separated by |. The second row defines alignment.",
          syntax: "| Feature | Shortcut |\n| --- | --- |\n| Save | ⌘S |\n| Shortcuts | ⌘/ |",
        },
      ],
    },
  ],
  de: [
    {
      title: "Grundlagen",
      items: [
        {
          title: "Überschriften",
          description: "1–6 # für Ebenen. Erscheinen im Inhaltsverzeichnis der Vorschau.",
          syntax: "# Überschrift 1\n## Überschrift 2\n### Überschrift 3",
        },
        {
          title: "Fett, kursiv und durchgestrichen",
          description: "Text mit GFM-Markierungen hervorheben.",
          syntax: "**fetter Text**\n*kursiver Text*\n~~durchgestrichen~~",
        },
        {
          title: "Aufzählungen",
          description: "Ungeordnete Listen mit -, * oder +.",
          syntax: "- Erster Punkt\n- Zweiter Punkt\n  - Unterpunkt",
        },
        {
          title: "Nummerierte Listen",
          description: "Geordnete Liste mit Zahlen und Punkt.",
          syntax: "1. Erster Schritt\n2. Zweiter Schritt\n3. Dritter Schritt",
        },
        {
          title: "Aufgabenlisten",
          description: "GFM-Checkboxen. [x] ist erledigt, [ ] ist offen.",
          syntax: "- [ ] Offene Aufgabe\n- [x] Erledigte Aufgabe",
        },
      ],
    },
    {
      title: "Links und Bilder",
      items: [
        {
          title: "Standard-Links",
          description: "Normale Markdown-Links mit optionalem Titel.",
          syntax: "[open mdHaus](https://example.com)\n[Link mit Titel](https://example.com \"Tooltip\")",
        },
        {
          title: "Wikilinks",
          description: "Obsidian-Stil. In der Vorschau klicken, um Dateien im Workspace zu öffnen.",
          syntax: "[[andere-notiz]]\n[[ordner/notiz]]",
        },
        {
          title: "Wikilink-Alias und Überschrift",
          description: "Eigener Linktext oder Sprung zu einer Überschrift.",
          syntax: "[[andere-notiz|mehr lesen]]\n[[andere-notiz#Überschrift 2]]",
        },
        {
          title: "Bilder",
          description: "Relative Pfade zur aktuellen Datei. Bilder können auch in den Editor gezogen werden.",
          syntax: "![Diagramm](bilder/ablauf.png)\n![Logo](logo.png \"Optionaler Titel\")",
        },
      ],
    },
    {
      title: "Code und Diagramme",
      items: [
        {
          title: "Inline-Code",
          description: "Kurzer Code oder Befehle im Fließtext.",
          syntax: "Starte die App mit `npm run tauri:dev`.",
        },
        {
          title: "Codeblöcke",
          description: "Eingerückter Block mit optionalem Sprach-Tag.",
          syntax: "```ts\nconst name = \"mdHaus\";\nconsole.log(name);\n```",
        },
        {
          title: "Mermaid-Diagramme",
          description: "Werden in der Vorschau als SVG gerendert.",
          syntax: "```mermaid\nflowchart LR\n  A[Schreiben] --> B[Vorschau]\n  B --> C[Speichern]\n```",
        },
        {
          title: "Mathematik (KaTeX)",
          description: "Inline mit $...$ und Block mit $$...$$. Wird in der Vorschau gerendert.",
          syntax: "Inline: $E = mc^2$\n\nBlock:\n$$\n\\int_0^1 x^2 \\, dx = \\frac{1}{3}\n$$",
        },
      ],
    },
    {
      title: "Struktur und Metadaten",
      items: [
        {
          title: "Zitat",
          description: "Ein Zitat oder Hinweis hervorheben.",
          syntax: "> Das ist ein Zitat.\n>\n> Es kann mehrere Zeilen umfassen.",
        },
        {
          title: "Horizontale Linie",
          description: "Visuelle Trennung zwischen Abschnitten.",
          syntax: "Erster Abschnitt.\n\n---\n\nZweiter Abschnitt.",
        },
        {
          title: "Abschnittstrenner",
          description: "Eine Zeile nur mit --- gefolgt von Text wird ein TOC-Abschnitt.",
          syntax: "---\n\nDieser Absatz wird ein Abschnitt im Inhaltsverzeichnis.",
        },
        {
          title: "YAML Front Matter",
          description: "Metadaten am Dateianfang. Auch im Metadaten-Panel bearbeitbar.",
          syntax: "---\ntitle: Mein Dokument\ndate: 2026-06-25\nauthor: Alex\ntags: notizen, projekt\n---\n\nDer Text beginnt hier.",
        },
        {
          title: "Tags",
          description: "YAML-Tags im Front Matter und Inline-#tags. Im Tag-Panel zum Filtern.",
          syntax: "---\ntags: notizen, projekt\n---\n\nOder inline #idee im Text.",
        },
      ],
    },
    {
      title: "Tabellen",
      items: [
        {
          title: "GFM-Tabellen",
          description: "Spalten werden mit | getrennt. Die zweite Zeile definiert die Ausrichtung.",
          syntax: "| Funktion | Tastenkürzel |\n| --- | --- |\n| Speichern | ⌘S |\n| Kürzel | ⌘/ |",
        },
      ],
    },
  ],
  es: [
    {
      title: "Básico",
      items: [
        {
          title: "Encabezados",
          description: "Usa 1–6 # para los niveles. Aparecen en el índice de la vista previa.",
          syntax: "# Encabezado 1\n## Encabezado 2\n### Encabezado 3",
        },
        {
          title: "Negrita, cursiva y tachado",
          description: "Destaca texto con marcadores GFM.",
          syntax: "**texto en negrita**\n*texto en cursiva*\n~~tachado~~",
        },
        {
          title: "Listas con viñetas",
          description: "Listas desordenadas con -, * o +.",
          syntax: "- Primer elemento\n- Segundo elemento\n  - Subelemento",
        },
        {
          title: "Listas numeradas",
          description: "Lista ordenada con números y punto.",
          syntax: "1. Primer paso\n2. Segundo paso\n3. Tercer paso",
        },
        {
          title: "Listas de tareas",
          description: "Casillas GFM. [x] está marcada, [ ] está abierta.",
          syntax: "- [ ] Tarea pendiente\n- [x] Tarea hecha",
        },
      ],
    },
    {
      title: "Enlaces e imágenes",
      items: [
        {
          title: "Enlaces estándar",
          description: "Enlaces markdown con título opcional.",
          syntax: "[open mdHaus](https://example.com)\n[Enlace con título](https://example.com \"Tooltip\")",
        },
        {
          title: "Wikilinks",
          description: "Estilo Obsidian. Haz clic en la vista previa para abrir archivos del workspace.",
          syntax: "[[otra-nota]]\n[[carpeta/nota]]",
        },
        {
          title: "Alias y encabezado en wikilink",
          description: "Texto personalizado o salto a una sección de la nota.",
          syntax: "[[otra-nota|leer más]]\n[[otra-nota#Encabezado 2]]",
        },
        {
          title: "Imágenes",
          description: "Rutas relativas al archivo actual. También puedes arrastrar imágenes al editor.",
          syntax: "![Diagrama](imagenes/flujo.png)\n![Logo](logo.png \"Título opcional\")",
        },
      ],
    },
    {
      title: "Código y diagramas",
      items: [
        {
          title: "Código en línea",
          description: "Código corto o comandos dentro del texto.",
          syntax: "Ejecuta `npm run tauri:dev` para iniciar la app.",
        },
        {
          title: "Bloques de código",
          description: "Bloque con etiqueta de idioma opcional.",
          syntax: "```ts\nconst nombre = \"mdHaus\";\nconsole.log(nombre);\n```",
        },
        {
          title: "Diagramas Mermaid",
          description: "Se renderizan como SVG en la vista previa.",
          syntax: "```mermaid\nflowchart LR\n  A[Escribir] --> B[Vista previa]\n  B --> C[Guardar]\n```",
        },
        {
          title: "Matemáticas (KaTeX)",
          description: "Inline con $...$ y bloque con $$...$$. Se renderiza en la vista previa.",
          syntax: "Inline: $E = mc^2$\n\nBloque:\n$$\n\\int_0^1 x^2 \\, dx = \\frac{1}{3}\n$$",
        },
      ],
    },
    {
      title: "Estructura y metadatos",
      items: [
        {
          title: "Cita",
          description: "Resalta una cita o nota.",
          syntax: "> Esto es una cita.\n>\n> Puede ocupar varias líneas.",
        },
        {
          title: "Línea horizontal",
          description: "Separador visual entre secciones.",
          syntax: "Primera sección.\n\n---\n\nSegunda sección.",
        },
        {
          title: "Separadores de sección",
          description: "Una línea solo con --- seguida de texto aparece en el índice.",
          syntax: "---\n\nEste párrafo se convierte en una sección del índice.",
        },
        {
          title: "YAML front matter",
          description: "Metadatos al inicio del archivo. También editable en el panel de metadatos.",
          syntax: "---\ntitle: Mi documento\ndate: 2026-06-25\nauthor: Alex\ntags: notas, proyecto\n---\n\nEl texto empieza aquí.",
        },
        {
          title: "Etiquetas",
          description: "Etiquetas YAML en front matter e inline #tags. Se muestran en el panel de etiquetas.",
          syntax: "---\ntags: notas, proyecto\n---\n\nTambién puedes escribir inline #idea en el texto.",
        },
      ],
    },
    {
      title: "Tablas",
      items: [
        {
          title: "Tablas GFM",
          description: "Las columnas se separan con |. La segunda fila define la alineación.",
          syntax: "| Función | Atajo |\n| --- | --- |\n| Guardar | ⌘S |\n| Atajos | ⌘/ |",
        },
      ],
    },
  ],
  nb: [
    {
      title: "Grunnleggende",
      items: [
        {
          title: "Overskrifter",
          description: "Bruk 1–6 # for nivåer. Vises i innholdsfortegnelsen i forhåndsvisning.",
          syntax: "# Overskrift 1\n## Overskrift 2\n### Overskrift 3",
        },
        {
          title: "Fet, kursiv og gjennomstreking",
          description: "Marker tekst med GFM-markører.",
          syntax: "**fet tekst**\n*kursiv tekst*\n~~gjennomstreket~~",
        },
        {
          title: "Punktlister",
          description: "Uordnede lister med -, * eller +.",
          syntax: "- Første punkt\n- Andre punkt\n  - Underpunkt",
        },
        {
          title: "Nummererte lister",
          description: "Ordnet liste med tall og punktum.",
          syntax: "1. Første steg\n2. Andre steg\n3. Tredje steg",
        },
        {
          title: "Oppgavelister",
          description: "GFM-avkrysningsbokser. [x] er ferdig, [ ] er åpen.",
          syntax: "- [ ] Åpen oppgave\n- [x] Fullført oppgave",
        },
      ],
    },
    {
      title: "Lenker og bilder",
      items: [
        {
          title: "Vanlige lenker",
          description: "Standard markdown-lenke med valgfri tittel.",
          syntax: "[open mdHaus](https://example.com)\n[Lenke med tittel](https://example.com \"Verktøytips\")",
        },
        {
          title: "Wikilenker",
          description: "Obsidian-stil. Klikk i forhåndsvisning for å åpne filer i mappen.",
          syntax: "[[annen-notat]]\n[[mappe/notat]]",
        },
        {
          title: "Wikilenke med alias og overskrift",
          description: "Tilpass lenketekst eller hopp til en seksjon i notatet.",
          syntax: "[[annen-notat|les mer]]\n[[annen-notat#Overskrift 2]]",
        },
        {
          title: "Bilder",
          description: "Relative stier fra gjeldende fil. Du kan også dra bilder inn i editoren.",
          syntax: "![Diagram](bilder/flyt.png)\n![Logo](logo.png \"Valgfri tittel\")",
        },
      ],
    },
    {
      title: "Kode og diagrammer",
      items: [
        {
          title: "Inline-kode",
          description: "Kort kode eller kommandoer i løpende tekst.",
          syntax: "Kjør `npm run tauri:dev` for å starte appen.",
        },
        {
          title: "Kodeblokker",
          description: "Blokk med valgfritt språknavn.",
          syntax: "```ts\nconst navn = \"mdHaus\";\nconsole.log(navn);\n```",
        },
        {
          title: "Mermaid-diagrammer",
          description: "Renderes som SVG i forhåndsvisning.",
          syntax: "```mermaid\nflowchart LR\n  A[Skriv] --> B[Forhåndsvisning]\n  B --> C[Lagre]\n```",
        },
        {
          title: "Matematikk (KaTeX)",
          description: "Inline med $...$ og blokk med $$...$$. Renderes i forhåndsvisning.",
          syntax: "Inline: $E = mc^2$\n\nBlokk:\n$$\n\\int_0^1 x^2 \\, dx = \\frac{1}{3}\n$$",
        },
      ],
    },
    {
      title: "Struktur og metadata",
      items: [
        {
          title: "Sitat",
          description: "Fremhev et sitat eller en merknad.",
          syntax: "> Dette er et sitat.\n>\n> Det kan gå over flere linjer.",
        },
        {
          title: "Horisontal linje",
          description: "Visuell skillelinje mellom avsnitt.",
          syntax: "Første avsnitt.\n\n---\n\nAndre avsnitt.",
        },
        {
          title: "Seksjonsskiller",
          description: "En linje med bare --- etterfulgt av tekst blir en seksjon i innholdsfortegnelsen.",
          syntax: "---\n\nDette avsnittet blir en seksjon i TOC.",
        },
        {
          title: "YAML front matter",
          description: "Metadata øverst i filen. Kan også redigeres i metadata-panelet.",
          syntax: "---\ntitle: Mitt dokument\ndate: 2026-06-25\nauthor: Alex\ntags: notater, prosjekt\n---\n\nBrødtekst starter her.",
        },
        {
          title: "Tagger",
          description: "YAML-tagger i front matter og inline #tagger. Vises i tagg-panelet for filtrering.",
          syntax: "---\ntags: notater, prosjekt\n---\n\nDu kan også skrive inline #idé i teksten.",
        },
      ],
    },
    {
      title: "Tabeller",
      items: [
        {
          title: "GFM-tabeller",
          description: "Kolonner skilles med |. Andre rad definerer justering.",
          syntax: "| Funksjon | Snarvei |\n| --- | --- |\n| Lagre | ⌘S |\n| Snarveier | ⌘/ |",
        },
      ],
    },
  ],
  sv: [
    {
      title: "Grunderna",
      items: [
        {
          title: "Rubriker",
          description: "Använd 1–6 # för nivåer. Visas i innehållsförteckningen i förhandsvisningen.",
          syntax: "# Rubrik 1\n## Rubrik 2\n### Rubrik 3",
        },
        {
          title: "Fet, kursiv och genomstrykning",
          description: "Framhäv text med GFM-markörer.",
          syntax: "**fet text**\n*kursiv text*\n~~genomstruken~~",
        },
        {
          title: "Punktlistor",
          description: "Oordnade listor med -, * eller +.",
          syntax: "- Första punkten\n- Andra punkten\n  - Underpunkt",
        },
        {
          title: "Numrerade listor",
          description: "Ordnad lista med siffror och punkt.",
          syntax: "1. Första steget\n2. Andra steget\n3. Tredje steget",
        },
        {
          title: "Uppgiftslistor",
          description: "GFM-kryssrutor. [x] är markerad, [ ] är öppen.",
          syntax: "- [ ] Öppen uppgift\n- [x] Klar uppgift",
        },
      ],
    },
    {
      title: "Länkar och bilder",
      items: [
        {
          title: "Vanliga länkar",
          description: "Standard markdown-länk med valfri titel.",
          syntax: "[open mdHaus](https://example.com)\n[Länk med titel](https://example.com \"Verktygstips\")",
        },
        {
          title: "Wikilänkar",
          description: "Obsidian-stil. Klicka i förhandsvisningen för att öppna filer i mappen.",
          syntax: "[[annan-anteckning]]\n[[mapp/anteckning]]",
        },
        {
          title: "Wikilänk med alias och rubrik",
          description: "Anpassad länktext eller hopp till en sektion i anteckningen.",
          syntax: "[[annan-anteckning|läs mer]]\n[[annan-anteckning#Rubrik 2]]",
        },
        {
          title: "Bilder",
          description: "Relativa sökvägar från aktuell fil. Du kan också dra bilder till editorn.",
          syntax: "![Diagram](bilder/flode.png)\n![Logotyp](logo.png \"Valfri titel\")",
        },
      ],
    },
    {
      title: "Kod och diagram",
      items: [
        {
          title: "Inline-kod",
          description: "Kort kod eller kommandon i löpande text.",
          syntax: "Kör `npm run tauri:dev` för att starta appen.",
        },
        {
          title: "Kodblock",
          description: "Block med valfritt språknamn.",
          syntax: "```ts\nconst namn = \"mdHaus\";\nconsole.log(namn);\n```",
        },
        {
          title: "Mermaid-diagram",
          description: "Renderas som SVG i förhandsvisningen.",
          syntax: "```mermaid\nflowchart LR\n  A[Skriv] --> B[Förhandsvisning]\n  B --> C[Spara]\n```",
        },
        {
          title: "Matematik (KaTeX)",
          description: "Inline med $...$ och block med $$...$$. Renderas i förhandsvisningen.",
          syntax: "Inline: $E = mc^2$\n\nBlock:\n$$\n\\int_0^1 x^2 \\, dx = \\frac{1}{3}\n$$",
        },
      ],
    },
    {
      title: "Struktur och metadata",
      items: [
        {
          title: "Citat",
          description: "Framhäv ett citat eller en anteckning.",
          syntax: "> Det här är ett citat.\n>\n> Det kan gå över flera rader.",
        },
        {
          title: "Horisontell linje",
          description: "Visuell avgränsare mellan avsnitt.",
          syntax: "Första avsnittet.\n\n---\n\nAndra avsnittet.",
        },
        {
          title: "Avsnittsavgränsare",
          description: "En rad med bara --- följt av text blir ett avsnitt i innehållsförteckningen.",
          syntax: "---\n\nDet här stycket blir ett avsnitt i TOC.",
        },
        {
          title: "YAML front matter",
          description: "Metadata högst upp i filen. Kan också redigeras i metadata-panelen.",
          syntax: "---\ntitle: Mitt dokument\ndate: 2026-06-25\nauthor: Alex\ntags: anteckningar, projekt\n---\n\nBrödtext börjar här.",
        },
        {
          title: "Taggar",
          description: "YAML-taggar i front matter och inline #taggar. Visas i taggpanelen för filtrering.",
          syntax: "---\ntags: anteckningar, projekt\n---\n\nDu kan också skriva inline #idé i texten.",
        },
      ],
    },
    {
      title: "Tabeller",
      items: [
        {
          title: "GFM-tabeller",
          description: "Kolumner separeras med |. Andra raden definierar justering.",
          syntax: "| Funktion | Genväg |\n| --- | --- |\n| Spara | ⌘S |\n| Genvägar | ⌘/ |",
        },
      ],
    },
  ],
};

export function getMarkdownGuideSections(locale: string): MarkdownGuideSection[] {
  if (locale in guides) {
    return guides[locale as Locale];
  }

  return guides.en;
}
