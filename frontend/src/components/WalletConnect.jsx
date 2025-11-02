import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function WalletConnect() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="wallet-connected">
        <span className="address">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button onClick={() => disconnect()} className="disconnect-btn">
          Disconnect
        </button>
      </div>
    );
  }

  // Show connecting state
  if (isConnecting || isPending) {
    return (
      <div className="wallet-connect">
        <button className="connect-btn" disabled>
          Connecting...
        </button>
      </div>
    );
  }

  // Get the first available connector (injected wallet like MetaMask)
  const connector = connectors[0];

  return (
    <div className="wallet-connect">
      <button
        onClick={() => connect({ connector })}
        className="connect-btn"
        disabled={!connector || isPending}
      >
        Connect MetaMask
      </button>
      {error && (
        <p className="error-message">
          Connection failed: {error.message}
        </p>
      )}
    </div>
  );
}
