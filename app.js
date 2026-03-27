const alertPlaceholder = document.getElementById('alert-placeholder');
const tableBody = document.querySelector('#portfolio-table tbody');
const summaryEl = document.getElementById('summary');
const priceInfo = document.getElementById('price-info');

let marketPrices = {};

function showAlert(message, type = 'success') {
  alertPlaceholder.innerHTML = `<div class="alert alert-${type} alert-dismissible" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
}

function savePortfolio(pf) {
  localStorage.setItem('portfolio_positions', JSON.stringify(pf));
}

function loadPortfolio() {
  const raw = localStorage.getItem('portfolio_positions') || '{}';
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
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
      <td><input class="form-control form-control-sm" type="number" value="${pos.quantity}" step="any" min="0" id="qty-${symbol}"/></td>
      <td><input class="form-control form-control-sm" type="number" value="${pos.cost_basis}" step="any" min="0" id="cb-${symbol}"/></td>
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
  summaryEl.innerHTML = `<strong>Total cost:</strong> ${totalCost.toFixed(2)}  <strong>Total value:</strong> ${totalValue.toFixed(2)}  <strong>Total P/L:</strong> ${totalPL.toFixed(2)}`;
}

function addPosition(e) {
  e.preventDefault();
  const symbol = document.getElementById('symbol').value.trim().toUpperCase();
  const quantity = parseFloat(document.getElementById('quantity').value);
  const cost_basis = parseFloat(document.getElementById('cost_basis').value);

  if (!symbol || Number.isNaN(quantity) || Number.isNaN(cost_basis) || quantity <= 0 || cost_basis < 0) {
    showAlert('Please enter valid symbol, quantity (>0), and cost basis (>=0).', 'danger');
    return;
  }

  const pf = loadPortfolio();
  if (pf[symbol]) {
    const old = pf[symbol];
    const totalCost = old.quantity * old.cost_basis + quantity * cost_basis;
    const totalQty = old.quantity + quantity;
    pf[symbol] = { quantity: totalQty, cost_basis: totalCost / totalQty };
    showAlert(`Merged position for ${symbol}.`, 'success');
  } else {
    pf[symbol] = { quantity, cost_basis };
    showAlert(`Added ${symbol}.`, 'success');
  }

  savePortfolio(pf);
  document.getElementById('add-form').reset();
  renderPortfolio(pf);
}

function updatePosition(symbol) {
  const pf = loadPortfolio();
  if (!pf[symbol]) {
    showAlert('Symbol not found', 'warning');
    return;
  }
  const quantity = parseFloat(document.getElementById(`qty-${symbol}`).value);
  const cost_basis = parseFloat(document.getElementById(`cb-${symbol}`).value);

  if (Number.isNaN(quantity) || Number.isNaN(cost_basis) || quantity < 0 || cost_basis < 0) {
    showAlert('Invalid update values.', 'danger');
    return;
  }

  pf[symbol] = { quantity, cost_basis };
  savePortfolio(pf);
  renderPortfolio(pf);
  showAlert(`${symbol} updated`, 'success');
}

function removePosition(symbol) {
  const pf = loadPortfolio();
  if (!pf[symbol]) {
    showAlert('Symbol not found', 'warning');
    return;
  }
  delete pf[symbol];
  savePortfolio(pf);
  renderPortfolio(pf);
  showAlert(`${symbol} deleted`, 'success');
}

function applyPrices() {
  const data = priceInfo.value.trim();
  if (!data) {
    marketPrices = {};
    renderPortfolio(loadPortfolio());
    showAlert('Reset market prices.', 'info');
    return;
  }

  const pairs = data.split(',').map(v => v.trim()).filter(Boolean);
  const nextPrices = {};

  for (const pair of pairs) {
    const [s, p] = pair.split('=');
    if (!s || Number.isNaN(Number(p))) {
      showAlert('Invalid price entry: ' + pair, 'warning');
      return;
    }
    nextPrices[s.trim().toUpperCase()] = Number(p);
  }

  marketPrices = nextPrices;
  renderPortfolio(loadPortfolio());
  showAlert('Market prices applied.', 'success');
}

document.getElementById('add-form').addEventListener('submit', addPosition);
document.getElementById('apply-prices').addEventListener('click', applyPrices);

renderPortfolio(loadPortfolio());
