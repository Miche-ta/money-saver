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

const pad = (n) => String(n).padStart(2, '0')
const jumlahHari = (bulan) => {
  const [y, m] = bulan.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

// 'YYYY-MM' geser n bulan
export function geserBulan(bulan, n) {
  const [y, m] = bulan.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

// 'YYYY-MM-DD' geser n hari
export function geserHari(tgl, n) {
  const [y, m, d] = tgl.split('-').map(Number)
  const x = new Date(y, m - 1, d + n)
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}

// pos alokasi yang sifatnya tabungan (bukan dibelanjakan)
export const isPosTabungan = (nama) => /tabung|darurat|invest/i.test(nama ?? '')
export const isPosJajan = (nama) => /jajan|hiburan/i.test(nama ?? '')

// rencana vs realita per pos budget. pengeluaran.kategoriId menunjuk ke id pos
export function budgetVsReal(pos, pengeluaran, bulan) {
  const ids = new Set(pos.map((x) => x.id))
  const isi = pengeluaran.filter((p) => p.tanggal?.startsWith(bulan))
  const terpakai = (id) => isi.filter((p) => p.kategoriId === id).reduce((s, p) => s + num(p.nominal), 0)
  return {
    pos: pos.map((x) => ({ ...x, terpakai: terpakai(x.id) })),
    // tanpa kategori, atau kategorinya sudah dihapus
    lainnya: isi.filter((p) => !ids.has(p.kategoriId)).reduce((s, p) => s + num(p.nominal), 0),
  }
}

// sisa budget dibagi sisa hari (termasuk hari ini). null kalau bukan bulan berjalan
export function jatahHarian(budget, terpakai, bulan, hariIni) {
  if (!hariIni.startsWith(bulan)) return null
  const sisaHari = jumlahHari(bulan) - +hariIni.slice(8) + 1
  return Math.max(num(budget) - num(terpakai), 0) / sisaHari
}

// berapa harus nabung per bulan (bulan ini ikut dihitung) supaya target tercapai
export function nabungPerBulan(kurang, bulanIni, bulanTarget) {
  if (!bulanTarget || kurang <= 0) return null
  const idx = (b) => {
    const [y, m] = b.split('-').map(Number)
    return y * 12 + m
  }
  const sisaBulan = idx(bulanTarget) - idx(bulanIni) + 1
  return sisaBulan > 0 ? { sisaBulan, perBulan: kurang / sisaBulan } : { sisaBulan: 0, perBulan: kurang }
}

// pengeluaran rutin dari bulan-bulan sebelumnya yang belum dicatat di bulan ini (kunci = nama)
export function tagihanBelum(list, bulan) {
  const lower = (s) => (s ?? '').trim().toLowerCase()
  const sudah = new Set(list.filter((p) => p.tanggal?.startsWith(bulan)).map((p) => lower(p.nama)))
  const terakhir = new Map()
  for (const p of list) {
    if (!p.rutin || !p.tanggal || p.tanggal >= `${bulan}-01` || sudah.has(lower(p.nama))) continue
    if (!terakhir.has(lower(p.nama)) || terakhir.get(lower(p.nama)).tanggal < p.tanggal) terakhir.set(lower(p.nama), p)
  }
  const maxHari = jumlahHari(bulan)
  return [...terakhir.values()].map((p) => ({
    ...p,
    tanggal: `${bulan}-${pad(Math.min(+p.tanggal.slice(8), maxHari))}`,
  }))
}

// ringkasan 12 bulan dalam satu tahun
export function ringkasTahun(pengeluaran, tabungan, tahun) {
  const bulan = Array.from({ length: 12 }, (_, i) => {
    const b = `${tahun}-${pad(i + 1)}`
    const keluar = pengeluaran.filter((p) => p.tanggal?.startsWith(b)).reduce((s, p) => s + num(p.nominal), 0)
    const nabung = tabungan
      .filter((t) => t.tanggal?.startsWith(b))
      .reduce((s, t) => s + (t.tipe === 'tarik' ? -num(t.nominal) : num(t.nominal)), 0)
    return { bulan: b, keluar, nabung }
  })
  const ada = bulan.filter((b) => b.keluar > 0)
  const pilih = (cmp) => (ada.length ? ada.reduce((a, b) => (cmp(b.keluar, a.keluar) ? b : a)) : null)
  return {
    bulan,
    totalKeluar: bulan.reduce((s, b) => s + b.keluar, 0),
    totalNabung: bulan.reduce((s, b) => s + b.nabung, 0),
    terhemat: ada.length > 1 ? pilih((x, y) => x < y) : null,
    terboros: pilih((x, y) => x > y),
  }
}

// hari berturut-turut (sampai hari ini / kemarin) yang ada catatan pengeluarannya
export function streakNyatet(list, hariIni) {
  const tgl = new Set(list.map((p) => p.tanggal))
  let d = tgl.has(hariIni) ? hariIni : geserHari(hariIni, -1)
  let n = 0
  while (tgl.has(d)) {
    n++
    d = geserHari(d, -1)
  }
  return n
}
