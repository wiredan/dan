import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
export function EducationHubPage() {
  const { t } = useTranslation();
  const [isVoiceReaderEnabled, setIsVoiceReaderEnabled] = useState(false);
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
  }, []);
  const speak = (text: string) => {
    if ('speechSynthesis' in window && isVoiceReaderEnabled) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
    }
  };
  const articles = [
    { titleKey: "education.articles.defi.title", descriptionKey: "education.articles.defi.description", categoryKey: "education.categories.technology" },
    { titleKey: "education.articles.sustainable.title", descriptionKey: "education.articles.sustainable.description", categoryKey: "education.categories.farming" },
    { titleKey: "education.articles.markets.title", descriptionKey: "education.articles.markets.description", categoryKey: "education.categories.markets" },
    { titleKey: "education.articles.kyc.title", descriptionKey: "education.articles.kyc.description", categoryKey: "education.categories.security" },
    { titleKey: "education.articles.logistics.title", descriptionKey: "education.articles.logistics.description", categoryKey: "education.categories.logistics" },
    { titleKey: "education.articles.tokenization.title", descriptionKey: "education.articles.tokenization.description", categoryKey: "education.categories.investment" },
  ];
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{t('education.title')}</h1>
          <p className="mt-4 text-xl text-muted-foreground">{t('education.description')}</p>
        </div>
        <div className="flex justify-center items-center gap-2 my-8">
          <Switch
            id="voice-reader-toggle"
            checked={isVoiceReaderEnabled}
            onCheckedChange={setIsVoiceReaderEnabled}
          />
          <Label htmlFor="voice-reader-toggle">{t('education.voiceReader.toggleLabel')}</Label>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <Card key={index} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-primary">{t(article.categoryKey)}</p>
                    <CardTitle>{t(article.titleKey)}</CardTitle>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => speak(`${t(article.titleKey)}. ${t(article.descriptionKey)}`)}
                          disabled={!isVoiceReaderEnabled}
                        >
                          <Volume2 className={`h-5 w-5 ${isVoiceReaderEnabled ? 'text-primary' : 'text-muted-foreground/50'}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('education.voiceReader.readAloudTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">{t(article.descriptionKey)}</p>
              </CardContent>
              <CardFooter>
                <Link to="#" className="flex items-center font-semibold text-sm text-primary hover:underline">
                  {t('education.readMore')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}