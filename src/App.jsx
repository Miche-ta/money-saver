import { useEffect, useRef, useState } from 'react'
import { hitung, ringkasTabungan } from './calc.js'
import { KEY, KOSONG, hariIni, load, normalisasi } from './data.js'
import Planner from './Planner.jsx'
import Pengeluaran from './Pengeluaran.jsx'
import Tabungan from './Tabungan.jsx'
import Ringkasan from './Ringkasan.jsx'

const sapaan = (jam) =>
  jam < 4 ? '🌙 Udah larut, jangan checkout tengah malam ya'
  : jam < 11 ? '☀️ Selamat pagi, semangat hemat hari ini!'
  : jam < 15 ? '🌤️ Selamat siang, makan siang jangan kemahalan~'
  : jam < 19 ? '🌇 Selamat sore, waktunya ngecek pengeluaran'
  : '🌙 Selamat malam, jangan checkout tengah malam ya'

export default function App() {
  const [state, setState] = useState(load)
  const [bulan, setBulan] = useState(() => hariIni().slice(0, 7))
  const [toast, setToast] = useState(null)
  const fileRef = useRef(null)
  const { tema } = state

  useEffect(() => {
    document.documentElement.dataset.theme = tema
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {}
  }, [state, tema])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const set = (patch) => setState((s) => ({ ...s, ...patch }))
  const editRow = (list, rowId, patch) =>
    set({ [list]: state[list].map((x) => (x.id === rowId ? { ...x, ...patch } : x)) })
  const hapusRow = (list, rowId) => set({ [list]: state[list].filter((x) => x.id !== rowId) })

  const r = hitung(state.gaji, state.kebutuhan, state.alokasi)
  const t = ringkasTabungan(state.tabungan, bulan)
  const targetPersen = state.targetTabungan ? (t.total / state.targetTabungan) * 100 : 0
  const textColor = tema === 'dark' ? '#cbd5e1' : '#334155'
  const gridColor = tema === 'dark' ? '#3c4043' : '#e2e8f0'

  const exportData = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `money-saver-${hariIni()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setToast('📦 Backup terunduh. Simpan baik-baik ya!')
  }
  const importData = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    let s = null
    try {
      s = normalisasi(JSON.parse(await file.text()))
    } catch {}
    if (!s) return alert('File ini bukan backup Money Saver 😵')
    if (!confirm('Ganti SEMUA data sekarang dengan isi file backup ini?')) return
    setState({ ...s, tema })
    setToast('📦 Backup berhasil dipulihkan!')
  }

  const props = { state, set, editRow, hapusRow, r, t, bulan, setBulan, targetPersen, textColor, gridColor, setToast }

  return (
    <main>
      <header>
        <div>
          <h1>💰 Money Saver</h1>
          <p className="muted greet">{sapaan(new Date().getHours())}</p>
        </div>
        <div className="actions">
          <button className="ghost" onClick={exportData} title="Unduh semua data ke file">
            📤 Backup
          </button>
          <button className="ghost" onClick={() => fileRef.current?.click()} title="Pulihkan dari file backup">
            📥 Pulihkan
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={importData} />
          <button className="ghost" onClick={() => confirm('Hapus semua data dan mulai dari 0?') && setState({ ...KOSONG, tema })}>
            Reset
          </button>
          <button className="ghost" aria-label="Ganti tema" onClick={() => set({ tema: tema === 'dark' ? 'light' : 'dark' })}>
            {tema === 'dark' ? '☀️ Terang' : '🌙 Gelap'}
          </button>
        </div>
      </header>

      <Planner {...props} />
      <Pengeluaran {...props} />
      <Tabungan {...props} />
      <Ringkasan {...props} />

      {toast && (
        <div className="toast" role="status" key={toast}>
          {toast}
        </div>
      )}
    </main>
  )
}
