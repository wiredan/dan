import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Loader2, CheckCircle, AlertTriangle, MapPin } from 'lucide-react';
import { api } from '@/lib/api-client';
import { CropHealthAnalysis } from '@shared/types';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
const MOCK_SATELLITE_IMAGE = 'https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=800';
const availableCrops = ['Corn', 'Avocados', 'Ginger'];
export function CropHealthAiPage() {
  const { t } = useTranslation();
  const { loading: geoLoading, error: geoError, data: geoData, getLocation } = useGeolocation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CropHealthAnalysis | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const handleAnalyze = useCallback(async () => {
    if (!selectedCrop || !geoData) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await api<CropHealthAnalysis>('/api/ai/crop-health', {
        method: 'POST',
        body: JSON.stringify({ cropType: selectedCrop }),
      });
      setAnalysisResult(result);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedCrop, geoData]);
  useEffect(() => {
    if (geoData && selectedCrop) {
      handleAnalyze();
    }
  }, [geoData, selectedCrop, handleAnalyze]);
  const renderGeoStatus = () => {
    if (geoLoading) {
      return <p className="text-sm text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {t('cropHealthAI.detectingLocation')}</p>;
    }
    if (geoError) {
      const errorMessage = geoError.code === 1 ? t('cropHealthAI.permissionDenied') : t('cropHealthAI.locationError', { message: geoError.message });
      return <p className="text-sm text-destructive">{errorMessage}</p>;
    }
    if (geoData) {
      return <p className="text-sm text-green-600">{t('cropHealthAI.locationDetected', { lat: geoData.latitude.toFixed(4), lon: geoData.longitude.toFixed(4) })}</p>;
    }
    return null;
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
              <CardTitle>{t('cropHealthAI.analysisTitle')}</CardTitle>
              <CardDescription>{t('cropHealthAI.analysisDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex flex-col items-center justify-center text-center h-full">
              <div className="w-full max-w-xs space-y-4">
                <div className="space-y-2 text-left">
                  <Label htmlFor="crop-select">{t('cropHealthAI.selectCrop.label')}</Label>
                  <Select onValueChange={setSelectedCrop} value={selectedCrop}>
                    <SelectTrigger id="crop-select">
                      <SelectValue placeholder={t('cropHealthAI.selectCrop.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCrops.map(crop => (
                        <SelectItem key={crop} value={crop}>{t(`crops.${crop.toLowerCase()}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={getLocation} disabled={!selectedCrop || geoLoading || isAnalyzing} size="lg" className="w-full">
                  {geoLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('cropHealthAI.detectingLocation')}
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      {t('cropHealthAI.detectLocationButton')}
                    </>
                  )}
                </Button>
                <div className="h-5">{renderGeoStatus()}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('cropHealthAI.resultsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              {(isAnalyzing || geoLoading) && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">{isAnalyzing ? t('cropHealthAI.analyzing') : t('cropHealthAI.detectingLocation')}</p>
                  <p className="text-sm text-muted-foreground">{t('cropHealthAI.mayTakeMoment')}</p>
                </div>
              )}
              {!isAnalyzing && !geoLoading && !analysisResult && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-secondary rounded-lg">
                  <p className="text-muted-foreground">{t('cropHealthAI.resultsPlaceholder')}</p>
                </div>
              )}
              {analysisResult && (
                <div className="space-y-6">
                  <div className="relative">
                    <img src={MOCK_SATELLITE_IMAGE} alt="Analyzed field" className="rounded-lg w-full h-auto" />
                    <div className="absolute inset-0 bg-red-500/20 rounded-lg" style={{
                      maskImage: 'radial-gradient(circle at 30% 40%, black 0%, transparent 50%)',
                      WebkitMaskImage: 'radial-gradient(circle at 30% 40%, black 0%, transparent 50%)',
                    }}></div>
                    <div className="absolute inset-0 bg-yellow-500/20 rounded-lg" style={{
                      maskImage: 'radial-gradient(circle at 60% 70%, black 0%, transparent 40%)',
                      WebkitMaskImage: 'radial-gradient(circle at 60% 70%, black 0%, transparent 40%)',
                    }}></div>
                  </div>
                  <Alert variant={t(analysisResult.disease).includes('Healthy') || t(analysisResult.disease).includes('صحي') ? 'default' : 'destructive'}>
                    {t(analysisResult.disease).includes('Healthy') || t(analysisResult.disease).includes('صحي') ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
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