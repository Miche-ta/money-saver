import { useEffect, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, LineElement, PointElement, BarElement, CategoryScale, LinearScale, Filler } from 'chart.js'
import { Chart, Doughnut } from 'react-chartjs-2'
import { hitung, ringkasPengeluaran, ringkasTabungan, rupiah } from './calc.js'

ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, BarElement, CategoryScale, LinearScale, Filler)

const KEY = 'money-saver'
const id = () => crypto.randomUUID()
// tanggal lokal format YYYY-MM-DD
const hariIni = () => new Date().toLocaleDateString('sv-SE')
const tglBulanIni = (d) => hariIni().slice(0, 8) + String(d).padStart(2, '0')
const DEFAULT = {
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
  tabungan: [{ id: id(), nama: 'Setoran pertama', nominal: 500_000, tanggal: tglBulanIni(1), tipe: 'setor' }],
}

// dipakai tombol Reset: semua kosong / 0
const KOSONG = { gaji: 0, kebutuhan: [], alokasi: [], pengeluaran: [], tabungan: [], targetTabungan: 0 }

const COLORS_KEB = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#e11d48', '#db2777', '#c026d3', '#a855f7']
const COLORS_ALO = ['#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#14b8a6', '#22c55e', '#0ea5e9', '#8b5cf6']

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
  [/ryzen|intel|rtx|gpu|cpu|laptop|pc|komputer|hp|iphone|keyboard|mouse|monitor/i, '💻'],
]
const emojiDari = (nama) => EMOJI.find(([re]) => re.test(nama))?.[1] ?? '💸'

// mood dompet berdasarkan persen sisa gaji yang sudah dipakai
const mood = (persen) =>
  persen < 50 ? ['😎', 'Hemat banget! Dompetmu masih tebal 🥰']
  : persen < 80 ? ['🙂', 'Masih aman, pelan-pelan ya~']
  : persen < 100 ? ['😰', 'Waduh, sisa gaji tinggal dikit!']
  : ['😭', 'Dompet nangis... udah lewat budget 💔']

const PESAN_TAMBAH = [
  'tercatat! Dompet makin ringan, hati makin ikhlas 🙏',
  'masuk catatan~ Jangan lupa napas dulu 😮‍💨',
  'dicatat! Uang datang dan pergi, yang penting dicatat 📝',
  'oke tercatat. Dompet: "aku gapapa kok" 🥲',
  'sip! Kamu keren udah rajin nyatet ✨',
]
const sapaan = (jam) =>
  jam < 4 ? '🌙 Udah larut, jangan checkout tengah malam ya'
  : jam < 11 ? '☀️ Selamat pagi, semangat hemat hari ini!'
  : jam < 15 ? '🌤️ Selamat siang, makan siang jangan kemahalan~'
  : jam < 19 ? '🌇 Selamat sore, waktunya ngecek pengeluaran'
  : '🌙 Selamat malam, jangan checkout tengah malam ya'

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    if (s?.kebutuhan && s?.alokasi) {
      // data lama pakai persen → ubah ke nominal
      const { sisa } = hitung(s.gaji, s.kebutuhan, [])
      s.alokasi = s.alokasi.map(({ persen, ...a }) =>
        persen == null ? a : { ...a, nominal: Math.round((Math.max(sisa, 0) * persen) / 100) },
      )
      s.pengeluaran ??= []
      s.tabungan ??= []
      s.targetTabungan ??= 10_000_000
      return s
    }
  } catch {}
  return {
    ...DEFAULT,
    tema: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  }
}

// input angka yang tampil dengan titik ribuan (8.000.000)
function MoneyInput({ value, onChange, ...rest }) {
  return (
    <input
      inputMode="numeric"
      value={value ? Number(value).toLocaleString('id-ID') : ''}
      onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
      placeholder="0"
      {...rest}
    />
  )
}

export default function App() {
  const [state, setState] = useState(load)
  const { gaji, kebutuhan, alokasi, tema, pengeluaran } = state
  const r = hitung(gaji, kebutuhan, alokasi)
  const [bulan, setBulan] = useState(() => hariIni().slice(0, 7))
  const [baru, setBaru] = useState({ nama: '', nominal: 0, tanggal: hariIni() })
  const [toast, setToast] = useState(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])
  const p = ringkasPengeluaran(pengeluaran, bulan, hariIni())
  const t = ringkasTabungan(state.tabungan, bulan)
  const targetPersen = state.targetTabungan ? (t.total / state.targetTabungan) * 100 : 0
  const [setoran, setSetoran] = useState({ nama: '', nominal: 0, tanggal: hariIni(), tipe: 'setor' })
  const tambahTabungan = (e) => {
    e.preventDefault()
    if (!setoran.nominal || !setoran.tanggal) return
    const tarik = setoran.tipe === 'tarik'
    set({ tabungan: [...state.tabungan, { id: id(), ...setoran, nama: setoran.nama.trim() || (tarik ? 'Ambil tabungan' : 'Nabung') }] })
    setSetoran({ ...setoran, nama: '', nominal: 0 })
    setToast(tarik ? `🥲 ${rupiah(setoran.nominal)} diambil dari tabungan. Semoga buat hal penting ya` : `🎉 Yay! ${rupiah(setoran.nominal)} masuk tabungan. Kamu hebat! ✨`)
  }

  useEffect(() => {
    document.documentElement.dataset.theme = tema
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {}
  }, [state, tema])

  const set = (patch) => setState((s) => ({ ...s, ...patch }))
  const editRow = (list, rowId, patch) =>
    set({ [list]: state[list].map((x) => (x.id === rowId ? { ...x, ...patch } : x)) })
  const hapusRow = (list, rowId) => set({ [list]: state[list].filter((x) => x.id !== rowId) })

  const labels = [...kebutuhan.map((k) => k.nama || 'Tanpa nama'), ...alokasi.map((a) => a.nama || 'Tanpa nama')]
  const data = [...kebutuhan.map((k) => k.nominal || 0), ...alokasi.map((a) => a.nominal || 0)]
  const colors = [
    ...kebutuhan.map((_, i) => COLORS_KEB[i % COLORS_KEB.length]),
    ...alokasi.map((_, i) => COLORS_ALO[i % COLORS_ALO.length]),
  ]
  if (r.belumDialokasikan > 0) {
    labels.push('Belum dialokasikan')
    data.push(r.belumDialokasikan)
    colors.push('#94a3b8')
  }
  const textColor = tema === 'dark' ? '#cbd5e1' : '#334155'
  const gridColor = tema === 'dark' ? '#3c4043' : '#e2e8f0'
  const tambahPengeluaran = (e) => {
    e.preventDefault()
    if (!baru.nama.trim() || !baru.nominal || !baru.tanggal) return
    set({ pengeluaran: [...pengeluaran, { id: id(), ...baru, nama: baru.nama.trim() }] })
    setBaru({ ...baru, nama: '', nominal: 0 })
    const pesan = PESAN_TAMBAH[Math.floor(Math.random() * PESAN_TAMBAH.length)]
    setToast(`${emojiDari(baru.nama)} ${baru.nama.trim()} ${rupiah(baru.nominal)} ${pesan}`)
  }

  return (
    <main>
      <header>
        <div>
          <h1>💰 Money Saver</h1>
          <p className="muted greet">{sapaan(new Date().getHours())}</p>
        </div>
        <div className="actions">
          <button className="ghost" onClick={() => confirm('Hapus semua data dan mulai dari 0?') && setState({ ...KOSONG, tema })}>
            Reset
          </button>
          <button
            className="ghost"
            aria-label="Ganti tema"
            onClick={() => set({ tema: tema === 'dark' ? 'light' : 'dark' })}
          >
            {tema === 'dark' ? '☀️ Terang' : '🌙 Gelap'}
          </button>
        </div>
      </header>

      <section className="cards">
        <div className="card">
          <span>Gaji Pokok</span>
          <strong>{rupiah(r.gaji)}</strong>
        </div>
        <div className="card">
          <span>Total Kebutuhan</span>
          <strong className="red">{rupiah(r.totalKebutuhan)}</strong>
        </div>
        <div className="card">
          <span>Sisa</span>
          <strong className={r.sisa < 0 ? 'red' : 'green'}>{rupiah(r.sisa)}</strong>
        </div>
        <div className="card">
          <span>Gaji Terpakai</span>
          <strong>{r.terpakaiPersen.toFixed(1)}%</strong>
          <div className="bar">
            <div
              style={{ width: `${Math.min(r.terpakaiPersen, 100)}%` }}
              className={r.terpakaiPersen > 100 ? 'over' : ''}
            />
          </div>
        </div>
      </section>

      <div className="grid">
        <section className="panel">
          <label className="gaji">
            Gaji pokok per bulan
            <MoneyInput value={gaji} onChange={(v) => set({ gaji: v })} />
          </label>

          <h2>Kebutuhan</h2>
          {kebutuhan.map((k) => (
            <div className="row" key={k.id}>
              <input
                value={k.nama}
                placeholder="Nama kebutuhan"
                onChange={(e) => editRow('kebutuhan', k.id, { nama: e.target.value })}
              />
              <MoneyInput value={k.nominal} onChange={(v) => editRow('kebutuhan', k.id, { nominal: v })} />
              <button className="del" aria-label={`Hapus ${k.nama}`} onClick={() => hapusRow('kebutuhan', k.id)}>
                ✕
              </button>
            </div>
          ))}
          <button className="add" onClick={() => set({ kebutuhan: [...kebutuhan, { id: id(), nama: '', nominal: 0 }] })}>
            + Tambah kebutuhan
          </button>
          {r.sisa < 0 && <p className="alert">⚠️ Kebutuhan melebihi gaji sebesar {rupiah(-r.sisa)}.</p>}
        </section>

        <section className="panel">
          <h2>Pembagian sisa ({rupiah(Math.max(r.sisa, 0))})</h2>
          {alokasi.map((a) => (
            <div className="alo" key={a.id}>
              <div className="row">
                <input
                  value={a.nama}
                  placeholder="Nama pos"
                  onChange={(e) => editRow('alokasi', a.id, { nama: e.target.value })}
                />
                <MoneyInput value={a.nominal} onChange={(v) => editRow('alokasi', a.id, { nominal: v })} />
                <button className="del" aria-label={`Hapus ${a.nama}`} onClick={() => hapusRow('alokasi', a.id)}>
                  ✕
                </button>
              </div>
              <div className="slider">
                <input
                  type="range"
                  min="0"
                  max={Math.max(r.sisa, a.nominal || 0, 0)}
                  step="10000"
                  value={a.nominal || 0}
                  aria-label={`Nominal ${a.nama}`}
                  onChange={(e) => editRow('alokasi', a.id, { nominal: +e.target.value })}
                />
                <span className="muted">{r.sisa > 0 ? (((a.nominal || 0) / r.sisa) * 100).toFixed(0) : 0}% dari sisa</span>
              </div>
            </div>
          ))}
          <button className="add" onClick={() => set({ alokasi: [...alokasi, { id: id(), nama: '', nominal: 0 }] })}>
            + Tambah pos
          </button>
          <p className={r.belumDialokasikan === 0 ? 'ok' : 'alert'}>
            Total: {rupiah(r.totalAlokasi)}
            {r.belumDialokasikan < 0 && ` — kelebihan ${rupiah(-r.belumDialokasikan)} dari sisa, kurangi dulu ya.`}
            {r.belumDialokasikan > 0 && ` — masih ada ${rupiah(r.belumDialokasikan)} belum dialokasikan.`}
            {r.belumDialokasikan === 0 && ' ✓ pas!'}
          </p>
        </section>

        <section className="panel chart">
          <h2>Ke mana gajimu pergi</h2>
          {data.some((d) => d > 0) ? (
            <Doughnut
              data={{ labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] }}
              options={{
                cutout: '62%',
                plugins: {
                  legend: { position: 'bottom', labels: { color: textColor, boxWidth: 12 } },
                  tooltip: { callbacks: { label: (c) => ` ${c.label}: ${rupiah(c.raw)}` } },
                },
              }}
            />
          ) : (
            <p className="muted">Isi gaji dulu biar chart-nya muncul.</p>
          )}
        </section>
      </div>

      <header className="sub">
        <h2>🧾 Catatan pengeluaran</h2>
        {(() => {
          const [muka, pesan] = mood(r.sisa > 0 ? (p.total / r.sisa) * 100 : 100)
          return (
            <div className="piggy" title={pesan}>
              <span className="face">{muka}</span>
              <span className="bubble">{pesan}</span>
            </div>
          )
        })()}
        <input type="month" value={bulan} onChange={(e) => e.target.value && setBulan(e.target.value)} aria-label="Pilih bulan" />
      </header>

      <section className="cards">
        <div className="card">
          <span>Total bulan ini</span>
          <strong className="red">{rupiah(p.total)}</strong>
        </div>
        <div className="card">
          <span>Rata-rata per hari</span>
          <strong>{rupiah(p.rataHarian)}</strong>
        </div>
        <div className="card">
          <span>Pengeluaran terbesar</span>
          <strong>{p.terbesar ? rupiah(p.terbesar.nominal) : '-'}</strong>
          {p.terbesar && <span>{p.terbesar.nama}</span>}
        </div>
        <div className="card">
          <span>Hari tanpa jajan</span>
          <strong className="green">🌱 {p.hariHemat} hari</strong>
          <span>{p.hariHemat >= 7 ? 'Tanaman hematmu tumbuh subur 🌳' : 'Siram terus biar tumbuh~'}</span>
        </div>
        <div className="card">
          <span>Dari sisa gaji</span>
          {r.sisa > 0 ? (
            <>
              <strong className={p.total > r.sisa ? 'red' : 'green'}>{((p.total / r.sisa) * 100).toFixed(1)}%</strong>
              <div className="bar">
                <div style={{ width: `${Math.min((p.total / r.sisa) * 100, 100)}%` }} className={p.total > r.sisa ? 'over' : ''} />
              </div>
            </>
          ) : (
            <>
              <strong>-</strong>
              <span>Isi gaji dulu di atas 👆</span>
            </>
          )}
        </div>
      </section>

      <div className="grid">
        <section className="panel chart wide">
          <h2>Pengeluaran & tabungan</h2>
          <div className="plot">
            <Chart
              type="bar"
              data={{
                labels: p.harian.map((_, i) => i + 1),
                datasets: [
                  {
                    label: 'Pengeluaran harian',
                    data: p.harian,
                    backgroundColor: '#6366f1',
                    borderRadius: 4,
                    maxBarThickness: 14,
                  },
                  {
                    type: 'line',
                    label: 'Saldo tabungan',
                    data: t.saldoHarian,
                    borderColor: '#10b981',
                    backgroundColor: '#10b981',
                    // saldo naik/turun per setoran, bukan melengkung
                    stepped: true,
                    pointRadius: 0,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                  legend: { position: 'bottom', labels: { color: textColor, boxWidth: 12 } },
                  tooltip: {
                    callbacks: { title: (c) => `Tanggal ${c[0].label}`, label: (c) => ` ${c.dataset.label}: ${rupiah(c.raw)}` },
                  },
                },
                scales: {
                  x: { ticks: { color: textColor }, grid: { color: gridColor } },
                  // satu skala biar perbandingannya jujur
                  y: { beginAtZero: true, grace: '15%', ticks: { color: textColor, callback: (v) => rupiah(v) }, grid: { color: gridColor } },
                },
              }}
            />
          </div>
        </section>

        <section className="panel wide">
          <h2>Tambah pengeluaran</h2>
          <form className="row wrap" onSubmit={tambahPengeluaran}>
            <input value={baru.nama} placeholder="Contoh: Laundry" onChange={(e) => setBaru({ ...baru, nama: e.target.value })} />
            <MoneyInput value={baru.nominal} onChange={(v) => setBaru({ ...baru, nominal: v })} aria-label="Nominal" />
            <input type="date" max={hariIni()} value={baru.tanggal} onChange={(e) => setBaru({ ...baru, tanggal: e.target.value })} aria-label="Tanggal" />
            <button type="submit" className="add">+ Tambah</button>
          </form>

          {p.isi.length === 0 && <p className="muted empty">🦗 krik krik... belum ada pengeluaran bulan ini. Dompetmu lagi tidur nyenyak 😴</p>}
          <div className="expenses">
            {p.isi
              .toSorted((a, b) => b.tanggal.localeCompare(a.tanggal))
              .map((x) => (
                <div className="card expense" key={x.id}>
                  <span className="emoji">{emojiDari(x.nama)}</span>
                  <div>
                    <b>{x.nama}</b>
                    <span>{new Date(x.tanggal + 'T00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <strong className="red">{rupiah(x.nominal)}</strong>
                  <button className="del" aria-label={`Hapus ${x.nama}`} onClick={() => hapusRow('pengeluaran', x.id)}>
                    ✕
                  </button>
                </div>
              ))}
          </div>
        </section>
      </div>
      <header className="sub">
        <h2>🏦 Tabungan</h2>
        <p className="muted">
          {targetPersen >= 100 ? '🏆 Target tercapai! Traktir diri sendiri dikit boleh lah~' : targetPersen >= 50 ? '🚀 Udah lewat setengah jalan, gas terus!' : '🌱 Sedikit-sedikit lama-lama jadi bukit'}
        </p>
      </header>

      <section className="cards">
        <div className="card">
          <span>Total tabungan</span>
          <strong className={t.total < 0 ? 'red' : 'green'}>{rupiah(t.total)}</strong>
        </div>
        <div className="card">
          <span>Nabung bulan ini</span>
          <strong className="green">+{rupiah(t.setor)}</strong>
        </div>
        <div className="card">
          <span>Diambil bulan ini</span>
          <strong className="red">-{rupiah(t.tarik)}</strong>
        </div>
        <div className="card">
          <span>Target tabungan</span>
          <MoneyInput value={state.targetTabungan} onChange={(v) => set({ targetTabungan: v })} aria-label="Target tabungan" />
          <div className="bar">
            <div style={{ width: `${Math.min(Math.max(targetPersen, 0), 100)}%` }} />
          </div>
          <span className="muted">
            {!state.targetTabungan
              ? 'Isi target dulu 🎯'
              : `${targetPersen.toFixed(1)}%${targetPersen < 100 ? ` · kurang ${rupiah(state.targetTabungan - t.total)}` : ''}`}
          </span>
        </div>
      </section>

      <div className="grid">
        <section className="panel">
          <h2>Tambah tabungan</h2>
          <form className="row wrap" onSubmit={tambahTabungan}>
            <select value={setoran.tipe} onChange={(e) => setSetoran({ ...setoran, tipe: e.target.value })} aria-label="Jenis">
              <option value="setor">💰 Nabung</option>
              <option value="tarik">🏧 Ambil</option>
            </select>
            <input value={setoran.nama} placeholder="Catatan (opsional)" onChange={(e) => setSetoran({ ...setoran, nama: e.target.value })} />
            <MoneyInput value={setoran.nominal} onChange={(v) => setSetoran({ ...setoran, nominal: v })} aria-label="Nominal" />
            <input type="date" max={hariIni()} value={setoran.tanggal} onChange={(e) => setSetoran({ ...setoran, tanggal: e.target.value })} aria-label="Tanggal" />
            <button type="submit" className="add">+ Simpan</button>
          </form>

          {state.tabungan.length === 0 && <p className="muted empty">Belum ada catatan tabungan.</p>}
          {state.tabungan.length > 0 && <h2>Semua riwayat tabungan ({state.tabungan.length})</h2>}
          <div className="expenses">
            {state.tabungan.toSorted((a, b) => b.tanggal.localeCompare(a.tanggal)).map((x) => (
              <div className="card expense" key={x.id}>
                <span className="emoji">{x.tipe === 'tarik' ? '🏧' : '💰'}</span>
                <div>
                  <b>{x.nama}</b>
                  <span>{new Date(x.tanggal + 'T00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <strong className={x.tipe === 'tarik' ? 'red' : 'green'}>
                  {x.tipe === 'tarik' ? '-' : '+'}
                  {rupiah(x.nominal)}
                </strong>
                <button className="del" aria-label={`Hapus ${x.nama}`} onClick={() => hapusRow('tabungan', x.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {toast && (
        <div className="toast" role="status" key={toast}>
          {toast}
        </div>
      )}
    </main>
  )
}
