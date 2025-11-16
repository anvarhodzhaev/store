import { useState } from 'react'

function getStatusClass(status) {
  const s = (status || 'parsed').toLowerCase()
  if (s === 'sent') return 'status-sent'
  if (s === 'error') return 'status-error'
  if (s === 'new') return 'status-new'
  return 'status-parsed'
}

function isFreshLot(lot) {
  if (!lot.received_at) return false
  const t = new Date(lot.received_at).getTime()
  if (Number.isNaN(t)) return false
  return Date.now() - t < 5 * 60 * 1000
}

function LotCard({ lot, onAccept, onReject }) {
  const [margin, setMargin] = useState(10)
  const [isLoading, setIsLoading] = useState(false)

  const statusClass = getStatusClass(lot.status)
  const freshClass = isFreshLot(lot) ? ' lot-card--fresh' : ''
  const createdAt = lot.received_at ? new Date(lot.received_at).toLocaleString() : ''
  const supplierName = lot.supplier_name || lot.supplier_id || '-'
  const positions = Array.isArray(lot.positions) ? lot.positions : []

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      await onAccept(lot.id, margin)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)
    try {
      await onReject(lot.id)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`lot-card${freshClass}`} data-lot-id={lot.id}>
      <div className="lot-header-row">
        <div className="lot-title">
          <span>Лот #{lot.id}</span>
        </div>
        <span className={`lot-badge-status ${statusClass}`}>
          {lot.status || 'new'}
        </span>
      </div>

      <div className="lot-meta-main">
        <div className="lot-supplier">{supplierName}</div>
        {createdAt && <div className="lot-datetime">{createdAt}</div>}
        {lot.region && <div className="lot-region">{lot.region}</div>}
      </div>

      <div className="lot-positions">
        {positions.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Модель</th>
                <th>Цвет</th>
                <th>Объём</th>
                <th>Кол-во</th>
                <th>Цена</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, idx) => (
                <tr key={idx}>
                  <td>{[p.brand, p.model].filter(Boolean).join(' ')}</td>
                  <td>{p.color || ''}</td>
                  <td>{p.capacity_gb ? p.capacity_gb + 'GB' : ''}</td>
                  <td>{p.quantity ?? ''}</td>
                  <td>
                    {p.unit_price != null
                      ? p.unit_price + ' ' + (p.currency || '')
                      : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">Нет позиций</div>
        )}
      </div>

      <div className="lot-actions">
        <label>
          Маржа, %:
          <input
            type="number"
            className="margin-input"
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
            min="0"
            max="500"
            step="1"
            disabled={isLoading}
          />
        </label>
        <button
          className="btn btn-primary btn-accept"
          onClick={handleAccept}
          disabled={isLoading}
        >
          Отправить
        </button>
        <button
          className="btn btn-danger btn-reject"
          onClick={handleReject}
          disabled={isLoading}
        >
          Отклонить
        </button>
      </div>
    </div>
  )
}

export default LotCard

