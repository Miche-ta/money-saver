const num = (v) => (Number.isFinite(+v) && +v > 0 ? +v : 0)

export function hitung(gaji, kebutuhan, alokasi) {
  gaji = num(gaji)
  const totalKebutuhan = kebutuhan.reduce((s, k) => s + num(k.nominal), 0)
  const sisa = gaji - totalKebutuhan
  const totalAlokasi = alokasi.reduce((s, a) => s + num(a.nominal), 0)
  return {
    gaji,
    totalKebutuhan,
    sisa,
    // kebutuhan + yang sudah dialokasikan (tabungan dll)
    terpakaiPersen: gaji ? ((totalKebutuhan + totalAlokasi) / gaji) * 100 : 0,
    totalAlokasi,
    // positif = masih ada sisa, negatif = alokasi melebihi sisa
    belumDialokasikan: Math.max(sisa, 0) - totalAlokasi,
  }
}

export const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

// ringkasan pengeluaran satu bulan. bulan = 'YYYY-MM', hariIni = 'YYYY-MM-DD'
export function ringkasPengeluaran(list, bulan, hariIni) {
  const [y, m] = bulan.split('-').map(Number)
  const jumlahHari = new Date(y, m, 0).getDate()
  const harian = Array(jumlahHari).fill(0)
  const isi = list.filter((p) => p.tanggal?.startsWith(bulan))
  for (const p of isi) harian[+p.tanggal.slice(8) - 1] += num(p.nominal)
  const total = harian.reduce((a, b) => a + b, 0)
  // bulan berjalan: rata-rata dihitung sampai hari ini saja
  const hariBerjalan = hariIni?.startsWith(bulan) ? +hariIni.slice(8) : jumlahHari
  const terbesar = isi.reduce((max, p) => (num(p.nominal) > num(max?.nominal) ? p : max), null)
  // hari (sampai hari ini) yang nol pengeluaran
  const hariHemat = harian.slice(0, hariBerjalan).filter((v) => !v).length
  return { isi, harian, total, rataHarian: total / hariBerjalan, terbesar, hariHemat }
}

// ringkasan tabungan. tipe 'tarik' = uang keluar dari tabungan
export function ringkasTabungan(list, bulan) {
  const nilai = (t) => (t.tipe === 'tarik' ? -num(t.nominal) : num(t.nominal))
  const urut = list.filter((t) => t.tanggal).toSorted((a, b) => a.tanggal.localeCompare(b.tanggal))
  const total = urut.reduce((s, t) => s + nilai(t), 0)
  // saldo di akhir tiap hari pada bulan ini (termasuk tabungan bulan-bulan sebelumnya)
  const [y, m] = bulan.split('-').map(Number)
  let i = 0
  let saldo = 0
  const saldoHarian = Array.from({ length: new Date(y, m, 0).getDate() }, (_, d) => {
    const tgl = `${bulan}-${String(d + 1).padStart(2, '0')}`
    while (i < urut.length && urut[i].tanggal <= tgl) saldo += nilai(urut[i++])
    return saldo
  })
  const bulanIni = urut.filter((t) => t.tanggal.startsWith(bulan))
  const setor = bulanIni.filter((t) => t.tipe !== 'tarik').reduce((s, t) => s + num(t.nominal), 0)
  const tarik = bulanIni.filter((t) => t.tipe === 'tarik').reduce((s, t) => s + num(t.nominal), 0)
  return { total, saldoHarian, setor, tarik, bulanIni }
}
