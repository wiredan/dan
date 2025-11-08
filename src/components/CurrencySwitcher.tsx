import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DollarSign } from 'lucide-react';
import { useCurrencyStore } from '@/lib/currencyStore';
export function CurrencySwitcher() {
  const { t } = useTranslation();
  const currencies = useCurrencyStore(s => s.currencies);
  const setCurrency = useCurrencyStore(s => s.setCurrency);
  const selectedCurrency = useCurrencyStore(s => s.selectedCurrency);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <DollarSign className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t('currency.switcherTooltip')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currencies.map((currency) => (
          <DropdownMenuItem key={currency.code} onClick={() => setCurrency(currency.code)}>
            {t(currency.name)} ({currency.code})
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}