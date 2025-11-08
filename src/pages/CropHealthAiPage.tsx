import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Loader2, CheckCircle, AlertTriangle, ScanLine } from 'lucide-react';
import { api } from '@/lib/api-client';
import { CropHealthAnalysis } from '@shared/types';
import { cn } from '@/lib/utils';
const sampleImages = [
  { name: 'Healthy Field', url: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=800' },
  { name: 'Potential Stress', url: 'https://images.unsplash.com/photo-1492496913980-501348b61469?q=80&w=800' },
  { name: 'Fungal Infection', url: 'https://images.unsplash.com/photo-1627923227318-2705f4b9d435?q=80&w=800' },
];
export function CropHealthAiPage() {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CropHealthAnalysis | null>(null);
  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const result = await api<CropHealthAnalysis>('/api/ai/crop-health', { method: 'POST' });
      setAnalysisResult(result);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{t('cropHealthAI.title')}</h1>
          <p className="mt-4 text-xl text-muted-foreground">{t('cropHealthAI.description')}</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('cropHealthAI.uploadTitle')}</CardTitle>
              <CardDescription>{t('cropHealthAI.uploadDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border-2 border-dashed rounded-lg text-center">
                <p className="text-muted-foreground">File upload is for demonstration purposes.</p>
                <p className="text-sm text-muted-foreground">Please select a sample image below.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('cropHealthAI.sampleImages')}</h3>
                <div className="grid grid-cols-3 gap-4">
                  {sampleImages.map((image) => (
                    <div
                      key={image.name}
                      className={cn(
                        "cursor-pointer border-2 rounded-lg overflow-hidden transition-all",
                        selectedImage === image.url ? 'border-primary ring-2 ring-primary' : 'border-transparent'
                      )}
                      onClick={() => setSelectedImage(image.url)}
                    >
                      <img src={image.url} alt={image.name} className="w-full h-24 object-cover" />
                      <p className="text-xs p-1 text-center bg-muted">{image.name}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleAnalyze} disabled={!selectedImage || isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('cropHealthAI.analyzing')}
                  </>
                ) : (
                  <>
                    <ScanLine className="mr-2 h-4 w-4" />
                    {t('cropHealthAI.analyzeButton')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('cropHealthAI.resultsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">{t('cropHealthAI.analyzing')}</p>
                  <p className="text-sm text-muted-foreground">This may take a moment...</p>
                </div>
              )}
              {!isLoading && !analysisResult && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-secondary rounded-lg">
                  <p className="text-muted-foreground">Your analysis results will appear here.</p>
                </div>
              )}
              {analysisResult && (
                <div className="space-y-6">
                  <div className="relative">
                    <img src={selectedImage!} alt="Analyzed field" className="rounded-lg w-full h-auto" />
                    <div className="absolute inset-0 bg-red-500/20 rounded-lg" style={{
                      maskImage: 'radial-gradient(circle at 30% 40%, black 0%, transparent 50%)',
                      WebkitMaskImage: 'radial-gradient(circle at 30% 40%, black 0%, transparent 50%)',
                    }}></div>
                    <div className="absolute inset-0 bg-yellow-500/20 rounded-lg" style={{
                      maskImage: 'radial-gradient(circle at 60% 70%, black 0%, transparent 40%)',
                      WebkitMaskImage: 'radial-gradient(circle at 60% 70%, black 0%, transparent 40%)',
                    }}></div>
                  </div>
                  <Alert variant={analysisResult.disease === 'None' ? 'default' : 'destructive'}>
                    {analysisResult.disease === 'None' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    <AlertTitle>{t('cropHealthAI.disease')}: {t(analysisResult.disease)}</AlertTitle>
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>{t('cropHealthAI.confidence')}</span>
                        <span className="font-semibold">{analysisResult.confidence.toFixed(1)}%</span>
                      </div>
                      <Progress value={analysisResult.confidence} className="mt-1 h-2" />
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>{t('cropHealthAI.recommendation')}</AlertTitle>
                    <AlertDescription>{t(analysisResult.recommendation)}</AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}