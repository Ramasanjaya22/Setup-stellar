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

## Contract Details

- Contract Address: CBLU4IUASQ4WUMOXBFLZRSBBLILGOH33GS4LUPKFBCCCMJCDQNMF7G2M
  ![alt text](screenshot.png)

## Future Scope

### Short-Term Enhancements

1. **Note Encryption**: Support for end-to-end encryption of note content for enhanced privacy
2. **Category Management**: Add tags and categories to organize notes efficiently
3. **Rich Text Support**: Extend support beyond plain text to include Markdown and formatted content
4. **Search Functionality**: Implement advanced search filters for large note collections

### Medium-Term Development

5. **Collaborative Notes**: Implement multi-signature requirements for shared or collaborative note-taking
   - Shared access for multiple addresses
   - Permission-based editing and viewing
   - Version history tracking
6. **Notification System**: Off-chain bridge to alert users of new updates or shared notes
7. **Asset Attachment**: Capability to attach digital assets or tokens to specific notes
8. **Inter-Contract Integration**: Allow other smart contracts to interact with and store data in the notes contract

### Long-Term Vision

9. **Cross-Chain Synchronization**: Extend note storage to multiple blockchain networks
10. **Decentralized UI Hosting**: Host the frontend on IPFS or similar decentralized platforms
11. **AI-Powered Summarization**: Optional integration with AI to help users summarize their notes
12. **Privacy Layers**: Implement zero-knowledge proofs for completely private note content
13. **DAO Governance**: Community-driven protocol improvements and feature prioritization
14. **Identity Management**: Integration with decentralized identity (DID) systems for user management

### Enterprise Features

15. **Corporate Documentation**: Adapt the system for secure corporate record-keeping
16. **Immutable Logging**: Create time-locked logs for audit purposes
17. **Automated Reporting**: Automatic note triggers for periodic reporting
18. **Multi-Language Support**: Expand accessibility with internationalization


## Frontend Deployment (GitHub Pages)

Project ini sudah menyiapkan workflow **`.github/workflows/deploy-pages.yml`** untuk build dan deploy frontend ke GitHub Pages.

### Prasyarat Repository Setting

1. Buka **Settings -> Pages** pada repository GitHub.
2. Pada bagian **Build and deployment**, set:
   - **Source** = `GitHub Actions`

### Build yang digunakan workflow

Workflow melakukan build frontend dari folder `frontend` dengan perintah:

```bash
cd frontend
npm ci
npm run build
```

Output build yang di-upload ke GitHub Pages adalah folder `frontend/dist`.

### Set `base` path untuk project pages

Jika frontend menggunakan Vite dan dipublish ke project pages (contoh: `https://<username>.github.io/<repo>/`), set `base` agar asset path tidak rusak:

```ts
// frontend/vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Setup-stellar/', // ganti dengan nama repo kamu
})
```

> Jika deploy ke user/organization pages utama (`https://<username>.github.io/`), gunakan `base: '/'`.

---

## Technical Requirements

- Soroban SDK
- Rust programming language
- Stellar blockchain network

## Getting Started

Deploy the smart contract to Stellar's Soroban network and interact with it using the three main functions:

- `create_note()` - Create a new note with a title and content
- `get_notes()` - Retrieve all stored notes from the contract
- `delete_note()` - Remove a specific note by its ID

---

**Stellar Notes DApp** - Securing Your Thoughts on the Blockchain

## Frontend App

Frontend ringan sudah tersedia di folder `frontend/` menggunakan **Vite + React + TypeScript**.

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Konfigurasi environment yang wajib:
- `VITE_CONTRACT_ID`
- `VITE_STELLAR_RPC_URL`
- `VITE_NETWORK_PASSPHRASE`

## Frontend Deployment (Vercel)

Project ini juga siap di-deploy ke Vercel.
Dengan adanya file `vercel.json` di root repository, Vercel akan otomatis mengenali project ini dan melakukan build pada folder `frontend/`.

Cara deploy:
1. Import repository ke Vercel
2. Project siap berjalan secara otomatis (Framework: Vite, Build Command: `cd frontend && npm install && npm run build`, Output Directory: `frontend/dist`)
3. Set Environment Variables di Vercel Dashboard jika dibutuhkan (`VITE_CONTRACT_ID`, `VITE_STELLAR_RPC_URL`, `VITE_NETWORK_PASSPHRASE`)
