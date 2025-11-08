import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Bot, Send, User as UserIcon, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/authStore";
interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}
export function EducationHubPage() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMessages([{ sender: 'ai', text: t('education.aiChat.greeting') }]);
  }, [t]);
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
    try {
      const response = await api<{ reply: string }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: input }),
      });
      const aiMessage: ChatMessage = { sender: 'ai', text: response.reply };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { sender: 'ai', text: "Sorry, I'm having trouble connecting right now." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
        <div className="mt-24">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot /> {t('education.aiChat.title')}
              </CardTitle>
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
        </div>
      </div>
    </div>
  );
}