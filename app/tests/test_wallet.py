from fastapi.testclient import TestClient
import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_events.db")

from app.main import create_app  # noqa: E402


def test_wallet_status_flow_and_csv():
    app = create_app()
    client = TestClient(app)

    # Create a requested transaction
    create_res = client.post(
        "/wallet/transactions",
        json={
            "amount_cents": 1234,
            "currency": "ZAR",
            "description": "Test payment",
            "counterparty": "Alice",
            "status": "requested",
        },
    )
    assert create_res.status_code == 201, create_res.text
    tx = create_res.json()
    tx_id = tx["id"]

    # Accept
    accept_res = client.post(f"/wallet/transactions/{tx_id}/accept")
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "accepted"

    # Mark paid
    paid_res = client.post(f"/wallet/transactions/{tx_id}/mark-paid")
    assert paid_res.status_code == 200
    assert paid_res.json()["status"] == "paid"

    # CSV export
    csv_res = client.get("/wallet/transactions.csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers.get("content-type", "")

