import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Hero from '../components/Hero';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Hero Component', () => {
  it('displays the correct iKasiLink branding', () => {
    render(
      <AllTheProviders>
        <Hero />
      </AllTheProviders>
    );

    // Check for the main heading
    expect(screen.getByRole('heading', { name: /iKasiLink/i })).toBeInTheDocument();
    
    // Check for the tagline
    expect(screen.getByText(/The Township Super-App for/i)).toBeInTheDocument();
    expect(screen.getByText(/Chat • Money • Community/i)).toBeInTheDocument();
    
    // Check for main action buttons
    expect(screen.getByRole('button', { name: /Join the Community/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Learn More/i })).toBeInTheDocument();
  });

  it('contains the correct descriptive text', () => {
    render(
      <AllTheProviders>
        <Hero />
      </AllTheProviders>
    );

    expect(screen.getByText(/iKasiLink brings township life into one powerful app/i)).toBeInTheDocument();
  });
});