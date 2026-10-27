import { render, screen } from '@testing-library/react';
import App from '../../../src/app/App';

describe('App initial state', () => {
  it('shows the empty state without presenting weather or loading data', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Consulte o tempo e planeje os próximos dias.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Sua previsão começa por uma cidade.' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
