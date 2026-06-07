export type Language = "en" | "it";

export function toggleLanguage(language: Language): Language {
	return language === "en" ? "it" : "en";
}
