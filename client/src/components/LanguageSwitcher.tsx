import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggle = () => {
    setLanguage(language === "de" ? "en" : "de");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="gap-1 text-xs font-medium"
      title={language === "de" ? "Switch to English" : "Auf Deutsch wechseln"}
    >
      <Globe className="w-3.5 h-3.5" />
      {language === "de" ? "EN" : "DE"}
    </Button>
  );
}
