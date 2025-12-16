import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { SiTelegram } from 'react-icons/si'
import LotCard from './components/LotCard'
import Toast from './components/Toast'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import Warehouse from './components/Warehouse'
import Products from './components/Products'
import Clients from './components/Clients'
import Deals from './components/Deals'
import Suppliers from './components/Suppliers'
import './index.css'

const N8N_BASE = 'https://quageyamoulu.beget.app'
const LOTS_URL = `${N8N_BASE}/webhook/lots`
const ACCEPT_URL = `${N8N_BASE}/webhook/lots/accept`
const TELEGRAM_ACCEPT_URL = `${N8N_BASE}/webhook/lots/accept-telegram`
const REJECT_URL = `${N8N_BASE}/webhook/lots/reject`
const SUPPLIERS_NOTIFY_URL = `${N8N_BASE}/webhook/send-to-suppliers`
const ACCEPT_ALL_URL = `${N8N_BASE}/webhook/lots/accept-all` // 🔹 старый вебхук (можно удалить)
const SEND_SELECTED_URL = `${N8N_BASE}/webhook/lots/send-selected` // ✅ массовая отправка выбранных лотов

function normalizeLots(data) {
  if (!data) return []
  
  let items = []
  if (Array.isArray(data)) {
    items = data
  } else if (Array.isArray(data.items)) {
    items = data.items
  } else if (Array.isArray(data.lots)) {
    items = data.lots
  } else if (Array.isArray(data.data)) {
    items = data.data
  } else {
    return []
  }
  
  // Разворачиваем объекты с .json свойствами
  return items.map(item => {
    if (item && typeof item === 'object' && item.json) {
      try {
        const parsed = typeof item.json === 'string' ? JSON.parse(item.json) : item.json
        return { ...item, ...parsed }
      } catch (e) {
        console.warn('Failed to parse .json property:', e)
        return item
      }
    }
    return item
  })
}

function App() {
  // Авторизация
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true'
  })
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('currentUser') || ''
  })

  const [currentPage, setCurrentPage] = useState('offers')
  const [allLots, setAllLots] = useState([])
  const [selectedLotIds, setSelectedLotIds] = useState(() => new Set())
  const [bulkMarginPercent, setBulkMarginPercent] = useState(10)
  
  // Функции для работы с localStorage
  const getLocalStatusChanges = useCallback(() => {
    try {
      const saved = localStorage.getItem('lotStatusChanges')
      if (saved) {
        const parsed = JSON.parse(saved)
        return new Map(Object.entries(parsed))
      }
    } catch (e) {
      console.error('Error loading status changes from localStorage', e)
    }
    return new Map()
  }, [])

  const saveLocalStatusChanges = useCallback((changes) => {
    try {
      const obj = Object.fromEntries(changes)
      localStorage.setItem('lotStatusChanges', JSON.stringify(obj))
    } catch (e) {
      console.error('Error saving status changes to localStorage', e)
    }
  }, [])

  // Хранилище локальных изменений статусов (lotId -> status)
  const localStatusChangesRef = useRef(getLocalStatusChanges())

  const [statusFilter, setStatusFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [refreshInterval, setRefreshInterval] = useState(5)

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ui_theme')
    return saved === 'dark' || saved === 'light' ? saved : 'dark'
  })

  const [statusMessage, setStatusMessage] = useState('')
  const [statusError, setStatusError] = useState(false)
  const [toasts, setToasts] = useState([])
  const [notifyLoading, setNotifyLoading] = useState(false)

  const knownLotIdsRef = useRef(new Set())
  const [isOffersPageActive, setIsOffersPageActive] = useState(false)
  const [newlyAppearedLotIds, setNewlyAppearedLotIds] = useState(new Set())

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  const handleLoginSuccess = useCallback((username) => {
    setIsAuthenticated(true)
    setCurrentUser(username)
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('currentUser', username)
  }, [])

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false)
    setCurrentUser('')
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('currentUser')
  }, [])

  // Установка темы
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ui_theme', theme)
  }, [theme])

  // Отслеживание переключения на страницу "Предложения"
  useEffect(() => {
    if (currentPage === 'offers') {
      if (!isOffersPageActive) {
        const allIds = new Set(allLots.map(lot => lot.id))
        knownLotIdsRef.current = allIds
        setNewlyAppearedLotIds(new Set())
      }
      setIsOffersPageActive(true)
    } else {
      setIsOffersPageActive(false)
    }
  }, [currentPage, allLots, isOffersPageActive])

  // Загрузка лотов
  const fetchLots = useCallback(async () => {
    try {
      const res = await fetch(LOTS_URL)
      const text = await res.text()

      if (!res.ok) {
        setStatusMessage('Ошибка загрузки лотов: HTTP ' + res.status)
        setStatusError(true)
        showToast('Ошибка загрузки лотов: HTTP ' + res.status, 'error')
        return
      }

      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        console.error('JSON parse error', e, text)
        setStatusMessage('Ошибка разбора JSON от /webhook/lots')
        setStatusError(true)
        showToast('Ошибка JSON от /webhook/lots', 'error')
        return
      }

      const normalized = normalizeLots(data)

      // Применяем локальные изменения статусов к данным с сервера
      const normalizedWithLocalChanges = normalized.map(lot => {
        const localStatus = localStatusChangesRef.current.get(String(lot.id))
        if (localStatus) {
          return { ...lot, status: localStatus }
        }
        return lot
      })

      if (isOffersPageActive && currentPage === 'offers') {
        // Используем normalizedWithLocalChanges для консистентности с setAllLots
        const currentIds = new Set(normalizedWithLocalChanges.map(lot => lot.id))
        const newIds = normalizedWithLocalChanges
          .filter(lot => !knownLotIdsRef.current.has(lot.id))
          .map(lot => lot.id)

        if (newIds.length > 0) {
          setNewlyAppearedLotIds(new Set(newIds))
          setTimeout(() => {
            setNewlyAppearedLotIds(prev => {
              const updated = new Set(prev)
              newIds.forEach(id => updated.delete(id))
              return updated
            })
          }, 4000)
        }

        currentIds.forEach(id => knownLotIdsRef.current.add(id))
      } else {
        knownLotIdsRef.current = new Set(normalizedWithLocalChanges.map(lot => lot.id))
        setNewlyAppearedLotIds(new Set())
      }

      setAllLots(normalizedWithLocalChanges)
      setStatusError(false)
      setStatusMessage(`Показано ${normalized.length} из ${normalized.length} лотов`)
    } catch (e) {
      console.error(e)
      setStatusMessage('Ошибка загрузки лотов: ' + e.message)
      setStatusError(true)
      showToast('Ошибка загрузки лотов: ' + e.message, 'error')
    }
  }, [currentPage, isOffersPageActive, showToast])

  // Загрузка сохраненных изменений статусов при монтировании
  useEffect(() => {
    localStatusChangesRef.current = getLocalStatusChanges()
  }, [getLocalStatusChanges])

  // Автообновление
  useEffect(() => {
    if (currentPage !== 'offers') return
    fetchLots()
    const id = setInterval(fetchLots, Math.max(2, Number(refreshInterval) || 5) * 1000)
    return () => clearInterval(id)
  }, [currentPage, fetchLots, refreshInterval])

  // Фильтрация
  const filteredLots = useMemo(() => {
    let filtered = allLots.slice()

    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        lot => (lot.status || 'parsed').toLowerCase() === statusFilter,
      )
    }

    if (supplierFilter.trim()) {
      const query = supplierFilter.trim().toLowerCase()
      filtered = filtered.filter(lot => {
        const name = (lot.supplier_name || lot.supplier_id || '').toLowerCase()
        return name.includes(query)
      })
    }

    return filtered
  }, [allLots, statusFilter, supplierFilter])

  // =========================
  // Выбор лотов (чекбоксы)
  // =========================
  const handleToggleSelectLot = useCallback((lotId, nextSelected) => {
    setSelectedLotIds(prev => {
      const next = new Set(prev)
      if (nextSelected) next.add(lotId)
      else next.delete(lotId)
      return next
    })
  }, [])

  const clearSelectedLots = useCallback(() => {
    setSelectedLotIds(new Set())
  }, [])

  const selectAllFilteredLots = useCallback(() => {
    setSelectedLotIds(prev => {
      const next = new Set(prev)
      filteredLots.forEach(l => next.add(l.id))
      return next
    })
  }, [filteredLots])

  // Если лот исчез из списка (обновление) — убираем его из selected
  useEffect(() => {
    setSelectedLotIds(prev => {
      if (prev.size === 0) return prev
      const existing = new Set(allLots.map(l => l.id))
      let changed = false
      const next = new Set()
      prev.forEach(id => {
        if (existing.has(id)) next.add(id)
        else changed = true
      })
      return changed ? next : prev
    })
  }, [allLots])

  // Обновление статуса лота на "parsed" при просмотре
  const handleMarkAsViewed = useCallback((lotId) => {
    const lotIdStr = String(lotId)
    // Сохраняем изменение в локальном хранилище
    localStatusChangesRef.current.set(lotIdStr, 'parsed')
    // Сохраняем в localStorage
    saveLocalStatusChanges(localStatusChangesRef.current)
    
    // Обновляем состояние
    setAllLots(prev => prev.map(lot => {
      const lotIdMatch = String(lot.id) === lotIdStr
      const currentStatus = String(lot.status || '').toLowerCase().trim()
      if (lotIdMatch && currentStatus === 'new') {
        return { ...lot, status: 'parsed' }
      }
      return lot
    }))
  }, [saveLocalStatusChanges])

  // Массовая отправка выбранных лотов клиентам
  const handleSendSelected = useCallback(async (channel) => {
    const lotIds = Array.from(selectedLotIds)
    if (lotIds.length === 0) return

    // Создаем Set для быстрой проверки
    const lotIdsSet = new Set(lotIds)

    setStatusError(false)
    setStatusMessage(`Отправляю ${lotIds.length} лотов (${channel})…`)

    try {
      const res = await fetch(SEND_SELECTED_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel, // 'whatsapp' | 'telegram' | 'all'
          lot_ids: lotIds,
          margin_percent: bulkMarginPercent,
        }),
      })

      if (!res.ok) throw new Error('HTTP ' + res.status)

      // убираем отправленные из списка, используя захваченный lotIdsSet
      setAllLots(prev => prev.filter(l => !lotIdsSet.has(l.id)))
      setSelectedLotIds(new Set())

      showToast(`Отправлено ${lotIds.length} лотов`, 'success')
      setStatusMessage(`Отправлено ${lotIds.length} лотов.`)
    } catch (e) {
      console.error(e)
      setStatusError(true)
      setStatusMessage('Ошибка отправки: ' + e.message)
      showToast('Ошибка отправки: ' + e.message, 'error')
    }
  }, [selectedLotIds, bulkMarginPercent, showToast])

  // Уведомить поставщиков (верхняя кнопка)
  const handleNotifySuppliers = useCallback(async () => {
    setNotifyLoading(true)
    setStatusMessage('Отправляю уведомление поставщикам…')
    try {
      const res = await fetch(SUPPLIERS_NOTIFY_URL, { method: 'POST' })
      if (!res.ok) throw new Error('HTTP ' + res.status)

      setStatusMessage('Уведомление поставщикам отправлено.')
      showToast('Уведомление успешно отправлено!', 'success')
    } catch (e) {
      console.error(e)
      setStatusMessage('Ошибка отправки поставщикам: ' + e.message)
      setStatusError(true)
      showToast('Ошибка отправки поставщикам: ' + e.message, 'error')
    } finally {
      setNotifyLoading(false)
    }
  }, [showToast])

  // Если не авторизован
  if (!isAuthenticated) {
    return (
      <div className="app">
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="app-content">
        <div className="app">
          {currentPage === 'offers' && (
            <>
              <div className="app-header">
                <div className="app-title">
                  <h1>Предложения поставщиков</h1>
                  <div className="app-subtitle">
                    Выбирайте лоты чекбоксами и отправляйте клиентам кнопками сверху
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <button
                      onClick={handleNotifySuppliers}
                      disabled={notifyLoading}
                      className="btn btn-primary"
                      style={{
                        padding: '10px 16px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '18px' }}>
                        campaign
                      </span>
                      Уведомить поставщиков
                    </button>
                  </div>
                </div>

                <div className="pill">
                  <span className="pill-dot"></span>
                  Live-обновление каждые <strong>{refreshInterval} секунд</strong>
                </div>
              </div>

              <div className="toolbar">
                <div className="filters">
                  <div className="filter-group">
                    <label htmlFor="statusFilter">Статус</label>
                    <select
                      id="statusFilter"
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Все</option>
                      <option value="new">new</option>
                      <option value="parsed">parsed</option>
                      <option value="sent">sent</option>
                      <option value="error">error</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label htmlFor="supplierFilter">Поставщик</label>
                    <input
                      id="supplierFilter"
                      value={supplierFilter}
                      onChange={e => setSupplierFilter(e.target.value)}
                      className="filter-input"
                      placeholder="поиск…"
                    />
                  </div>

                  <div className="interval-control">
                    <label htmlFor="refreshInterval">Интервал обновления</label>
                    <select
                      id="refreshInterval"
                      value={refreshInterval}
                      onChange={e => setRefreshInterval(Number(e.target.value))}
                      className="filter-select"
                    >
                      <option value={5}>5 секунд</option>
                      <option value={15}>15 секунд</option>
                      <option value={30}>30 секунд</option>
                      <option value={60}>60 секунд</option>
                    </select>
                  </div>
                </div>

                <div className="toolbar-right">
                  <button
                    className="btn btn-outline"
                    onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
                    title="Переключить тему"
                  >
                    {theme === 'dark' ? '🌙 Тёмная тема' : '☀️ Светлая тема'}
                  </button>

                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      setStatusFilter('all')
                      setSupplierFilter('')
                    }}
                  >
                    Сбросить фильтры
                  </button>
                </div>
              </div>

              {statusMessage && (
                <div
                  className="status-message"
                  style={{ color: statusError ? '#fecaca' : undefined }}
                >
                  {statusMessage}
                </div>
              )}

              {/* ===== Массовые действия (кнопки отправки вынесены сюда) ===== */}
              <div className="bulk-actions">
                <div className="bulk-actions__content">
                  <div className="bulk-actions__count">
                    Выбрано: <strong>{selectedLotIds.size}</strong>
                  </div>

                  <label className="bulk-actions__margin">
                    Маржа, %:
                    <input
                      type="number"
                      className="margin-input bulk-actions__marginInput"
                      value={bulkMarginPercent}
                      onChange={(e) => setBulkMarginPercent(Number(e.target.value))}
                      min="0"
                      max="500"
                      step="1"
                    />
                  </label>

                  <button
                    className="btn btn-outline"
                    onClick={selectAllFilteredLots}
                    disabled={filteredLots.length === 0}
                    title="Выбрать все лоты из текущего списка"
                  >
                    Выбрать все
                  </button>

                  <button
                    className="btn btn-outline"
                    onClick={clearSelectedLots}
                    disabled={selectedLotIds.size === 0}
                    title="Снять выделение"
                  >
                    Снять
                  </button>

                  <button
                    className="btn btn-whatsapp"
                    disabled={selectedLotIds.size === 0}
                    onClick={() => handleSendSelected('whatsapp')}
                  >
                    <FaWhatsapp size={18} />
                    WhatsApp
                  </button>

                  <button
                    className="btn btn-telegram"
                    disabled={selectedLotIds.size === 0}
                    onClick={() => handleSendSelected('telegram')}
                  >
                    <SiTelegram size={18} />
                    Telegram
                  </button>

                  <button
                    className="btn btn-all-chats"
                    disabled={selectedLotIds.size === 0}
                    onClick={() => handleSendSelected('all')}
                    title="Отправить выбранные лоты во все чаты"
                  >
                    <FaWhatsapp size={16} />
                    <span>/</span>
                    <SiTelegram size={16} />
                    Во все чаты
                  </button>
                </div>
              </div>

              <div className="lots-container">
                {filteredLots.length === 0 ? (
                  <div className="empty">Нет лотов со статусом parsed.</div>
                ) : (
                  filteredLots.map(lot => {
                    const isNewlyAppeared = newlyAppearedLotIds.has(lot.id)
                    return (
                      <LotCard
                        key={lot.id}
                        lot={lot}
                        selected={selectedLotIds.has(lot.id)}
                        onToggleSelect={handleToggleSelectLot}
                        shouldPulse={isNewlyAppeared}
                        onMarkAsViewed={handleMarkAsViewed}
                      />
                    )
                  })
                )}
              </div>
            </>
          )}

          {currentPage === 'warehouse' && <Warehouse />}
          {currentPage === 'products' && <Products />}
          {currentPage === 'clients' && <Clients />}
          {currentPage === 'deals' && <Deals />}
          {currentPage === 'suppliers' && <Suppliers />}
        </div>

        <div className="toast-container">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
