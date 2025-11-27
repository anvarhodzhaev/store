import { useEffect, useState } from 'react';
import './Clients.css';

const API_BASE = 'https://quageyamoulu.beget.app/webhook';

const LIST_URL = `${API_BASE}/clients`;

const SAVE_URL = `${API_BASE}/clients/save`;

const DELETE_URL = `${API_BASE}/clients/delete`;

function getStatusLabel(status) {
  if (!status) return 'Активен';

  const s = status.toLowerCase();

  if (s === 'blocked') return 'Заблокирован';

  if (s === 'inactive') return 'Неактивен';

  return 'Активен';
}

function getStatusClass(status) {
  const s = (status || 'active').toLowerCase();

  if (s === 'blocked') return 'client-status client-status--blocked';

  if (s === 'inactive') return 'client-status client-status--inactive';

  return 'client-status client-status--active';
}

const emptyClient = {
  id: null,
  name: '',
  phone: '',
  whatsapp_chat_id: '',
  region: '',
  company: '',
  status: 'active',
};

export default function ClientsPage() {
  const [clients, setClients] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState('');

  const [regionFilter, setRegionFilter] = useState('Все');

  const [statusFilter, setStatusFilter] = useState('Все');

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingClient, setEditingClient] = useState(emptyClient);

  const [isSaving, setIsSaving] = useState(false);

  const fetchClients = async () => {
    try {
      setIsLoading(true);

      const res = await fetch(LIST_URL);

      const data = await res.json();

      setClients(Array.isArray(data) ? data : []);

    } catch (e) {
      console.error('Ошибка загрузки клиентов', e);

    } finally {
      setIsLoading(false);

    }
  };

  useEffect(() => {
    fetchClients();

  }, []);

  const regions = ['Все', ...Array.from(new Set(clients.map(c => c.region).filter(Boolean)))];

  const statuses = ['Все', 'active', 'inactive', 'blocked'];

  const filtered = clients.filter(c => {
    const text = `${c.name || ''} ${c.phone || ''} ${c.company || ''}`.toLowerCase();

    const s = search.toLowerCase();

    if (s && !text.includes(s)) return false;

    if (regionFilter !== 'Все' && c.region !== regionFilter) return false;

    if (statusFilter !== 'Все') {
      if ((c.status || 'active') !== statusFilter) return false;
    }

    return true;

  });

  const handleOpenWhatsApp = (client) => {
    const phone = (client.phone || '').replace(/[^\d]/g, '');

    if (!phone) return;

    const url = `https://wa.me/${phone}`;

    window.open(url, '_blank');

  };

  const openAddModal = () => {
    setEditingClient({ ...emptyClient });

    setIsModalOpen(true);

  };

  const openEditModal = (client) => {
    setEditingClient({ ...emptyClient, ...client });

    setIsModalOpen(true);

  };

  const closeModal = () => {
    if (isSaving) return;

    setIsModalOpen(false);

  };

  const handleChangeField = (field, value) => {
    setEditingClient(prev => ({ ...prev, [field]: value }));

  };

  const autoFillWhatsapp = () => {
    // если whatsapp_chat_id пустой — подставляем phone@c.us
    setEditingClient(prev => {
      if (!prev.phone) return prev;

      if (prev.whatsapp_chat_id) return prev;

      const digits = prev.phone.replace(/[^\d]/g, '');

      return { ...prev, whatsapp_chat_id: `${digits}@c.us` };

    });

  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!editingClient.name || !editingClient.phone) {
      alert('Имя и телефон обязательны');

      return;

    }

    try {
      setIsSaving(true);

      const res = await fetch(SAVE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClient),
      });

      const data = await res.json();

      console.log('Saved client:', data);

      await fetchClients();

      setIsModalOpen(false);

    } catch (err) {
      console.error('Ошибка сохранения клиента', err);

      alert('Ошибка при сохранении клиента');

    } finally {
      setIsSaving(false);

    }
  };

  const handleDelete = async (client) => {
    if (!client.id) return;

    const ok = window.confirm(`Удалить клиента "${client.name}"?`);

    if (!ok) return;

    try {
      const res = await fetch(DELETE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: client.id }),
      });

      const data = await res.json();

      console.log('Deleted client:', data);

      // можно refetch, можно локально удалить

      setClients(prev => prev.filter(c => c.id !== client.id));

    } catch (err) {
      console.error('Ошибка удаления клиента', err);

      alert('Ошибка при удалении клиента');

    }

  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Клиенты</h1>
          <p className="page-subtitle">
            База покупателей и партнёров. Быстрый доступ к контактам.
          </p>
        </div>

        <button className="btn btn-primary" type="button" onClick={openAddModal}>
          + Добавить клиента
        </button>
      </div>

      <div className="clients-filters card">
        <div className="clients-filters-row">
          <div className="clients-filter">
            <label>Поиск</label>
            <input
              type="text"
              className="input"
              placeholder="Имя, телефон или компания…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="clients-filter">
            <label>Регион</label>
            <select
              className="select"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="clients-filter">
            <label>Статус</label>
            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statuses.map(s => (
                <option key={s} value={s}>
                  {s === 'Все' ? 'Все' : getStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card clients-card">
        {isLoading ? (
          <div className="clients-empty">Загрузка клиентов…</div>
        ) : filtered.length === 0 ? (
          <div className="clients-empty">Клиенты не найдены</div>
        ) : (
          <table className="clients-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Компания</th>
                <th>Телефон</th>
                <th>Регион</th>
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.company || '—'}</td>
                  <td>
                    <div className="clients-phone-cell">
                      <span>{c.phone}</span>
                      <button
                        type="button"
                        className="btn-icon btn-wa"
                        onClick={() => handleOpenWhatsApp(c)}
                        title="Написать в WhatsApp"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td>{c.region || '—'}</td>
                  <td>
                    <span className={getStatusClass(c.status)}>
                      {getStatusLabel(c.status)}
                    </span>
                  </td>
                  <td className="clients-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      onClick={() => openEditModal(c)}
                    >
                      Редактировать
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      type="button"
                      onClick={() => handleDelete(c)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingClient.id ? 'Редактировать клиента' : 'Новый клиент'}
            </h2>

            <form className="modal-body" onSubmit={handleSave}>
              <div className="modal-row">
                <label>Имя *</label>
                <input
                  type="text"
                  className="input"
                  value={editingClient.name}
                  onChange={(e) => handleChangeField('name', e.target.value)}
                  required
                />
              </div>

              <div className="modal-row">
                <label>Телефон *</label>
                <input
                  type="text"
                  className="input"
                  value={editingClient.phone}
                  onChange={(e) => handleChangeField('phone', e.target.value)}
                  onBlur={autoFillWhatsapp}
                  required
                />
              </div>

              <div className="modal-row">
                <label>WhatsApp chatId</label>
                <input
                  type="text"
                  className="input"
                  placeholder="79998887766@c.us"
                  value={editingClient.whatsapp_chat_id || ''}
                  onChange={(e) => handleChangeField('whatsapp_chat_id', e.target.value)}
                />
              </div>

              <div className="modal-row">
                <label>Регион</label>
                <input
                  type="text"
                  className="input"
                  value={editingClient.region || ''}
                  onChange={(e) => handleChangeField('region', e.target.value)}
                />
              </div>

              <div className="modal-row">
                <label>Компания</label>
                <input
                  type="text"
                  className="input"
                  value={editingClient.company || ''}
                  onChange={(e) => handleChangeField('company', e.target.value)}
                />
              </div>

              <div className="modal-row">
                <label>Статус</label>
                <select
                  className="select"
                  value={editingClient.status || 'active'}
                  onChange={(e) => handleChangeField('status', e.target.value)}
                >
                  <option value="active">Активен</option>
                  <option value="inactive">Неактивен</option>
                  <option value="blocked">Заблокирован</option>
                </select>
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
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
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
