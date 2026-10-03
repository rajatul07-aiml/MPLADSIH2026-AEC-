"""
Risk Aggregation Engine

Combines ML anomaly scores, deterministic rule violations, and
NLP similarity scores into a unified 0–100 risk prioritization score.

IMPORTANT: The system flags projects as "Priority for human verification".
           It does NOT declare fraud.
"""

import pandas as pd
import numpy as np
import json
import logging

from . import config

logger = logging.getLogger(__name__)


def _rule_score(details_json) -> float:
    """Translate rule-violation JSON into a continuous 0–100 score."""
    if pd.isna(details_json) or details_json == "":
        return 0.0
    try:
        violations = json.loads(details_json)
    except (json.JSONDecodeError, TypeError):
        return 0.0

    total = sum(
        config.RULE_SEVERITY_MAP.get(v.get("severity", "LOW").upper(), 25)
        for v in violations
    )
    return float(min(total, 100.0))


def _assign_level(score: int) -> str:
    """Map a 0–100 score to a risk-level label."""
    for label, threshold in config.RISK_BINS.items():
        if score >= threshold:
            return label
    return "Low"


def _explain(row: pd.Series) -> str:
    """Build a human-readable explanation for the risk score."""
    reasons = []

    # Rule-engine reasons
    details = row.get("rule_violations_details", "[]")
    if pd.notna(details) and str(details) != "[]":
        try:
            for v in json.loads(details):
                reasons.append(f"- {v.get('rule_name', 'Rule violation').lower()}")
        except (json.JSONDecodeError, TypeError):
            pass

    # Similarity reasons
    if row.get("nlp_max_similarity_score", 0) >= config.SIMILARITY_THRESHOLD:
        reasons.append("- highly similar work descriptions detected in local geography")

    # ML reasons
    if (row.get("ml_anomaly_prediction", 0) == 1 or
            row.get("ml_raw_anomaly_score", 0) < 0):
        reasons.append(
            "- machine learning engine detected unusual multivariate feature patterns"
        )

    reasons_str = "\n".join(reasons) if reasons else "- no significant anomalies flagged"

    return (
        f"Risk Score: {row['final_risk_score']}\n"
        f"Risk Level: {row['risk_level']}\n\n"
        f"ML Anomaly Contribution: {row['ml_risk_score']} × {config.WEIGHT_ML:.0%}\n"
        f"Rules Contribution: {row['rule_risk_score']} × {config.WEIGHT_RULES:.0%}\n"
        f"Similarity Contribution: {row['similarity_risk_score']} × {config.WEIGHT_SIMILARITY:.0%}\n\n"
        f"Reasons:\n{reasons_str}\n\n"
        f"Status: Priority for human verification."
    )


def aggregate_risk(df: pd.DataFrame) -> pd.DataFrame:
    """
    Main entry point.
    Returns a SEPARATE DataFrame with only risk-intelligence columns —
    cleanly separated from raw project data.
    """
    logger.info("Aggregating risk — weights ML=%.0f%% Rules=%.0f%% Sim=%.0f%%",
                config.WEIGHT_ML * 100, config.WEIGHT_RULES * 100,
                config.WEIGHT_SIMILARITY * 100)

    # Component scores
    df["ml_risk_score"] = df["ml_anomaly_risk_score"].fillna(0)
    df["rule_risk_score"] = df["rule_violations_details"].apply(_rule_score)
    df["similarity_risk_score"] = df["nlp_max_similarity_score"].fillna(0) * 100

    # Weighted sum
    df["final_risk_score"] = (
        (df["ml_risk_score"] * config.WEIGHT_ML) +
        (df["rule_risk_score"] * config.WEIGHT_RULES) +
        (df["similarity_risk_score"] * config.WEIGHT_SIMILARITY)
    ).round(0).astype(int)

    # Labels & explanations
    df["risk_level"] = df["final_risk_score"].apply(_assign_level)
    df["risk_explanation"] = df.apply(_explain, axis=1)

    # Extract clean output
    output_cols = {
        "work_id": "work_id",
        "ml_raw_anomaly_score": "anomaly_score",
        "ml_anomaly_prediction": "anomaly_prediction",
        "ml_risk_score": "ml_risk_score",
        "rule_risk_score": "rule_risk_score",
        "similarity_risk_score": "similarity_risk_score",
        "final_risk_score": "final_risk_score",
        "risk_level": "risk_level",
        "risk_explanation": "risk_explanation",
    }

    df_out = df[list(output_cols.keys())].rename(columns=output_cols)

    logger.info("Risk distribution:\n%s", df_out["risk_level"].value_counts().to_string())

    return df_out
