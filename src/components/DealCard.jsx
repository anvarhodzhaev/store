import React from 'react';
import './Deals.css';

function formatDate(dateString) {
  if (!dateString) return '';

  const d = new Date(dateString);

  if (Number.isNaN(d.getTime())) return dateString;

  return d.toLocaleString();
}

function getStatusLabel(status) {
  switch ((status || '').toLowerCase()) {
    case 'open':
      return 'Открыта';

    case 'closed':
      return 'Закрыта';

    default:
      return status || 'Неизвестно';
  }
}

function getStatusClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'open':
      return 'deal-status deal-status--open';

    case 'closed':
      return 'deal-status deal-status--closed';

    default:
      return 'deal-status';
  }
}

export default function DealCard({ deal }) {
  if (!deal) return null;

  const dealId = deal.deal_id ?? deal.id;

  const supplierName = deal.supplier_name || 'Поставщик';

  const createdAt = formatDate(deal.created_at);

  const totalQty = Number(deal.total_qty ?? 0);

  const soldQty = Number(deal.sold_qty ?? 0);

  const availableQty = Number(deal.available_qty ?? 0);

  const soldPercent = Number(deal.sold_percent ?? 0); // 0–1

  const soldPercentDisplay = isFinite(soldPercent)
    ? Math.round(soldPercent * 100)
    : 0;

  const threshold = Number(deal.buyout_threshold ?? 0); // 0–1

  const thresholdDisplay = isFinite(threshold)
    ? Math.round(threshold * 100)
    : 0;

  const isThresholdReached =
    isFinite(soldPercent) &&
    isFinite(threshold) &&
    threshold > 0 &&
    soldPercent >= threshold;

  const progressWidth = Math.max(
    0,
    Math.min(100, soldPercentDisplay)
  );

  // Текст лота разбиваем по строкам

  const lotLines = (deal.lot_raw_text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  // Клиенты: сначала берём из API, если есть

  let clients = Array.isArray(deal.clients) ? deal.clients : [];

  // Если с бэка ничего не пришло, но есть лот и имя клиента,
  // создаём одного "виртуального" клиента и даём ему все строки лота
  if (!clients.length && lotLines.length) {
    const fallbackClientName = deal.client_name || 'Клиент 1';

    clients = [
      {
        name: fallbackClientName,
        lines: lotLines,
        isPaid: false,
      },
    ];
  }

  const clientCount = clients.length || Number(deal.client_count || 0);

  // Статусы инвойса/оплаты — пока простые заглушки
  const invoiceStatus = (deal.invoice_status || 'missing').toLowerCase();

  const supplierPaymentStatus = (deal.supplier_payment_status || 'required').toLowerCase();

  const isInvoiceReceived = invoiceStatus === 'received';

  const isInvoiceRequested = invoiceStatus === 'requested';

  const isSupplierPaid = supplierPaymentStatus === 'paid';

  return (
    <div className="deal-card-horizontal">
      {/* Левая колонка: поставщик, прогресс, товары, статусы */}
      <div className="deal-column deal-column-main">
        <div className="deal-main-header">
          <div className="deal-main-title">
            <div className="deal-supplier-name">
              {supplierName}
            </div>
            <div className="deal-offer-number">
              Предложение #{dealId}
            </div>
          </div>
          <div className={getStatusClass(deal.status)}>
            {getStatusLabel(deal.status)}
          </div>
        </div>
        <div className="deal-main-subheader">
          <span>{createdAt}</span>
          {clientCount > 0 && (
            <span className="deal-main-clients-count">
              {clientCount} клиент
              {clientCount > 1 ? 'а' : ''}
            </span>
          )}
        </div>
        <div className="deal-progress-block">
          <div className="deal-progress-header">
            <span>
              Подтверждено клиентами:{' '}
              <strong>{soldPercentDisplay}%</strong>
            </span>
            <span>
              Порог выкупа:{' '}
              {thresholdDisplay > 0 ? (
                <strong>{thresholdDisplay}%</strong>
              ) : (
                <span className="deal-muted">не задан</span>
              )}
            </span>
          </div>
          <div className="deal-progress-bar">
            <div
              className="deal-progress-fill"
              style={{ width: `${progressWidth}%` }}
            />
            {threshold > 0 && (
              <div
                className="deal-progress-threshold"
                style={{ left: `${thresholdDisplay}%` }}
              />
            )}
          </div>
          <div className="deal-progress-footer">
            <span>
              Подтверждено:{' '}
              <strong>
                {soldQty} / {totalQty}
              </strong>
            </span>
            <span>
              Осталось:{' '}
              <strong>{availableQty}</strong>
            </span>
            {isThresholdReached && (
              <span className="deal-threshold-badge">
                Порог достигнут
              </span>
            )}
          </div>
        </div>
        {lotLines.length > 0 && (
          <div className="deal-lot-block">
            <div className="deal-section-title">
              ТОВАРЫ В ПРЕДЛОЖЕНИИ ПОСТАВЩИКА
            </div>
            <div className="deal-lot-lines">
              {lotLines.map((line, idx) => (
                <div key={idx} className="deal-lot-line">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="deal-status-groups">
          <div className="deal-status-group">
            <div className="deal-section-title">
              ПОДТВЕРЖДЕНИЕ У ПОСТАВЩИКА
            </div>
            <button
              type="button"
              className="btn btn-primary deal-btn-wide"
              onClick={() => {
                alert(
                  `Здесь будет запрос подтверждения поставщику по сделке #${dealId}`
                );
              }}
            >
              Запросить подтверждение поставщика
            </button>
          </div>
          <div className="deal-status-group">
            <div className="deal-section-title">
              ИНВОЙС
            </div>
            <div className="deal-inline-status">
              {isInvoiceReceived ? (
                <span className="deal-text-success">
                  Инвойс получен
                </span>
              ) : (
                <span className="deal-text-danger">
                  Инвойс не получен
                </span>
              )}
            </div>
            <button
              type="button"
              className="btn btn-primary deal-btn-small"
              onClick={() => {
                alert(
                  `Здесь будет запрос инвойса по сделке #${dealId}`
                );
              }}
            >
              {isInvoiceRequested
                ? 'Инвойс запрошен'
                : 'Запросить инвойс'}
            </button>
          </div>
          <div className="deal-status-group">
            <div className="deal-section-title">
              ОПЛАТА ПОСТАВЩИКУ
            </div>
            <div className="deal-inline-status">
              {isSupplierPaid ? (
                <span className="deal-text-success">
                  Оплачено
                </span>
              ) : (
                <span className="deal-text-danger">
                  требуется оплата
                </span>
              )}
            </div>
            <button
              type="button"
              className="btn btn-primary deal-btn-small"
              onClick={() => {
                alert(
                  `Здесь будет логика оплаты поставщику по сделке #${dealId}`
                );
              }}
            >
              Оплатить
            </button>
          </div>
        </div>
      </div>
      {/* Центральная колонка: клиенты */}
      <div className="deal-column deal-column-clients">
        <div className="deal-section-title">
          КЛИЕНТЫ И ЗАКАЗЫ
        </div>
        {clients.length === 0 ? (
          <div className="deal-clients-empty">
            Клиенты ещё не добавлены к этой сделке.
          </div>
        ) : (
          <div className="deal-clients-grid">
            {clients.map((client, idx) => {
              const name = client.name || `Клиент ${idx + 1}`;

              const lines = Array.isArray(client.lines)
                ? client.lines
                : [];

              const isPaidByClient = !!client.isPaid;

              const isConfirmed = !!client.isConfirmed;

              return (
                <div key={idx} className="deal-client-card">
                  <div className="deal-client-header">
                    <span className="deal-client-name">{name}</span>
                    <button
                      type="button"
                      className="btn btn-chip"
                      onClick={() => {
                        alert(
                          `Здесь будет подтверждение клиента "${name}" по сделке #${dealId}`
                        );
                      }}
                    >
                      Подтвердить
                    </button>
                  </div>
                  <div className="deal-client-lines">
                    {lines.length === 0 ? (
                      <div className="deal-muted">
                        Позиции клиента не указаны
                      </div>
                    ) : (
                      lines.map((line, li) => (
                        <div key={li}>{line}</div>
                      ))
                    )}
                  </div>
                  <div className="deal-client-footer">
                    <span>
                      Оплачено клиентом:{' '}
                      {isPaidByClient ? (
                        <span className="deal-text-success">
                          да ✓
                        </span>
                      ) : (
                        <span className="deal-text-danger">
                          нет
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline deal-btn-small"
                      onClick={() => {
                        alert(
                          `Здесь будет проверка оплаты клиента "${name}" по сделке #${dealId}`
                        );
                      }}
                    >
                      Проверить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Правая колонка: общие действия по сделке */}
      <div className="deal-column deal-column-actions">
        <button
          type="button"
          className="btn btn-primary deal-btn-small"
          onClick={() => {
            alert(
              `Здесь будет перевод сделки #${dealId} в архив`
            );
          }}
        >
          В архив
        </button>
        <button
          type="button"
          className="btn btn-danger deal-btn-actions"
          onClick={() => {
            if (
              window.confirm(
                `Удалить предложение #${dealId}?`
              )
            ) {
              alert(
                'Здесь будет запрос в n8n / API на удаление сделки'
              );
            }
          }}
        >
          Удалить предложение
        </button>
      </div>
    </div>
  );
}
