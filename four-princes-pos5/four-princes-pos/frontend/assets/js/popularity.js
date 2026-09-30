async function loadPopularity() {
  const days = document.getElementById('periodSelect').value;
  const data = await Api.get(`/popularity?days=${days}`);

  document.getElementById('bestSellersBody').innerHTML = data.best_sellers.length
    ? data.best_sellers.map(p => `
        <tr><td>${p.name}</td><td>${p.sku}</td><td>${p.qty_sold}</td><td>${peso(p.revenue)}</td></tr>
      `).join('')
    : '<tr><td colspan="4" class="empty-row">No sales recorded in this period.</td></tr>';

  document.getElementById('slowMoversBody').innerHTML = data.slow_movers.length
    ? data.slow_movers.map(p => `<tr><td>${p.name}</td><td>${p.sku}</td><td>${p.qty_sold}</td></tr>`).join('')
    : '<tr><td colspan="3" class="empty-row">Not enough sales data yet.</td></tr>';

  document.getElementById('restockBody').innerHTML = data.restock_priority.length
    ? data.restock_priority.map(p => `
        <tr>
          <td>${p.name}</td><td>${p.sku}</td><td>${p.qty_sold}</td>
          <td>${p.current_stock}</td><td>${statusBadge(p.status)}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="5" class="empty-row">Nothing urgent \u2014 popular items are well-stocked.</td></tr>';

  document.getElementById('deadStockDaysLabel').textContent = data.dead_stock_days;
  document.getElementById('deadStockBody').innerHTML = data.dead_stock.length
    ? data.dead_stock.map(p => `<tr><td>${p.name}</td><td>${p.sku}</td><td>${p.current_stock}</td></tr>`).join('')
    : '<tr><td colspan="3" class="empty-row">No dead stock right now.</td></tr>';
}

document.getElementById('periodSelect').addEventListener('change', loadPopularity);
loadPopularity();
