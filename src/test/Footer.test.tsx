import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../components/Footer';

const WithRouter = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Footer Component', () => {
  it('displays the correct iKasiLink branding', () => {
    render(
      <WithRouter>
        <Footer />
      </WithRouter>
    );

    // Check for the brand name
    expect(screen.getByRole('heading', { name: /iKasiLink/i })).toBeInTheDocument();
    
    // Check for copyright notice
    expect(screen.getByText(/© 2024 iKasiLink/i)).toBeInTheDocument();
    expect(screen.getByText(/for South African communities/i)).toBeInTheDocument();
  });

  it('contains newsletter signup section', () => {
    render(
      <WithRouter>
        <Footer />
      </WithRouter>
    );

    expect(screen.getByText(/Stay Connected with Your Community/i)).toBeInTheDocument();
    expect(screen.getByText(/Be the first to know when iKasiLink launches/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Notify Me/i })).toBeInTheDocument();
  });

  it('has platform navigation links', () => {
    render(
      <WithRouter>
        <Footer />
      </WithRouter>
    );

    expect(screen.getByText(/Community Chat/i)).toBeInTheDocument();
    expect(screen.getByText(/Stokvel Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Local Business/i)).toBeInTheDocument();
    expect(screen.getByText(/Safety Alerts/i)).toBeInTheDocument();
  });
});