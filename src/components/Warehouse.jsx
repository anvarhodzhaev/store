import { useState, useMemo } from 'react'
import './Warehouse.css'

function Warehouse() {
  const [items, setItems] = useState([
    { id: 1, name: 'iPhone 15 Pro', model: '128GB', color: 'Титан', quantity: 45, price: 89900, category: 'Смартфоны', location: 'Секция A-1' },
    { id: 2, name: 'Samsung Galaxy S24', model: '256GB', color: 'Черный', quantity: 32, price: 79900, category: 'Смартфоны', location: 'Секция A-2' },
    { id: 3, name: 'MacBook Pro 14"', model: 'M3', color: 'Серебристый', quantity: 18, price: 199900, category: 'Ноутбуки', location: 'Секция B-1' },
    { id: 4, name: 'iPad Air', model: '256GB', color: 'Синий', quantity: 28, price: 69900, category: 'Планшеты', location: 'Секция B-2' },
    { id: 5, name: 'AirPods Pro', model: '2 поколение', color: 'Белый', quantity: 67, price: 24900, category: 'Аксессуары', location: 'Секция C-1' },
    { id: 6, name: 'Apple Watch Series 9', model: '45mm', color: 'Миднайт', quantity: 24, price: 44900, category: 'Часы', location: 'Секция C-2' },
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    model: '',
    color: '',
    quantity: '',
    price: '',
    category: 'Смартфоны',
    location: ''
  })

  const categories = useMemo(() => {
    return [...new Set(items.map(item => item.category))]
  }, [items])

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.color.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
      return matchesSearch && matchesCategory
    })

    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'quantity') return b.quantity - a.quantity
      if (sortBy === 'price') return b.price - a.price
      return 0
    })

    return filtered
  }, [items, searchQuery, categoryFilter, sortBy])

  const statistics = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const lowStock = items.filter(item => item.quantity < 10).length
    return { totalItems, totalValue, lowStock, totalProducts: items.length }
  }, [items])

  const handleAddItem = () => {
    if (!formData.name || !formData.quantity || !formData.price) return

    const newItem = {
      id: Date.now(),
      name: formData.name,
      model: formData.model || '-',
      color: formData.color || '-',
      quantity: parseInt(formData.quantity),
      price: parseInt(formData.price),
      category: formData.category,
      location: formData.location || '-'
    }

    setItems([...items, newItem])
    resetForm()
    setShowAddForm(false)
  }

  const handleEditItem = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      model: item.model,
      color: item.color,
      quantity: item.quantity.toString(),
      price: item.price.toString(),
      category: item.category,
      location: item.location
    })
    setShowAddForm(true)
  }

  const handleUpdateItem = () => {
    if (!formData.name || !formData.quantity || !formData.price) return

    setItems(items.map(item =>
      item.id === editingItem.id
        ? {
            ...item,
            name: formData.name,
            model: formData.model || '-',
            color: formData.color || '-',
            quantity: parseInt(formData.quantity),
            price: parseInt(formData.price),
            category: formData.category,
            location: formData.location || '-'
          }
        : item
    ))

    resetForm()
    setShowAddForm(false)
    setEditingItem(null)
  }

  const handleDeleteItem = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      model: '',
      color: '',
      quantity: '',
      price: '',
      category: 'Смартфоны',
      location: ''
    })
  }

  const handleCancel = () => {
    resetForm()
    setShowAddForm(false)
    setEditingItem(null)
  }

  return (
    <div className="warehouse-container">
      <div className="warehouse-header">
        <div>
          <h1>Склад</h1>
          <p className="warehouse-subtitle">Управление товарными запасами</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm()
            setEditingItem(null)
            setShowAddForm(!showAddForm)
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span className="material-icons" style={{ fontSize: '18px' }}>
            {showAddForm ? 'close' : 'add'}
          </span>
          {showAddForm ? 'Отмена' : 'Добавить товар'}
        </button>
      </div>

      {/* Статистика */}
      <div className="warehouse-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
            <span className="material-icons">inventory_2</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statistics.totalItems}</div>
            <div className="stat-label">Всего единиц</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
            <span className="material-icons">category</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statistics.totalProducts}</div>
            <div className="stat-label">Видов товаров</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
            <span className="material-icons">attach_money</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statistics.totalValue.toLocaleString('ru-RU')} ₽</div>
            <div className="stat-label">Общая стоимость</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
            <span className="material-icons">warning</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statistics.lowStock}</div>
            <div className="stat-label">Низкий остаток</div>
          </div>
        </div>
      </div>

      {/* Форма добавления/редактирования */}
      {showAddForm && (
        <div className="warehouse-form-card">
          <h3>{editingItem ? 'Редактировать товар' : 'Добавить новый товар'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Название товара *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="iPhone 15 Pro"
              />
            </div>
            <div className="form-group">
              <label>Модель</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="128GB"
              />
            </div>
            <div className="form-group">
              <label>Цвет</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Титан"
              />
            </div>
            <div className="form-group">
              <label>Количество *</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Цена (₽) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Категория</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Смартфоны">Смартфоны</option>
                <option value="Ноутбуки">Ноутбуки</option>
                <option value="Планшеты">Планшеты</option>
                <option value="Аксессуары">Аксессуары</option>
                <option value="Часы">Часы</option>
              </select>
            </div>
            <div className="form-group">
              <label>Местоположение</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Секция A-1"
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={editingItem ? handleUpdateItem : handleAddItem}>
              {editingItem ? 'Сохранить изменения' : 'Добавить товар'}
            </button>
            <button className="btn btn-secondary" onClick={handleCancel}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Фильтры и поиск */}
      <div className="warehouse-toolbar">
        <div className="warehouse-filters">
          <div className="filter-group">
            <span className="material-icons" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>search</span>
            <input
              type="text"
              className="filter-input"
              placeholder="Поиск по названию, модели, цвету..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Категория</label>
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Все категории</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Сортировка</label>
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">По названию</option>
              <option value="quantity">По количеству</option>
              <option value="price">По цене</option>
            </select>
          </div>
        </div>
      </div>

      {/* Таблица товаров */}
      <div className="warehouse-table-container">
        <table className="warehouse-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Модель</th>
              <th>Цвет</th>
              <th>Категория</th>
              <th>Количество</th>
              <th>Цена за единицу</th>
              <th>Общая стоимость</th>
              <th>Местоположение</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedItems.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-cell">
                  {searchQuery || categoryFilter !== 'all' ? 'Товары не найдены' : 'Нет товаров на складе'}
                </td>
              </tr>
            ) : (
              filteredAndSortedItems.map(item => (
                <tr key={item.id} className={item.quantity < 10 ? 'low-stock' : ''}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.model}</td>
                  <td>{item.color}</td>
                  <td>
                    <span className="category-badge">{item.category}</span>
                  </td>
                  <td>
                    <span className={`quantity-badge ${item.quantity < 10 ? 'low' : item.quantity < 20 ? 'medium' : 'high'}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td>{item.price.toLocaleString('ru-RU')} ₽</td>
                  <td><strong>{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</strong></td>
                  <td>{item.location}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => handleEditItem(item)}
                        title="Редактировать"
                      >
                        <span className="material-icons">edit</span>
                      </button>
                      <button
                        className="btn-icon btn-icon-danger"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Удалить"
                      >
                        <span className="material-icons">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Warehouse

