import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';
import GameRegistryABI from '../contracts/GameRegistry.json';

export function PlayerRegistration() {
  const { address } = useAccount();
  const [isRegistering, setIsRegistering] = useState(false);

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

  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      await writeContract({
        address: CONTRACT_ADDRESSES.GameRegistry,
        abi: GameRegistryABI,
        functionName: 'registerPlayer',
      });

      // Refetch registration status after a delay
      setTimeout(() => {
        refetch();
        setIsRegistering(false);
      }, 2000);
    } catch (error) {
      console.error('Registration failed:', error);
      setIsRegistering(false);
    }
  };

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
