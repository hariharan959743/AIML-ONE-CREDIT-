const alertPlaceholder = document.getElementById('alert-placeholder');
const tableBody = document.querySelector('#portfolio-table tbody');
const summaryEl = document.getElementById('summary');
const priceInfo = document.getElementById('price-info');

let marketPrices = {};

function showAlert(message, type = 'success') {
  alertPlaceholder.innerHTML = `<div class="alert alert-${type} alert-dismissible" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
}

function loadPortfolio() {
  fetch('/api/positions').then(r => r.json()).then(data => renderPortfolio(data)).catch(() => showAlert('Cannot load portfolio', 'danger'));
}

function renderPortfolio(pf) {
  tableBody.innerHTML = '';
  let totalCost = 0;
  let totalValue = 0;

  for (const [symbol, pos] of Object.entries(pf)) {
    const price = marketPrices[symbol] != null ? marketPrices[symbol] : pos.cost_basis;
    const value = pos.quantity * price;
    const pl = pos.quantity * (price - pos.cost_basis);

    totalCost += pos.quantity * pos.cost_basis;
    totalValue += value;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${symbol}</td>
      <td><input class="form-control form-control-sm" type="number" value="${pos.quantity}" step="any" min="0" id="qty-${symbol}" /></td>
      <td><input class="form-control form-control-sm" type="number" value="${pos.cost_basis}" step="any" min="0" id="cb-${symbol}" /></td>
      <td>${value.toFixed(2)}</td>
      <td>${pl.toFixed(2)}</td>
      <td>
        <button class="btn btn-sm btn-warning action-btn" onclick="updatePosition('${symbol}')">Save</button>
        <button class="btn btn-sm btn-danger" onclick="removePosition('${symbol}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  }

  if (!Object.keys(pf).length) {
    tableBody.innerHTML = `<tr><td colspan="6">No positions yet.</td></tr>`;
  }

  const totalPL = totalValue - totalCost;
  summaryEl.innerHTML = `<strong>Total cost:</strong> ${totalCost.toFixed(2)} <strong>Total value:</strong> ${totalValue.toFixed(2)} <strong>Total P/L:</strong> ${totalPL.toFixed(2)}`;
}

function addPosition(e) {
  e.preventDefault();
  const symbol = document.getElementById('symbol').value.trim().toUpperCase();
  const quantity = parseFloat(document.getElementById('quantity').value);
  const cost_basis = parseFloat(document.getElementById('cost_basis').value);

  fetch('/api/positions', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ symbol, quantity, cost_basis })
  })
  .then(res => res.json())
  .then(res => {
    if (res.error) throw new Error(res.error);
    showAlert(`Position ${symbol} added/merged`, 'success');
    document.getElementById('add-form').reset();
    loadPortfolio();
  })
  .catch(err => showAlert(err.message, 'danger'));
}

function updatePosition(symbol) {
  const quantity = parseFloat(document.getElementById(`qty-${symbol}`).value);
  const cost_basis = parseFloat(document.getElementById(`cb-${symbol}`).value);
  fetch(`/api/positions/${symbol}`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ quantity, cost_basis })
  })
  .then(res => res.json())
  .then(res => {
    if (res.error) throw new Error(res.error);
    showAlert(`${symbol} updated`, 'success');
    loadPortfolio();
  })
  .catch(err => showAlert(err.message, 'danger'));
}

function removePosition(symbol) {
  fetch(`/api/positions/${symbol}`, { method: 'DELETE' })
  .then(res => res.json())
  .then(res => {
    if (res.error) throw new Error(res.error);
    showAlert(`${symbol} deleted`, 'success');
    loadPortfolio();
  })
  .catch(err => showAlert(err.message, 'danger'));
}

function applyPrices() {
  const data = priceInfo.value.trim();
  const pairs = data.split(',').map(v => v.trim()).filter(Boolean);
  const nextPrices = {};

  for (const pair of pairs) {
    const [s, p] = pair.split('=');
    if (!s || isNaN(Number(p))) {
      showAlert('Invalid price entry: ' + pair, 'warning');
      return;
    }
    nextPrices[s.trim().toUpperCase()] = Number(p);
  }

  marketPrices = nextPrices;
  loadPortfolio();
}

document.getElementById('add-form').addEventListener('submit', addPosition);
document.getElementById('apply-prices').addEventListener('click', applyPrices);
loadPortfolio();
