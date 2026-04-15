const requiredEnv = {
  contractId: import.meta.env.VITE_CONTRACT_ID as string | undefined,
  rpcUrl: import.meta.env.VITE_STELLAR_RPC_URL as string | undefined,
  networkPassphrase: import.meta.env.VITE_NETWORK_PASSPHRASE as string | undefined
};

export const env = {
  contractId: requiredEnv.contractId ?? '',
  rpcUrl: requiredEnv.rpcUrl ?? '',
  networkPassphrase: requiredEnv.networkPassphrase ?? ''
};

export function assertEnvReady() {
  if (!env.contractId || !env.rpcUrl || !env.networkPassphrase) {
    throw new Error(
      'Missing env. Set VITE_CONTRACT_ID, VITE_STELLAR_RPC_URL, and VITE_NETWORK_PASSPHRASE.'
    );
  }
}
