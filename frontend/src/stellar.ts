import {
  BASE_FEE,
  Contract,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  rpc,
  type xdr
} from '@stellar/stellar-sdk';
import {
  getAddress,
  isConnected,
  signTransaction
} from '@stellar/freighter-api';
import { assertEnvReady, env } from './env';

type PoolData = {
  id: string;
  targetAmount: number;
  raisedAmount: number;
  deadline: number;
};

type Contribution = {
  contributor: string;
  amount: number;
  timestamp: number;
};

const networkPassphrase = env.networkPassphrase || Networks.TESTNET;

function makeServer() {
  assertEnvReady();
  return new rpc.Server(env.rpcUrl, { allowHttp: env.rpcUrl.startsWith('http://') });
}

async function ensureWalletAddress() {
  const wallet = await isConnected();
  if (wallet.error || !wallet.isConnected) {
    throw new Error('Wallet belum terhubung. Silakan connect Freighter terlebih dahulu.');
  }

  const addressResponse = await getAddress();
  if (addressResponse.error) {
    throw new Error(`Gagal mengambil alamat wallet: ${addressResponse.error}`);
  }
  return addressResponse.address;
}

function parseSimulation(result: rpc.Api.GetTransactionResponse | rpc.Api.SimulateTransactionResponse) {
  if ('results' in result && Array.isArray(result.results) && result.results.length > 0) {
    return scValToNative(result.results[0].xdr as xdr.ScVal);
  }
  return null;
}

async function invokeRead(method: string, args: unknown[] = []) {
  const server = makeServer();
  const source = await ensureWalletAddress();
  const sourceAccount = await server.getAccount(source);
  const contract = new Contract(env.contractId);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase
  })
    .addOperation(contract.call(method, ...args.map((arg) => nativeToScVal(arg))))
    .setTimeout(60)
    .build();

  const simulated = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulasi get data gagal: ${simulated.error}`);
  }

  return parseSimulation(simulated);
}

async function invokeWrite(method: string, args: unknown[]) {
  const server = makeServer();
  const source = await ensureWalletAddress();
  const sourceAccount = await server.getAccount(source);
  const contract = new Contract(env.contractId);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase
  })
    .addOperation(contract.call(method, ...args.map((arg) => nativeToScVal(arg))))
    .setTimeout(120)
    .build();

  const prepared = await server.prepareTransaction(tx);

  const signedXdr = await signTransaction(prepared.toXDR(), {
    networkPassphrase,
    address: source
  });

  if (signedXdr.error) {
    throw new Error(`Penandatanganan transaksi gagal: ${signedXdr.error}`);
  }

  const sent = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedXdr.signedTxXdr, networkPassphrase)
  );

  if (sent.status !== 'PENDING') {
    throw new Error(`Transaksi gagal dikirim: ${(sent as any).errorResultXdr ?? sent.status}`);
  }

  return sent;
}

export async function createPool(targetAmount: number, deadline: number) {
  try {
    return await invokeWrite('create_pool', [targetAmount, deadline]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Gagal create_pool: ${message}`);
  }
}

export async function getPool(poolId: string): Promise<PoolData | null> {
  try {
    const raw = await invokeRead('get_pool', [poolId]);
    if (!raw) {
      return null;
    }

    const data = raw as Record<string, unknown>;
    return {
      id: String(data.id ?? poolId),
      targetAmount: Number(data.target_amount ?? 0),
      raisedAmount: Number(data.raised_amount ?? 0),
      deadline: Number(data.deadline ?? 0)
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Gagal get_pool: ${message}`);
  }
}

export async function getContributions(poolId: string): Promise<Contribution[]> {
  try {
    const raw = await invokeRead('get_contributions', [poolId]);
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw.map((entry): Contribution => {
      const item = entry as Record<string, unknown>;
      return {
        contributor: String(item.contributor ?? '-'),
        amount: Number(item.amount ?? 0),
        timestamp: Number(item.timestamp ?? 0)
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Gagal get_contributions: ${message}`);
  }
}

export async function contribute(poolId: string, amount: number) {
  try {
    return await invokeWrite('contribute', [poolId, amount]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Gagal kontribusi: ${message}`);
  }
}
