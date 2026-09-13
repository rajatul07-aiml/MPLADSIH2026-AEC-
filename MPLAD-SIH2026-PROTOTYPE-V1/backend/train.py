#!/usr/bin/env python3
"""
train.py — MPLADS Full Training Pipeline

Usage:
    python train.py                                          # uses default paths
    python train.py --input data/raw.csv                     # custom input
    python train.py --input data/raw.csv --threshold 0.90    # custom similarity threshold
"""

import argparse
import sys
import os

# Ensure project root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.config import setup_logging, DATA_DIR
from src.pipeline import run_training_pipeline


def main():
    parser = argparse.ArgumentParser(
        description="Train the MPLADS anomaly detection pipeline"
    )
    parser.add_argument(
        "--input", "-i",
        default=os.path.join(DATA_DIR, "raw.csv"),
        help="Path to the raw MPLADS CSV (default: data/raw.csv)",
    )
    parser.add_argument(
        "--output-dir",
        default=None,
        help="Directory for output CSVs (default: outputs/)",
    )
    parser.add_argument(
        "--model-dir",
        default=None,
        help="Directory to save trained model (default: models/)",
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
        print("    Place your raw MPLADS CSV at data/raw.csv or specify --input")
        sys.exit(1)

    risk_path = run_training_pipeline(
        input_csv=args.input,
        output_dir=args.output_dir,
        model_dir=args.model_dir,
        similarity_threshold=args.threshold,
    )

    print(f"\n[+] Training complete. Final risk scores -> {risk_path}")
    print(f"[+] Trained model saved in models/")


if __name__ == "__main__":
    main()
