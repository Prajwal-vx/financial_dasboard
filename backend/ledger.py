import json
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from backend.models import Account, AuditLog, Category, Transaction, User
from backend.schemas import TransactionInput


def account_balance(db: Session, account: Account) -> Decimal:
    incoming = func.coalesce(func.sum(case(
        (((Transaction.account_id == account.id) & (Transaction.type == "income")) | (Transaction.destination_account_id == account.id), Transaction.amount),
        else_=Decimal("0.00"),
    )), 0)
    outgoing = func.coalesce(func.sum(case(
        ((Transaction.account_id == account.id) & (Transaction.type.in_(["expense", "transfer"])), Transaction.amount),
        else_=Decimal("0.00"),
    )), 0)
    amounts = db.execute(select(incoming, outgoing).where(
        Transaction.user_id == account.user_id,
        Transaction.deleted_at.is_(None),
        Transaction.status == "posted",
    )).one()
    return Decimal(account.opening_balance) + Decimal(amounts[0] or 0) - Decimal(amounts[1] or 0)


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
        if category.type != payload.type and payload.type != "transfer":
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
    db.add(AuditLog(
        user_id=user.id,
        action="transaction.created",
        entity_type="transaction",
        entity_id=transaction.id,
        new_value=json.dumps({"amount": str(transaction.amount), "type": transaction.type, "description": transaction.description}),
    ))
    db.commit()
    db.refresh(transaction)
    return transaction