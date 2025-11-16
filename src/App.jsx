import { useState, useEffect, useCallback, useMemo } from 'react'
import LotCard from './components/LotCard'
import Toast from './components/Toast'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import './index.css'

const N8N_BASE = 'https://quageyamoulu.beget.app'
const LOTS_URL = `${N8N_BASE}/webhook/lots`
const ACCEPT_URL = `${N8N_BASE}/webhook/lots/accept`
const REJECT_URL = `${N8N_BASE}/webhook/lots/reject`
const SUPPLIERS_NOTIFY_URL = `${N8N_BASE}/webhook/send-to-suppliers`

function App() {
  // Авторизация
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const auth = localStorage.getItem('isAuthenticated')
    const user = localStorage.getItem('currentUser')
    return auth === 'true' && user ? true : false
  })
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('currentUser') || ''
  })

  const [currentPage, setCurrentPage] = useState('offers')

  const [allLots, setAllLots] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [refreshInterval, setRefreshInterval] = useState(5)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ui_theme')
    return saved === 'dark' || saved === 'light' ? saved : 'light'
  })
  const [statusMessage, setStatusMessage] = useState('')
  const [statusError, setStatusError] = useState(false)
  const [toasts, setToasts] = useState([])
  const [notifyLoading, setNotifyLoading] = useState(false)

  // Применение темы
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ui_theme', theme)
  }, [theme])

  // Функция для показа toast
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2800)
  }, [])

  // Нормализация данных лотов
  const normalizeLots = useCallback((data) => {
    if (!data) return []

    if (Array.isArray(data)) {
      if (data.length && data[0] && data[0].json) {
        return data.map(i => i.json)
      }
      return data
    }

    if (Array.isArray(data.data)) {
      return data.data[0] && data.data[0].json
        ? data.data.map(i => i.json)
        : data.data
    }
    if (Array.isArray(data.items)) {
      return data.items[0] && data.items[0].json
        ? data.items.map(i => i.json)
        : data.items
    }
    if (Array.isArray(data.lots)) {
      return data.lots[0] && data.lots[0].json
        ? data.lots.map(i => i.json)
        : data.lots
    }

    if (data.id) return [data]

    return []
  }, [])

  // Загрузка лотов
  const fetchLots = useCallback(async () => {
    try {
      const res = await fetch(LOTS_URL, { cache: 'no-store' })
      if (!res.ok) throw new Error('HTTP ' + res.status)

      const text = await res.text()
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
      setAllLots(normalized)
      setStatusError(false)
    } catch (e) {
      console.error(e)
      setStatusMessage('Ошибка загрузки лотов: ' + e.message)
      setStatusError(true)
      showToast('Ошибка загрузки лотов: ' + e.message, 'error')
    }
  }, [normalizeLots, showToast])

  // Автообновление (только если авторизован)
  useEffect(() => {
    if (!isAuthenticated) return

    fetchLots()
    const interval = setInterval(fetchLots, refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [fetchLots, refreshInterval, isAuthenticated])

  // Фильтрация лотов
  const filteredLots = useMemo(() => {
    let filtered = allLots.slice()

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lot => 
        ((lot.status || 'parsed').toLowerCase() === statusFilter)
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

  // Обновление статуса при изменении фильтров
  useEffect(() => {
    if (filteredLots.length) {
      setStatusMessage(`Показано ${filteredLots.length} из ${allLots.length} лотов`)
    } else {
      setStatusMessage('По выбранным фильтрам лоты не найдены')
    }
  }, [filteredLots.length, allLots.length])

  // Обработка принятия лота
  const handleAccept = useCallback(async (lotId, margin) => {
    setStatusMessage(`Отправляю лот #${lotId} с маржой ${margin}%…`)
    try {
      const res = await fetch(ACCEPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lot_id: lotId, margin_percent: margin })
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)

      setAllLots(prev => prev.filter(item => item.id !== lotId))
      setStatusMessage(`Лот #${lotId} отправлен.`)
      showToast(`Лот #${lotId} отправлен`, 'success')
    } catch (e) {
      console.error(e)
      setStatusMessage('Ошибка отправки: ' + e.message)
      setStatusError(true)
      showToast('Ошибка отправки: ' + e.message, 'error')
    }
  }, [showToast])

  // Обработка отклонения лота
  const handleReject = useCallback(async (lotId) => {
    setStatusMessage(`Отклоняю лот #${lotId}…`)
    try {
      const res = await fetch(REJECT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lot_id: lotId })
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)

      setAllLots(prev => prev.filter(item => item.id !== lotId))
      setStatusMessage(`Лот #${lotId} отклонён.`)
      showToast(`Лот #${lotId} отклонён`, 'success')
    } catch (e) {
      console.error(e)
      setStatusMessage('Ошибка отклонения: ' + e.message)
      setStatusError(true)
      showToast('Ошибка отклонения: ' + e.message, 'error')
    }
  }, [showToast])

  // Уведомление поставщиков
  const handleNotifySuppliers = useCallback(async () => {
    setNotifyLoading(true)
    setStatusMessage('Отправляю сообщение поставщикам...')
    showToast('Отправка уведомления поставщикам…', 'info')

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

  // Сброс фильтров
  const handleResetFilters = useCallback(() => {
    setStatusFilter('all')
    setSupplierFilter('')
  }, [])

  // Переключение темы
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

  // Обработка входа
  const handleLogin = useCallback((username) => {
    setIsAuthenticated(true)
    setCurrentUser(username)
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('currentUser', username)
    showToast(`Добро пожаловать, ${username}!`, 'success')
  }, [showToast])

  // Выход
  const handleLogout = useCallback(() => {
    setIsAuthenticated(false)
    setCurrentUser('')
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('currentUser')
    setAllLots([])
    setStatusMessage('')
    showToast('Вы вышли из системы', 'info')
  }, [showToast])

  // Если не авторизован, показываем форму входа
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
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
                  <div className="app-subtitle">Оценка прайсов и отправка в WhatsApp-группы</div>
                  <div style={{ marginTop: '8px' }}>
                    <button
                      onClick={handleNotifySuppliers}
                      disabled={notifyLoading}
                      className="btn btn-primary"
                      style={{ padding: '10px 16px', fontSize: '13px' }}
                    >
                      📢 Уведомить поставщиков
                    </button>
                  </div>
                </div>
                <div className="pill">
                  <span className="pill-dot"></span>
                  Live-обновление каждые
                  <strong>{refreshInterval} секунд</strong>
                </div>
              </div>

              <div className="toolbar">
                <div className="filters">
                  <div className="filter-group">
                    <label htmlFor="statusFilter">Статус</label>
                    <select
                      id="statusFilter"
                      className="filter-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">Все</option>
                      <option value="parsed">Только parsed</option>
                      <option value="sent">Только sent</option>
                      <option value="error">Только error</option>
                      <option value="new">Только new</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label htmlFor="supplierFilter">Поставщик</label>
                    <input
                      id="supplierFilter"
                      className="filter-input"
                      type="text"
                      placeholder="AnvarStore …"
                      value={supplierFilter}
                      onChange={(e) => setSupplierFilter(e.target.value)}
                    />
                  </div>
                </div>

                <div className="toolbar-right">
                  <div className="interval-control">
                    <label htmlFor="intervalSelect">Интервал обновления</label>
                    <select
                      id="intervalSelect"
                      className="filter-select"
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    >
                      <option value="5">5 секунд</option>
                      <option value="15">15 секунд</option>
                      <option value="30">30 секунд</option>
                      <option value="60">60 секунд</option>
                    </select>
                  </div>
                  <button onClick={toggleTheme} className="btn-theme">
                    <span>{theme === 'dark' ? '🌙' : '🌞'}</span>
                    <span>{theme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}</span>
                  </button>
                  <button onClick={handleResetFilters} className="btn-reset">
                    Сбросить фильтры
                  </button>
                </div>
              </div>

              {statusMessage && (
                <div className="status-message" style={{ color: statusError ? '#fecaca' : undefined }}>
                  {statusMessage}
                </div>
              )}

              <div className="lots-container">
                {filteredLots.length === 0 ? (
                  <div className="empty">Нет лотов со статусом parsed.</div>
                ) : (
                  filteredLots.map(lot => (
                    <LotCard
                      key={lot.id}
                      lot={lot}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))
                )}
              </div>
            </>
          )}
          {currentPage !== 'offers' && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <h2 style={{ color: 'var(--text-main)', marginBottom: '12px' }}>
                {currentPage === 'suppliers' && 'Поставщики'}
                {currentPage === 'clients' && 'Клиенты'}
                {currentPage === 'products' && 'Товары'}
                {currentPage === 'deals' && 'Сделки'}
                {currentPage === 'warehouse' && 'Склад'}
                {currentPage === 'documents' && 'Документы'}
                {currentPage === 'finance' && 'Финансы'}
                {currentPage === 'reports' && 'Отчеты'}
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>
                Раздел в разработке
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </div>
  )
}

export default App

