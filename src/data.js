import { hitung } from './calc.js'

export const KEY = 'money-saver'
export const id = () => crypto.randomUUID()
// tanggal lokal format YYYY-MM-DD
export const hariIni = () => new Date().toLocaleDateString('sv-SE')
const tglBulanIni = (d) => hariIni().slice(0, 8) + String(d).padStart(2, '0')

export const DEFAULT = {
  gaji: 8_000_000,
  kebutuhan: [
    { id: id(), nama: 'Kos / Sewa', nominal: 1_500_000 },
    { id: id(), nama: 'Makan', nominal: 1_800_000 },
    { id: id(), nama: 'Transport', nominal: 600_000 },
    { id: id(), nama: 'Listrik & Internet', nominal: 400_000 },
    { id: id(), nama: 'Cicilan', nominal: 700_000 },
  ],
  alokasi: [
    { id: id(), nama: 'Tabungan', nominal: 1_500_000 },
    { id: id(), nama: 'Dana Darurat', nominal: 1_000_000 },
    { id: id(), nama: 'Jajan / Hiburan', nominal: 500_000 },
  ],
  pengeluaran: [
    { id: id(), nama: 'Laundry', nominal: 35_000, tanggal: tglBulanIni(1) },
    { id: id(), nama: 'Makan siang', nominal: 25_000, tanggal: tglBulanIni(1) },
    { id: id(), nama: 'Bensin', nominal: 50_000, tanggal: tglBulanIni(2) },
  ],
  targetTabungan: 10_000_000,
  targetBulan: '',
  tabungan: [{ id: id(), nama: 'Setoran pertama', nominal: 500_000, tanggal: tglBulanIni(1), tipe: 'setor' }],
}

// dipakai tombol Reset: semua kosong / 0
export const KOSONG = { gaji: 0, kebutuhan: [], alokasi: [], pengeluaran: [], tabungan: [], targetTabungan: 0, targetBulan: '' }

const angka = (v) => (Number.isFinite(+v) && +v > 0 ? +v : 0)
const isTanggal = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const baris = (list) =>
  (Array.isArray(list) ? list : [])
    .filter((x) => x && typeof x === 'object')
    .map((x) => ({ ...x, id: typeof x.id === 'string' && x.id ? x.id : id(), nama: String(x.nama ?? ''), nominal: angka(x.nominal) }))

// rapikan data dari localStorage / file backup. null kalau bentuknya bukan data Money Saver
export function normalisasi(s) {
  if (!s || typeof s !== 'object' || !Array.isArray(s.kebutuhan) || !Array.isArray(s.alokasi)) return null
  const kebutuhan = baris(s.kebutuhan)
  // data lama pakai persen → ubah ke nominal
  const { sisa } = hitung(s.gaji, kebutuhan, [])
  const alokasi = baris(s.alokasi).map(({ persen, ...a }) =>
    persen == null ? a : { ...a, nominal: Math.round((Math.max(sisa, 0) * angka(persen)) / 100) },
  )
  return {
    gaji: angka(s.gaji),
    kebutuhan,
    alokasi,
    pengeluaran: baris(s.pengeluaran).filter((p) => isTanggal(p.tanggal)),
    tabungan: baris(s.tabungan)
      .filter((t) => isTanggal(t.tanggal))
      .map((t) => ({ ...t, tipe: t.tipe === 'tarik' ? 'tarik' : 'setor' })),
    targetTabungan: angka(s.targetTabungan),
    targetBulan: typeof s.targetBulan === 'string' && /^\d{4}-\d{2}$/.test(s.targetBulan) ? s.targetBulan : '',
    tema: s.tema === 'dark' ? 'dark' : 'light',
  }
}

export function load() {
  try {
    const s = normalisasi(JSON.parse(localStorage.getItem(KEY)))
    if (s) return s
  } catch {}
  return { ...DEFAULT, tema: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' }
}
