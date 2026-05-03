import { render, screen } from '@testing-library/react';
import App from './App';

describe('Portfolio dashboard', () => {
  it('renders primary dashboard sections', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /portfolio dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /featured work/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /writing/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /stack/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /contact/i })).toBeInTheDocument();
  });

  it('renders representative project and article content', () => {
    render(<App />);

    expect(screen.getByText(/signal board/i)).toBeInTheDocument();
    expect(screen.getByText(/building calm interfaces/i)).toBeInTheDocument();
  });
});
