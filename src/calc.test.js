import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hitung, ringkasPengeluaran, ringkasTabungan } from './calc.js'

test('hitung sisa & alokasi', () => {
  const r = hitung(10_000_000, [{ nominal: 3_000_000 }, { nominal: 2_000_000 }], [{ nominal: 2_500_000 }, { nominal: 1_500_000 }])
  assert.equal(r.totalKebutuhan, 5_000_000)
  assert.equal(r.sisa, 5_000_000)
  assert.equal(r.terpakaiPersen, 90)
  assert.equal(r.totalAlokasi, 4_000_000)
  assert.equal(r.belumDialokasikan, 1_000_000)
})

test('sisa minus → semua alokasi jadi kelebihan', () => {
  const r = hitung(1_000_000, [{ nominal: 1_500_000 }], [{ nominal: 200_000 }])
  assert.equal(r.sisa, -500_000)
  assert.equal(r.belumDialokasikan, -200_000)
})

test('alokasi melebihi sisa & input kosong', () => {
  const r = hitung('', [{ nominal: '' }], [{ nominal: '' }])
  assert.equal(r.gaji, 0)
  assert.equal(r.belumDialokasikan, 0)
  assert.equal(hitung(1000, [], [{ nominal: 1500 }]).belumDialokasikan, -500)
})

test('ringkas pengeluaran per bulan', () => {
  const list = [
    { nama: 'Laundry', nominal: 30_000, tanggal: '2026-09-02' },
    { nama: 'Makan', nominal: 50_000, tanggal: '2026-09-02' },
    { nama: 'Bensin', nominal: 100_000, tanggal: '2026-09-10' },
    { nama: 'Lain bulan', nominal: 999_000, tanggal: '2026-08-31' },
  ]
  const r = ringkasPengeluaran(list, '2026-09', '2026-09-10')
  assert.equal(r.harian.length, 30)
  assert.equal(r.harian[1], 80_000)
  assert.equal(r.total, 180_000)
  assert.equal(r.rataHarian, 18_000)
  assert.equal(r.terbesar.nama, 'Bensin')
  assert.equal(r.hariHemat, 8)
  // bulan lalu → rata-rata dibagi semua hari
  assert.equal(ringkasPengeluaran(list, '2026-08', '2026-09-10').rataHarian, 999_000 / 31)
  assert.equal(ringkasPengeluaran([], '2026-02', '2026-09-10').terbesar, null)
})

test('ringkas tabungan', () => {
  const list = [
    { nominal: 500_000, tanggal: '2026-09-05' },
    { nominal: 1_000_000, tanggal: '2026-08-01' },
    { nominal: 200_000, tanggal: '2026-09-05', tipe: 'tarik' },
    { nominal: 300_000, tanggal: '2026-09-20' },
  ]
  const r = ringkasTabungan(list, '2026-09')
  assert.equal(r.total, 1_600_000)
  assert.equal(r.saldoHarian.length, 30)
  assert.equal(r.saldoHarian[0], 1_000_000)
  assert.equal(r.saldoHarian[4], 1_300_000)
  assert.equal(r.saldoHarian[29], 1_600_000)
  assert.equal(r.setor, 800_000)
  assert.equal(r.tarik, 200_000)
  assert.equal(r.bulanIni.length, 3)
  assert.equal(ringkasTabungan([], '2026-09').total, 0)
})
