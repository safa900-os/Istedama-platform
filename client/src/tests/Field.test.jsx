import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { User, Mail } from 'lucide-react';
import Field from '../components/ui/Field';

describe('Field', () => {
  test('the label points at its control, so clicking it focuses the input', async () => {
    const user = userEvent.setup();
    render(<Field label="الاسم الكامل" icon={User} />);

    const input = screen.getByLabelText(/الاسم الكامل/);
    await user.click(screen.getByText(/الاسم الكامل/));
    expect(input).toHaveFocus();
  });

  test('a required field marks itself for assistive tech, not just visually', () => {
    render(<Field label="البريد الإلكتروني" icon={Mail} type="email" required />);
    expect(screen.getByLabelText(/البريد الإلكتروني/)).toBeRequired();
  });

  test('an error replaces the hint and is announced with the control', () => {
    render(<Field label="رقم الهاتف" hint="ثمانية أرقام" error="رقم غير صالح" />);

    const input = screen.getByLabelText('رقم الهاتف');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('رقم غير صالح')).toBeInTheDocument();
    expect(screen.queryByText('ثمانية أرقام')).not.toBeInTheDocument();
  });

  test('renders a textarea or a select when asked, keeping the same label wiring', () => {
    const { unmount } = render(<Field as="textarea" label="الغرض" rows={3} />);
    expect(screen.getByLabelText('الغرض').tagName).toBe('TEXTAREA');
    unmount();

    render(<Field as="select" label="الفرع" options={['مسقط', 'صحار']} />);
    const select = screen.getByLabelText('الفرع');
    expect(select.tagName).toBe('SELECT');
    expect(screen.getByRole('option', { name: 'صحار' })).toBeInTheDocument();
  });

  test('typing reaches the caller through onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Field label="المؤسسة" value="" onChange={onChange} />);

    await user.type(screen.getByLabelText('المؤسسة'), 'وادي');
    expect(onChange).toHaveBeenCalled();
  });
});
