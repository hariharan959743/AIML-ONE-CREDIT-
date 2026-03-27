#!/usr/bin/env python3
"""Portfolio manager (big program) - track assets and performance."""

from dataclasses import dataclass, field
from typing import Dict, List
import json
import argparse
import sys
import os

DATA_PATH = "portfolio_data.json"

@dataclass
class Position:
    symbol: str
    quantity: float
    cost_basis: float

    def market_value(self, price: float) -> float:
        return self.quantity * price

    def profit_loss(self, market_price: float) -> float:
        return self.quantity * (market_price - self.cost_basis)


@dataclass
class Portfolio:
    positions: Dict[str, Position] = field(default_factory=dict)

    def add_position(self, symbol: str, quantity: float, cost_basis: float):
        symbol = symbol.upper()
        if quantity <= 0 or cost_basis < 0:
            raise ValueError("quantity must be positive and cost_basis non-negative")

        if symbol in self.positions:
            current = self.positions[symbol]
            total_cost = current.quantity * current.cost_basis + quantity * cost_basis
            total_qty = current.quantity + quantity
            current.cost_basis = total_cost / total_qty
            current.quantity = total_qty
        else:
            self.positions[symbol] = Position(symbol, quantity, cost_basis)

    def remove_position(self, symbol: str):
        symbol = symbol.upper()
        if symbol in self.positions:
            del self.positions[symbol]
        else:
            raise KeyError(f"No position for {symbol}")

    def update_position(self, symbol: str, quantity: float = None, cost_basis: float = None):
        symbol = symbol.upper()
        if symbol not in self.positions:
            raise KeyError(f"No position for {symbol}")
        if quantity is not None and quantity < 0:
            raise ValueError("quantity cannot be negative")
        if cost_basis is not None and cost_basis < 0:
            raise ValueError("cost_basis cannot be negative")

        pos = self.positions[symbol]
        if quantity is not None:
            pos.quantity = quantity
        if cost_basis is not None:
            pos.cost_basis = cost_basis

    def total_cost(self) -> float:
        return sum(p.quantity * p.cost_basis for p in self.positions.values())

    def value(self, market_prices: Dict[str, float]) -> float:
        return sum(p.market_value(market_prices.get(p.symbol, p.cost_basis)) for p in self.positions.values())

    def total_pl(self, market_prices: Dict[str, float]) -> float:
        return sum(p.profit_loss(market_prices.get(p.symbol, p.cost_basis)) for p in self.positions.values())

    def to_json(self) -> Dict:
        return {symbol: {"quantity": p.quantity, "cost_basis": p.cost_basis} for symbol, p in self.positions.items()}

    @classmethod
    def from_json(cls, data: Dict):
        pf = cls()
        for symbol, values in data.items():
            pf.positions[symbol] = Position(symbol, values["quantity"], values["cost_basis"])
        return pf


def load_portfolio(path: str = DATA_PATH) -> Portfolio:
    if not os.path.exists(path):
        return Portfolio()
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return Portfolio.from_json(data)


def save_portfolio(portfolio: Portfolio, path: str = DATA_PATH):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(portfolio.to_json(), f, indent=2)


def print_portfolio(pf: Portfolio, market_prices: Dict[str, float] = None):
    if market_prices is None:
        market_prices = {}

    rows: List[Dict] = []
    for pos in pf.positions.values():
        price = market_prices.get(pos.symbol, pos.cost_basis)
        rows.append({
            "symbol": pos.symbol,
            "quantity": pos.quantity,
            "cost_basis": pos.cost_basis,
            "price": price,
            "value": pos.market_value(price),
            "p/l": pos.profit_loss(price),
        })

    if not rows:
        print("Portfolio is empty.")
        return

    print("{:<8} {:>10} {:>12} {:>12} {:>12} {:>12}".format("Symbol", "Quantity", "CostBasis", "Price", "Value", "P/L"))
    print("-" * 70)
    for r in sorted(rows, key=lambda x: x["symbol"]):
        print("{:<8} {:>10.2f} {:>12.2f} {:>12.2f} {:>12.2f} {:>12.2f}".format(
            r["symbol"], r["quantity"], r["cost_basis"], r["price"], r["value"], r["p/l"]
        ))

    total_cost = pf.total_cost()
    total_value = pf.value(market_prices)
    total_pl = pf.total_pl(market_prices)
    print("-" * 70)
    print(f"Total cost: {total_cost:.2f}\nTotal value: {total_value:.2f}\nTotal P/L: {total_pl:.2f}")


def main():
    parser = argparse.ArgumentParser(description="Portfolio manager for a big program")
    subparsers = parser.add_subparsers(dest="command", required=True)

    parser_add = subparsers.add_parser("add", help="Add or merge a position")
    parser_add.add_argument("symbol")
    parser_add.add_argument("quantity", type=float)
    parser_add.add_argument("cost_basis", type=float)

    parser_remove = subparsers.add_parser("remove", help="Remove a position")
    parser_remove.add_argument("symbol")

    parser_update = subparsers.add_parser("update", help="Update a position")
    parser_update.add_argument("symbol")
    parser_update.add_argument("quantity", type=float, nargs="?", default=None)
    parser_update.add_argument("cost_basis", type=float, nargs="?", default=None)

    parser_show = subparsers.add_parser("show", help="Show portfolio")
    parser_show.add_argument("symbol", nargs="?", default=None)

    parser_price = subparsers.add_parser("price", help="Show portfolio with market prices")
    parser_price.add_argument("prices", nargs="*", help="Symbol=price pairs, e.g. AAPL=175.50")

    args = parser.parse_args()
    portfolio = load_portfolio()

    try:
        if args.command == "add":
            portfolio.add_position(args.symbol, args.quantity, args.cost_basis)
            save_portfolio(portfolio)
            print(f"Added/updated {args.symbol.upper()} {args.quantity} @ {args.cost_basis}")

        elif args.command == "remove":
            portfolio.remove_position(args.symbol)
            save_portfolio(portfolio)
            print(f"Removed {args.symbol.upper()}")

        elif args.command == "update":
            portfolio.update_position(args.symbol, quantity=args.quantity, cost_basis=args.cost_basis)
            save_portfolio(portfolio)
            print(f"Updated {args.symbol.upper()}")

        elif args.command == "show":
            if args.symbol:
                symbol = args.symbol.upper()
                if symbol in portfolio.positions:
                    pos = portfolio.positions[symbol]
                    print(f"{symbol}: qty={pos.quantity}, cost_basis={pos.cost_basis}")
                else:
                    print(f"No position for {symbol}")
            else:
                print_portfolio(portfolio)

        elif args.command == "price":
            market_prices = {}
            for pair in args.prices:
                if "=" not in pair:
                    raise ValueError("Prices should be given as SYMBOL=PRICE")
                sym, p = pair.split("=", 1)
                market_prices[sym.upper()] = float(p)
            print_portfolio(portfolio, market_prices=market_prices)

    except Exception as exc:
        print(f"Error: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
