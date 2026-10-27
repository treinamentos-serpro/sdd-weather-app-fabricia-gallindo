import { render, screen, within } from '@testing-library/react';
import ForecastCard from '../../../src/components/ForecastCard';
import ForecastList from '../../../src/components/ForecastList';
import { weatherDataMock } from '../../../src/mocks/weather';

const { forecast } = weatherDataMock;

describe('ForecastList', () => {
  it('renders exactly five days in their supplied order with the required responsive grid', () => {
    render(<ForecastList forecast={forecast} unit="celsius" />);

    const region = screen.getByRole('region', { name: 'Previsão diária' });
    const list = within(region).getByRole('list');
    expect(list).toHaveClass('grid', 'grid-cols-2', 'sm:grid-cols-3', 'lg:grid-cols-5');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(
      items.map(
        (item) => within(item).getByRole('heading', { level: 3 }).querySelector('time')?.dateTime,
      ),
    ).toEqual(forecast.map((day) => day.date));
    expect(within(items[0]).getByRole('heading')).toHaveTextContent('ter., 27/10');
    expect(within(items[4]).getByRole('heading')).toHaveTextContent('sáb., 31/10');
  });

  it('updates all minimum and maximum temperatures when the unit changes', () => {
    const { rerender } = render(<ForecastList forecast={forecast} unit="celsius" />);
    expect(screen.getAllByText(/°C/)).toHaveLength(10);
    expect(screen.getByText('27,5 °C')).toBeInTheDocument();

    rerender(<ForecastList forecast={forecast} unit="fahrenheit" />);
    expect(screen.queryByText(/°C/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/°F/)).toHaveLength(10);
    expect(screen.getByText('81,5 °F')).toBeInTheDocument();
    expect(screen.getByText('64,8 °F')).toBeInTheDocument();
    expect(forecast[0].temperatureMaxC).toBe(27.5);
  });

  it('communicates an empty forecast without creating fake cards', () => {
    render(<ForecastList forecast={[]} unit="celsius" />);
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma previsão disponível.');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

describe('ForecastCard', () => {
  it('shows the condition, decorative icon, temperatures and rain probability', () => {
    render(<ForecastCard day={forecast[0]} unit="celsius" />);
    expect(screen.getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(screen.getByText('⛅')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Máxima').nextElementSibling).toHaveTextContent('27,5 °C');
    expect(screen.getByText('Mínima').nextElementSibling).toHaveTextContent('18,2 °C');
    expect(screen.getByText('Probabilidade de chuva').nextElementSibling).toHaveTextContent('20 %');
  });

  it('preserves the date and marks each missing value as unavailable', () => {
    render(
      <ForecastCard
        day={{
          ...forecast[0],
          weatherCode: null,
          temperatureMaxC: null,
          temperatureMinC: null,
          precipitationProbabilityPercent: null,
        }}
        unit="fahrenheit"
      />,
    );
    expect(screen.getByRole('heading')).toHaveTextContent('ter., 27/10');
    expect(screen.getByText('Condição indisponível')).toBeInTheDocument();
    expect(screen.getAllByText('Indisponível')).toHaveLength(3);
    expect(screen.queryByText(/°F/)).not.toBeInTheDocument();
  });

  it('renders zero probability and zero or negative temperatures as real values', () => {
    render(
      <ForecastCard
        day={{
          ...forecast[0],
          temperatureMaxC: 0,
          temperatureMinC: -3.2,
          precipitationProbabilityPercent: 0,
        }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('0,0 °C')).toBeInTheDocument();
    expect(screen.getByText('-3,2 °C')).toBeInTheDocument();
    expect(screen.getByText('0 %')).toBeInTheDocument();
  });
});
