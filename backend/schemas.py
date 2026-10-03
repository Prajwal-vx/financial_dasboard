from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    currency: str = Field(default="NPR", pattern="^[A-Z]{3}$")

    @field_validator("name", mode="before")
    @classmethod
    def trim_name(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.strip().upper() if isinstance(value, str) else value


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower() if isinstance(value, str) else value


class AccountInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    account_type: Literal["cash", "bank", "wallet", "credit_card", "investment", "loan", "other"]
    institution: str | None = Field(default=None, max_length=100)
    currency: str = Field(default="NPR", pattern="^[A-Z]{3}$")
    opening_balance: Decimal = Field(default=Decimal("0.00"), ge=0, max_digits=18, decimal_places=2)

    @field_validator("name", mode="before")
    @classmethod
    def trim_name(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.strip().upper() if isinstance(value, str) else value

    @field_validator("institution", mode="before")
    @classmethod
    def clean_institution(cls, value: str | None) -> str | None:
        if isinstance(value, str):
            val = value.strip()
            return val if val else None
        return value

    @field_validator("opening_balance")
    @classmethod
    def opening_balance_has_cent_precision(cls, value: Decimal) -> Decimal:
        if value.as_tuple().exponent < -2:
            raise ValueError("Opening balance supports at most two decimal places")
        return value


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

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.strip().upper() if isinstance(value, str) else value

    @field_validator("description", mode="before")
    @classmethod
    def trim_description(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value

    @field_validator("merchant", mode="before")
    @classmethod
    def clean_merchant(cls, value: str | None) -> str | None:
        if isinstance(value, str):
            val = value.strip()
            return val if val else None
        return value

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


class CategoryInput(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    type: Literal["income", "expense"]
    icon: str | None = Field(default=None, max_length=40)
    color: str | None = Field(default=None, max_length=24)

    @field_validator("name", mode="before")
    @classmethod
    def trim_name(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value


class CategoryOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    type: str
    parent_id: int | None = None
    icon: str | None = None
    color: str | None = None
    is_system: bool = False


class UserOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    currency: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOutput


class AuthSessionOutput(BaseModel):
    authenticated: bool
    user: UserOutput | None = None


class AccountBalanceSummary(BaseModel):
    account_id: int
    balance: Decimal
    currency: str


class SummaryOutput(BaseModel):
    accounts: list[AccountBalanceSummary]
    account_balance: Decimal
    monthly_income: Decimal
    monthly_expense: Decimal
    month_start: str
    as_of: str
