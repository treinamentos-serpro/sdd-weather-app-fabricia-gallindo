import { render, screen } from '@testing-library/react';
import CurrentWeather from '../../../src/components/CurrentWeather';
import { weatherDataMock } from '../../../src/mocks/weather';

const { city, current } = weatherDataMock;

function getMetric(label: string) {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling;
}

describe('CurrentWeather', () => {
  it('identifies the city and displays conditions and labeled metrics', () => {
    render(<CurrentWeather city={city} current={current} unit="celsius" />);

    expect(screen.getByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByText(city.contextLabel)).toBeInTheDocument();
    expect(screen.getByText('25,4 °C')).toBeInTheDocument();
    expect(screen.getByText('Sensação térmica: 26,1 °C')).toBeInTheDocument();
    expect(screen.getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(screen.getByText('⛅')).toHaveAttribute('aria-hidden', 'true');
    expect(getMetric('Umidade')).toHaveTextContent('62 %');
    expect(getMetric('Vento')).toHaveTextContent('12,6 km/h');
    expect(getMetric('Precipitação')).toHaveTextContent('0 mm');
    expect(getMetric('Pressão')).toHaveTextContent('Indisponível');
  });

  it('converts both temperatures on prop changes without changing domain data', () => {
    const snapshot = structuredClone(current);
    const { rerender } = render(<CurrentWeather city={city} current={current} unit="celsius" />);

    rerender(<CurrentWeather city={city} current={current} unit="fahrenheit" />);
    expect(screen.getByText('77,7 °F')).toBeInTheDocument();
    expect(screen.getByText('Sensação térmica: 79,0 °F')).toBeInTheDocument();
    expect(screen.queryByText(/°C/)).not.toBeInTheDocument();
    expect(getMetric('Vento')).toHaveTextContent('12,6 km/h');
    expect(current).toEqual(snapshot);
  });

  it('marks missing values explicitly instead of showing zero or stale data', () => {
    const { rerender } = render(<CurrentWeather city={city} current={current} unit="celsius" />);
    rerender(
      <CurrentWeather
        city={city}
        current={{
          ...current,
          temperatureC: null,
          apparentTemperatureC: null,
          weatherCode: null,
          relativeHumidityPercent: null,
          windSpeedKmh: null,
          precipitationMm: null,
        }}
        unit="fahrenheit"
      />,
    );

    expect(screen.getByText('Indisponível', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('Sensação térmica: Indisponível')).toBeInTheDocument();
    expect(screen.getByText('Condição indisponível')).toBeInTheDocument();
    for (const label of ['Umidade', 'Vento', 'Precipitação', 'Pressão']) {
      expect(getMetric(label)).toHaveTextContent('Indisponível');
    }
    expect(screen.queryByText('25,4 °C')).not.toBeInTheDocument();
    expect(screen.queryByText('0 mm')).not.toBeInTheDocument();
  });

  it('preserves zero and negative temperatures and numeric zero metrics', () => {
    render(
      <CurrentWeather
        city={city}
        current={{
          ...current,
          temperatureC: 0,
          apparentTemperatureC: -2.35,
          relativeHumidityPercent: 0,
          windSpeedKmh: 0,
        }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('0,0 °C')).toBeInTheDocument();
    expect(screen.getByText('Sensação térmica: -2,4 °C')).toBeInTheDocument();
    expect(getMetric('Umidade')).toHaveTextContent('0 %');
    expect(getMetric('Vento')).toHaveTextContent('0 km/h');
  });

  it('displays an explicit unknown condition and handles night icons', () => {
    const { rerender } = render(
      <CurrentWeather city={city} current={{ ...current, weatherCode: 999 }} unit="celsius" />,
    );
    expect(screen.getByText('Condição desconhecida (código 999)')).toBeInTheDocument();

    rerender(
      <CurrentWeather
        city={city}
        current={{ ...current, weatherCode: 0, isDay: false }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('🌙')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Céu limpo')).toBeInTheDocument();
  });
});
