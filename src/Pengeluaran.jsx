import { useRef, useState } from 'react'
import { Chart } from 'react-chartjs-2'
import {
  budgetVsReal, geserBulan, isPosJajan, isPosTabungan, jatahHarian, ringkasPengeluaran, rupiah, tagihanBelum,
} from './calc.js'
import { hariIni, id } from './data.js'
import { Bar, MoneyInput } from './ui.jsx'
import { emojiDari, tglPanjang } from './format.js'

// mood dompet berdasarkan persen sisa gaji yang sudah dipakai
const mood = (persen, adaGaji) =>
  !adaGaji ? ['🤔', 'Isi gaji dulu biar aku bisa ngitung~']
  : persen < 50 ? ['😎', 'Hemat banget! Dompetmu masih tebal 🥰']
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

const formKosong = (tanggal) => ({ nama: '', nominal: 0, tanggal, kategoriId: '', rutin: false })

export default function Pengeluaran({ state, set, hapusRow, r, bulan, setBulan, t, textColor, gridColor, setToast }) {
  const { pengeluaran, kebutuhan, alokasi } = state
  const [form, setForm] = useState(() => formKosong(hariIni()))
  const formRef = useRef(null)

  const p = ringkasPengeluaran(pengeluaran, bulan, hariIni())
  const lalu = ringkasPengeluaran(pengeluaran, geserBulan(bulan, -1), hariIni()).total
  const selisih = lalu ? ((p.total - lalu) / lalu) * 100 : null

  const posBelanja = [...kebutuhan, ...alokasi.filter((a) => !isPosTabungan(a.nama))]
  const bvr = budgetVsReal(posBelanja, pengeluaran, bulan)
  const posJajan = bvr.pos.filter((x) => isPosJajan(x.nama))
  const budgetJajan = posJajan.reduce((s, x) => s + x.nominal, 0)
  // pengeluaran tanpa kategori ikut dihitung sebagai jajan
  const terpakaiJajan = posJajan.reduce((s, x) => s + x.terpakai, 0) + bvr.lainnya
  const jatah = jatahHarian(budgetJajan, terpakaiJajan, bulan, hariIni())
  const tagihan = tagihanBelum(pengeluaran, bulan)

  const [muka, pesan] = mood(r.sisa > 0 ? (p.total / r.sisa) * 100 : 100, r.gaji > 0)
  const namaPos = (kategoriId) => posBelanja.find((x) => x.id === kategoriId)?.nama

  const simpan = (e) => {
    e.preventDefault()
    const nama = form.nama.trim()
    if (!nama || !form.nominal || !form.tanggal) return
    if (form.id) {
      set({ pengeluaran: pengeluaran.map((x) => (x.id === form.id ? { ...form, nama } : x)) })
      setToast(`✏️ ${nama} diperbarui`)
    } else {
      set({ pengeluaran: [...pengeluaran, { ...form, id: id(), nama }] })
      setToast(`${emojiDari(nama)} ${nama} ${rupiah(form.nominal)} ${PESAN_TAMBAH[pengeluaran.length % PESAN_TAMBAH.length]}`)
    }
    setForm(formKosong(form.tanggal))
  }
  const edit = (x) => {
    setForm({ ...formKosong(x.tanggal), ...x, kategoriId: x.kategoriId ?? '', rutin: !!x.rutin })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  const hapus = (x) => {
    if (form.id === x.id) setForm(formKosong(form.tanggal))
    hapusRow('pengeluaran', x.id)
  }
  const bayar = (x) => {
    const tanggal = x.tanggal > hariIni() ? hariIni() : x.tanggal
    set({ pengeluaran: [...pengeluaran, { ...x, id: id(), tanggal }] })
    setToast(`📅 ${x.nama} ${rupiah(x.nominal)} dibayar. Satu tagihan beres! ✅`)
  }
  const stopRutin = (nama) => {
    const lower = nama.trim().toLowerCase()
    set({ pengeluaran: pengeluaran.map((x) => (x.nama.trim().toLowerCase() === lower ? { ...x, rutin: false } : x)) })
  }

  return (
    <>
      <header className="sub">
        <h2>🧾 Catatan pengeluaran</h2>
        <div className="piggy" title={pesan}>
          <span className="face">{muka}</span>
          <span className="bubble">{pesan}</span>
        </div>
        <input type="month" value={bulan} onChange={(e) => e.target.value && setBulan(e.target.value)} aria-label="Pilih bulan" />
      </header>

      <section className="cards">
        <div className="card">
          <span>Total bulan ini</span>
          <strong className="red">{rupiah(p.total)}</strong>
          {selisih != null && (
            <span className={selisih > 0 ? 'red' : 'green'}>
              {selisih > 0 ? '▲' : '▼'} {Math.abs(selisih).toFixed(0)}% vs bulan lalu {selisih <= 0 && '🎉'}
            </span>
          )}
        </div>
        <div className="card">
          <span>Boleh jajan per hari</span>
          {!posJajan.length ? (
            <>
              <strong>-</strong>
              <span>Buat pos "Jajan" di pembagian sisa 👆</span>
            </>
          ) : jatah == null ? (
            <>
              <strong>-</strong>
              <span>Cuma untuk bulan berjalan</span>
            </>
          ) : (
            <>
              <strong className={jatah > 0 ? 'green' : 'red'}>{rupiah(jatah)} {jatah > 0 ? '😋' : '🥲'}</strong>
              <span>sisa budget jajan {rupiah(Math.max(budgetJajan - terpakaiJajan, 0))}</span>
            </>
          )}
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
              <Bar persen={(p.total / r.sisa) * 100} over={p.total > r.sisa} />
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
                  { label: 'Pengeluaran harian', data: p.harian, backgroundColor: '#6366f1', borderRadius: 4, maxBarThickness: 14 },
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

        <div className="split wide">
        <section className="panel">
          <h2>Rencana vs realita</h2>
          {bvr.pos.filter((x) => x.nominal || x.terpakai).map((x) => (
            <div className="budget" key={x.id}>
              <div>
                <span>{x.nama || 'Tanpa nama'}</span>
                <span className={x.terpakai > x.nominal ? 'red' : 'muted'}>
                  {rupiah(x.terpakai)} / {rupiah(x.nominal)}
                </span>
              </div>
              <Bar persen={x.nominal ? (x.terpakai / x.nominal) * 100 : 100} over={x.terpakai > x.nominal} />
              {x.terpakai > x.nominal && <small className="red">⚠️ lebih {rupiah(x.terpakai - x.nominal)}</small>}
            </div>
          ))}
          {bvr.lainnya > 0 && (
            <div className="budget">
              <div>
                <span>Lainnya (tanpa kategori)</span>
                <span className="muted">{rupiah(bvr.lainnya)}</span>
              </div>
            </div>
          )}
          {!posBelanja.length && <p className="muted">Isi kebutuhan & pembagian sisa di atas dulu ya.</p>}
          <p className="muted small">💡 Pilih kategori waktu nambah pengeluaran biar kehitung di sini.</p>
        </section>

        <section className="panel" ref={formRef}>
          <h2>{form.id ? '✏️ Edit pengeluaran' : 'Tambah pengeluaran'}</h2>
          <form className="row wrap" onSubmit={simpan}>
            <input value={form.nama} placeholder="Contoh: Laundry" onChange={(e) => setForm({ ...form, nama: e.target.value })} aria-label="Nama" />
            <MoneyInput value={form.nominal} onChange={(v) => setForm({ ...form, nominal: v })} aria-label="Nominal" />
            <input type="date" max={hariIni()} value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} aria-label="Tanggal" />
            <select value={form.kategoriId} onChange={(e) => setForm({ ...form, kategoriId: e.target.value })} aria-label="Kategori">
              <option value="">Lainnya</option>
              {posBelanja.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nama || 'Tanpa nama'}
                </option>
              ))}
            </select>
            <label className="check">
              <input type="checkbox" checked={form.rutin} onChange={(e) => setForm({ ...form, rutin: e.target.checked })} />
              🔁 Tiap bulan
            </label>
            <button type="submit" className="add">{form.id ? '💾 Simpan' : '+ Tambah'}</button>
            {form.id && (
              <button type="button" className="ghost" onClick={() => setForm(formKosong(form.tanggal))}>
                Batal
              </button>
            )}
          </form>

          {tagihan.length > 0 && (
            <div className="tagihan">
              <h2>📅 Tagihan rutin belum dicatat</h2>
              {tagihan.map((x) => (
                <div className="row" key={x.id}>
                  <span className="grow">
                    {emojiDari(x.nama)} {x.nama} · <b>{rupiah(x.nominal)}</b> <span className="muted">· tgl {+x.tanggal.slice(8)}</span>
                  </span>
                  <button onClick={() => bayar(x)}>✓ Bayar</button>
                  <button className="del" title="Berhenti jadi tagihan rutin" onClick={() => stopRutin(x.nama)}>
                    Stop
                  </button>
                </div>
              ))}
            </div>
          )}

          {p.isi.length === 0 && <p className="muted empty">🦗 krik krik... belum ada pengeluaran bulan ini. Dompetmu lagi tidur nyenyak 😴</p>}
          <div className="expenses">
            {p.isi
              .toSorted((a, b) => b.tanggal.localeCompare(a.tanggal))
              .map((x) => (
                <div className={`card expense${form.id === x.id ? ' editing' : ''}`} key={x.id}>
                  <span className="emoji">{emojiDari(x.nama)}</span>
                  <div>
                    <b>
                      {x.nama} {x.rutin && <span title="Tiap bulan">🔁</span>}
                    </b>
                    <span>
                      {tglPanjang(x.tanggal)} · {namaPos(x.kategoriId) ?? 'Lainnya'}
                    </span>
                  </div>
                  <strong className="red">{rupiah(x.nominal)}</strong>
                  <button className="del" aria-label={`Edit ${x.nama}`} onClick={() => edit(x)}>
                    ✏️
                  </button>
                  <button className="del" aria-label={`Hapus ${x.nama}`} onClick={() => hapus(x)}>
                    ✕
                  </button>
                </div>
              ))}
          </div>
        </section>
        </div>
      </div>
    </>
  )
}
