import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../../src/App';
import { weatherDataMock } from '../../../src/mocks/weather';

describe('App offline layout', () => {
  it('starts idle with header controls and identifies the offline demonstration', () => {
    render(<App />);
    const header = screen.getByRole('banner');
    expect(within(header).getByText('WEATHER')).toBeInTheDocument();
    expect(within(header).getByRole('search')).toBeInTheDocument();
    expect(
      within(header).getByRole('group', { name: 'Unidade de temperatura' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Modo de demonstração — sem API')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Cenário de demonstração' })).toHaveValue('idle');
    expect(screen.getByRole('button', { name: '°C Celsius' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'São Paulo' })).not.toBeInTheDocument();
  });

  it('rejects whitespace and shows the identified mock after a valid keyboard search', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox'), '   {Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome de uma cidade.');
    expect(screen.getByRole('combobox')).toHaveValue('idle');

    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'Recife{Enter}');
    expect(screen.getByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Resultado da consulta' })).toHaveFocus();
    expect(screen.queryByRole('heading', { name: 'Recife' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('success');
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('switches among all scenarios and retries an error to success without network requests', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('Rede não permitida'));
    try {
      render(<App />);
      const selector = screen.getByRole('combobox');
      await user.selectOptions(selector, 'success');
      expect(screen.getByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
      expect(selector).toHaveFocus();

      await user.selectOptions(selector, 'loading');
      expect(screen.getByRole('status')).toHaveTextContent('Carregando dados do tempo...');
      expect(screen.getByRole('searchbox')).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
      expect(screen.queryByRole('region', { name: 'São Paulo' })).not.toBeInTheDocument();

      await user.selectOptions(selector, 'empty');
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Nenhuma cidade encontrada' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeEnabled();

      await user.selectOptions(selector, 'error');
      expect(screen.getByRole('alert')).toHaveTextContent('erro de demonstração');
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
      expect(screen.getByRole('region', { name: 'Resultado da consulta' })).toHaveFocus();
      expect(selector).toHaveValue('success');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'São Paulo' })).toBeInTheDocument();

      await user.selectOptions(selector, 'idle');
      expect(
        screen.getByRole('heading', { name: 'Sua previsão começa por uma cidade.' }),
      ).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('keeps the UI unit across scenarios and converts every temperature without mutating the mock', async () => {
    const user = userEvent.setup();
    const original = structuredClone(weatherDataMock);
    render(<App />);
    await user.click(screen.getByRole('button', { name: '°F Fahrenheit' }));
    await user.selectOptions(screen.getByRole('combobox'), 'success');
    expect(screen.getByText('77,7 °F')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getAllByText(/°F/)).toHaveLength(12);

    await user.selectOptions(screen.getByRole('combobox'), 'empty');
    await user.selectOptions(screen.getByRole('combobox'), 'success');
    expect(screen.getByRole('button', { name: '°F Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('77,7 °F')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '°C Celsius' }));
    expect(screen.getByText('25,4 °C')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getAllByText(/°C/)).toHaveLength(12);
    expect(within(screen.getByRole('main')).queryByText(/°F/)).not.toBeInTheDocument();
    expect(weatherDataMock).toEqual(original);
  });
});
