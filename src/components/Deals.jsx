import React, { useEffect, useState } from 'react';
import DealCard from './DealCard';
import './Deals.css';

const BASE_URL = 'https://quageyamoulu.beget.app/webhook';

// Локальная функция для загрузки сделок
async function fetchDeals() {
  const response = await fetch(`${BASE_URL}/deals`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('RAW DEALS RESPONSE:', data);

  // Если уже массив — возвращаем как есть
  if (Array.isArray(data)) {
    return data;
  }

  // Если пришёл один объект — оборачиваем в массив
  if (data && typeof data === 'object') {
    return [data];
  }

  // Если пришла строка — пробуем распарсить JSON
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return [parsed];
    } catch (e) {
      console.error('Не удалось распарсить строковый JSON сделок', e);
    }
  }

  // На всякий случай
  return [];
}

function Deals() {
  const [deals, setDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDeals = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchDeals();
      console.log('DEALS FROM API (normalized):', data);
      setDeals(data);
    } catch (err) {
      console.error('Ошибка загрузки сделок:', err);
      setError('Не удалось загрузить сделки. Попробуйте ещё раз.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  return (
    <div className="deals-page">
      <div className="deals-header">
        <h1>Сделки</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={loadDeals}
          disabled={isLoading}
        >
          {isLoading ? 'Обновляем…' : 'Обновить'}
        </button>
      </div>

      {error && (
        <div className="deals-error">
          {error}
        </div>
      )}

      {isLoading && deals.length === 0 && (
        <div className="deals-empty">Загрузка сделок…</div>
      )}

      {!isLoading && deals.length === 0 && !error && (
        <div className="deals-empty">Сделок пока нет</div>
      )}

      {!isLoading && deals.length > 0 && (
        <div className="deals-grid">
          {deals.map((deal, index) => (
            <DealCard
              key={deal.deal_id ?? deal.id ?? index}
              deal={deal}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Deals;


