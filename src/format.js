// emoji otomatis dari nama pengeluaran
const EMOJI = [
  [/laundry|cuci|setrika/i, '🧺'],
  [/makan|nasi|mie|bakso|sarapan|lunch|dinner/i, '🍜'],
  [/kopi|coffee|teh|boba|minum/i, '🧋'],
  [/bensin|pertalite|pertamax|parkir|tol/i, '⛽'],
  [/gojek|grab|ojek|taxi|kereta|krl|bus|transport/i, '🛵'],
  [/pulsa|kuota|internet|wifi/i, '📶'],
  [/listrik|pln|token/i, '💡'],
  [/belanja|shopee|tokopedia|baju|sepatu/i, '🛍️'],
  [/film|nonton|game|netflix|spotify|hiburan/i, '🎮'],
  [/obat|dokter|apotek|sakit/i, '💊'],
  [/kucing|anjing|pet/i, '🐱'],
  [/sabun|shampo|odol|mandi/i, '🧼'],
  [/hadiah|kado|gift/i, '🎁'],
  [/kos|sewa|kontrakan/i, '🏠'],
  [/ryzen|intel|rtx|gpu|cpu|laptop|pc|komputer|hp|iphone|keyboard|mouse|monitor/i, '💻'],
]
export const emojiDari = (nama) => EMOJI.find(([re]) => re.test(nama))?.[1] ?? '💸'

export const tglPanjang = (tgl) =>
  new Date(tgl + 'T00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
export const namaBulan = (bulan, month = 'long') =>
  new Date(bulan + '-01T00:00').toLocaleDateString('id-ID', { month, year: 'numeric' })
