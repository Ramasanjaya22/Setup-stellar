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
  const [poolId] = useState<string | null>(() => readPoolIdFromQuery());
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
      setErrorMessage('Target amount and deadline must be valid.');
      return;
    }

    setLoading(true);
    try {
      const response = await createPool(parsedAmount, deadlineSeconds);
      setTxStatus(`Create pool transaction sent. Status: ${response.status}`);
      // Assuming response gives an ID or we can navigate to it.
      // If we don't have the ID, we might need a different approach.
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
      setErrorMessage('Contribution amount must be greater than 0.');
      return;
    }

    setLoading(true);
    try {
      const response = await contribute(poolId, amount);
      setTxStatus(`Contribution sent. Status: ${response.status}`);
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
      setTxStatus('Share link copied to clipboard.');
    } catch {
      setErrorMessage('Failed to copy link.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <main className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Stellar Funding Pool</h1>
          <p className="mt-2 text-lg text-gray-600">Decentralized crowd-funding on the Stellar network</p>
        </div>

        {errorMessage && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{errorMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {txStatus && (
          <div className="rounded-md bg-green-50 p-4 border border-green-200">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{txStatus}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!poolId ? (
          <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Create a New Pool</h2>
              <form onSubmit={onCreatePool} className="space-y-6">
                <div>
                  <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700">
                    Target Amount (XLM)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      name="targetAmount"
                      id="targetAmount"
                      min="1"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border"
                      placeholder="1000"
                      value={targetAmount}
                      onChange={(event) => setTargetAmount(event.target.value)}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">XLM</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                    Deadline
                  </label>
                  <div className="mt-1">
                    <input
                      type="datetime-local"
                      name="deadline"
                      id="deadline"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                      value={deadline}
                      onChange={(event) => setDeadline(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Create Pool'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
                <div>
                  <h2 className="text-lg leading-6 font-medium text-gray-900">Pool Details</h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500 truncate">ID: <span className="font-mono text-xs">{poolId}</span></p>
                </div>
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                  Copy Link
                </button>
              </div>

              <div className="px-4 py-5 sm:p-6">
                {loading && !pool && (
                  <div className="flex justify-center py-4">
                     <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                  </div>
                )}

                {pool ? (
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-sm font-medium text-gray-700">Funding Progress</span>
                        <span className="text-sm font-semibold text-indigo-600">{progress.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                        <div
                          className="bg-indigo-600 h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-center overflow-hidden"
                          style={{ width: `${progress}%` }}
                        >
                           {progress > 5 && <div className="w-full h-full opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.15)_25%,rgba(255,255,255,.15)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.15)_75%,rgba(255,255,255,.15)_100%)] bg-[length:1rem_1rem]"></div>}
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>{pool.raisedAmount} XLM raised</span>
                        <span>{pool.targetAmount} XLM target</span>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Deadline: <span className="ml-1 font-medium text-gray-900">{formatDate(pool.deadline)}</span>
                    </div>
                  </div>
                ) : (
                  !loading && <p className="text-gray-500 italic">Pool not found or could not be loaded.</p>
                )}
              </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Contribute to Pool</h3>
                <form onSubmit={onContribute} className="flex gap-4 items-end">
                  <div className="flex-grow">
                    <label htmlFor="amount" className="sr-only">Amount</label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        name="amount"
                        id="amount"
                        min="1"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border"
                        placeholder="Amount"
                        value={contributionAmount}
                        onChange={(event) => setContributionAmount(event.target.value)}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">XLM</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Processing...' : 'Contribute'}
                  </button>
                </form>
              </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Contributions</h3>
              </div>

              {contributions.length === 0 ? (
                <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="mt-2 text-sm">No contributions yet. Be the first!</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {contributions.map((item, idx) => (
                    <li key={`${item.contributor}-${idx}`} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100">
                              <span className="text-xs font-medium leading-none text-indigo-700">
                                {item.contributor.substring(0, 2).toUpperCase()}
                              </span>
                            </span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-indigo-600 truncate max-w-[200px] sm:max-w-xs md:max-w-md" title={item.contributor}>
                              {item.contributor.substring(0, 8)}...{item.contributor.substring(item.contributor.length - 4)}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(item.timestamp)}</p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            +{item.amount} XLM
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {!poolId && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 bg-gray-100 inline-block px-4 py-2 rounded-lg">
              Open a specific pool by adding <code className="font-mono text-indigo-600 bg-indigo-50 px-1 rounded">/?pool=&lt;id&gt;</code> to the URL.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
