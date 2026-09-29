import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  hitung, ringkasPengeluaran, ringkasTabungan, geserBulan, geserHari, budgetVsReal, jatahHarian,
  nabungPerBulan, tagihanBelum, ringkasTahun, streakNyatet,
} from './calc.js'

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

test('geser bulan & hari', () => {
  assert.equal(geserBulan('2026-01', -1), '2025-12')
  assert.equal(geserBulan('2026-12', 1), '2027-01')
  assert.equal(geserHari('2026-03-01', -1), '2026-02-28')
})

test('budget vs realita & jatah harian', () => {
  const pos = [{ id: 'a', nama: 'Makan' }, { id: 'b', nama: 'Jajan' }]
  const list = [
    { nominal: 100, tanggal: '2026-09-01', kategoriId: 'a' },
    { nominal: 50, tanggal: '2026-09-02', kategoriId: 'b' },
    { nominal: 30, tanggal: '2026-09-03', kategoriId: 'dihapus' },
    { nominal: 20, tanggal: '2026-09-03' },
    { nominal: 999, tanggal: '2026-08-03', kategoriId: 'a' },
  ]
  const r = budgetVsReal(pos, list, '2026-09')
  assert.deepEqual(r.pos.map((x) => x.terpakai), [100, 50])
  assert.equal(r.lainnya, 50)
  // 30 hari, tanggal 21 → sisa 10 hari
  assert.equal(jatahHarian(1000, 400, '2026-09', '2026-09-21'), 60)
  assert.equal(jatahHarian(100, 400, '2026-09', '2026-09-30'), 0)
  assert.equal(jatahHarian(100, 0, '2026-08', '2026-09-21'), null)
})

test('nabung per bulan untuk target', () => {
  assert.deepEqual(nabungPerBulan(1200, '2026-09', '2026-12'), { sisaBulan: 4, perBulan: 300 })
  assert.equal(nabungPerBulan(0, '2026-09', '2026-12'), null)
  assert.equal(nabungPerBulan(100, '2026-09', ''), null)
  assert.deepEqual(nabungPerBulan(100, '2026-09', '2026-08'), { sisaBulan: 0, perBulan: 100 })
})

test('tagihan rutin yang belum dibayar', () => {
  const list = [
    { nama: 'Netflix', nominal: 50, tanggal: '2026-07-31', rutin: true },
    { nama: 'netflix ', nominal: 55, tanggal: '2026-08-31', rutin: true },
    { nama: 'Kos', nominal: 900, tanggal: '2026-08-05', rutin: true },
    { nama: 'kos', nominal: 900, tanggal: '2026-09-05' },
    { nama: 'Makan', nominal: 20, tanggal: '2026-08-05' },
  ]
  const r = tagihanBelum(list, '2026-09')
  assert.equal(r.length, 1)
  assert.equal(r[0].nominal, 55)
  // 31 Agustus → 30 September
  assert.equal(r[0].tanggal, '2026-09-30')
})

test('ringkas tahun & streak', () => {
  const keluar = [
    { nominal: 100, tanggal: '2026-01-10' },
    { nominal: 300, tanggal: '2026-02-10' },
    { nominal: 999, tanggal: '2025-02-10' },
  ]
  const nabung = [{ nominal: 500, tanggal: '2026-01-02' }, { nominal: 200, tanggal: '2026-01-03', tipe: 'tarik' }]
  const r = ringkasTahun(keluar, nabung, 2026)
  assert.equal(r.bulan.length, 12)
  assert.equal(r.totalKeluar, 400)
  assert.equal(r.totalNabung, 300)
  assert.equal(r.terhemat.bulan, '2026-01')
  assert.equal(r.terboros.bulan, '2026-02')
  assert.equal(ringkasTahun([], [], 2026).terboros, null)

  const hari = ['2026-09-24', '2026-09-25', '2026-09-26', '2026-09-20'].map((tanggal) => ({ tanggal }))
  assert.equal(streakNyatet(hari, '2026-09-26'), 3)
  assert.equal(streakNyatet(hari, '2026-09-27'), 3)
  assert.equal(streakNyatet(hari, '2026-09-28'), 0)
})

test('normalisasi data backup', async () => {
  const { normalisasi } = await import('./data.js')
  assert.equal(normalisasi(null), null)
  assert.equal(normalisasi({ foo: 1 }), null)
  assert.equal(normalisasi('<script>'), null)
  const s = normalisasi({
    gaji: '1000',
    kebutuhan: [{ nama: 'Kos', nominal: 400 }, null, 'x'],
    alokasi: [{ id: 'a', nama: 'Tabungan', persen: 50 }],
    pengeluaran: [{ nama: 'ok', nominal: 5, tanggal: '2026-09-01' }, { nama: 'rusak', tanggal: 'kemarin' }],
    tabungan: [{ nominal: -5, tanggal: '2026-09-01', tipe: 'aneh' }],
    tema: 'dark',
  })
  assert.equal(s.gaji, 1000)
  assert.equal(s.kebutuhan.length, 1)
  assert.ok(s.kebutuhan[0].id)
  assert.equal(s.alokasi[0].nominal, 300)
  assert.equal(s.pengeluaran.length, 1)
  assert.deepEqual([s.tabungan[0].nominal, s.tabungan[0].tipe], [0, 'setor'])
  assert.equal(s.targetTabungan, 0)
  assert.equal(s.tema, 'dark')
})
