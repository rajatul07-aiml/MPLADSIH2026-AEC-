"""
MPLADS ML Pipeline — Central Configuration

All tunable parameters live here. Nothing is hardcoded inside the
individual engine modules, making the pipeline fully configurable
without touching engine logic.
"""

import os
import logging
from datetime import datetime

# ──────────────────────────────────────────────
# PATHS
# ──────────────────────────────────────────────
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
MODEL_DIR = os.path.join(PROJECT_ROOT, "models")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "outputs")

# ──────────────────────────────────────────────
# FEATURE ENGINEERING
# ──────────────────────────────────────────────
REFERENCE_DATE = datetime(2025, 9, 1)

DATE_COLUMNS = [
    "work_start_date", "sanction_date",
    "expected_completion_date", "actual_completion_date",
    "first_payment_date", "last_payment_date",
]

EXPECTED_RAW_COLUMNS = [
    "work_id", "mp_id", "constituency_id", "state", "district",
    "constituency", "block", "village_or_urban_area", "sector",
    "sub_sector", "work_type", "work_description",
    "recommended_amount", "technical_estimate_amount",
    "administrative_approval_amount", "sanctioned_amount",
    "released_amount", "actual_expenditure",
    "work_start_date", "sanction_date",
    "expected_completion_date", "actual_completion_date",
    "physical_progress_percent", "financial_progress_percent",
    "number_of_payments", "first_payment_date", "last_payment_date",
    "implementing_agency_id", "contractor_id",
    "latitude", "longitude",
    "number_of_progress_updates", "inspection_count",
]

# ──────────────────────────────────────────────
# ISOLATION FOREST
# ──────────────────────────────────────────────
ML_FEATURE_SET = [
    "cost_utilization_pct", "release_utilization_pct", "cost_deviation_pct",
    "financial_physical_gap", "planned_duration_days", "elapsed_days",
    "delay_days", "payment_frequency_per_100_days", "average_payment_amount",
    "expenditure_per_progress_percent", "estimate_to_sanction_ratio",
    "approval_to_sanction_ratio", "release_to_sanction_ratio",
    "physical_progress_percent", "financial_progress_percent",
    "number_of_payments", "inspection_count", "number_of_progress_updates",
]

IFOREST_N_ESTIMATORS = 300
IFOREST_CONTAMINATION = "auto"
IFOREST_RANDOM_STATE = 42

# Columns that should NEVER be used as model features
# (ground-truth / target labels that must be popped before training)
LABEL_CANDIDATES = [
    "DATA_LABEL", "synthetic_anomaly_type",
    "anomaly_type", "anomaly_flag",
]

# ──────────────────────────────────────────────
# RULE ENGINE
# ──────────────────────────────────────────────
RULE_SEVERITY_MAP = {
    "CRITICAL": 100,
    "HIGH": 75,
    "MEDIUM": 50,
    "LOW": 25,
}

# Thresholds
RULE_ESTIMATE_SANCTION_DIFF_PCT = 20      # FIN-004: percentage gap
RULE_COST_UTIL_HIGH = 90                  # FIN-005: cost utilization %
RULE_PHYS_PROGRESS_LOW = 10              # FIN-005: physical progress %
RULE_FIN_PHYS_GAP = 30                   # PROG-001: financial > physical
RULE_PHYS_FIN_GAP = 50                   # PROG-002: physical > financial
RULE_EXTREME_DELAY_DAYS = 365            # TIM-004: extreme delay
RULE_HIGH_PAYMENT_COUNT = 20             # PAY-001: high payments
RULE_AGGRESSIVE_PAYMENT_PACE = 30        # PAY-002: payments per 100 days

# India bounding box for coordinates
INDIA_LAT_MIN, INDIA_LAT_MAX = 8.0, 38.0
INDIA_LON_MIN, INDIA_LON_MAX = 68.0, 98.0

# ──────────────────────────────────────────────
# SIMILARITY ENGINE
# ──────────────────────────────────────────────
SIMILARITY_THRESHOLD = 0.85
SIMILARITY_GROUP_BY = ["state", "district"]

# ──────────────────────────────────────────────
# RISK AGGREGATION
# ──────────────────────────────────────────────
WEIGHT_ML = 0.50
WEIGHT_RULES = 0.30
WEIGHT_SIMILARITY = 0.20

RISK_BINS = {
    "Critical": 75,
    "High":     50,
    "Medium":   25,
    "Low":       0,
}

# ──────────────────────────────────────────────
# LOGGING
# ──────────────────────────────────────────────
LOG_FORMAT = "[%(asctime)s] %(levelname)s — %(name)s — %(message)s"
LOG_DATEFMT = "%Y-%m-%d %H:%M:%S"

def setup_logging(level=logging.INFO):
    """Configure root logger for the entire pipeline."""
    logging.basicConfig(
        level=level,
        format=LOG_FORMAT,
        datefmt=LOG_DATEFMT,
    )
