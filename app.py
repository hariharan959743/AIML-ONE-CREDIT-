from flask import Flask, render_template, request, redirect, url_for, flash
from portfolio import Portfolio, load_portfolio, save_portfolio

app = Flask(__name__)
app.secret_key = "change-this-secret"

@app.route("/", methods=["GET", "POST"])
def index():
    portfolio = load_portfolio()
    message = None

    if request.method == "POST":
        try:
            symbol = request.form.get("symbol", "").strip().upper()
            quantity = float(request.form.get("quantity", "0"))
            cost_basis = float(request.form.get("cost_basis", "0"))
            if not symbol:
                raise ValueError("Symbol is required")
            portfolio.add_position(symbol, quantity, cost_basis)
            save_portfolio(portfolio)
            flash(f"Position added/updated: {symbol}", "success")
            return redirect(url_for("index"))
        except Exception as ex:
            flash(str(ex), "danger")

    market_prices = {}
    for key, value in request.args.items():
        if key.isalpha():
            try:
                market_prices[key.upper()] = float(value)
            except ValueError:
                flash(f"Invalid price '{value}' for {key}", "warning")

    return render_template(
        "index.html",
        portfolio=portfolio,
        market_prices=market_prices,
        total_cost=portfolio.total_cost(),
        total_value=portfolio.value(market_prices),
        total_pl=portfolio.total_pl(market_prices),
    )

@app.route("/remove/<symbol>")
def remove(symbol):
    portfolio = load_portfolio()
    try:
        portfolio.remove_position(symbol)
        save_portfolio(portfolio)
        flash(f"Removed {symbol.upper()}", "success")
    except KeyError:
        flash(f"No position for {symbol}", "danger")
    return redirect(url_for("index"))

@app.route("/update/<symbol>", methods=["POST"])
def update(symbol):
    portfolio = load_portfolio()
    try:
        quantity = float(request.form.get("quantity", "0"))
        cost_basis = float(request.form.get("cost_basis", "0"))
        portfolio.update_position(symbol, quantity=quantity, cost_basis=cost_basis)
        save_portfolio(portfolio)
        flash(f"Updated {symbol.upper()}", "success")
    except Exception as ex:
        flash(str(ex), "danger")
    return redirect(url_for("index"))

if __name__ == "__main__":
    app.run(debug=True, port=5000)
