import { useEffect, useMemo, useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa'

function getStatusClass(status) {
  const s = (status || 'parsed').toLowerCase()
  if (s === 'sent') return 'status-sent'
  if (s === 'error') return 'status-error'
  if (s === 'new') return 'status-new'
  return 'status-parsed'
}

function getStatusLabel(status) {
  const s = (status || 'parsed').toLowerCase()
  if (s === 'new') return 'Новый Лот'
  if (s === 'parsed') return 'Просмотрено'
  if (s === 'sent') return 'Отправлено'
  if (s === 'error') return 'Ошибка'
  return status || 'Просмотрено'
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
  // ✅ новое:
  selected = false,
  onToggleSelect, // (lotId:number, nextSelected:boolean) => void
  onMarkAsViewed, // (lotId:number) => void

  // остальное оставляем, чтобы ничего не ломалось в проекте (но в LotCard больше не используем)
  // ВАЖНО: onAccept принимает только 2 параметра: (lotId, margin)
  // onAcceptTelegram принимает только 2 параметра: (lotId, margin)
  // Не передавайте третий параметр (channel) в эти функции
  onAccept, // (lotId: number, margin: number) => void
  onReject,
  onAcceptTelegram, // (lotId: number, margin: number) => void
  onAcceptAll,
  shouldPulse = false,
}) {
  const [isLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const statusClass = getStatusClass(lot.status)
  const freshClass = isFreshLot(lot) ? ' lot-card--fresh' : ''
  const isNewStatus = (lot.status || '').toLowerCase() === 'new'
  const newClass = isNewStatus && shouldPulse ? ' lot-card--new' : ''

  const createdAt = lot.received_at ? new Date(lot.received_at).toLocaleString() : ''
  const supplierName = lot.supplier_name || lot.supplier_id || '-'
  const positions = Array.isArray(lot.positions) ? lot.positions : []

  const regions = useMemo(() => (
    [
      ...new Set(
        positions
          .map(p => p.region)
          .filter(Boolean)
          .filter(r => String(r).toLowerCase() !== 'unknown'),
      ),
    ]
  ), [positions])

  const activations = useMemo(() => (
    [
      ...new Set(
        positions
          .map(p => p.activation)
          .filter(Boolean)
          .filter(a => String(a).toLowerCase() !== 'unknown'),
      ),
    ]
  ), [positions])

  const rawWhatsappId = lot.supplier_whatsapp_id || null
  const waPhone = getPhoneFromWhatsappId(rawWhatsappId)

  const rawText = String(lot.raw_text || '')

  const closeModal = () => {
    if (isLoading) return
    setIsModalOpen(false)
  }

  // Изменение статуса на "parsed" при открытии модального окна
  useEffect(() => {
    if (!isModalOpen) return
    
    // Изменяем статус на "parsed" при открытии модального окна
    if (typeof onMarkAsViewed === 'function') {
      const currentStatus = String(lot.status || '').toLowerCase().trim()
      if (currentStatus === 'new') {
        onMarkAsViewed(lot.id)
      }
    }
  }, [isModalOpen, onMarkAsViewed, lot.id, lot.status])

  // ESC + блокировка скролла страницы при открытой модалке
  useEffect(() => {
    if (!isModalOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeModal()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, isLoading])

  const toggleSelected = (next) => {
    if (typeof onToggleSelect === 'function') {
      onToggleSelect(lot.id, next)
    }
  }

  return (
    <>
      {/* =========================
          CARD (всегда свернутая)
          ========================= */}
      <div
        className={`lot-card lot-card--collapsed${freshClass}${newClass}${selected ? ' lot-card--selected' : ''}`}
        data-lot-id={lot.id}
      >
        <div className="lot-collapsed-top">
          <div className="lot-leftHead">
            {/* ✅ чекбокс выбора */}
            <label
              className="lot-select"
              title="Выбрать лот для отправки клиентам"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={!!selected}
                onChange={(e) => toggleSelected(e.target.checked)}
              />
              <span className="lot-select__box" />
            </label>

            <div className="lot-title">
              <span>Лот #{lot.id}</span>
            </div>
          </div>

          <div className="lot-collapsed-right">
            <span className={`lot-badge-status ${statusClass}`}>
              {getStatusLabel(lot.status)}
            </span>

            <button
              className="btn btn-outline lot-collapsed-toggle"
              onClick={() => setIsModalOpen(true)}
              disabled={isLoading}
              title="Открыть детали"
            >
              Показать
            </button>
          </div>
        </div>

        <div className="lot-collapsed-rawtext">
          {rawText ? (
            <pre className="lot-rawtext-pre">{rawText}</pre>
          ) : (
            <div className="empty">raw_text пустой</div>
          )}
        </div>
      </div>

      {/* =========================
          MODAL (детали)
          ========================= */}
      {isModalOpen && (
        <div className="lot-modal__overlay" onClick={closeModal}>
          <div className="lot-modal__window" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="lot-modal__header">
              <div className="lot-modal__title">
                {/* ✅ чекбокс выбора внутри модалки */}
                <label
                  className="lot-select lot-select--modal"
                  title="Выбрать лот для отправки клиентам"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={(e) => toggleSelected(e.target.checked)}
                  />
                  <span className="lot-select__box" />
                </label>

                <div className="lot-modal__titleText">Лот #{lot.id}</div>
                <span className={`lot-badge-status ${statusClass}`}>
                  {getStatusLabel(lot.status)}
                </span>
              </div>

              <button
                className="lot-modal__close"
                onClick={closeModal}
                disabled={isLoading}
                aria-label="Закрыть"
                title="Закрыть (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Body (скролл внутри) */}
            <div className="lot-modal__body">
              <div className="lot-meta-main">
                <div
                  className="lot-supplier"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>{supplierName}</span>
                  {waPhone && (
                    <a
                      href={`https://wa.me/${waPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Написать поставщику в WhatsApp"
                      style={{ display: 'inline-flex', color: '#25D366', textDecoration: 'none' }}
                    >
                      <FaWhatsapp size={22} />
                    </a>
                  )}
                </div>

                {createdAt && <div className="lot-datetime">{createdAt}</div>}
                {regions.length > 0 && <div className="lot-region">Регион: {regions.join(', ')}</div>}
                {activations.length > 0 && <div className="lot-activation">Активация: {activations.join(', ')}</div>}
              </div>

              <div className="lot-modal__section">
                <div className="lot-modal__sectionTitle">Позиции</div>

                <div className="lot-positions lot-modal__positions">
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
                            <td>{p.unit_price != null ? p.unit_price + ' ' + (p.currency || '') : ''}</td>
                            <td>{p.region && String(p.region).toLowerCase() !== 'unknown' ? p.region : ''}</td>
                            <td>{p.activation && String(p.activation).toLowerCase() !== 'unknown' ? p.activation : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty">Нет позиций</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer (кнопок отправки тут больше нет) */}
            <div className="lot-modal__footer">
              <div className="lot-modal__hint">
                Выберите лоты чекбоксами — отправка кнопками на странице.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default LotCard
