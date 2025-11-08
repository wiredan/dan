import { useState, useCallback } from 'react';
interface GeolocationData {
  latitude: number;
  longitude: number;
}
interface GeolocationError {
  code: number;
  message: string;
}
interface UseGeolocationState {
  loading: boolean;
  error: GeolocationError | null;
  data: GeolocationData | null;
}
export const useGeolocation = () => {
  const [state, setState] = useState<UseGeolocationState>({
    loading: false,
    error: null,
    data: null,
  });
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        loading: false,
        error: { code: 0, message: 'Geolocation is not supported by your browser' },
        data: null,
      });
      return;
    }
    setState({ loading: true, error: null, data: null });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          loading: false,
          error: null,
          data: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
      },
      (err) => {
        setState({
          loading: false,
          error: { code: err.code, message: err.message },
          data: null,
        });
      }
    );
  }, []);
  return { ...state, getLocation };
};