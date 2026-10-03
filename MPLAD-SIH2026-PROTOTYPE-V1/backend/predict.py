#!/usr/bin/env python3
"""
predict.py — MPLADS Inference Pipeline

Loads a pre-trained Isolation Forest model and scores NEW data
without retraining. Prevents data leakage by construction.

Usage:
    python predict.py --input data/new_batch.csv
    python predict.py --input data/new_batch.csv --threshold 0.90
"""

import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.config import setup_logging, MODEL_DIR
from src.pipeline import run_inference_pipeline


def main():
    parser = argparse.ArgumentParser(
        description="Score new MPLADS data using a pre-trained model"
    )
    parser.add_argument(
        "--input", "-i",
        required=True,
        help="Path to the new raw MPLADS CSV to score",
    )
    parser.add_argument(
        "--output-dir",
        default=None,
        help="Directory for output CSVs (default: outputs/)",
    )
    parser.add_argument(
        "--model-dir",
        default=None,
        help="Directory containing trained model (default: models/)",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=None,
        help="Similarity threshold 0.0–1.0 (default: 0.85)",
    )
    args = parser.parse_args()

    setup_logging()

    if not os.path.exists(args.input):
        print(f"[!] Error: Input file not found: {args.input}")
        sys.exit(1)

    model_path = os.path.join(
        args.model_dir or MODEL_DIR, "isolation_forest_pipeline.pkl"
    )
    if not os.path.exists(model_path):
        print(f"[!] Error: No trained model found at {model_path}")
        print("    Run train.py first to train the model.")
        sys.exit(1)

    risk_path = run_inference_pipeline(
        input_csv=args.input,
        output_dir=args.output_dir,
        model_dir=args.model_dir,
        similarity_threshold=args.threshold,
    )

    print(f"\n[+] Inference complete. Final risk scores -> {risk_path}")


if __name__ == "__main__":
    main()
