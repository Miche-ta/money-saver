# 💰 Money Saver

Aplikasi web sederhana untuk mengatur gaji, mencatat pengeluaran harian, dan melacak tabungan.

## Fitur

- **Perencana gaji:** isi gaji pokok, daftar kebutuhan bulanan, lalu bagi sisanya ke pos-pos (tabungan, dana darurat, jajan, dll). Ada donut chart ke mana gajimu pergi.
- **Catatan pengeluaran:** nama, nominal, tanggal, kategori (pos budget), dan tanda 🔁 tiap bulan. Semua catatan bisa diedit.
  - Ringkasan per bulan: total (dibanding bulan lalu), jatah jajan per hari, rata-rata, terbesar, hari tanpa jajan, persen dari sisa gaji.
  - **Rencana vs realita:** pemakaian tiap pos budget, dengan peringatan kalau lewat.
  - **Tagihan rutin:** pengeluaran 🔁 yang belum dicatat bulan ini, tinggal klik "Bayar".
- **Tabungan:** setoran & pengambilan, total saldo, rencana vs realita nabung bulan ini, dan target dengan tenggat (berapa harus nabung per bulan).
- **Grafik gabungan:** pengeluaran harian (batang) dan saldo tabungan (garis) dalam satu skala.
- **Lencana 🏅** dan **ringkasan tahunan** (bulan terhemat & terboros).
- **Backup & pulihkan** data ke/dari file `.json`.
- Bisa di-install ke HP (PWA) dan tetap bisa dibuka waktu offline.
- Tema terang/gelap, emoji otomatis, dan pesan-pesan lucu 😄

Semua data disimpan di `localStorage` browser. Tidak ada server, dan data tidak dikirim ke mana-mana, jadi rajin-rajin **Backup** ya.

## Menjalankan

```sh
npm install
npm run dev      # server development
npm test         # unit test (node:test) untuk perhitungan di src/calc.js
npm run lint     # oxlint
npm run build    # build produksi ke dist/
```

## Struktur

- `src/App.jsx`: state, simpan ke localStorage, header (backup/pulihkan/reset/tema)
- `src/Planner.jsx`, `src/Pengeluaran.jsx`, `src/Tabungan.jsx`, `src/Ringkasan.jsx`: bagian-bagian halaman
- `src/calc.js`: perhitungan murni (sisa gaji, ringkasan, budget, tagihan, dll)
- `src/data.js`: data awal, load & validasi data (termasuk file backup)
- `src/ui.jsx`, `src/format.js`: komponen & helper kecil
- `src/calc.test.js`: unit test
- `public/manifest.webmanifest`, `public/sw.js`: PWA (install & offline)

## Lisensi

Copyright (C) 2026 miche

Proyek ini dirilis di bawah [GNU Affero General Public License v3.0 atau yang lebih baru](LICENSE) (AGPL-3.0-or-later).

Singkatnya: kamu bebas memakai, mempelajari, mengubah, dan membagikan aplikasi ini. Tapi kalau kamu membagikan versi yang sudah diubah, **atau menjalankannya sebagai layanan yang bisa diakses orang lain lewat internet**, kamu wajib membuka seluruh kode sumbernya dengan lisensi yang sama. Detail lengkapnya ada di file [LICENSE](LICENSE).
