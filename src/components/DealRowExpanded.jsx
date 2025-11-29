import React from 'react';

export default function DealRowExpanded({ deal }) {
  const clients = Array.isArray(deal.clients) ? deal.clients : [];

  const paymentSupplier = deal.payment_status_supplier === 'paid';

  return (
    <div className="deal-row-expanded">
      {/* Клиенты */}
      <div className="deal-section">
        <div className="deal-section-title">Клиенты и заказы</div>
        {clients.map((c) => (
          <div key={c.client_id} className="deal-client-block">
            <div className="deal-client-header">
              <div className="deal-client-name">{c.client_name}</div>
              <div className="deal-client-status">
                {c.paid ? (
                  <span className="paid">оплачено</span>
                ) : (
                  <span className="not-paid">не оплачено</span>
                )}
              </div>
            </div>
            {Array.isArray(c.positions) && c.positions.length > 0 && (
              <ul className="deal-client-positions">
                {c.positions.map((p, idx) => (
                  <li key={idx}>
                    {p.item_name} — {p.qty} шт
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Оплата поставщику */}
      <div className="deal-section">
        <div className="deal-section-title">Оплата поставщику</div>
        <div className="deal-supplier-payment">
          {paymentSupplier ? (
            <span className="paid">оплачено</span>
          ) : (
            <span className="not-paid">требуется</span>
          )}
        </div>
      </div>

      {/* Инвойс */}
      <div className="deal-section">
        <div className="deal-section-title">Инвойс</div>
        {deal.invoice_file_url ? (
          <a 
            href={deal.invoice_file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="invoice-link"
          >
            Скачать PDF
          </a>
        ) : (
          <div className="not-paid">Инвойс не получен</div>
        )}
      </div>
    </div>
  );
}

