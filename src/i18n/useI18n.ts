import { inject } from "vue";
import { I18N_KEY, type I18nContext } from "./index";

export function useI18n(): I18nContext {
  const i18n = inject(I18N_KEY);
  if (!i18n) {
    throw new Error("useI18n must be used after installI18n");
  }
  return i18n;
}
