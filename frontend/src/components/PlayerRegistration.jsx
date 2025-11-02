import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';
import GameRegistryABI from '../contracts/GameRegistry.json';

export function PlayerRegistration() {
  const { address } = useAccount();
  const [txHash, setTxHash] = useState(null);

  const { writeContract } = useWriteContract();

  // Check if player is registered
  const { data: isRegistered, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.GameRegistry,
    abi: GameRegistryABI,
    functionName: 'isRegistered',
    args: [address],
    query: {
      enabled: !!address,
    }
  });

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Refetch registration status after transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      refetch();
      setTxHash(null);
    }
  }, [isConfirmed, refetch]);

  const handleRegister = async () => {
    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.GameRegistry,
        abi: GameRegistryABI,
        functionName: 'registerPlayer',
      });
      setTxHash(hash);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const isRegistering = txHash && isConfirming;

  if (!address) {
    return null;
  }

  if (isRegistered) {
    return null; // Player is already registered
  }

  return (
    <div className="registration-panel">
      <h2>Welcome to Soil2Sauce! 🌾</h2>
      <p>Register to receive your starter pack:</p>
      <ul>
        <li>100 STOKEN</li>
        <li>5 Wheat Seeds 🌾</li>
        <li>3 Tomato Seeds 🍅</li>
        <li>3 Farm Plots</li>
      </ul>
      <button
        onClick={handleRegister}
        disabled={isRegistering}
        className="register-btn"
      >
        {isRegistering ? 'Registering...' : 'Register & Start Farming'}
      </button>
    </div>
  );
}
