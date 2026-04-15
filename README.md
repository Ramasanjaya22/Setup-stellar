# Stellar Notes CRUD (Soroban)

Smart contract sederhana untuk **CRUD catatan** di jaringan Stellar Soroban.

## Fitur

- **Create** note baru (`create_note`)
- **Read** note berdasarkan ID (`get_note`) dan list semua note (`get_notes`)
- **Update** note berdasarkan ID (`update_note`)
- **Delete** note berdasarkan ID (`delete_note`)

## Struktur Data

Setiap note disimpan sebagai:

- `id: u64`
- `title: String`
- `content: String`

## Build & Test (Local)

```bash
cargo test -p notes
```

## Setup agar bisa running di Soroban Studio

1. Buka [Soroban Studio](https://soroban.stellar.org/playground).
2. Pilih **Rust Contract** lalu paste isi `contracts/notes/src/lib.rs`.
3. Compile contract di Studio.
4. Deploy ke sandbox/testnet dari UI Studio.
5. Invoke fungsi dengan parameter berikut:

### Contoh input fungsi di Soroban Studio

- `create_note`
  - `title`: `"Catatan Studio"`
  - `content`: `"Tes dari Soroban Studio"`
- `get_note`
  - `id`: `1`
- `get_notes`
  - tanpa parameter
- `update_note`
  - `id`: `1`
  - `title`: `"Catatan Studio Update"`
  - `content`: `"Konten update"`
- `delete_note`
  - `id`: `1`

> Catatan: `get_note` dan `update_note` mengembalikan `Option<Note>`. Jika data tidak ada maka hasilnya `None`.

## Deploy Testnet (Sederhana)

Prasyarat:

1. Install Stellar CLI: `stellar`
2. Buat identity testnet **dengan source: `ramasanjaya22`**
3. Fund akun melalui friendbot

### 1) Build WASM

```bash
cd contracts/notes
stellar contract build
```

Output wasm:

`target/wasm32v1-none/release/notes.wasm`

### 2) Setup identity testnet

```bash
stellar keys generate ramasanjaya22 --network testnet --fund
```

### 3) Deploy ke testnet

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/notes.wasm \
  --source ramasanjaya22 \
  --network testnet
```

Simpan contract ID yang keluar dari command di atas.

### 4) Contoh invoke fungsi CRUD

#### Create

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source ramasanjaya22 \
  --network testnet \
  -- create_note \
  --title "Catatan 1" \
  --content "Halo testnet"
```

#### Read satu note

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source ramasanjaya22 \
  --network testnet \
  -- get_note \
  --id 1
```

#### Read semua note

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source ramasanjaya22 \
  --network testnet \
  -- get_notes
```

#### Update

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source ramasanjaya22 \
  --network testnet \
  -- update_note \
  --id 1 \
  --title "Catatan 1 (Update)" \
  --content "Konten baru"
```

#### Delete

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source ramasanjaya22 \
  --network testnet \
  -- delete_note \
  --id 1
```
