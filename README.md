# 💰 Money Saver

Aplikasi web sederhana untuk mengatur gaji, mencatat pengeluaran harian, dan melacak tabungan.

## Fitur

- **Perencana gaji:** isi gaji pokok, daftar kebutuhan bulanan, lalu bagi sisanya ke pos-pos (tabungan, dana darurat, dll). Ada donut chart ke mana gajimu pergi.
- **Catatan pengeluaran:** catat nama, nominal, dan tanggal. Ringkasan per bulan: total, rata-rata per hari, pengeluaran terbesar, hari tanpa jajan, dan persen dari sisa gaji.
- **Tabungan:** catat setoran dan pengambilan, total saldo, dan target tabungan dengan progress bar.
- **Grafik gabungan:** pengeluaran harian (batang) dan saldo tabungan (garis) dalam satu grafik.
- Tema terang/gelap, emoji otomatis per pengeluaran, dan pesan-pesan lucu 😄

Semua data disimpan di `localStorage` browser. Tidak ada server, dan data tidak dikirim ke mana-mana.

## Menjalankan

```sh
npm install
npm run dev      # server development
npm test         # unit test (node:test) untuk perhitungan di src/calc.js
npm run lint     # oxlint
npm run build    # build produksi ke dist/
```

## Struktur

- `src/App.jsx`: seluruh UI
- `src/calc.js`: perhitungan murni (sisa gaji, ringkasan pengeluaran & tabungan)
- `src/calc.test.js`: test untuk `calc.js`
- `src/index.css`: style dan token warna tema
