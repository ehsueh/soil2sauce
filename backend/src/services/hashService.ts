import { keccak256, toHex } from 'viem';

interface EvaluationData {
  walletAddress: string;
  dishDescription: string;
  grade: number;
  revenueRate: number;
  critics: string;
  metadataURI: string;
  timestamp: number;
}

class HashService {
  /**
   * Compute keccak256 hash of evaluation data
   */
  private computeHash(data: EvaluationData): string {
    const payload = JSON.stringify({
      walletAddress: data.walletAddress.toLowerCase(),
      dishDescription: data.dishDescription,
      grade: data.grade,
      revenueRate: data.revenueRate,
      critics: data.critics,
      metadataURI: data.metadataURI,
      timestamp: data.timestamp,
    });

    const hash = keccak256(toHex(payload));
    return hash;
  }

  /**
   * Create hash for evaluation
   */
  createHash(data: EvaluationData): { hash: string; timestamp: number } {
    const timestamp = data.timestamp;
    const hash = this.computeHash(data);

    console.log('🔐 Hash created:', { hash: hash.substring(0, 10) + '...', timestamp });

    return { hash, timestamp };
  }

  /**
   * Verify hash and validate data
   */
  verifyHash(hash: string, providedData: Omit<EvaluationData, 'timestamp'>, timestamp: number): void {
    // Recompute hash from provided data
    const fullData: EvaluationData = {
      ...providedData,
      timestamp,
    };

    const recomputedHash = this.computeHash(fullData);

    if (recomputedHash !== hash) {
      throw new Error('Hash verification failed: data has been tampered with');
    }

    console.log('✅ Hash verified successfully');
  }
}

export const hashService = new HashService();
