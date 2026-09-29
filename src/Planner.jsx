import { Doughnut } from 'react-chartjs-2'
import { rupiah } from './calc.js'
import { id } from './data.js'
import { Bar, MoneyInput } from './ui.jsx'

const COLORS_KEB = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#e11d48', '#db2777', '#c026d3', '#a855f7']
const COLORS_ALO = ['#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#14b8a6', '#22c55e', '#0ea5e9', '#8b5cf6']

export default function Planner({ state, set, editRow, hapusRow, r, textColor }) {
  const { gaji, kebutuhan, alokasi } = state

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

  return (
    <>
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
          <Bar persen={r.terpakaiPersen} over={r.terpakaiPersen > 100} />
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
    </>
  )
}
