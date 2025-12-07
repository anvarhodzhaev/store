import { useState } from 'react'
import { FaWhatsapp, FaTelegram } from 'react-icons/fa'

function getStatusClass(status) {
  const s = (status || 'parsed').toLowerCase()
  if (s === 'sent') return 'status-sent'
  if (s === 'error') return 'status-error'
  if (s === 'new') return 'status-new'
  return 'status-parsed'
}

function getPhoneFromWhatsappId(whatsappId) {
  if (!whatsappId) return null

  const beforeAt = String(whatsappId).split('@')[0]
  const mainPart = beforeAt.split('-')[0]
  const digits = mainPart.replace(/\D/g, '')

  return digits || null
}

function isFreshLot(lot) {
  if (!lot.received_at) return false
  const t = new Date(lot.received_at).getTime()
  if (Number.isNaN(t)) return false
  return Date.now() - t < 5 * 60 * 1000
}

function LotCard({
  lot,
  onAccept,
  onReject,
  onAcceptTelegram,   // 🔹 новый проп
  shouldPulse = false,
}) {
  const [margin, setMargin] = useState(10)
  const [isLoading, setIsLoading] = useState(false)

  const statusClass = getStatusClass(lot.status)
  const freshClass = isFreshLot(lot) ? ' lot-card--fresh' : ''
  const isNewStatus = (lot.status || '').toLowerCase() === 'new'
  const newClass = (isNewStatus && shouldPulse) ? ' lot-card--new' : ''
  const createdAt = lot.received_at ? new Date(lot.received_at).toLocaleString() : ''
  const supplierName = lot.supplier_name || lot.supplier_id || '-'
  const positions = Array.isArray(lot.positions) ? lot.positions : []

  const regions = [...new Set(
    positions.map((p) => p.region).filter(Boolean).filter(r => r.toLowerCase() !== 'unknown')
  )]
  const activations = [...new Set(
    positions.map((p) => p.activation).filter(Boolean).filter(a => a.toLowerCase() !== 'unknown')
  )]

  // WhatsApp
  const rawWhatsappId = lot.supplier_whatsapp_id || null
  const waPhone = getPhoneFromWhatsappId(rawWhatsappId)

  // 🔹 отправка в WhatsApp
  const handleAcceptWhatsapp = async () => {
    if (!onAccept) return
    setIsLoading(true)
    try {
      // третий аргумент "whatsapp" — если захочешь различать канал в n8n
      await onAccept(lot.id, margin, 'whatsapp')
    } finally {
      setIsLoading(false)
    }
  }

  // 🔹 отправка в Telegram
  const handleAcceptTelegram = async () => {
    const handler = onAcceptTelegram || onAccept
    if (!handler) return
    setIsLoading(true)
    try {
      // третий аргумент "telegram"
      await handler(lot.id, margin, 'telegram')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!onReject) return
    setIsLoading(true)
    try {
      await onReject(lot.id)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`lot-card${freshClass}${newClass}`} data-lot-id={lot.id}>
      <div className="lot-header-row">
        <div className="lot-title">
          <span>Лот #{lot.id}</span>
        </div>
        <span className={`lot-badge-status ${statusClass}`}>
          {lot.status || 'new'}
        </span>
      </div>

      <div className="lot-meta-main">
        <div className="lot-supplier" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{supplierName}</span>
          {waPhone && (
            <a
              href={`https://wa.me/${waPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Написать в WhatsApp"
              style={{ display: 'inline-flex', color: '#25D366', textDecoration: 'none' }}
            >
              <FaWhatsapp size={22} />
            </a>
          )}
        </div>
        {createdAt && <div className="lot-datetime">{createdAt}</div>}
        {regions.length > 0 && (
          <div className="lot-region">Регион: {regions.join(', ')}</div>
        )}
        {activations.length > 0 && (
          <div className="lot-activation">Активация: {activations.join(', ')}</div>
        )}
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
                <th>Регион</th>
                <th>Активация</th>
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
                  <td>{(p.region && p.region.toLowerCase() !== 'unknown') ? p.region : ''}</td>
                  <td>{(p.activation && p.activation.toLowerCase() !== 'unknown') ? p.activation : ''}</td>
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
        <div className="lot-actions-buttons">
          <button
            className="btn btn-primary btn-accept"
            onClick={handleAcceptWhatsapp}
            disabled={isLoading}
          >
            <FaWhatsapp size={16} style={{ marginRight: '6px' }} />
            Отправить в WhatsApp
          </button>
          <button
            className="btn btn-telegram"
            onClick={handleAcceptTelegram}
            disabled={isLoading}
          >
            <FaTelegram size={16} style={{ marginRight: '6px' }} />
            Отправить в Telegram
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
    </div>
  )
}

export default LotCard
