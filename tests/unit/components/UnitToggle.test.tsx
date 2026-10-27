import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UnitToggle from '../../../src/components/UnitToggle';

describe('UnitToggle', () => {
  it.each([
    'celsius',
    'fahrenheit',
  ] as const)('exposes the controlled selection for %s in a labeled group', (unit) => {
    render(<UnitToggle unit={unit} onChange={vi.fn()} />);

    const group = screen.getByRole('group', { name: 'Unidade de temperatura' });
    expect(within(group).getAllByRole('button')).toHaveLength(2);
    expect(within(group).getByRole('button', { name: '°C Celsius' })).toHaveAttribute(
      'aria-pressed',
      String(unit === 'celsius'),
    );
    expect(within(group).getByRole('button', { name: '°F Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      String(unit === 'fahrenheit'),
    );
  });

  it('emits each selected unit and only updates the active button when the prop changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '°F Fahrenheit' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');
    expect(screen.getByRole('button', { name: '°C Celsius' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);
    expect(screen.getByRole('button', { name: '°F Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: '°C Celsius' }));
    expect(onChange).toHaveBeenNthCalledWith(2, 'celsius');

    rerender(<UnitToggle unit="celsius" onChange={onChange} />);
    expect(screen.getByRole('button', { name: '°C Celsius' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '°F Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('supports Tab, Shift+Tab, Enter and Space through native buttons', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole('button', { name: '°C Celsius' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: '°F Fahrenheit' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenNthCalledWith(1, 'fahrenheit');

    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: '°C Celsius' })).toHaveFocus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenNthCalledWith(2, 'celsius');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('does not submit a surrounding form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <UnitToggle unit="celsius" onChange={vi.fn()} />
      </form>,
    );

    await user.click(screen.getByRole('button', { name: '°F Fahrenheit' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
