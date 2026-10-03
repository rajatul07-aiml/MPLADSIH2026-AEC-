"""
Deterministic Rule Engine

Evaluates hard logical constraints that are 100% independent of
the ML model. Each rule produces a structured violation record
with severity, ID, and human-readable explanation.
"""

import pandas as pd
import numpy as np
import json
import logging

from . import config

logger = logging.getLogger(__name__)


def evaluate_project_rules(row: dict) -> list[dict]:
    """
    Evaluate all deterministic rules for a single project record.
    Returns a list of violation dicts.
    """
    violations = []

    expenditure = row.get("actual_expenditure")
    sanctioned = row.get("sanctioned_amount")
    released = row.get("released_amount")
    estimate = row.get("technical_estimate_amount")
    phys = row.get("physical_progress_percent")
    fin = row.get("financial_progress_percent")

    # ── FINANCIAL RULES ──

    if pd.notna(expenditure) and pd.notna(sanctioned) and expenditure > sanctioned:
        violations.append({
            "rule_id": "FIN-001",
            "rule_name": "Expenditure Exceeds Sanctioned Amount",
            "triggered": True,
            "severity": "HIGH",
            "explanation": (f"Actual expenditure ({expenditure}) exceeds "
                            f"officially sanctioned limit ({sanctioned})."),
        })

    if pd.notna(expenditure) and pd.notna(released) and expenditure > released:
        violations.append({
            "rule_id": "FIN-002",
            "rule_name": "Expenditure Exceeds Released Funds",
            "triggered": True,
            "severity": "HIGH",
            "explanation": (f"Actual expenditure ({expenditure}) is greater "
                            f"than currently released funds ({released})."),
        })

    if pd.notna(released) and pd.notna(sanctioned) and released > sanctioned:
        violations.append({
            "rule_id": "FIN-003",
            "rule_name": "Over-Release of Funds",
            "triggered": True,
            "severity": "HIGH",
            "explanation": (f"Released amount ({released}) exceeds total "
                            f"sanctioned amount ({sanctioned})."),
        })

    if pd.notna(sanctioned) and pd.notna(estimate) and estimate > 0:
        diff_pct = abs(sanctioned - estimate) / estimate * 100
        if diff_pct > config.RULE_ESTIMATE_SANCTION_DIFF_PCT:
            violations.append({
                "rule_id": "FIN-004",
                "rule_name": "Estimate-Sanction Discrepancy",
                "triggered": True,
                "severity": "MEDIUM",
                "explanation": (f"Sanctioned amount ({sanctioned}) deviates from "
                                f"the technical estimate ({estimate}) by {diff_pct:.1f}%."),
            })

    if (pd.notna(expenditure) and pd.notna(sanctioned) and
            pd.notna(phys) and sanctioned > 0):
        if ((expenditure / sanctioned * 100) > config.RULE_COST_UTIL_HIGH and
                phys < config.RULE_PHYS_PROGRESS_LOW):
            violations.append({
                "rule_id": "FIN-005",
                "rule_name": "Unusual Cost Utilization",
                "triggered": True,
                "severity": "CRITICAL",
                "explanation": ("Cost utilization is nearly complete while "
                                "physical progress remains critically negligible."),
            })

    # ── PROGRESS RULES ──

    if pd.notna(fin) and pd.notna(phys):
        if (fin - phys) > config.RULE_FIN_PHYS_GAP:
            violations.append({
                "rule_id": "PROG-001",
                "rule_name": "Disproportionate Financial Progress",
                "triggered": True,
                "severity": "HIGH",
                "explanation": (f"Financial progress ({fin}%) significantly "
                                f"outpaces physical progress ({phys}%)."),
            })
        if (phys - fin) > config.RULE_PHYS_FIN_GAP:
            violations.append({
                "rule_id": "PROG-002",
                "rule_name": "Unpaid Physical Progress",
                "triggered": True,
                "severity": "LOW",
                "explanation": (f"Physical work ({phys}%) significantly outpaces "
                                f"financial drawdown ({fin}%). Potential reporting lag."),
            })

    if pd.notna(phys) and (phys < 0 or phys > 100):
        violations.append({
            "rule_id": "PROG-003",
            "rule_name": "Invalid Physical Progress",
            "triggered": True,
            "severity": "CRITICAL",
            "explanation": (f"Physical progress ({phys}%) falls outside "
                            "logical 0–100% boundary."),
        })

    # ── TIMELINE RULES ──

    start_date = pd.to_datetime(row.get("work_start_date"), errors="coerce")
    comp_date = pd.to_datetime(row.get("actual_completion_date"), errors="coerce")
    exp_date = pd.to_datetime(row.get("expected_completion_date"), errors="coerce")
    sanc_date = pd.to_datetime(row.get("sanction_date"), errors="coerce")
    pay_date = pd.to_datetime(row.get("first_payment_date"), errors="coerce")

    if pd.notna(comp_date) and pd.notna(start_date) and comp_date < start_date:
        violations.append({
            "rule_id": "TIM-001",
            "rule_name": "Chronological Inconsistency",
            "triggered": True,
            "severity": "CRITICAL",
            "explanation": (f"Recorded completion ({comp_date.date()}) precedes "
                            f"start ({start_date.date()})."),
        })

    if pd.notna(pay_date) and pd.notna(sanc_date) and pay_date < sanc_date:
        violations.append({
            "rule_id": "TIM-002",
            "rule_name": "Premature Payment Release",
            "triggered": True,
            "severity": "HIGH",
            "explanation": (f"First payment ({pay_date.date()}) released prior "
                            f"to sanction ({sanc_date.date()})."),
        })

    if pd.notna(comp_date) and pd.notna(exp_date):
        delay = (comp_date - exp_date).days
        if delay > 0:
            violations.append({
                "rule_id": "TIM-003",
                "rule_name": "Project Completion Delayed",
                "triggered": True,
                "severity": "MEDIUM",
                "explanation": f"Project completed {delay} days past the expected date.",
            })

    delay_days_val = row.get("delay_days")
    if (pd.notna(delay_days_val) and
            delay_days_val > config.RULE_EXTREME_DELAY_DAYS and pd.isna(comp_date)):
        violations.append({
            "rule_id": "TIM-004",
            "rule_name": "Unusually Long Active Delay",
            "triggered": True,
            "severity": "HIGH",
            "explanation": (f"Project actively delayed by {delay_days_val} days "
                            "past expected deadline."),
        })

    # ── PAYMENT RULES ──

    num_payments = row.get("number_of_payments")
    pay_freq = row.get("payment_frequency_per_100_days")

    if pd.notna(num_payments) and num_payments > config.RULE_HIGH_PAYMENT_COUNT:
        violations.append({
            "rule_id": "PAY-001",
            "rule_name": "High Payment Frequency",
            "triggered": True,
            "severity": "MEDIUM",
            "explanation": f"Project logs {num_payments} payment transactions.",
        })

    if (pd.notna(pay_freq) and
            pay_freq > config.RULE_AGGRESSIVE_PAYMENT_PACE and pd.notna(start_date)):
        violations.append({
            "rule_id": "PAY-002",
            "rule_name": "Anomalous Payment Pace",
            "triggered": True,
            "severity": "HIGH",
            "explanation": (f"Unusually aggressive {pay_freq:.1f} payments "
                            "per 100 days of duration."),
        })

    # ── DATA CONSISTENCY RULES ──

    for col in ["recommended_amount", "technical_estimate_amount",
                "sanctioned_amount", "released_amount", "actual_expenditure"]:
        val = row.get(col)
        if pd.notna(val) and val < 0:
            violations.append({
                "rule_id": "CON-001",
                "rule_name": "Negative Financial Record",
                "triggered": True,
                "severity": "CRITICAL",
                "explanation": f"Field '{col}' has impossible negative value ({val}).",
            })

    lat = row.get("latitude")
    lon = row.get("longitude")
    if pd.notna(lat) and pd.notna(lon):
        if (not (config.INDIA_LAT_MIN <= lat <= config.INDIA_LAT_MAX) or
                not (config.INDIA_LON_MIN <= lon <= config.INDIA_LON_MAX)):
            violations.append({
                "rule_id": "CON-002",
                "rule_name": "Invalid Geographic Coordinates",
                "triggered": True,
                "severity": "MEDIUM",
                "explanation": (f"Coordinates (Lat {lat}, Lon {lon}) fall outside "
                                "nominal Indian boundaries."),
            })

    if (pd.notna(released) and released == 0 and
            pd.notna(expenditure) and expenditure > 0):
        violations.append({
            "rule_id": "CON-003",
            "rule_name": "Impossible Spending Record",
            "triggered": True,
            "severity": "CRITICAL",
            "explanation": ("Expenditure incurred despite records showing "
                            "0 released funds."),
        })

    return violations


def apply_rules(df: pd.DataFrame) -> pd.DataFrame:
    """
    Run the rule engine across every row.
    Appends: rule_violations_details (JSON), rule_violations_count (int)
    """
    logger.info("Applying deterministic rules to %d rows", len(df))

    all_json = []
    all_counts = []

    for record in df.to_dict("records"):
        results = evaluate_project_rules(record)
        all_json.append(json.dumps(results))
        all_counts.append(len(results))

    df["rule_violations_details"] = all_json
    df["rule_violations_count"] = all_counts

    total_flagged = sum(1 for c in all_counts if c > 0)
    logger.info("Rules complete — %d/%d projects triggered at least one rule",
                total_flagged, len(df))

    return df
