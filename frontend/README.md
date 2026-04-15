# Frontend (Vite + React + TypeScript)

## Setup

1. Copy env template:
   ```bash
   cp .env.example .env
   ```
2. Isi environment berikut:
   - `VITE_CONTRACT_ID`
   - `VITE_STELLAR_RPC_URL`
   - `VITE_NETWORK_PASSPHRASE`
3. Install dependency dan jalankan:
   ```bash
   npm install
   npm run dev
   ```

## Minimum Features

- **Create Pool** page (default route): input target amount + deadline dan panggil `create_pool`.
- **Pool Detail** page via `/?pool=<id>`: progress funding, form kontribusi, tombol copy share link.
- **Read-only state**: memanggil `get_pool` + `get_contributions`.
- Handling error untuk wallet belum terhubung dan transaksi gagal.
