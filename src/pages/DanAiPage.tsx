import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Send, User as UserIcon, Loader2, TrendingUp, Clock, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}
interface MarketDataItem {
  crop: string;
  price: number;
  change: number;
}
const generateMockData = (): MarketDataItem[] => [
  { crop: 'Avocados', price: 2.50 + (Math.random() - 0.5) * 0.2, change: (Math.random() - 0.5) * 5 },
  { crop: 'Ginger', price: 15.00 + (Math.random() - 0.5) * 1, change: (Math.random() - 0.5) * 5 },
  { crop: 'Sweet Corn', price: 0.50 + (Math.random() - 0.5) * 0.1, change: (Math.random() - 0.5) * 5 },
  { crop: 'Cashew Nuts', price: 8.00 + (Math.random() - 0.5) * 0.5, change: (Math.random() - 0.5) * 5 },
];
export function DanAiPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState<MarketDataItem[]>(generateMockData());
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isVoiceReaderEnabled, setIsVoiceReaderEnabled] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const speak = (text: string) => {
    if ('speechSynthesis' in window && isVoiceReaderEnabled) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
    }
  };
  useEffect(() => {
    setMessages([{ sender: 'ai', text: t('education.aiChat.greeting') }]);
    return () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
  }, [t]);
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(generateMockData());
      setLastUpdated(new Date());
    }, 20 * 60 * 1000); // Refresh every 20 minutes
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;
    const userMessage: ChatMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    console.log("handleSendMessage: Before API call");
    try {
      const response = await api<{ reply: string }>('/api/dan/message', { method: 'POST', body: JSON.stringify({ message: input }) });
      const aiMessage: ChatMessage = { sender: 'ai', text: response.reply };
      setMessages(prev => [...prev, aiMessage]);
      speak(response.reply);
    } catch (error) {
      console.log("handleSendMessage: Error in API call", error);
      const errorMessage: ChatMessage = { sender: 'ai', text: "Sorry, the AI assistant is currently offline. Please try again later." };
      setMessages(prev => [...prev, errorMessage]);
      speak(errorMessage.text);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{t('danAI.title')}</h1>
          <p className="mt-4 text-xl text-muted-foreground">{t('danAI.description')}</p>
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Bot /> {t('education.aiChat.title')}
                </CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setIsVoiceReaderEnabled(prev => !prev)}>
                        {isVoiceReaderEnabled ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('danAI.voiceReader.toggleTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full pr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                      {msg.sender === 'ai' && <Avatar className="h-8 w-8"><AvatarFallback><Bot size={18} /></AvatarFallback></Avatar>}
                      <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                      {msg.sender === 'user' && <Avatar className="h-8 w-8"><AvatarFallback><UserIcon size={18} /></AvatarFallback></Avatar>}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback><Bot size={18} /></AvatarFallback></Avatar>
                      <div className="rounded-lg px-4 py-2 bg-secondary flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex w-full items-center space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('education.aiChat.placeholder')}
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                  <span className="sr-only">{t('education.aiChat.send')}</span>
                </Button>
              </form>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp /> {t('danAI.marketData.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('danAI.marketData.crop')}</TableHead>
                    <TableHead className="text-right">{t('danAI.marketData.price')}</TableHead>
                    <TableHead className="text-right">{t('danAI.marketData.change')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketData.map((item) => (
                    <TableRow key={item.crop}>
                      <TableCell className="font-medium">{item.crop}</TableCell>
                      <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.change >= 0 ? "default" : "destructive"}>
                          {item.change.toFixed(2)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={12} />
              {t('danAI.marketData.lastUpdated', { time: lastUpdated.toLocaleTimeString() })}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}