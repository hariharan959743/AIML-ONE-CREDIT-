const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'portfolio_data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadPortfolio() {
  if (!fs.existsSync(DATA_FILE)) return {};
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data || '{}');
  } catch (err) {
    console.error('Error reading portfolio file', err);
    return {};
  }
}

function savePortfolio(portfolio) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(portfolio, null, 2));
}

app.get('/api/positions', (req, res) => {
  const pf = loadPortfolio();
  res.json(pf);
});

app.post('/api/positions', (req, res) => {
  const { symbol, quantity, cost_basis } = req.body;
  const sym = String(symbol || '').trim().toUpperCase();
  if (!sym || quantity == null || cost_basis == null) {
    return res.status(400).json({ error: 'symbol, quantity, and cost_basis required' });
  }
  if (quantity <= 0 || cost_basis < 0) {
    return res.status(400).json({ error: 'quantity must be >0; cost_basis must be >=0' });
  }

  const pf = loadPortfolio();
  if (pf[sym]) {
    // merge:
    const old = pf[sym];
    const totalCost = old.quantity * old.cost_basis + quantity * cost_basis;
    const totalQty = old.quantity + quantity;
    pf[sym] = {
      quantity: totalQty,
      cost_basis: totalCost / totalQty
    };
  } else {
    pf[sym] = { quantity, cost_basis };
  }
  savePortfolio(pf);
  res.json(pf[sym]);
});

app.put('/api/positions/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const { quantity, cost_basis } = req.body;
  const pf = loadPortfolio();
  if (!pf[symbol]) return res.status(404).json({ error: 'symbol not found' });

  if (quantity != null) {
    if (quantity < 0) return res.status(400).json({ error: 'quantity must be >=0'});
    pf[symbol].quantity = quantity;
  }
  if (cost_basis != null) {
    if (cost_basis < 0) return res.status(400).json({ error: 'cost_basis must be >=0'});
    pf[symbol].cost_basis = cost_basis;
  }
  savePortfolio(pf);
  res.json(pf[symbol]);
});

app.delete('/api/positions/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const pf = loadPortfolio();
  if (!pf[symbol]) return res.status(404).json({ error: 'symbol not found' });
  delete pf[symbol];
  savePortfolio(pf);
  res.json({ success: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Portfolio web server running at http://localhost:${PORT}`);
});
