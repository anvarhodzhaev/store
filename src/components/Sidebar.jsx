import './Sidebar.css'

function Sidebar({ currentPage, onPageChange, currentUser, onLogout }) {
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
  )
}

export default Sidebar

