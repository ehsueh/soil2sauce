import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { useQuery } from '@tanstack/react-query';
import { config } from '../wagmi.ts';
import { CONTRACT_ADDRESSES } from '../contracts/addresses.ts';
import GameRegistryABI from '../contracts/GameRegistry.json';
import './PlayerRegistration.css';

export function PlayerRegistration() {
  const { address } = useAccount();

  const { data: hash, writeContract, isPending } = useWriteContract();

  // Check if player is registered using React Query
  // Note: EventProvider automatically invalidates 'playerRegistration' query
  // when PlayerRegistered event is emitted
  const { data: isRegistered } = useQuery({
    queryKey: ['playerRegistration', address],
    queryFn: async () => {
      if (!address) return false;
      return await readContract(config, {
        address: CONTRACT_ADDRESSES.GameRegistry,
        abi: GameRegistryABI,
        functionName: 'isRegistered',
        args: [address],
      }) as boolean;
    },
    enabled: !!address,
  });

  // Wait for transaction confirmation
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  const handleRegister = () => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.GameRegistry,
        abi: GameRegistryABI,
        functionName: 'registerPlayer',
      });
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const isRegistering = isPending || isConfirming;

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
        disabled={!!isRegistering}
        className="register-btn"
      >
        {isRegistering ? 'Registering...' : 'Register & Start Farming'}
      </button>
    </div>
  );
}
