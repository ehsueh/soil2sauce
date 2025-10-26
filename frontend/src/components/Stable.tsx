import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../wagmi';
import AnimalFarmABI from '../contracts/AnimalFarm.json';

const Stable = () => {
  const { address } = useAccount();

  // Read player's animals
  const { data: animalIds = [] } = useReadContract({
    address: CONTRACT_ADDRESSES.animalFarm,
    abi: AnimalFarmABI.abi,
    functionName: 'playerAnimals',
    args: [address],
  });

  if ((animalIds as bigint[]).length === 0) {
    return (
      <div>
        <h1>🏠 Stable</h1>
        <div className="connect-prompt">
          <h2>Your stable is empty</h2>
          <p>You don't have any animals yet!</p>
          <p className="info">Visit the Animal Market to purchase cows and chickens for your farm. They will produce milk and eggs that you can collect here.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>🏠 Stable</h1>
      <p>Manage your animals and collect their products</p>
      <div className="info">
        <p>You have {(animalIds as bigint[]).length} animal(s) in your stable</p>
      </div>
    </div>
  );
};

export default Stable;
