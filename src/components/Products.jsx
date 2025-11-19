import { useState, useEffect, useMemo } from 'react'
import './Products.css'

const N8N_BASE = 'https://quageyamoulu.beget.app'
const ITEMS_URL = `${N8N_BASE}/webhook/items`
const ITEM_CREATE_URL = `${N8N_BASE}/webhook/item-create`
const ITEM_UPDATE_URL = `${N8N_BASE}/webhook/item-update`

async function reloadProducts(setProducts, setLoading, setError) {
  try {
    setLoading(true)
    const res = await fetch(ITEMS_URL)
    const text = await res.text()
    let data

    try {
      data = JSON.parse(text)
    } catch (e) {
      console.error('Ошибка парсинга JSON от /items:', text)
      throw new Error('Неверный формат ответа от сервера')
    }

    const normalized = Array.isArray(data) ? data.map(i => i.json || i) : []
    setProducts(normalized)
  } catch (e) {
    console.error(e)
    setError(e.message || 'Ошибка загрузки товаров')
  } finally {
    setLoading(false)
  }
}

async function createItem(payload) {
  const { id, ...body } = payload

  const res = await fetch(ITEM_CREATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  console.log('Создание товара: запрос', body)
  console.log('Создание товара: ответ сервера', text)

  if (!res.ok) {
    throw new Error(`Ошибка создания товара: ${text || res.status}`)
  }
}

async function updateItem(payload) {
  const res = await fetch(ITEM_UPDATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const text = await res.text()
  console.log('Обновление товара: запрос', payload)
  console.log('Обновление товара: ответ сервера', text)

  if (!res.ok) {
    throw new Error(`Ошибка обновления товара: ${text || res.status}`)
  }
}

function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState('grid')

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const [formData, setFormData] = useState({
    id: null,
    sku: '',
    name: '',
    brand: '',
    model_name: '',
    category: '',
    capacity_gb: '',
    color: '',
    region: 'UNKNOWN',
    activation: 'unknown',
    is_active: true,
    description: '',
  })

  useEffect(() => {
    reloadProducts(setProducts, setLoading, setError)
  }, [])

  const categories = useMemo(
    () => [...new Set(products.map(p => p.category).filter(Boolean))],
    [products]
  )

  const brands = useMemo(
    () => [...new Set(products.map(p => p.brand).filter(Boolean))],
    [products]
  )

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        (product.name || '').toLowerCase().includes(q) ||
        (product.brand || '').toLowerCase().includes(q) ||
        (product.model_name || '').toLowerCase().includes(q)

      const matchesCategory =
        categoryFilter === 'all' || product.category === categoryFilter

      const matchesBrand =
        brandFilter === 'all' || product.brand === brandFilter

      const status = product.is_active ? 'active' : 'inactive'
      const matchesStatus =
        statusFilter === 'all' || statusFilter === status

      return matchesSearch && matchesCategory && matchesBrand && matchesStatus
    })

    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '')
      }
      if (sortBy === 'brand') {
        return (a.brand || '').localeCompare(b.brand || '')
      }
      return 0
    })

    return filtered
  }, [products, searchQuery, categoryFilter, brandFilter, statusFilter, sortBy])

  const statistics = useMemo(() => {
    const totalProducts = products.length
    const activeProducts = products.filter(p => p.is_active).length
    const categoriesCount = categories.length
    return { totalProducts, activeProducts, categoriesCount }
  }, [products, categories])

  const resetForm = () => {
    setFormData({
      id: null,
      sku: '',
      name: '',
      brand: '',
      model_name: '',
      category: '',
      capacity_gb: '',
      color: '',
      region: 'UNKNOWN',
      activation: 'unknown',
      is_active: true,
      description: '',
    })
    setEditingProduct(null)
  }

  const handleCardClick = product => {
    setSelectedProduct(product)
  }

  const handleEditProduct = product => {
    setEditingProduct(product)
    setFormData({
      id: product.id,
      sku: product.sku || '',
      name: product.name || '',
      brand: product.brand || '',
      model_name: product.model_name || '',
      category: product.category || '',
      capacity_gb: product.capacity_gb || '',
      color: product.color || '',
      region: product.region || 'UNKNOWN',
      activation: product.activation || 'unknown',
      is_active: !!product.is_active,
      description: product.description || '',
    })
    setShowAddForm(true)
  }

  const handleAddButtonClick = () => {
    resetForm()
    setShowAddForm(prev => !prev)
  }

  const handleCancel = () => {
    resetForm()
    setShowAddForm(false)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.brand) {
      alert('Название и бренд обязательны')
      return
    }

    const payload = {
      ...formData,
      capacity_gb: formData.capacity_gb
        ? Number(formData.capacity_gb)
        : null,
    }

    try {
      if (editingProduct) {
        await updateItem(payload)
      } else {
        await createItem(payload)
      }

      setShowAddForm(false)
      setEditingProduct(null)
      await reloadProducts(setProducts, setLoading, setError)
    } catch (e) {
      console.error(e)
      alert(e.message || 'Ошибка сохранения товара')
    }
  }

  if (loading) {
    return (
      <div className="products-container">
        <h2>Загрузка товаров…</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div className="products-container">
        <h2 style={{ color: 'red' }}>{error}</h2>
      </div>
    )
  }

  return (
    <div className="products-container">
      <div className="products-header">
        <div>
          <h1>Товары</h1>
          <p className="products-subtitle">
            Каталог товаров из базы данных
          </p>
        </div>
        <div className="products-header-actions">
          <button
            className="icon-button"
            onClick={() =>
              setViewMode(prev => (prev === 'grid' ? 'list' : 'grid'))
            }
          >
            <span className="material-icons">
              {viewMode === 'grid' ? 'view_list' : 'grid_view'}
            </span>
          </button>
        </div>
      </div>

      <div className="products-stats">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">
            <span className="material-icons">inventory_2</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statistics.totalProducts}</div>
            <div className="stat-label">Всего товаров</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green">
            <span className="material-icons">check_circle</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statistics.activeProducts}</div>
            <div className="stat-label">Активных</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-amber">
            <span className="material-icons">category</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statistics.categoriesCount}</div>
            <div className="stat-label">Категорий</div>
          </div>
        </div>
      </div>

      <div className="products-toolbar">
        <div className="products-filters">
          <div className="filter-group">
            <input
              type="text"
              className="filter-input"
              placeholder="Поиск по названию, бренду, модели..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Категория</label>
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="all">Все</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Бренд</label>
            <select
              className="filter-select"
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
            >
              <option value="all">Все</option>
              {brands.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Статус</label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Сортировка</label>
            <select
              className="filter-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="name">По названию</option>
              <option value="brand">По бренду</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          className="btn btn-primary"
          onClick={handleAddButtonClick}
        >
          <span className="material-icons" style={{ marginRight: 6 }}>
            {showAddForm ? 'close' : 'add'}
          </span>
          {showAddForm ? 'Отмена' : 'Добавить товар'}
        </button>
      </div>

      {(showAddForm || editingProduct) && (
        <div className="product-modal-backdrop" onClick={handleCancel}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <div className="product-modal-header">
              <h3>{editingProduct ? 'Редактировать товар' : 'Добавить новый товар'}</h3>
              <button
                className="icon-button"
                onClick={handleCancel}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="product-modal-body">

          <div className="form-grid">
            <div className="form-group">
              <label>SKU</label>
              <input
                value={formData.sku}
                onChange={e =>
                  setFormData({ ...formData, sku: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Название *</label>
              <input
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Бренд *</label>
              <input
                value={formData.brand}
                onChange={e =>
                  setFormData({ ...formData, brand: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Категория</label>
              <input
                value={formData.category}
                onChange={e =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Модель</label>
              <input
                value={formData.model_name}
                onChange={e =>
                  setFormData({
                    ...formData,
                    model_name: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>Память (GB)</label>
              <input
                type="number"
                value={formData.capacity_gb}
                onChange={e =>
                  setFormData({
                    ...formData,
                    capacity_gb: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>Цвет</label>
              <input
                value={formData.color}
                onChange={e =>
                  setFormData({ ...formData, color: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Регион</label>
              <input
                value={formData.region}
                onChange={e =>
                  setFormData({ ...formData, region: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Активен</label>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={e =>
                  setFormData({
                    ...formData,
                    is_active: e.target.checked,
                  })
                }
              />
            </div>
          </div>

          <div className="form-group form-fullwidth">
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleSave}>
                {editingProduct ? 'Сохранить изменения' : 'Добавить товар'}
              </button>
              <button className="btn btn-secondary" onClick={handleCancel}>
                Отмена
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={
          viewMode === 'grid' ? 'products-grid' : 'products-list'
        }
      >
        {filteredAndSortedProducts.map(product => (
          <div
            key={product.id}
            className="product-card"
            onClick={() => handleCardClick(product)}
          >
            <div className="product-card-header">
              <div className="product-brand">{product.brand}</div>
              <span
                className={
                  'status-badge ' +
                  (product.is_active ? 'active' : 'inactive')
                }
              >
                {product.is_active ? 'АКТИВЕН' : 'НЕАКТИВЕН'}
              </span>
            </div>

            <div className="product-card-body">
              <h3 className="product-name">{product.name}</h3>
              <p className="product-model">{product.model_name}</p>

              {product.capacity_gb && (
                <p className="product-description">
                  Память: {product.capacity_gb} GB
                </p>
              )}
              {product.color && (
                <p className="product-description">Цвет: {product.color}</p>
              )}
            </div>

            <div className="product-card-footer">
              <div className="product-category">
                {product.category}
              </div>
              <button
                className="btn btn-link"
                onClick={e => {
                  e.stopPropagation()
                  handleEditProduct(product)
                }}
              >
                Редактировать
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <div className="product-modal-backdrop">
          <div className="product-modal">
            <div className="product-modal-header">
              <div>
                <div className="product-brand">
                  {selectedProduct.brand}
                </div>
                <h2 className="product-name">
                  {selectedProduct.name}
                </h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedProduct(null)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="product-modal-body">
              <p className="product-model">
                {selectedProduct.model_name}
              </p>
              {selectedProduct.capacity_gb && (
                <p className="product-description">
                  Память: {selectedProduct.capacity_gb} GB
                </p>
              )}
              {selectedProduct.color && (
                <p className="product-description">
                  Цвет: {selectedProduct.color}
                </p>
              )}
              {selectedProduct.description && (
                <p className="product-description">
                  {selectedProduct.description}
                </p>
              )}
            </div>

            <div className="product-modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleEditProduct(selectedProduct)
                  setSelectedProduct(null)
                }}
              >
                Редактировать
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedProduct(null)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
