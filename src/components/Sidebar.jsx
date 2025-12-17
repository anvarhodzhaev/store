import { useState } from 'react'
import './Sidebar.css'

function Sidebar({ currentPage, onPageChange, currentUser, onLogout, theme, setTheme }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const menuItems = [
    { id: 'offers', label: 'Предложения', icon: 'description' },
    { id: 'suppliers', label: 'Поставщики', icon: 'business' },
    { id: 'clients', label: 'Клиенты', icon: 'people' },
    { id: 'products', label: 'Товары', icon: 'inventory_2' },
    { id: 'deals', label: 'Сделки', icon: 'handshake' },
    { id: 'warehouse', label: 'Склад', icon: 'warehouse' },
    { id: 'documents', label: 'Документы', icon: 'article' },
    { id: 'finance', label: 'Финансы', icon: 'payments' },
    { id: 'reports', label: 'Отчеты', icon: 'assessment' },
  ]

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img 
          src="/logo.png" 
          alt="CRM317" 
          className="sidebar-logo"
        />
      </div>
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onPageChange(item.id)}
          >
            <span className="material-icons sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user-section">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="sidebar-settings-btn"
            title="Настройки"
          >
            <span className="material-icons sidebar-item-icon">settings</span>
          </button>
          <button
            onClick={onLogout}
            className="sidebar-logout-btn"
            title="Выйти из системы"
          >
            <span className="material-icons sidebar-item-icon">person</span>
            <span className="sidebar-item-label">{currentUser}</span>
            <span className="sidebar-logout-text">(Выход)</span>
          </button>
        </div>
      </div>

      {/* Модальное окно настроек */}
      {isSettingsOpen && (
        <div className="settings-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h2 className="settings-title">Настройки</h2>
              <button
                className="settings-close"
                onClick={() => setIsSettingsOpen(false)}
                title="Закрыть"
              >
                ✕
              </button>
            </div>
            <div className="settings-body">
              <div className="settings-group">
                <label className="settings-label">Тема оформления</label>
                <button
                  className="btn btn-outline settings-theme-btn"
                  onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
                  title="Переключить тему"
                >
                  {theme === 'dark' ? '🌙 Тёмная тема' : '☀️ Светлая тема'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar

