async function loadDashboard() {
  try {
    const data = await Api.get('/dashboard/summary');

    document.getElementById('kpiTodayRevenue').textContent = peso(data.today_revenue);
    document.getElementById('kpiTodayCount').textContent =
      `${data.today_transaction_count} transaction${data.today_transaction_count === 1 ? '' : 's'}`;
    document.getElementById('kpiWeekRevenue').textContent = peso(data.week_revenue);
    document.getElementById('kpiLowStock').textContent = data.low_stock_count;
    document.getElementById('kpiOutStock').textContent = data.out_of_stock_count;

    const topBody = document.getElementById('topProductsBody');
    topBody.innerHTML = data.top_products.length
      ? data.top_products.map(p => `<tr><td>${p.name}</td><td>${p.sku}</td><td>${p.qty_sold}</td></tr>`).join('')
      : '<tr><td colspan="3" class="empty-row">No sales recorded yet this week.</td></tr>';

    const recentBody = document.getElementById('recentSalesBody');
    recentBody.innerHTML = data.recent_sales.length
      ? data.recent_sales.map(s => `
          <tr>
            <td>${s.invoice_number}</td>
            <td>${s.cashier_name || '\u2014'}</td>
            <td>${peso(s.total_amount)}</td>
            <td>${formatDateTime(s.created_at)}</td>
          </tr>`).join('')
      : '<tr><td colspan="4" class="empty-row">No sales yet.</td></tr>';
  } catch (err) {
    console.error(err);
  }
}

document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-PH', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

loadDashboard();
setInterval(loadDashboard, 30000);
