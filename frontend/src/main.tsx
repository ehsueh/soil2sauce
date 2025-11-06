import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { config } from './wagmi.ts';
import { EventProvider } from './contexts/EventProvider.tsx';
import { RefreshProvider } from './RefreshContext.tsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <EventProvider>
          <RefreshProvider>
            <App />
          </RefreshProvider>
        </EventProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
