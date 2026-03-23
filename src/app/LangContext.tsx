import { createContext, useContext } from "react";
import { i18n, Lang } from "./i18n";

export const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "es",
  setLang: () => {},
});

export function useLang() { return useContext(LangContext); }
export function useT()    { const { lang } = useLang(); return i18n[lang]; }
