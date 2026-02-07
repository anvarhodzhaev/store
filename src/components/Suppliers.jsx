import { useEffect, useMemo, useState } from 'react';
import './Suppliers.css';

const API_BASE = 'https://quageyamoulu.beget.app/webhook';

const LIST_URL = `${API_BASE}/suppliers`;
const SAVE_URL = `${API_BASE}/suppliers/save`;
const DELETE_URL = `${API_BASE}/suppliers/delete`;

// Оставляем те же функции статуса, но статус будем выводить из is_active
function getStatusLabel(status) {
  if (!status) return 'Активен';
  const s = String(status).toLowerCase();
  if (s === 'inactive') return 'Неактивен';
  if (s === 'blocked') return 'Заблокирован';
  return 'Активен';
}

function getStatusClass(status) {
  const s = String(status || 'active').toLowerCase();
  if (s === 'inactive') return 'supplier-status supplier-status--inactive';
  if (s === 'blocked') return 'supplier-status supplier-status--blocked';
  return 'supplier-status supplier-status--active';
}

const emptySupplier = {
  id: null,
  name: '',
  whatsapp_id: '',
  whatsapp_type: 'user',   // user/group (как у тебя в БД)
  is_active: true,
  reminder_min: 0,
  notes: '',
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Все'); // Все | active | inactive

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState({ ...emptySupplier });
  const [isSaving, setIsSaving] = useState(false);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(LIST_URL);
      const data = await res.json();

      // Ожидаем массив
      const rows = Array.isArray(data) ? data : (data?.data || []);
      setSuppliers(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error('Ошибка загрузки suppliers:', err);
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return suppliers.filter((s) => {
      const text = `${s.name ?? ''} ${s.whatsapp_id ?? ''} ${s.whatsapp_type ?? ''}`.toLowerCase();

      if (term && !text.includes(term)) return false;

      // фильтр активных
      const isActive = s.is_active === false ? false : true; // по умолчанию true
      const status = isActive ? 'active' : 'inactive';

      if (activeFilter !== 'Все' && status !== activeFilter) return false;

      return true;
    });
  }, [suppliers, search, activeFilter]);

  const openCreateModal = () => {
    setEditingSupplier({ ...emptySupplier });
    setIsModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier({
      id: supplier.id ?? null,
      name: supplier.name ?? '',
      whatsapp_id: supplier.whatsapp_id ?? '',
      whatsapp_type: supplier.whatsapp_type ?? 'user',
      is_active: supplier.is_active === false ? false : true,
      reminder_min: supplier.reminder_min ?? 0,
      notes: supplier.notes ?? '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingSupplier({ ...emptySupplier });
  };

  const handleChangeField = (field, value) => {
    setEditingSupplier((prev) => ({ ...prev, [field]: value }));
  };

  const normalizePayload = (s) => {
    // reminder_min: число или null
    let reminder = s.reminder_min;

    if (reminder === '' || reminder === null || reminder === undefined) {
      reminder = null;
    } else {
      const n = Number(reminder);
      reminder = Number.isFinite(n) ? n : null;
    }

    return {
      id: s.id ?? null,
      name: (s.name ?? '').trim(),
      whatsapp_id: (s.whatsapp_id ?? '').trim(),
      whatsapp_type: (s.whatsapp_type ?? 'user').trim(),
      is_active: !!s.is_active,
      reminder_min: reminder,
      notes: s.notes ?? '',
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const payload = normalizePayload(editingSupplier);

    if (!payload.name) {
      alert('Имя обязательно');
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(SAVE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log('Saved supplier:', data);

      await fetchSuppliers();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      alert('Ошибка сохранения. Проверь консоль.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (supplier) => {
    const ok = window.confirm(`Удалить поставщика "${supplier.name}"?`);
    if (!ok) return;

    try {
      const res = await fetch(DELETE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: supplier.id }),
      });

      const data = await res.json();
      console.log('Deleted supplier:', data);

      await fetchSuppliers();
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Ошибка удаления. Проверь консоль.');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Поставщики</h1>
          <p className="page-subtitle">
            База поставщиков. Управление контактами и напоминаниями.
          </p>
        </div>

        <button className="btn btn-primary" type="button" onClick={openCreateModal}>
          + Добавить поставщика
        </button>
      </div>

      <div className="suppliers-filters card">
        <div className="suppliers-filters-row">
          <div className="suppliers-filter">
            <label>Поиск</label>
            <input
              type="text"
              className="input"
              placeholder="Имя или WhatsApp ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="suppliers-filter">
            <label>Статус</label>
            <select
              className="select"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="Все">Все</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card suppliers-card">
        {isLoading ? (
          <div className="suppliers-empty">Загрузка поставщиков…</div>
        ) : filtered.length === 0 ? (
          <div className="suppliers-empty">Поставщики не найдены</div>
        ) : (
          <table className="suppliers-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>ID</th>
                <th>Имя</th>
                <th>WhatsApp ID</th>
                <th style={{ width: 120 }}>Тип</th>
                <th style={{ width: 130 }}>Статус</th>
                <th style={{ width: 140 }}>Reminder (мин)</th>
                <th style={{ width: 150 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                  const isActive = s.is_active === false ? false : true;
                  const status = isActive ? 'active' : 'inactive';

                  return (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.name || '—'}</td>
                      <td style={{ fontFamily: 'monospace' }}>{s.whatsapp_id || '—'}</td>
                      <td>{s.whatsapp_type || '—'}</td>
                      <td>
                        <span className={getStatusClass(status)}>
                          {getStatusLabel(status)}
                        </span>
                      </td>
                      <td>{s.reminder_min ?? '—'}</td>
                      <td className="suppliers-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          type="button"
                          onClick={() => openEditModal(s)}
                        >
                          Редактировать
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          type="button"
                          onClick={() => handleDelete(s)}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingSupplier.id ? 'Редактировать поставщика' : 'Новый поставщик'}
            </h2>

            <form className="modal-body" onSubmit={handleSave}>
              <div className="modal-row">
                <label>Имя *</label>
                <input
                  type="text"
                  className="input"
                  value={editingSupplier.name}
                  onChange={(e) => handleChangeField('name', e.target.value)}
                  required
                />
              </div>

              <div className="modal-row">
                <label>WhatsApp ID</label>
                <input
                  type="text"
                  className="input"
                  placeholder="например: 79858594292@c.us"
                  value={editingSupplier.whatsapp_id}
                  onChange={(e) => handleChangeField('whatsapp_id', e.target.value)}
                />
              </div>

              <div className="modal-row">
                <label>WhatsApp тип</label>
                <select
                  className="select"
                  value={editingSupplier.whatsapp_type || 'user'}
                  onChange={(e) => handleChangeField('whatsapp_type', e.target.value)}
                >
                  <option value="user">user</option>
                  <option value="group">group</option>
                </select>
              </div>

              <div className="modal-row" style={{ alignItems: 'center', gap: 12 }}>
                <label style={{ margin: 0 }}>Активен</label>
                <input
                  type="checkbox"
                  checked={!!editingSupplier.is_active}
                  onChange={(e) => handleChangeField('is_active', e.target.checked)}
                />
              </div>

              <div className="modal-row">
                <label>Reminder (мин)</label>
                <input
                  type="number"
                  className="input"
                  min={0}
                  step={1}
                  value={editingSupplier.reminder_min ?? 0}
                  onChange={(e) => handleChangeField('reminder_min', e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
