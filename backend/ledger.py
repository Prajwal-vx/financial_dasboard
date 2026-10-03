import json
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from backend.models import Account, AuditLog, Category, Transaction, User
from backend.schemas import TransactionInput


def get_account_balances(db: Session, user_id: int, accounts: list[Account]) -> dict[int, Decimal]:
    balances = {acc.id: Decimal(acc.opening_balance) for acc in accounts}
    if not accounts:
        return balances

    # Sum posted transactions by account_id and type
    tx_source = db.execute(
        select(
            Transaction.account_id,
            Transaction.type,
            func.coalesce(func.sum(Transaction.amount), 0),
        ).where(
            Transaction.user_id == user_id,
            Transaction.deleted_at.is_(None),
            Transaction.status == "posted",
        ).group_by(Transaction.account_id, Transaction.type)
    ).all()

    for acc_id, tx_type, amount in tx_source:
        if acc_id in balances:
            amt = Decimal(amount) if amount is not None else Decimal("0.00")
            if tx_type == "income":
                balances[acc_id] += amt
            elif tx_type in ("expense", "transfer"):
                balances[acc_id] -= amt

    # Sum posted transfers into destination_account_id
    tx_dest = db.execute(
        select(
            Transaction.destination_account_id,
            func.coalesce(func.sum(Transaction.amount), 0),
        ).where(
            Transaction.user_id == user_id,
            Transaction.destination_account_id.is_not(None),
            Transaction.deleted_at.is_(None),
            Transaction.status == "posted",
            Transaction.type == "transfer",
        ).group_by(Transaction.destination_account_id)
    ).all()

    for dest_id, amount in tx_dest:
        if dest_id in balances:
            amt = Decimal(amount) if amount is not None else Decimal("0.00")
            balances[dest_id] += amt

    return balances


def account_balance(db: Session, account: Account) -> Decimal:
    return get_account_balances(db, account.user_id, [account]).get(account.id, Decimal(account.opening_balance))


def create_transaction(db: Session, user: User, payload: TransactionInput) -> Transaction:
    source = db.scalar(select(Account).where(Account.id == payload.account_id, Account.user_id == user.id, Account.status == "active"))
    if source is None:
        raise HTTPException(status_code=404, detail="Source account was not found")
    if source.currency != payload.currency:
        raise HTTPException(status_code=422, detail="Transaction currency must match the source account currency")

    destination = None
    if payload.type == "transfer":
        if payload.destination_account_id is None or payload.destination_account_id == source.id:
            raise HTTPException(status_code=422, detail="Choose a different destination account for a transfer")
        if payload.category_id is not None:
            raise HTTPException(status_code=422, detail="Transfers cannot have a category")
        destination = db.scalar(select(Account).where(Account.id == payload.destination_account_id, Account.user_id == user.id, Account.status == "active"))
        if destination is None:
            raise HTTPException(status_code=404, detail="Destination account was not found")
        if destination.currency != source.currency:
            raise HTTPException(status_code=422, detail="Transfers require accounts with the same currency")
    elif payload.destination_account_id is not None:
        raise HTTPException(status_code=422, detail="Only transfers can have a destination account")

    if payload.category_id is not None:
        category = db.scalar(select(Category).where(Category.id == payload.category_id, Category.user_id == user.id))
        if category is None:
            raise HTTPException(status_code=404, detail="Category was not found")
        if category.type != payload.type:
            raise HTTPException(status_code=422, detail="Category type does not match the transaction")

    transaction = Transaction(
        user_id=user.id,
        account_id=source.id,
        destination_account_id=destination.id if destination else None,
        category_id=payload.category_id,
        type=payload.type,
        amount=payload.amount,
        currency=payload.currency,
        merchant=payload.merchant,
        description=payload.description,
        transaction_date=payload.transaction_date,
        status=payload.status,
        source=payload.source,
    )
    db.add(transaction)
    db.flush()
    audit_data = {
        "amount": str(transaction.amount),
        "type": transaction.type,
        "description": transaction.description,
        "account_id": transaction.account_id,
        "destination_account_id": transaction.destination_account_id,
        "category_id": transaction.category_id,
        "transaction_date": transaction.transaction_date.isoformat(),
    }
    db.add(AuditLog(
        user_id=user.id,
        action="transaction.created",
        entity_type="transaction",
        entity_id=transaction.id,
        new_value=json.dumps(audit_data),
    ))
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(transaction)
    return transaction