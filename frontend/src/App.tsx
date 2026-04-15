import { FormEvent, useEffect, useMemo, useState } from 'react';
import { contribute, createPool, getContributions, getPool } from './stellar';

type Pool = {
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

function readPoolIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get('pool');
}

function formatDate(timestamp: number) {
  if (!timestamp) return '-';
  return new Date(timestamp * 1000).toLocaleString();
}

export default function App() {
  const [poolId, setPoolId] = useState<string | null>(() => readPoolIdFromQuery());
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string>('');

  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  const [pool, setPool] = useState<Pool | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [contributionAmount, setContributionAmount] = useState('');

  const progress = useMemo(() => {
    if (!pool || pool.targetAmount <= 0) return 0;
    return Math.min(100, (pool.raisedAmount / pool.targetAmount) * 100);
  }, [pool]);

  useEffect(() => {
    if (!poolId) return;
    void loadPool(poolId);
  }, [poolId]);

  async function loadPool(id: string) {
    setErrorMessage('');
    setLoading(true);

    try {
      const [poolData, contributionData] = await Promise.all([getPool(id), getContributions(id)]);
      setPool(poolData);
      setContributions(contributionData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  async function onCreatePool(event: FormEvent) {
    event.preventDefault();
    setErrorMessage('');
    setTxStatus('');

    const parsedAmount = Number(targetAmount);
    const deadlineSeconds = Math.floor(new Date(deadline).getTime() / 1000);

    if (!parsedAmount || !deadlineSeconds) {
      setErrorMessage('Target amount dan deadline wajib valid.');
      return;
    }

    setLoading(true);
    try {
      const response = await createPool(parsedAmount, deadlineSeconds);
      setTxStatus(`Transaksi create_pool terkirim. Status: ${response.status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  async function onContribute(event: FormEvent) {
    event.preventDefault();
    if (!poolId) return;

    setErrorMessage('');
    setTxStatus('');

    const amount = Number(contributionAmount);
    if (!amount || amount <= 0) {
      setErrorMessage('Amount kontribusi harus lebih dari 0.');
      return;
    }

    setLoading(true);
    try {
      const response = await contribute(poolId, amount);
      setTxStatus(`Kontribusi terkirim. Status: ${response.status}`);
      setContributionAmount('');
      await loadPool(poolId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  async function copyShareLink() {
    if (!poolId) return;
    const url = `${window.location.origin}/?pool=${poolId}`;

    try {
      await navigator.clipboard.writeText(url);
      setTxStatus('Share link disalin ke clipboard.');
    } catch {
      setErrorMessage('Gagal menyalin link.');
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '24px auto', fontFamily: 'Inter, Arial, sans-serif' }}>
      <h1>Stellar Funding Pool</h1>
      {errorMessage && <p style={{ color: '#c62828' }}>{errorMessage}</p>}
      {txStatus && <p style={{ color: '#2e7d32' }}>{txStatus}</p>}

      {!poolId ? (
        <section>
          <h2>Create Pool</h2>
          <form onSubmit={onCreatePool} style={{ display: 'grid', gap: 12 }}>
            <label>
              Target amount
              <input
                type="number"
                min="1"
                value={targetAmount}
                onChange={(event) => setTargetAmount(event.target.value)}
                required
              />
            </label>

            <label>
              Deadline
              <input
                type="datetime-local"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                required
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Create Pool'}
            </button>
          </form>
        </section>
      ) : (
        <section>
          <h2>Pool Detail</h2>
          <p>
            <strong>Pool ID:</strong> {poolId}
          </p>
          <button type="button" onClick={copyShareLink}>
            Copy Share Link
          </button>

          {loading && <p>Loading pool state...</p>}

          {pool ? (
            <>
              <p>
                Progress: {pool.raisedAmount} / {pool.targetAmount} ({progress.toFixed(2)}%)
              </p>
              <div
                style={{
                  width: '100%',
                  height: 14,
                  background: '#eceff1',
                  borderRadius: 20,
                  overflow: 'hidden'
                }}
              >
                <div style={{ width: `${progress}%`, height: '100%', background: '#2962ff' }} />
              </div>
              <p>Deadline: {formatDate(pool.deadline)}</p>
            </>
          ) : (
            !loading && <p>Pool tidak ditemukan.</p>
          )}

          <h3>Contribute</h3>
          <form onSubmit={onContribute} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="number"
              min="1"
              placeholder="Amount"
              value={contributionAmount}
              onChange={(event) => setContributionAmount(event.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Contribute'}
            </button>
          </form>

          <h3>Contributions (read-only)</h3>
          {contributions.length === 0 ? (
            <p>Belum ada kontribusi.</p>
          ) : (
            <ul>
              {contributions.map((item, idx) => (
                <li key={`${item.contributor}-${idx}`}>
                  {item.contributor} — {item.amount} @ {formatDate(item.timestamp)}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!poolId && (
        <p style={{ marginTop: 24 }}>
          Buka detail pool dengan format URL <code>/?pool=&lt;id&gt;</code>.
        </p>
      )}
    </main>
  );
}
