import { ringkasPengeluaran, ringkasTahun, rupiah, streakNyatet } from './calc.js'
import { hariIni } from './data.js'
import { namaBulan } from './format.js'

export default function Ringkasan({ state, bulan, setBulan, targetPersen }) {
  const { pengeluaran, tabungan } = state
  const hari = hariIni()
  // lencana selalu dihitung dari bulan berjalan, bukan bulan yang dipilih
  const hemat = ringkasPengeluaran(pengeluaran, hari.slice(0, 7), hari).hariHemat
  const streak = streakNyatet(pengeluaran, hari)
  const lencana = [
    ['🌱', '3 hari tanpa jajan', hemat >= 3],
    ['🌿', 'Seminggu tanpa jajan', hemat >= 7],
    ['🌳', '2 minggu tanpa jajan', hemat >= 14],
    ['📝', 'Rajin nyatet 7 hari berturut-turut', streak >= 7],
    ['💰', 'Nabung pertama kali', tabungan.some((t) => t.tipe !== 'tarik')],
    ['🎯', 'Setengah target tabungan', targetPersen >= 50],
    ['🏆', 'Target tabungan tercapai', targetPersen >= 100],
  ]

  const tahun = bulan.slice(0, 4)
  const y = ringkasTahun(pengeluaran, tabungan, tahun)
  const maxKeluar = Math.max(...y.bulan.map((b) => b.keluar), 1)

  return (
    <>
      <header className="sub">
        <h2>🏅 Lencana</h2>
        <p className="muted">
          {lencana.filter((l) => l[2]).length}/{lencana.length} terbuka · 🔥 nyatet {streak} hari berturut-turut
        </p>
      </header>
      <section className="badges">
        {lencana.map(([emoji, nama, dapat]) => (
          <div className={`badge${dapat ? '' : ' locked'}`} key={nama} title={dapat ? 'Terbuka!' : 'Belum terbuka'}>
            <span>{dapat ? emoji : '🔒'}</span>
            {nama}
          </div>
        ))}
      </section>

      <header className="sub">
        <h2>📆 Ringkasan {tahun}</h2>
        <p className="muted">
          Keluar {rupiah(y.totalKeluar)} · Nabung {rupiah(y.totalNabung)}
        </p>
      </header>
      <section className="panel">
        <table className="year">
          <thead>
            <tr>
              <th>Bulan</th>
              <th>Pengeluaran</th>
              <th>Tabungan</th>
            </tr>
          </thead>
          <tbody>
            {y.bulan.map((b) => (
              <tr key={b.bulan} className={b.bulan === bulan ? 'active' : ''}>
                <td>
                  <button className="link" onClick={() => setBulan(b.bulan)} title="Lihat detail bulan ini">
                    {namaBulan(b.bulan, 'short')}
                  </button>{' '}
                  {b.bulan === y.terhemat?.bulan && '🏅'} {b.bulan === y.terboros?.bulan && '💸'}
                </td>
                <td>
                  <div className="ybar">
                    <div style={{ width: `${(b.keluar / maxKeluar) * 100}%` }} />
                  </div>
                  <span className="red">{b.keluar ? rupiah(b.keluar) : '-'}</span>
                </td>
                <td className={b.nabung < 0 ? 'red' : 'green'}>{b.nabung ? `${b.nabung > 0 ? '+' : ''}${rupiah(b.nabung)}` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">
          🏅 bulan terhemat · 💸 bulan terboros · klik nama bulan untuk lihat detail bulannya
        </p>
      </section>
    </>
  )
}
