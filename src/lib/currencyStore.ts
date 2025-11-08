import { create } from 'zustand';
import { persist } from 'zustand/middleware';
type Currency = {
  code: 'USD' | 'NGN' | 'EUR' | 'USDT' | 'DAN';
  name: string;
  symbol: string;
  rate: number; // Rate against USD
};
interface CurrencyState {
  currencies: Currency[];
  selectedCurrency: Currency;
  setCurrency: (code: Currency['code']) => void;
}
const availableCurrencies: Currency[] = [
  { code: 'USD', name: 'currency.names.usd', symbol: '$', rate: 1 },
  { code: 'NGN', name: 'currency.names.ngn', symbol: '₦', rate: 1450 },
  { code: 'EUR', name: 'currency.names.eur', symbol: '€', rate: 0.92 },
  { code: 'USDT', name: 'currency.names.usdt', symbol: '₮', rate: 1 },
  { code: 'DAN', name: 'currency.names.dan', symbol: 'DAN', rate: 10 },
];
export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currencies: availableCurrencies,
      selectedCurrency: availableCurrencies[0], // Default to USD
      setCurrency: (code) => {
        const newCurrency = get().currencies.find((c) => c.code === code);
        if (newCurrency) {
          set({ selectedCurrency: newCurrency });
        }
      },
    }),
    {
      name: 'agrilink-currency-storage', // name of the item in the storage (must be unique)
      onRehydrateStorage: () => (state) => {
        // This is to ensure the rates are always up-to-date from our mock data
        // in case they change in a new deployment, rather than using stale persisted rates.
        if (state) {
            const persistedCurrency = state.currencies.find(c => c.code === state.selectedCurrency.code);
            if(persistedCurrency) {
                state.selectedCurrency = persistedCurrency;
            }
        }
      }
    }
  )
);