"""
Feature Engineering Module

Transforms raw operational columns into analytically meaningful
features that the Isolation Forest model can consume.
"""

import pandas as pd
import numpy as np
import logging

from . import config

logger = logging.getLogger(__name__)


def engineer_financial_features(df: pd.DataFrame) -> pd.DataFrame:
    """Derive ratios from financial columns."""
    df["cost_utilization_pct"] = np.where(
        df["sanctioned_amount"] > 0,
        (df["actual_expenditure"] / df["sanctioned_amount"]) * 100,
        np.nan,
    )
    df["release_utilization_pct"] = np.where(
        df["released_amount"] > 0,
        (df["actual_expenditure"] / df["released_amount"]) * 100,
        np.nan,
    )
    df["cost_deviation_pct"] = np.where(
        df["sanctioned_amount"] > 0,
        ((df["actual_expenditure"] - df["sanctioned_amount"]) / df["sanctioned_amount"]) * 100,
        np.nan,
    )
    df["estimate_to_sanction_ratio"] = np.where(
        df["technical_estimate_amount"] > 0,
        df["sanctioned_amount"] / df["technical_estimate_amount"],
        np.nan,
    )
    df["approval_to_sanction_ratio"] = np.where(
        df["administrative_approval_amount"] > 0,
        df["sanctioned_amount"] / df["administrative_approval_amount"],
        np.nan,
    )
    df["release_to_sanction_ratio"] = np.where(
        df["sanctioned_amount"] > 0,
        df["released_amount"] / df["sanctioned_amount"],
        np.nan,
    )
    return df


def engineer_progress_features(df: pd.DataFrame) -> pd.DataFrame:
    """Derive progress-gap metrics."""
    df["financial_physical_gap"] = (
        df["financial_progress_percent"] - df["physical_progress_percent"]
    )
    df["expenditure_per_progress_percent"] = np.where(
        df["physical_progress_percent"] > 0,
        df["actual_expenditure"] / df["physical_progress_percent"],
        np.nan,
    )
    return df


def engineer_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """Derive timeline durations and delay metrics."""
    ref = pd.to_datetime(config.REFERENCE_DATE)

    df["planned_duration_days"] = (
        df["expected_completion_date"] - df["work_start_date"]
    ).dt.days

    df["elapsed_days"] = (ref - df["work_start_date"]).dt.days
    df["elapsed_days"] = np.where(df["elapsed_days"] < 0, 0, df["elapsed_days"])

    has_actual = df["actual_completion_date"].notna()
    completed_delay = (
        df["actual_completion_date"] - df["expected_completion_date"]
    ).dt.days
    ongoing_delay = df["elapsed_days"] - df["planned_duration_days"]

    df["delay_days"] = np.where(has_actual, completed_delay, ongoing_delay)
    return df


def engineer_payment_features(df: pd.DataFrame) -> pd.DataFrame:
    """Derive payment-rate metrics."""
    df["payment_frequency_per_100_days"] = np.where(
        df["planned_duration_days"] > 0,
        (df["number_of_payments"] / df["planned_duration_days"]) * 100,
        np.nan,
    )
    df["average_payment_amount"] = np.where(
        df["number_of_payments"] > 0,
        df["actual_expenditure"] / df["number_of_payments"],
        np.nan,
    )
    return df


def sanitize(df: pd.DataFrame) -> pd.DataFrame:
    """Replace infinities with NaN across engineered columns."""
    engineered = [
        "cost_utilization_pct", "release_utilization_pct", "cost_deviation_pct",
        "estimate_to_sanction_ratio", "approval_to_sanction_ratio",
        "release_to_sanction_ratio", "financial_physical_gap",
        "expenditure_per_progress_percent", "planned_duration_days",
        "elapsed_days", "delay_days", "payment_frequency_per_100_days",
        "average_payment_amount",
    ]
    present = [c for c in engineered if c in df.columns]
    df[present] = df[present].replace([np.inf, -np.inf], np.nan)
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Full feature-engineering entry point.
    Applies all transforms and returns the augmented DataFrame.
    """
    logger.info("Starting feature engineering on %d rows", len(df))

    df = engineer_financial_features(df)
    df = engineer_progress_features(df)
    df = engineer_time_features(df)
    df = engineer_payment_features(df)
    df = sanitize(df)

    logger.info("Feature engineering complete — %d columns total", df.shape[1])
    return df
