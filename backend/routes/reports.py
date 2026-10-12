"""
backend/routes/reports.py — Forbusyness Web ERP

FastAPI Reporting & Business Intelligence endpoints.
Serves server-side aggregated reports for Sales, Purchases, Stock,
Financials (P&L), Outstanding aging, and Tax compliance.
Uses standard, simple business words and domain-neutral models.
"""

from typing import Optional
from fastapi import APIRouter, Query

router = APIRouter()

@router.get("/overview")
async def get_overview_report(
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
):
    """Executive KPI summary and trend overview."""
    return {
        "status": "success",
        "data": {
            "period": {"from": date_from, "to": date_to},
            "kpi": {
                "totalSales": 0,
                "totalPurchases": 0,
                "grossProfit": 0,
                "grossProfitPct": 0,
                "totalStockValue": 0,
                "customerOutstanding": 0,
                "supplierOutstanding": 0,
                "netProfit": 0,
            },
            "trendData": [],
            "topProducts": [],
            "topCustomers": [],
        }
    }

@router.get("/sales")
async def get_sales_report(
    sub_type: str = Query("register", description="register | customer | product | returns"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    """Sales registers, customer-wise and product-wise sales reports."""
    return {
        "status": "success",
        "sub_type": sub_type,
        "summary": {"totalSales": 0, "totalReceived": 0, "totalDue": 0, "count": 0},
        "rows": []
    }

@router.get("/purchases")
async def get_purchases_report(
    sub_type: str = Query("register", description="register | supplier | product"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    """Purchase bills, inward stock, and supplier-wise purchase reports."""
    return {
        "status": "success",
        "sub_type": sub_type,
        "summary": {"totalPurchases": 0, "totalPaid": 0, "totalBalance": 0, "count": 0},
        "rows": []
    }

@router.get("/ledgers")
async def get_ledger_report(
    sub_type: str = Query("customerLedger", description="customerLedger | supplierLedger | cashBankLedger | expenseLedger"),
    party_id: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    """Double-entry ledger statements and party balance history."""
    return {
        "status": "success",
        "sub_type": sub_type,
        "openingBalance": 0,
        "closingBalance": 0,
        "rows": []
    }

@router.get("/financials/profit-loss")
async def get_profit_and_loss(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    """Statement of Profit & Loss (Revenue, COGS, Gross Profit, Expenses, Net Profit)."""
    return {
        "status": "success",
        "revenue": {"grossSales": 0, "salesReturns": 0, "netSales": 0},
        "cogs": {"purchases": 0, "totalCogs": 0},
        "grossProfit": 0,
        "grossProfitPct": 0,
        "expenses": {"items": [], "totalExpenses": 0},
        "netProfit": 0,
        "netProfitPct": 0,
    }

@router.get("/outstanding")
async def get_outstanding_report(
    sub_type: str = Query("customerOutstanding", description="customerOutstanding | supplierOutstanding"),
    search: Optional[str] = Query(None),
):
    """Receivables and payables aging analysis schedule."""
    return {
        "status": "success",
        "sub_type": sub_type,
        "summary": {
            "totalOutstanding": 0,
            "totalCurrent": 0,
            "total30To60": 0,
            "total60To90": 0,
            "totalAbove90": 0,
            "partyCount": 0,
        },
        "rows": []
    }

@router.get("/inventory")
async def get_inventory_report(
    sub_type: str = Query("stockSummary", description="stockSummary | lowStock | stockMovement"),
    search: Optional[str] = Query(None),
):
    """Product stock summary, valuation, and low-stock reorder alerts."""
    return {
        "status": "success",
        "sub_type": sub_type,
        "summary": {"totalStockValue": 0, "totalStockUnits": 0, "lowStockCount": 0},
        "rows": []
    }

@router.get("/tax-hsn")
async def get_tax_report(
    sub_type: str = Query("gstr1", description="gstr1 | gstr2 | hsn"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    """GST outward/inward tax returns and HSN commodity dispatches summary."""
    return {
        "status": "success",
        "sub_type": sub_type,
        "summary": {"totalTaxable": 0, "totalTax": 0, "grandTotal": 0},
        "rows": []
    }
