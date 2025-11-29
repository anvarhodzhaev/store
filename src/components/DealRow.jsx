import React, { useState } from 'react';
import DealRowExpanded from './DealRowExpanded';

function pluralizeClients(count) {
  if (count === 1) return '1 клиент';

  if (count >= 2 && count <= 4) return `${count} клиента`;

  return `${count} клиентов`;
}

function getStatusLabel(status) {
  const s = (status || '').toLowerCase();

  if (s === 'open') return 'Открыта';

  if (s === 'confirmation') return 'Ожидание подтверждения';

  if (s === 'invoice') return 'Инвойс';

  if (s === 'closed') return 'Закрыта';

  return status || 'Неизвестно';
}

function getStatusClass(status) {
  const s = (status || '').toLowerCase();

  if (s === 'open') return 'deal-status-badge deal-status-badge--open';

  if (s === 'confirmation') return 'deal-status-badge deal-status-badge--confirm';

  if (s === 'invoice') return 'deal-status-badge deal-status-badge--invoice';

  if (s === 'closed') return 'deal-status-badge deal-status-badge--closed';

  return 'deal-status-badge';
}

export default function DealRow({ deal, onAction }) {
  const [open, setOpen] = useState(false);

  const dealId = deal.deal_id ?? deal.id;

  const supplier = deal.supplier_name || 'Без названия';

  const createdAt = deal.created_at
    ? new Date(deal.created_at).toLocaleString()
    : '';

  const clients = Array.isArray(deal.clients) ? deal.clients : [];

  const clientsCount = clients.length;

  const confirmedPercent = Math.round((deal.sold_percent ?? 0) * 100);

  const thresholdPercent = Math.round(
    (deal.threshold ?? deal.buyout_threshold ?? 0) * 100
  );

  const progressWidth = Math.max(
    6,
    Math.min(100, confirmedPercent || 0)
  );

  const positions = Array.isArray(deal.positions) ? deal.positions : [];

  const paymentCustomers = deal.payment_status_customers === 'paid';

  const paymentSupplier = deal.payment_status_supplier === 'paid';

  const handleToggle = () => setOpen((prev) => !prev);

  const handleActionClick = (type, e) => {
    e.stopPropagation();

    if (onAction) {
      onAction(type, deal);

      return;
    }

    alert(`Действие "${type}" для сделки #${dealId}`);
  };

  return (
    <div className="deal-row">
      {/* Верхняя часть строки */}
      <div className="deal-row-main">
        {/* Левая часть (кликабельная) */}
        <div className="deal-row-main-left" onClick={handleToggle}>
          <div className="deal-row-toggle">
            {open ? '▾' : '▸'}
          </div>
          <div className="deal-row-main-content">
            <div className="deal-row-header">
              <div className="deal-row-title">
                <span className="deal-row-supplier">{supplier}</span>
                <span className="deal-row-deal-id">#{dealId}</span>
              </div>
              <div className={getStatusClass(deal.status)}>
                {getStatusLabel(deal.status)}
              </div>
            </div>
            <div className="deal-row-meta">
              <span className="deal-row-meta-item">
                {pluralizeClients(clientsCount)}
              </span>
              {createdAt && (
                <span className="deal-row-meta-divider">•</span>
              )}
              {createdAt && (
                <span className="deal-row-meta-item">
                  {createdAt}
                </span>
              )}
            </div>
            <div className="deal-row-progress-block">
              <div className="deal-row-progress-top">
                <span>
                  Подтверждено клиентом:{' '}
                  <strong>{confirmedPercent}%</strong>
                </span>
                <span className="deal-row-progress-threshold">
                  Порог выкупа:{' '}
                  <strong>
                    {thresholdPercent ? `${thresholdPercent}%` : 'не задан'}
                  </strong>
                </span>
              </div>
              <div className="deal-row-progress-line">
                <div
                  className="deal-row-progress-fill"
                  style={{ width: `${progressWidth}%` }}
                />
                {thresholdPercent > 0 && (
                  <div
                    className="deal-row-progress-marker"
                    style={{ left: `${thresholdPercent}%` }}
                  />
                )}
              </div>
            </div>
            {positions.length > 0 && (
              <div className="deal-row-positions">
                {positions.map((p) => {
                  const total = Number(p.total ?? 0);
                  const sold = Number(p.sold ?? 0);
                  const rest = total - sold;

                  return (
                    <div
                      key={p.item_id ?? p.name}
                      className="deal-row-pos-item"
                    >
                      {p.name || p.item_name || 'Позиция'} — осталось{' '}
                      {rest}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="deal-row-payment">
              <span>
                Оплата клиентов:{' '}
                <span className={paymentCustomers ? 'paid' : 'not-paid'}>
                  {paymentCustomers ? 'оплачено' : 'не оплачено'}
                </span>
              </span>
            </div>
            <div className="deal-row-payment">
              <span>
                Поставщику:{' '}
                <span className={paymentSupplier ? 'paid' : 'not-paid'}>
                  {paymentSupplier ? 'оплачено' : 'требуется'}
                </span>
              </span>
            </div>
          </div>
        </div>
        {/* Правая часть — кнопки действий */}
        <div className="deal-row-actions">
          {deal.status === 'open' && (
            <>
              <button
                className="btn deal-row-btn"
                onClick={(e) => handleActionClick('confirm', e)}
              >
                Подтверждение
              </button>
              <button
                className="btn deal-row-btn"
                onClick={(e) => handleActionClick('invoice', e)}
              >
                Отправить инвойс
              </button>
              <button
                className="btn btn-danger deal-row-btn"
                onClick={(e) => handleActionClick('close', e)}
              >
                Закрыть
              </button>
            </>
          )}
          {deal.status === 'confirmation' && (
            <>
              <button
                className="btn deal-row-btn"
                onClick={(e) => handleActionClick('confirm', e)}
              >
                Переотправить подтверждение
              </button>
              <button
                className="btn deal-row-btn"
                onClick={(e) => handleActionClick('invoice', e)}
              >
                Отправить инвойс
              </button>
              <button
                className="btn btn-danger deal-row-btn"
                onClick={(e) => handleActionClick('close', e)}
              >
                Закрыть
              </button>
            </>
          )}
          {deal.status === 'invoice' && (
            <button
              className="btn btn-danger deal-row-btn"
              onClick={(e) => handleActionClick('close', e)}
            >
              Закрыть
            </button>
          )}
          {deal.status === 'closed' && (
            <span className="deal-row-archived">
              В архиве
            </span>
          )}
        </div>
      </div>
      {/* Раскрытая часть */}
      {open && (
        <DealRowExpanded deal={deal} />
      )}
    </div>
  );
}
