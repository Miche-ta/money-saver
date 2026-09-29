import { Chart as ChartJS, ArcElement, Tooltip, Legend, LineElement, PointElement, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, BarElement, CategoryScale, LinearScale)

// input angka yang tampil dengan titik ribuan (8.000.000)
export function MoneyInput({ value, onChange, ...rest }) {
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

// progress bar kecil di bawah kartu
export function Bar({ persen, over }) {
  return (
    <div className="bar">
      <div style={{ width: `${Math.min(Math.max(persen, 0), 100)}%` }} className={over ? 'over' : ''} />
    </div>
  )
}
