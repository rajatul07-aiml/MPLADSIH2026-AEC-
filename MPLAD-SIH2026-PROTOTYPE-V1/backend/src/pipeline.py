"""
Pipeline Orchestrator

Wires every engine together in the correct order:
  raw → validate → features → ML → rules → similarity → risk

Used by both train.py and predict.py.
"""

import os
import logging

import pandas as pd

from . import config
from .data_validation import validate
from .feature_engineering import engineer_features
from .isolation_forest_model import train as ml_train, predict as ml_predict
from .rule_engine import apply_rules
from .similarity_engine import apply_similarity
from .risk_engine import aggregate_risk

logger = logging.getLogger(__name__)


def run_training_pipeline(input_csv: str,
                          output_dir: str | None = None,
                          model_dir: str | None = None,
                          similarity_threshold: float | None = None) -> str:
    """
    Full training pipeline: validate → engineer → train ML → rules →
    similarity → risk aggregation → save outputs.

    Returns the path to the final risk CSV.
    """
    output_dir = output_dir or config.OUTPUT_DIR
    model_dir = model_dir or config.MODEL_DIR
    os.makedirs(output_dir, exist_ok=True)

    logger.info("═══ MPLADS TRAINING PIPELINE START ═══")

    # Phase 2 — Validation
    logger.info("── Phase 2: Data Validation ──")
    df = validate(input_csv)

    # Phase 3 — Feature Engineering
    logger.info("── Phase 3: Feature Engineering ──")
    df = engineer_features(df)

    # Phase 4 — Isolation Forest (train + score)
    logger.info("── Phase 4: Isolation Forest Training ──")
    df = ml_train(df, model_dir=model_dir)

    # Phase 5 — Rule Engine
    logger.info("── Phase 5: Rule Engine ──")
    df = apply_rules(df)

    # Phase 6 — Similarity Engine
    logger.info("── Phase 6: Similarity Engine ──")
    df, pairs = apply_similarity(df, threshold=similarity_threshold)

    # Phase 7 — Risk Aggregation
    logger.info("── Phase 7: Risk Aggregation ──")
    df_risk = aggregate_risk(df)

    # Save outputs
    risk_path = os.path.join(output_dir, "final_risk_scores.csv")
    df_risk.to_csv(risk_path, index=False)
    logger.info("Final risk output saved → %s", risk_path)

    # Save suspicious pairs separately
    if pairs:
        pairs_path = os.path.join(output_dir, "similarity_pairs.json")
        import json
        with open(pairs_path, "w") as f:
            json.dump(pairs, f, indent=2)
        logger.info("Similarity pairs saved → %s (%d pairs)", pairs_path, len(pairs))

    logger.info("═══ TRAINING PIPELINE COMPLETE ═══")
    return risk_path


def run_inference_pipeline(input_csv: str,
                           output_dir: str | None = None,
                           model_dir: str | None = None,
                           similarity_threshold: float | None = None) -> str:
    """
    Inference pipeline: same flow but loads a pre-trained model
    instead of training a new one. NO data leakage by design.

    Returns the path to the final risk CSV.
    """
    output_dir = output_dir or config.OUTPUT_DIR
    model_dir = model_dir or config.MODEL_DIR
    os.makedirs(output_dir, exist_ok=True)

    logger.info("═══ MPLADS INFERENCE PIPELINE START ═══")

    # Phase 2
    logger.info("── Phase 2: Data Validation ──")
    df = validate(input_csv)

    # Phase 3
    logger.info("── Phase 3: Feature Engineering ──")
    df = engineer_features(df)

    # Phase 4 — Load pre-trained model, score only
    logger.info("── Phase 4: Isolation Forest Inference ──")
    df = ml_predict(df, model_dir=model_dir)

    # Phase 5
    logger.info("── Phase 5: Rule Engine ──")
    df = apply_rules(df)

    # Phase 6
    logger.info("── Phase 6: Similarity Engine ──")
    df, pairs = apply_similarity(df, threshold=similarity_threshold)

    # Phase 7
    logger.info("── Phase 7: Risk Aggregation ──")
    df_risk = aggregate_risk(df)

    # Save
    risk_path = os.path.join(output_dir, "final_risk_scores.csv")
    df_risk.to_csv(risk_path, index=False)
    logger.info("Final risk output saved → %s", risk_path)

    if pairs:
        pairs_path = os.path.join(output_dir, "similarity_pairs.json")
        import json
        with open(pairs_path, "w") as f:
            json.dump(pairs, f, indent=2)
        logger.info("Similarity pairs saved → %s", pairs_path)

    logger.info("═══ INFERENCE PIPELINE COMPLETE ═══")
    return risk_path
