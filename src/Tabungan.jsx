import { useRef, useState } from 'react'
import { isPosTabungan, nabungPerBulan, rupiah } from './calc.js'
import { hariIni, id } from './data.js'
import { Bar, MoneyInput } from './ui.jsx'
import { namaBulan, tglPanjang } from './format.js'

const formKosong = (tanggal, tipe = 'setor') => ({ nama: '', nominal: 0, tanggal, tipe })

export default function Tabungan({ state, set, hapusRow, bulan, t, targetPersen, setToast }) {
  const { tabungan, alokasi, targetTabungan, targetBulan } = state
  const [form, setForm] = useState(() => formKosong(hariIni()))
  const formRef = useRef(null)

  const rencana = alokasi.filter((a) => isPosTabungan(a.nama)).reduce((s, a) => s + a.nominal, 0)
  const bersih = t.setor - t.tarik
  const kurang = targetTabungan - t.total
  const perBulan = nabungPerBulan(kurang, hariIni().slice(0, 7), targetBulan)

  const simpan = (e) => {
    e.preventDefault()
    if (!form.nominal || !form.tanggal) return
    const tarik = form.tipe === 'tarik'
    const nama = form.nama.trim() || (tarik ? 'Ambil tabungan' : 'Nabung')
    if (form.id) {
      set({ tabungan: tabungan.map((x) => (x.id === form.id ? { ...form, nama } : x)) })
      setToast(`✏️ ${nama} diperbarui`)
    } else {
      set({ tabungan: [...tabungan, { ...form, id: id(), nama }] })
      setToast(
        tarik
          ? `🥲 ${rupiah(form.nominal)} diambil dari tabungan. Semoga buat hal penting ya`
          : `🎉 Yay! ${rupiah(form.nominal)} masuk tabungan. Kamu hebat! ✨`,
      )
    }
    setForm(formKosong(form.tanggal, form.tipe))
  }
  const edit = (x) => {
    setForm({ ...x })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  const hapus = (x) => {
    if (form.id === x.id) setForm(formKosong(form.tanggal))
    hapusRow('tabungan', x.id)
  }

  return (
    <>
      <header className="sub">
        <h2>🏦 Tabungan</h2>
        <p className="muted">
          {targetPersen >= 100
            ? '🏆 Target tercapai! Traktir diri sendiri dikit boleh lah~'
            : targetPersen >= 50
              ? '🚀 Udah lewat setengah jalan, gas terus!'
              : '🌱 Sedikit-sedikit lama-lama jadi bukit'}
        </p>
      </header>

      <section className="cards">
        <div className="card">
          <span>Total tabungan</span>
          <strong className={t.total < 0 ? 'red' : 'green'}>{rupiah(t.total)}</strong>
        </div>
        <div className="card">
          <span>Rencana vs realita ({namaBulan(bulan, 'short')})</span>
          {rencana ? (
            <>
              <strong className={bersih >= rencana ? 'green' : ''}>
                {((bersih / rencana) * 100).toFixed(0)}% {bersih >= rencana && '✅'}
              </strong>
              <Bar persen={(bersih / rencana) * 100} />
              <span>
                {rupiah(bersih)} dari rencana {rupiah(rencana)}
              </span>
            </>
          ) : (
            <>
              <strong>-</strong>
              <span>Buat pos "Tabungan" di pembagian sisa 👆</span>
            </>
          )}
        </div>
        <div className="card">
          <span>Nabung / diambil bulan ini</span>
          <strong className="green">+{rupiah(t.setor)}</strong>
          <span className="red">-{rupiah(t.tarik)}</span>
        </div>
        <div className="card">
          <span>Target tabungan</span>
          <MoneyInput value={targetTabungan} onChange={(v) => set({ targetTabungan: v })} aria-label="Target tabungan" />
          <label className="deadline">
            Tercapai bulan
            <input
              type="month"
              min={hariIni().slice(0, 7)}
              value={targetBulan}
              onChange={(e) => set({ targetBulan: e.target.value })}
              aria-label="Tenggat target"
            />
          </label>
          <Bar persen={targetPersen} />
          <span className="muted">
            {!targetTabungan
              ? 'Isi target dulu 🎯'
              : `${targetPersen.toFixed(1)}%${kurang > 0 ? ` · kurang ${rupiah(kurang)}` : ''}`}
          </span>
          {perBulan && (
            <span className={perBulan.sisaBulan ? '' : 'red'}>
              {perBulan.sisaBulan
                ? `💡 Nabung ${rupiah(perBulan.perBulan)}/bulan selama ${perBulan.sisaBulan} bulan`
                : '⏰ Tenggatnya sudah lewat, geser bulannya ya'}
            </span>
          )}
        </div>
      </section>

      <div className="grid">
        <section className="panel wide" ref={formRef}>
          <h2>{form.id ? '✏️ Edit tabungan' : 'Tambah tabungan'}</h2>
          <form className="row wrap" onSubmit={simpan}>
            <select value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })} aria-label="Jenis">
              <option value="setor">💰 Nabung</option>
              <option value="tarik">🏧 Ambil</option>
            </select>
            <input value={form.nama} placeholder="Catatan (opsional)" onChange={(e) => setForm({ ...form, nama: e.target.value })} aria-label="Catatan" />
            <MoneyInput value={form.nominal} onChange={(v) => setForm({ ...form, nominal: v })} aria-label="Nominal" />
            <input type="date" max={hariIni()} value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} aria-label="Tanggal" />
            <button type="submit" className="add">{form.id ? '💾 Simpan' : '+ Simpan'}</button>
            {form.id && (
              <button type="button" className="ghost" onClick={() => setForm(formKosong(form.tanggal))}>
                Batal
              </button>
            )}
          </form>

          {tabungan.length === 0 && <p className="muted empty">🐣 Belum ada tabungan. Yuk mulai nabung, sekecil apa pun!</p>}
          {tabungan.length > 0 && <h2>Semua riwayat tabungan ({tabungan.length})</h2>}
          <div className="expenses">
            {tabungan
              .toSorted((a, b) => b.tanggal.localeCompare(a.tanggal))
              .map((x) => (
                <div className={`card expense${form.id === x.id ? ' editing' : ''}`} key={x.id}>
                  <span className="emoji">{x.tipe === 'tarik' ? '🏧' : '💰'}</span>
                  <div>
                    <b>{x.nama}</b>
                    <span>{tglPanjang(x.tanggal)}</span>
                  </div>
                  <strong className={x.tipe === 'tarik' ? 'red' : 'green'}>
                    {x.tipe === 'tarik' ? '-' : '+'}
                    {rupiah(x.nominal)}
                  </strong>
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
    </>
  )
}
