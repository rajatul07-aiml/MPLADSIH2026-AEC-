"""
Isolation Forest Anomaly Model

Unsupervised anomaly detection. Trains on engineered features,
persists the fitted pipeline + feature list via joblib, and
scores new data without retraining.
"""

import pandas as pd
import numpy as np
import joblib
import os
import logging

from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

from . import config

logger = logging.getLogger(__name__)


def _build_pipeline() -> Pipeline:
    """Construct the imputer → IsolationForest sklearn pipeline."""
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("iforest", IsolationForest(
            n_estimators=config.IFOREST_N_ESTIMATORS,
            contamination=config.IFOREST_CONTAMINATION,
            random_state=config.IFOREST_RANDOM_STATE,
            n_jobs=-1,
            verbose=0,
        )),
    ])


def _normalize_scores(raw_scores: np.ndarray) -> tuple[np.ndarray, dict]:
    """
    Robust 0–100 normalisation.
    Clips at 1st/99th percentile, then linear-scales.

    Returns (normalised_array, params_dict) so the training run
    can persist the percentile anchors for later single-row inference.
    """
    inverted = -raw_scores
    p1 = float(np.percentile(inverted, 1))
    p99 = float(np.percentile(inverted, 99))
    clipped = np.clip(inverted, p1, p99)
    span = max(p99 - p1, 1e-9)
    normalised = ((clipped - p1) / span) * 100
    return normalised, {"p1": p1, "p99": p99}


def _normalize_scores_with_params(raw_scores: np.ndarray,
                                  params: dict) -> np.ndarray:
    """
    Apply the SAME normalisation used during training, using
    pre-computed p1/p99 anchors. Safe for any batch size including 1.
    """
    inverted = -raw_scores
    p1 = params["p1"]
    p99 = params["p99"]
    clipped = np.clip(inverted, p1, p99)
    span = max(p99 - p1, 1e-9)
    return ((clipped - p1) / span) * 100


def _strip_labels(df: pd.DataFrame) -> pd.Series | None:
    """
    Remove any known ground-truth label columns so they are
    NEVER used as model features. Returns the popped series or None.
    """
    for col in config.LABEL_CANDIDATES:
        if col in df.columns:
            labels = df.pop(col)
            logger.info("Ground-truth column '%s' stripped via .pop() — "
                        "never used as a model feature", col)
            return labels
    return None


def _select_features(df: pd.DataFrame) -> pd.DataFrame:
    """Select and clean the ML feature matrix."""
    valid = [f for f in config.ML_FEATURE_SET if f in df.columns]
    missing = set(config.ML_FEATURE_SET) - set(valid)
    if missing:
        logger.warning("Features not found in data (will be skipped): %s", missing)

    X = df[valid].copy()
    X = X.replace([np.inf, -np.inf], np.nan)
    return X


# ───────────────────── PUBLIC API ─────────────────────

def train(df: pd.DataFrame, model_dir: str | None = None) -> pd.DataFrame:
    """
    Train the Isolation Forest on the full dataset (unsupervised)
    and persist the model + feature list.

    Returns the DataFrame with three new columns:
      ml_anomaly_prediction  (0/1)
      ml_raw_anomaly_score   (float)
      ml_anomaly_risk_score  (0–100)
    """
    model_dir = model_dir or config.MODEL_DIR
    os.makedirs(model_dir, exist_ok=True)

    _strip_labels(df)      # remove any ground-truth first
    X = _select_features(df)

    logger.info("Training Isolation Forest on %d rows × %d features", *X.shape)

    pipeline = _build_pipeline()
    pipeline.fit(X)

    # Score
    raw_scores = pipeline.decision_function(X)
    normalised, norm_params = _normalize_scores(raw_scores)
    predictions = pipeline.predict(X)

    df["ml_anomaly_prediction"] = np.where(predictions == -1, 1, 0)
    df["ml_raw_anomaly_score"] = raw_scores
    df["ml_anomaly_risk_score"] = np.round(normalised, 2)

    anomaly_count = int((df["ml_anomaly_prediction"] == 1).sum())
    logger.info("Training complete — %d anomalies flagged (%.1f%%)",
                anomaly_count, anomaly_count / len(df) * 100)

    # Persist
    model_path = os.path.join(model_dir, "isolation_forest_pipeline.pkl")
    features_path = os.path.join(model_dir, "feature_list.json")
    norm_path = os.path.join(model_dir, "score_normalization_params.json")

    joblib.dump(pipeline, model_path)
    logger.info("Model saved → %s", model_path)

    import json
    with open(features_path, "w") as f:
        json.dump(list(X.columns), f, indent=2)
    logger.info("Feature list saved → %s", features_path)

    with open(norm_path, "w") as f:
        json.dump(norm_params, f, indent=2)
    logger.info("Normalization params saved → %s (p1=%.6f, p99=%.6f)",
                norm_path, norm_params["p1"], norm_params["p99"])

    return df


def predict(df: pd.DataFrame, model_dir: str | None = None) -> pd.DataFrame:
    """
    Load a previously trained model and score new data
    WITHOUT retraining. Avoids data leakage by construction.
    """
    import json

    model_dir = model_dir or config.MODEL_DIR
    model_path = os.path.join(model_dir, "isolation_forest_pipeline.pkl")
    features_path = os.path.join(model_dir, "feature_list.json")
    norm_path = os.path.join(model_dir, "score_normalization_params.json")

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Trained model not found at {model_path}. Run train.py first."
        )

    pipeline = joblib.load(model_path)
    logger.info("Loaded trained model from %s", model_path)

    # Load exact feature list used during training
    with open(features_path) as f:
        trained_features = json.load(f)

    with open(norm_path) as f:
        norm_params = json.load(f)

    _strip_labels(df)

    # Ensure feature alignment — add missing columns as NaN
    for feat in trained_features:
        if feat not in df.columns:
            logger.warning("Feature '%s' missing in new data — filled with NaN", feat)
            df[feat] = np.nan

    X = df[trained_features].copy()
    X = X.replace([np.inf, -np.inf], np.nan)

    logger.info("Scoring %d rows with trained model", len(X))

    raw_scores = pipeline.decision_function(X)
    normalised = _normalize_scores_with_params(raw_scores, norm_params)
    predictions = pipeline.predict(X)

    df["ml_anomaly_prediction"] = np.where(predictions == -1, 1, 0)
    df["ml_raw_anomaly_score"] = raw_scores
    df["ml_anomaly_risk_score"] = np.round(normalised, 2)

    anomaly_count = int((df["ml_anomaly_prediction"] == 1).sum())
    logger.info("Inference complete — %d anomalies flagged", anomaly_count)

    return df
