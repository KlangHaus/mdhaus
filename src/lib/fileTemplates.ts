import type { Locale } from "../i18n/types";

export type FileTemplateId = "blank" | "note" | "meeting" | "blog";

export const FILE_TEMPLATE_IDS: FileTemplateId[] = ["blank", "note", "meeting", "blog"];

const TEMPLATE_BASE_NAMES: Record<FileTemplateId, string> = {
  blank: "untitled.md",
  note: "note.md",
  meeting: "meeting.md",
  blog: "post.md",
};

type TemplateContentByLocale = Record<Locale, Record<FileTemplateId, string>>;

const templateContent: TemplateContentByLocale = {
  da: {
    blank: "# Untitled\n\n",
    note: "---\ntitle: Ny note\ndate: \ntags: \n---\n\n",
    meeting: "---\ntitle: Mødenotat\ndate: \ntags: møde\n---\n\n## Deltagere\n\n- \n\n## Agenda\n\n- \n\n## Noter\n\n",
    blog: "---\ntitle: Nyt indlæg\ndate: \nauthor: \ntags: \n---\n\n",
  },
  en: {
    blank: "# Untitled\n\n",
    note: "---\ntitle: New note\ndate: \ntags: \n---\n\n",
    meeting: "---\ntitle: Meeting notes\ndate: \ntags: meeting\n---\n\n## Attendees\n\n- \n\n## Agenda\n\n- \n\n## Notes\n\n",
    blog: "---\ntitle: New post\ndate: \nauthor: \ntags: \n---\n\n",
  },
  de: {
    blank: "# Untitled\n\n",
    note: "---\ntitle: Neue Notiz\ndate: \ntags: \n---\n\n",
    meeting: "---\ntitle: Besprechungsnotiz\ndate: \ntags: meeting\n---\n\n## Teilnehmer\n\n- \n\n## Agenda\n\n- \n\n## Notizen\n\n",
    blog: "---\ntitle: Neuer Beitrag\ndate: \nauthor: \ntags: \n---\n\n",
  },
  es: {
    blank: "# Untitled\n\n",
    note: "---\ntitle: Nueva nota\ndate: \ntags: \n---\n\n",
    meeting: "---\ntitle: Notas de reunión\ndate: \ntags: reunion\n---\n\n## Asistentes\n\n- \n\n## Agenda\n\n- \n\n## Notas\n\n",
    blog: "---\ntitle: Nueva entrada\ndate: \nauthor: \ntags: \n---\n\n",
  },
  nb: {
    blank: "# Untitled\n\n",
    note: "---\ntitle: Nytt notat\ndate: \ntags: \n---\n\n",
    meeting: "---\ntitle: Møtenotat\ndate: \ntags: møte\n---\n\n## Deltakere\n\n- \n\n## Agenda\n\n- \n\n## Notater\n\n",
    blog: "---\ntitle: Nytt innlegg\ndate: \nauthor: \ntags: \n---\n\n",
  },
  sv: {
    blank: "# Untitled\n\n",
    note: "---\ntitle: Ny anteckning\ndate: \ntags: \n---\n\n",
    meeting: "---\ntitle: Mötesanteckningar\ndate: \ntags: möte\n---\n\n## Deltagare\n\n- \n\n## Agenda\n\n- \n\n## Anteckningar\n\n",
    blog: "---\ntitle: Nytt inlägg\ndate: \nauthor: \ntags: \n---\n\n",
  },
};

export function getTemplateBaseName(templateId: FileTemplateId): string {
  return TEMPLATE_BASE_NAMES[templateId];
}

export function getTemplateContent(templateId: FileTemplateId, locale: Locale): string {
  return templateContent[locale][templateId];
}
