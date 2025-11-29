import React from 'react';
import DealRow from './DealRow';
import './Deals.css';

export default function DealsTable({ deals, onAction }) {
  if (!deals || deals.length === 0) {
    return <div className="deals-empty-block">Сделок пока нет</div>;
  }

  return (
    <div className="deals-table">
      {deals.map((deal) => (
        <DealRow 
          key={deal.deal_id ?? deal.id} 
          deal={deal} 
          onAction={onAction}
        />
      ))}
    </div>
  );
}

