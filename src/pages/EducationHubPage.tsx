import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
export function EducationHubPage() {
  const { t } = useTranslation();
  const articles = [
    {
      titleKey: "education.articles.defi.title",
      descriptionKey: "education.articles.defi.description",
      categoryKey: "education.categories.technology",
    },
    {
      titleKey: "education.articles.sustainable.title",
      descriptionKey: "education.articles.sustainable.description",
      categoryKey: "education.categories.farming",
    },
    {
      titleKey: "education.articles.markets.title",
      descriptionKey: "education.articles.markets.description",
      categoryKey: "education.categories.markets",
    },
    {
      titleKey: "education.articles.kyc.title",
      descriptionKey: "education.articles.kyc.description",
      categoryKey: "education.categories.security",
    },
    {
      titleKey: "education.articles.logistics.title",
      descriptionKey: "education.articles.logistics.description",
      categoryKey: "education.categories.logistics",
    },
    {
      titleKey: "education.articles.tokenization.title",
      descriptionKey: "education.articles.tokenization.description",
      categoryKey: "education.categories.investment",
    },
  ];
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{t('education.title')}</h1>
          <p className="mt-4 text-xl text-muted-foreground">{t('education.description')}</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <Card key={index} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <p className="text-sm font-semibold text-primary">{t(article.categoryKey)}</p>
                <CardTitle>{t(article.titleKey)}</CardTitle>
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