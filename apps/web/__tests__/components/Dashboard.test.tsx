import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '@/app/dashboard/page';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { email: 'test@example.com', name: 'Test' }, token: 'x', logout: jest.fn(), loading: false }),
}));

describe('DashboardPage', () => {
  it('renders form and disables submit without inputs', () => {
    render(<DashboardPage />);
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button).toBeDisabled();
  });

  it('enables submit when file and prompt present', () => {
    render(<DashboardPage />);
    const fileInput = screen.getByLabelText(/upload image/i) as HTMLInputElement;
    const promptInput = screen.getByLabelText(/prompt/i) as HTMLInputElement;

    const file = new File([new Uint8Array([1])], 'a.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.change(promptInput, { target: { value: 'hello' } });

    const button = screen.getByRole('button', { name: /generate/i });
    expect(button).toBeEnabled();
  });
});


