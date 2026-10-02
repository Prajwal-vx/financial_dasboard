from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    currency: str = Field(default="NPR", pattern="^[A-Z]{3}$")


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AccountInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    account_type: Literal["cash", "bank", "wallet", "credit_card", "investment", "loan", "other"]
    institution: str | None = Field(default=None, max_length=100)
    currency: str = Field(default="NPR", pattern="^[A-Z]{3}$")
    opening_balance: Decimal = Field(default=Decimal("0.00"), ge=0, max_digits=18, decimal_places=2)


class TransactionInput(BaseModel):
    account_id: int = Field(gt=0)
    destination_account_id: int | None = Field(default=None, gt=0)
    category_id: int | None = Field(default=None, gt=0)
    type: Literal["income", "expense", "transfer"]
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    currency: str = Field(default="NPR", pattern="^[A-Z]{3}$")
    merchant: str | None = Field(default=None, max_length=120)
    description: str = Field(min_length=1, max_length=240)
    transaction_date: date
    status: Literal["posted", "pending"] = "posted"
    source: Literal["manual", "import"] = "manual"

    @field_validator("amount")
    @classmethod
    def amount_has_cent_precision(cls, value: Decimal) -> Decimal:
        if value.as_tuple().exponent < -2:
            raise ValueError("Amount supports at most two decimal places")
        return value


class AccountOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    account_type: str
    institution: str | None
    currency: str
    opening_balance: Decimal
    current_balance: Decimal


class TransactionOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    account_id: int
    destination_account_id: int | None
    category_id: int | None
    type: str
    amount: Decimal
    currency: str
    merchant: str | None
    description: str
    transaction_date: date
    status: str
    source: str