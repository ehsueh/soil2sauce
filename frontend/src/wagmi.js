import { http, createConfig } from 'wagmi';
import { localhost } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Configure local Anvil chain
export const config = createConfig({
  chains: [localhost],
  connectors: [
    injected(),
  ],
  transports: {
    [localhost.id]: http('http://127.0.0.1:8545'),
  },
});
