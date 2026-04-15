# Stellar Shared Wallet (Soroban)

Smart contract ini mengimplementasikan model **shared wallet / funding pool** di Stellar Soroban.

## Fitur Utama

- Membuat funding pool dengan target dana dan deadline.
- Kontributor bisa mendanai pool selama masih terbuka.
- Menyimpan histori kontribusi per pool.
- Owner bisa menutup pool secara manual.
- Emit event untuk sinkronisasi frontend.

## Struktur Data

### `FundingPool`

Menyimpan status pool:

- `id: u64`
- `owner: Address`
- `target_amount: i128`
- `deadline_ts: u64`
- `total_funded: i128`
- `is_closed: bool`

### `Contribution`

Menyimpan setiap transaksi pendanaan:

- `contributor: Address`
- `amount: i128`
- `timestamp: u64`

## Storage Key

- `PoolCounter` → counter ID pool
- `Pool(id)` → data pool berdasarkan ID
- `Contributions(id)` → daftar kontribusi per pool

## Public API

- `create_pool(owner, target_amount, deadline_ts) -> u64`
- `fund_pool(pool_id, contributor, amount)`
- `get_pool(pool_id) -> FundingPool`
- `get_contributions(pool_id) -> Vec<Contribution>`
- `close_pool(pool_id)`

## Validasi

- `target_amount > 0`
- `amount > 0`
- Tidak bisa fund jika:
  - pool sudah ditutup (`is_closed == true`), atau
  - deadline sudah terlewati.

## Event yang Di-emit

- **Create Pool** topic: `("pool", "create", pool_id)`
- **Fund Pool** topic: `("pool", "fund", pool_id)`
- **Close Pool** topic: `("pool", "close", pool_id)`

## Menjalankan Test

```bash
cargo test -p notes
```
