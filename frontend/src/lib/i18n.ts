import type { LanguagePreference } from "./api";

export type UILocale = "en" | "hi";

type TranslationKey =
  | "nav_chat"
  | "nav_documents"
  | "nav_tools"
  | "nav_admin"
  | "conversations"
  | "no_conversations"
  | "new_chat"
  | "sign_out"
  | "task"
  | "language"
  | "persona"
  | "start_conversation"
  | "start_conversation_hint"
  | "upload_case";

const strings: Record<UILocale, Record<TranslationKey, string>> = {
  en: {
    nav_chat: "Chat",
    nav_documents: "Documents",
    nav_tools: "Legal Tools",
    nav_admin: "Admin",
    conversations: "Conversations",
    no_conversations: "No conversations yet",
    new_chat: "New chat",
    sign_out: "Sign out",
    task: "Task",
    language: "Language",
    persona: "Persona",
    start_conversation: "Start a conversation",
    start_conversation_hint:
      "Ask about legal documents such as contracts, case files, notices, and compliance materials.",
    upload_case: "Upload case file and summarize",
  },
  hi: {
    nav_chat: "चैट",
    nav_documents: "दस्तावेज़",
    nav_tools: "कानूनी उपकरण",
    nav_admin: "एडमिन",
    conversations: "वार्तालाप",
    no_conversations: "अभी कोई वार्तालाप नहीं",
    new_chat: "नई चैट",
    sign_out: "साइन आउट",
    task: "कार्य",
    language: "भाषा",
    persona: "भूमिका",
    start_conversation: "वार्तालाप शुरू करें",
    start_conversation_hint:
      "अनुबंध, केस फाइल, नोटिस और अनुपालन दस्तावेज़ों के बारे में पूछें।",
    upload_case: "केस फ़ाइल अपलोड करें और सारांश लें",
  },
};

export function uiLocaleFromLanguage(language: LanguagePreference): UILocale {
  return language === "hi" ? "hi" : "en";
}

export function t(locale: UILocale, key: TranslationKey): string {
  return strings[locale]?.[key] || strings.en[key];
}
