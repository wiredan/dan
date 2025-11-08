import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
const articlesData = [
  { slug: "defi-in-agriculture", titleKey: "education.articles.defi.title", contentKey: "education.articles.defi.content", categoryKey: "education.categories.technology" },
  { slug: "sustainable-farming", titleKey: "education.articles.sustainable.title", contentKey: "education.articles.sustainable.content", categoryKey: "education.categories.farming" },
  { slug: "global-food-markets", titleKey: "education.articles.markets.title", contentKey: "education.articles.markets.content", categoryKey: "education.categories.markets" },
  { slug: "kyc-in-agribusiness", titleKey: "education.articles.kyc.title", contentKey: "education.articles.kyc.content", categoryKey: "education.categories.security" },
  { slug: "logistics-optimization", titleKey: "education.articles.logistics.title", contentKey: "education.articles.logistics.content", categoryKey: "education.categories.logistics" },
  { slug: "agri-tokenization", titleKey: "education.articles.tokenization.title", contentKey: "education.articles.tokenization.content", categoryKey: "education.categories.investment" },
];
export function ArticleDetailPage() {
  const { articleId } = useParams<{ articleId: string }>();
  const { t } = useTranslation();
  const article = articlesData.find(a => a.slug === articleId);
  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-2xl font-bold">Article Not Found</h1>
        <p className="text-muted-foreground mt-2">The article you are looking for does not exist.</p>
        <Button asChild className="mt-6">
          <Link to="/education">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t('education.backToHub')}
          </Link>
        </Button>
      </div>
    );
  }
  const content = t(article.contentKey, { returnObjects: true }) as string[];
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-16 md:py-24">
        <div className="mb-8">
          <Button asChild variant="ghost">
            <Link to="/education">
              <ArrowLeft className="mr-2 h-4 w-4" /> {t('education.backToHub')}
            </Link>
          </Button>
        </div>
        <article className="prose dark:prose-invert max-w-none">
          <p className="text-base font-semibold text-primary">{t(article.categoryKey)}</p>
          <h1 className="text-4xl font-bold tracking-tight mt-2">{t(article.titleKey)}</h1>
          <div className="mt-8 space-y-6 text-lg text-foreground/80">
            {Array.isArray(content) ? content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            )) : <p>{content}</p>}
          </div>
        </article>
      </div>
    </div>
  );
}