import './Sidebar.css'

function Sidebar({ currentPage, onPageChange, currentUser, onLogout }) {
  const menuItems = [
    { id: 'offers', label: 'Предложения', icon: '📋' },
    { id: 'suppliers', label: 'Поставщики', icon: '🏢' },
    { id: 'clients', label: 'Клиенты', icon: '👥' },
    { id: 'products', label: 'Товары', icon: '📦' },
    { id: 'deals', label: 'Сделки', icon: '🤝' },
    { id: 'warehouse', label: 'Склад', icon: '🏭' },
    { id: 'documents', label: 'Документы', icon: '📄' },
    { id: 'finance', label: 'Финансы', icon: '💰' },
    { id: 'reports', label: 'Отчеты', icon: '📊' },
  ]

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img 
          src="/logo.png" 
          alt="art crm" 
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
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">{item.label}</span>
            {currentPage === item.id && (
              <span className="sidebar-item-indicator">●</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button
          onClick={onLogout}
          className="sidebar-logout-btn"
          title="Выйти из системы"
        >
          <span className="sidebar-item-icon">👤</span>
          <span className="sidebar-item-label">{currentUser}</span>
          <span className="sidebar-logout-text">(Выход)</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar

