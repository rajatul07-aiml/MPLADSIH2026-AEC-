"""
NLP Similarity Detection Engine

Uses TF-IDF + cosine similarity to find potentially duplicated
MPLADS works within the same geographic district.
"""

import pandas as pd
import numpy as np
import re
import json
import logging

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from . import config

logger = logging.getLogger(__name__)


def _normalize_text(text) -> str:
    """Lowercase + strip special chars. Returns '' for NaN."""
    if pd.isna(text):
        return ""
    text = str(text).lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    return text.strip()


def _process_district(df_group: pd.DataFrame,
                      threshold: float) -> list[dict]:
    """Pairwise cosine similarity within one district group."""
    df_group = df_group[df_group["work_description_clean"] != ""].reset_index(drop=True)
    if len(df_group) < 2:
        return []

    descriptions = df_group["work_description_clean"].tolist()

    vectorizer = TfidfVectorizer(stop_words="english")
    try:
        tfidf_matrix = vectorizer.fit_transform(descriptions)
    except ValueError:
        return []

    sim_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)
    pairs = []

    for i in range(len(sim_matrix)):
        for j in range(i + 1, len(sim_matrix)):
            score = sim_matrix[i, j]
            if score < threshold:
                continue

            w1 = df_group.iloc[i]
            w2 = df_group.iloc[j]

            matching_wt = w1.get("work_type") == w2.get("work_type")
            matching_const = w1.get("constituency") == w2.get("constituency")
            matching_sector = w1.get("sector") == w2.get("sector")

            loc = (f"same constituency ({w1.get('constituency')})"
                   if matching_const else "same district")
            wt = (f" and identical work type ('{w1.get('work_type')}')"
                  if matching_wt else "")

            pairs.append({
                "work_id_1": w1["work_id"],
                "work_id_2": w2["work_id"],
                "text_similarity_score": round(float(score), 4),
                "matching_work_type": bool(matching_wt),
                "matching_location": bool(matching_const),
                "matching_sector": bool(matching_sector),
                "explanation": (
                    f"Two works exhibit highly similar descriptions "
                    f"({score * 100:.1f}% match) in the {loc}{wt}. "
                    f"This is a potential duplicate requiring verification."
                ),
            })

    return pairs


def apply_similarity(df: pd.DataFrame,
                     threshold: float | None = None) -> tuple[pd.DataFrame, list[dict]]:
    """
    Full similarity-detection entry point.

    Returns (augmented_df, list_of_suspicious_pairs).
    Appends: nlp_max_similarity_score, nlp_similarity_details
    """
    threshold = threshold or config.SIMILARITY_THRESHOLD

    logger.info("Running similarity engine (threshold=%.2f)", threshold)

    df["work_description_clean"] = df["work_description"].apply(_normalize_text)

    valid_geo = df["state"].notna() & df["district"].notna()
    df_valid = df[valid_geo].copy()
    skipped = len(df) - len(df_valid)
    if skipped:
        logger.warning("%d rows skipped — missing state/district", skipped)

    grouped = df_valid.groupby(list(config.SIMILARITY_GROUP_BY))
    all_pairs: list[dict] = []

    for _key, group in grouped:
        all_pairs.extend(_process_district(group, threshold))

    logger.info("Processed %d geographic groups — %d similar pairs found",
                len(grouped), len(all_pairs))

    # Map scores back
    scores_map: dict[str, float] = {}
    details_map: dict[str, list] = {}

    for pair in all_pairs:
        w1, w2 = pair["work_id_1"], pair["work_id_2"]
        sc = pair["text_similarity_score"]

        if w1 not in scores_map or sc > scores_map[w1]:
            scores_map[w1] = sc
        if w2 not in scores_map or sc > scores_map[w2]:
            scores_map[w2] = sc

        details_map.setdefault(w1, []).append(pair)
        details_map.setdefault(w2, []).append(pair)

    df["nlp_max_similarity_score"] = df["work_id"].map(scores_map).fillna(0.0)
    df["nlp_similarity_details"] = df["work_id"].map(
        lambda x: json.dumps(details_map.get(x, []))
    )

    df = df.drop(columns=["work_description_clean"])
    return df, all_pairs
