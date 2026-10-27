import { useCallback, useEffect, useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

interface WeatherState {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  query: string;
}

type Operation = { type: 'search'; name: string } | { type: 'selectCity'; city: City };

export function useWeather() {
  const [state, setState] = useState<WeatherState>({
    status: 'idle',
    data: null,
    cities: [],
    error: null,
    query: '',
  });
  const lastOperation = useRef<Operation | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    return () => {
      requestId.current += 1;
    };
  }, []);

  const execute = useCallback(async (operation: Operation): Promise<void> => {
    const id = ++requestId.current;
    lastOperation.current = operation;

    if (operation.type === 'search' && !operation.name) {
      setState((previous) => ({
        ...previous,
        query: '',
        status: 'error',
        error: 'Informe o nome de uma cidade.',
      }));
      return;
    }

    setState((previous) => ({
      ...previous,
      status: 'loading',
      error: null,
      ...(operation.type === 'search' ? { query: operation.name, cities: [] } : {}),
    }));

    try {
      let city: City;
      if (operation.type === 'search') {
        const cities = await searchCities(operation.name);
        if (id !== requestId.current) return;

        setState((previous) => ({ ...previous, cities }));
        const firstCity = cities[0];
        if (!firstCity) {
          setState((previous) => ({ ...previous, status: 'empty' }));
          return;
        }
        city = firstCity;
        lastOperation.current = { type: 'selectCity', city };
      } else {
        city = operation.city;
      }

      const data = await getWeather(city);
      if (id !== requestId.current) return;
      setState((previous) => ({ ...previous, data, status: 'success' }));
    } catch (error) {
      if (id !== requestId.current) return;
      setState((previous) => ({
        ...previous,
        status: 'error',
        error:
          error instanceof WeatherServiceError
            ? error.message
            : 'Não foi possível consultar os dados do tempo. Tente novamente.',
      }));
    }
  }, []);

  const search = useCallback(
    (name: string) => execute({ type: 'search', name: name.trim() }),
    [execute],
  );
  const selectCity = useCallback((city: City) => execute({ type: 'selectCity', city }), [execute]);
  const retry = useCallback(async (): Promise<void> => {
    if (lastOperation.current) {
      await execute(lastOperation.current);
    }
  }, [execute]);

  return { ...state, search, selectCity, retry };
}

export default useWeather;
