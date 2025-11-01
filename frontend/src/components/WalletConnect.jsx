import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
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

  // Get the first available connector (injected wallet like MetaMask)
  const connector = connectors[0];

  return (
    <div className="wallet-connect">
      <button
        onClick={() => connect({ connector })}
        className="connect-btn"
        disabled={!connector}
      >
        Connect MetaMask
      </button>
    </div>
  );
}
