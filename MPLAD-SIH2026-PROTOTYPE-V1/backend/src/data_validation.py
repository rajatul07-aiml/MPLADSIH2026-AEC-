"""
Data Validation Module

Loads raw CSV, verifies expected schema, parses dates,
and produces a data quality report. Returns a clean DataFrame
ready for feature engineering.
"""

import pandas as pd
import numpy as np
import logging

from . import config

logger = logging.getLogger(__name__)


def load_raw_data(filepath: str) -> pd.DataFrame:
    """Load raw CSV and parse date columns."""
    logger.info("Loading raw data from: %s", filepath)
    df = pd.read_csv(filepath)
    logger.info("Loaded %d rows x %d columns", *df.shape)

    for col in config.DATE_COLUMNS:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")

    return df


def verify_schema(df: pd.DataFrame) -> list[str]:
    """Check that all expected columns exist. Returns list of missing ones."""
    missing = [c for c in config.EXPECTED_RAW_COLUMNS if c not in df.columns]
    if missing:
        logger.warning("Missing expected columns: %s", missing)
    else:
        logger.info("Schema verification passed - all %d columns present",
                     len(config.EXPECTED_RAW_COLUMNS))
    return missing


def run_quality_checks(df: pd.DataFrame) -> dict:
    """
    Run data-quality checks and return a summary dict.
    Does NOT modify the DataFrame.
    """
    report = {}

    # Missing values
    missing = df.isnull().sum()
    report["missing_values"] = missing[missing > 0].to_dict()

    # Duplicates
    report["duplicate_work_ids"] = int(df.duplicated(subset=["work_id"]).sum())

    # Negative finances
    fin_cols = [
        "recommended_amount", "technical_estimate_amount",
        "administrative_approval_amount", "sanctioned_amount",
        "released_amount", "actual_expenditure",
    ]
    present = [c for c in fin_cols if c in df.columns]
    report["negative_financial_values"] = int(
        (df[present] < 0).any(axis=1).sum()
    )

    # Progress out of range
    if "physical_progress_percent" in df.columns and "financial_progress_percent" in df.columns:
        report["invalid_progress"] = int(
            ((df["physical_progress_percent"] < 0) |
             (df["physical_progress_percent"] > 100) |
             (df["financial_progress_percent"] < 0) |
             (df["financial_progress_percent"] > 100)).sum()
        )

    # Lat/lon outside India
    if "latitude" in df.columns and "longitude" in df.columns:
        report["out_of_bounds_coords"] = int(
            ((df["latitude"] < config.INDIA_LAT_MIN) |
             (df["latitude"] > config.INDIA_LAT_MAX) |
             (df["longitude"] < config.INDIA_LON_MIN) |
             (df["longitude"] > config.INDIA_LON_MAX)).sum()
        )

    return report


def validate(filepath: str) -> pd.DataFrame:
    """
    Full validation entry point.
    Returns the loaded, date-parsed DataFrame.
    """
    df = load_raw_data(filepath)
    missing_cols = verify_schema(df)
    if missing_cols:
        logger.error("Cannot proceed - critical columns missing: %s", missing_cols)
        raise ValueError(f"Missing required columns: {missing_cols}")

    report = run_quality_checks(df)

    logger.info("- Data Quality Report -")
    logger.info("Duplicate work_ids: %d", report["duplicate_work_ids"])
    logger.info("Rows with negative financials: %d", report.get("negative_financial_values", 0))
    logger.info("Invalid progress values: %d", report.get("invalid_progress", 0))
    logger.info("Out-of-bounds coordinates: %d", report.get("out_of_bounds_coords", 0))

    mv = report["missing_values"]
    if mv:
        for col, cnt in mv.items():
            logger.info("  Missing - %s: %d (%.1f%%)", col, cnt, cnt / len(df) * 100)
    else:
        logger.info("  No missing values detected.")

    return df
def validate_single_record(payload: dict) -> list[str]:
    """
    Validates a single record (dictionary) for business rules.
    Returns a list of error strings. If empty, validation passed.
    """
    errors = []
    
    fin_cols = [
        "recommended_amount", "technical_estimate_amount",
        "administrative_approval_amount", "sanctioned_amount",
        "released_amount", "actual_expenditure",
    ]
    for col in fin_cols:
        val = payload.get(col)
        if val is not None and isinstance(val, (int, float)) and val < 0:
            errors.append(f"Invalid financial value: {col} cannot be negative")

    phys_prog = payload.get("physical_progress_percent")
    if phys_prog is not None and isinstance(phys_prog, (int, float)) and (phys_prog < 0 or phys_prog > 100):
        errors.append("Invalid progress value")

    fin_prog = payload.get("financial_progress_percent")
    if fin_prog is not None and isinstance(fin_prog, (int, float)) and (fin_prog < 0 or fin_prog > 100):
        errors.append("Invalid progress value")

    lat = payload.get("latitude")
    if lat is not None and isinstance(lat, (int, float)):
        if lat < config.INDIA_LAT_MIN or lat > config.INDIA_LAT_MAX:
            errors.append("Invalid coordinates")

    lon = payload.get("longitude")
    if lon is not None and isinstance(lon, (int, float)):
        if lon < config.INDIA_LON_MIN or lon > config.INDIA_LON_MAX:
            errors.append("Invalid coordinates")
            
    return errors

