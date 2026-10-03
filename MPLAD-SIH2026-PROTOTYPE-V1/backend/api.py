import logging
from contextlib import asynccontextmanager
import pandas as pd
import json
import os
import math
from datetime import datetime
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware

from src import config
from src.data_validation import run_quality_checks, validate_single_record
from src.feature_engineering import engineer_features
from src.isolation_forest_model import predict as ml_predict
from src.rule_engine import apply_rules
from src.similarity_engine import apply_similarity
from src.risk_engine import aggregate_risk

# Set up logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Global cache for data
DATA_CACHE = {
    "df_merged": pd.DataFrame(),
    "raw_works_dict": {},
}

# (added verification / audit datastore)
VERIFICATION_CACHE = {}
AUDIT_TRAIL = {}

def load_data():
    raw_path = os.path.join(config.DATA_DIR, "raw.csv")
    risk_path = os.path.join(config.OUTPUT_DIR, "final_risk_scores.csv")
    verify_path = os.path.join(config.DATA_DIR, "verifications.json")
    audit_path = os.path.join(config.DATA_DIR, "audit_trail.json")

    if os.path.exists(verify_path):
        try:
            with open(verify_path, "r") as f:
                VERIFICATION_CACHE.update(json.load(f))
        except:
            pass

    if os.path.exists(audit_path):
        try:
            with open(audit_path, "r") as f:
                AUDIT_TRAIL.update(json.load(f))
        except:
            pass

    if os.path.exists(raw_path) and os.path.exists(risk_path):
        df_raw = pd.read_csv(raw_path)
        # Parse dates just in case
        for col in config.DATE_COLUMNS:
            if col in df_raw.columns:
                df_raw[col] = pd.to_datetime(df_raw[col], errors="coerce")

        df_risk = pd.read_csv(risk_path)

        # Merge exactly as it is expected to be joined
        df_merged = pd.merge(df_raw, df_risk, on="work_id", how="left")

        # Build dictionary for fast lookup
        # Replace nans with None for json serialization
        df_merged_cleaned = df_merged.where(pd.notnull(df_merged), None)

        # Re-convert dates to strings for JSON
        for col in config.DATE_COLUMNS + ['financial_year', 'financial_year_start']:
            if col in df_merged_cleaned.columns:
                df_merged_cleaned[col] = df_merged_cleaned[col].astype(str).replace('NaT', None).replace('nan', None)

        DATA_CACHE["df_merged"] = df_merged_cleaned

        records = df_merged_cleaned.to_dict(orient="records")
        # Comprehensive NaN cleaning for JSON serialization
        for r in records:
            for k in list(r.keys()):
                v = r[k]
                # Check all NaN variants
                try:
                    if v is None:
                        continue
                    elif pd.isna(v):
                        r[k] = None
                    elif v is pd.NaT:
                        r[k] = None
                    elif isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                        r[k] = None
                    elif isinstance(v, str) and v in ('nan', 'NaN', 'NaT', ''):
                        r[k] = None
                except (TypeError, ValueError):
                    # v is not comparable to NaN
                    pass
        DATA_CACHE["raw_works_dict"] = {r["work_id"]: r for r in records}
        logger.info(f"Loaded {len(records)} records into api cache.")
    else:
        logger.warning("Data files not found. Run training pipeline first.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load on startup
    load_data()
    yield
    # Cleanup on shutdown

app = FastAPI(title="MPLADS ML API", lifespan=lifespan)

# Allow CORS for typical frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def safe_float(val):
    if val is None or pd.isna(val) or (isinstance(val, float) and math.isnan(val)):
        return None
    return float(val)

@app.get("/api/health")
def health_check():
    has_data = not DATA_CACHE["df_merged"].empty
    return {"status": "ok", "has_data": has_data}

@app.get("/api/dashboard/summary")
def get_dashboard_summary():
    df = DATA_CACHE["df_merged"]
    if df.empty:
        return {
            "total_works": 0, "low": 0, "medium": 0, "high": 0, "critical": 0
        }

    total = len(df)
    counts = df["risk_level"].value_counts().to_dict()
    low = counts.get("Low", 0)
    medium = counts.get("Medium", 0)
    high = counts.get("High", 0)
    critical = counts.get("Critical", 0)

    verification_required = high + critical

    avg_score = float(df["final_risk_score"].mean()) if "final_risk_score" in df else 0
    total_sanctioned = float(df["sanctioned_amount"].sum()) if "sanctioned_amount" in df else 0

    return {
        "total_works": total,
        "low": low,
        "medium": medium,
        "high": high,
        "critical": critical,
        "verification_required": verification_required,
        "average_risk_score": avg_score,
        "total_sanctioned_amount": total_sanctioned
    }

@app.get("/api/works")
def get_works():
    """Return all works with basic verification status appended."""
    works = list(DATA_CACHE["raw_works_dict"].values())
    for w in works:
        wid = w.get("work_id")
        v = VERIFICATION_CACHE.get(wid, {})
        w["verification_status"] = v.get("status", "Not Started")
        w["verification_outcome"] = v.get("outcome", None)
        w["actionStatus"] = v.get("actionStatus", "NO_ACTION")
        w["inspectionReport"] = v.get("inspectionReport", None)
        w["correctiveAction"] = v.get("correctiveAction", None)
    return works

@app.get("/api/works/{work_id}")
def get_work(work_id: str):
    work = DATA_CACHE["raw_works_dict"].get(work_id)
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return work

@app.get("/api/works/{work_id}/explanation")
def get_work_explanation(work_id: str):
    work = DATA_CACHE["raw_works_dict"].get(work_id)
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")

    ml_score = work.get("ml_risk_score", 0)
    rule_score = work.get("rule_risk_score", 0)
    sim_score = work.get("similarity_risk_score", 0)
    final_score = work.get("final_risk_score", 0)
    risk_level = work.get("risk_level", "Low")

    signals = []
    if safe_float(ml_score) and ml_score > 25:
        signals.append("High ML Anomaly")
    if safe_float(rule_score) and rule_score > 25:
        signals.append("Multiple Rule Violations")
    if safe_float(sim_score) and sim_score > 0:
        signals.append("Duplicate Detected")

    explanation_text = str(work.get("risk_explanation", ""))

    # Parse out rule details if available for better frontend display
    rule_details = []
    try:
        raw_rules = work.get("rule_violations_details")
        if raw_rules and isinstance(raw_rules, str):
            rule_details = json.loads(raw_rules)
    except:
        pass

    # Extract key indicators and engineered features for the UI
    indicators = {
        "physical_progress": work.get("physical_progress_percent", 0),
        "financial_progress": work.get("financial_progress_percent", 0),
        "sanctioned_amount": work.get("sanctioned_amount", 0),
        "expenditure": work.get("actual_expenditure", 0),
        "inspections": work.get("inspection_count", 0),
        "progress_updates": work.get("number_of_progress_updates", 0),
        "delay_days": work.get("delay_days", 0),
        # Extra ML engineered features
        "cost_utilization_pct": work.get("cost_utilization_pct", 0),
        "release_utilization_pct": work.get("release_utilization_pct", 0),
        "cost_deviation_pct": work.get("cost_deviation_pct", 0),
        "financial_physical_gap": work.get("financial_physical_gap", 0),
        "planned_duration_days": work.get("planned_duration_days", 0),
        "elapsed_days": work.get("elapsed_days", 0),
        "payment_frequency_per_100_days": work.get("payment_frequency_per_100_days", 0),
        "average_payment_amount": work.get("average_payment_amount", 0),
        "expenditure_per_progress_percent": work.get("expenditure_per_progress_percent", 0),
        "estimate_to_sanction_ratio": work.get("estimate_to_sanction_ratio", 0),
        "approval_to_sanction_ratio": work.get("approval_to_sanction_ratio", 0),
        "release_to_sanction_ratio": work.get("release_to_sanction_ratio", 0),
        "number_of_payments": work.get("number_of_payments", 0),
    }

    return {
        "ml_score": safe_float(ml_score),
        "rule_score": safe_float(rule_score),
        "similarity_score": safe_float(sim_score),
        "final_score": safe_float(final_score),
        "risk_level": risk_level,
        "signals": signals,
        "observations": [explanation_text],
        "rule_details": rule_details,
        "indicators": indicators
    }

@app.get("/api/alerts")
def get_alerts():
    """Return an alert per work for high/critical risks."""
    df = DATA_CACHE["df_merged"]
    if df.empty:
        return []

    alert_df = df[df["risk_level"].isin(["High", "Critical"])]
    alerts = []
    idx = 1
    for _, row in alert_df.iterrows():
        alerts.append({
            "id": f"ALT-{idx}",
            "workId": row["work_id"],
            "title": f"High Risk Detected: {row.get('work_description', 'No desc')[:50]}...",
            "severity": row["risk_level"].lower(),
            "date": datetime.now().strftime("%Y-%m-%d"),
            "description": row.get("risk_explanation", ""),
            "status": "active"
        })
        idx += 1

    return alerts

@app.post("/api/works/analyze")
def analyze_new_work(payload: dict = Body(...)):
    """
    Validates, features, infer, applies rules/sim for a single NEW record using the pipeline
    components without retraining, and persists the work to the datastore.
    """
    work_id = payload.get("work_id")
    if not work_id:
        raise HTTPException(status_code=400, detail="Missing work_id")

    if work_id in DATA_CACHE["raw_works_dict"]:
        raise HTTPException(status_code=400, detail=f"Duplicate work_id: {work_id} already exists")

    validation_errors = validate_single_record(payload)
    if validation_errors:
        raise HTTPException(status_code=400, detail=", ".join(validation_errors))

    df_new = pd.DataFrame([payload])

    for col in config.EXPECTED_RAW_COLUMNS:
        if col not in df_new.columns:
            df_new[col] = float('nan')

    df_raw_write = df_new[config.EXPECTED_RAW_COLUMNS].copy()

    for col in config.DATE_COLUMNS:
        if col in df_new.columns:
            df_new[col] = pd.to_datetime(df_new[col], errors="coerce")

    df_new = engineer_features(df_new)

    model_dir = config.MODEL_DIR
    df_new = ml_predict(df_new, model_dir=model_dir)

    df_new = apply_rules(df_new)

    df_hist = DATA_CACHE["df_merged"]

    if not df_hist.empty:
        state = payload.get("state")
        district = payload.get("district")
        if state and district:
            df_subset = df_hist[(df_hist["state"] == state) & (df_hist["district"] == district)].copy()
            df_combined = pd.concat([df_subset, df_new], ignore_index=True)
        else:
            df_combined = pd.concat([df_hist.head(100), df_new], ignore_index=True)
    else:
        df_combined = df_new.copy()

    df_combined, pairs = apply_similarity(df_combined, threshold=config.SIMILARITY_THRESHOLD)

    df_scored = df_combined.tail(1).copy()

    df_risk = aggregate_risk(df_scored)

    # Persist the new work
    raw_path = os.path.join(config.DATA_DIR, "raw.csv")
    risk_path = os.path.join(config.OUTPUT_DIR, "final_risk_scores.csv")

    RISK_HEADERS = ["work_id","anomaly_score","anomaly_prediction","ml_risk_score","rule_risk_score","similarity_risk_score","final_risk_score","risk_level","risk_explanation"]
    df_risk_write = df_risk[RISK_HEADERS].copy()

    df_raw_write.to_csv(raw_path, mode='a', header=False, index=False)
    df_risk_write.to_csv(risk_path, mode='a', header=False, index=False)

    # Refresh in-memory cache to include the new work
    load_data()

    output_dict = df_risk.iloc[0].to_dict()
    final_output = {**payload, **output_dict}

    for k, v in final_output.items():
        if pd.isna(v) or v is pd.NaT:
            final_output[k] = None

    explanation_text = str(output_dict.get("risk_explanation", ""))

    final_output["risk"] = {
        "ml_score": safe_float(output_dict.get("ml_risk_score", 0)),
        "rule_score": safe_float(output_dict.get("rule_risk_score", 0)),
        "similarity_score": safe_float(output_dict.get("similarity_risk_score", 0)),
        "final_score": safe_float(output_dict.get("final_risk_score", 0)),
        "risk_level": output_dict.get("risk_level", "Low"),
        "observations": [explanation_text]
    }

    return final_output

def save_verification_data():
    verify_path = os.path.join(config.DATA_DIR, "verifications.json")
    with open(verify_path, "w") as f:
        json.dump(VERIFICATION_CACHE, f)

def save_audit_data():
    audit_path = os.path.join(config.DATA_DIR, "audit_trail.json")
    with open(audit_path, "w") as f:
        json.dump(AUDIT_TRAIL, f)

def add_audit_event(work_id: str, event_type: str, details: str, user: str = "System"):
    if work_id not in AUDIT_TRAIL:
        AUDIT_TRAIL[work_id] = []
    
    AUDIT_TRAIL[work_id].append({
        "timestamp": datetime.now().isoformat(),
        "event_type": event_type,
        "details": details,
        "user": user
    })
    save_audit_data()

@app.get("/api/works/{work_id}/verification")
def get_verification(work_id: str):
    if work_id not in VERIFICATION_CACHE:
        # Default empty state
        return {
            "status": "Not Started",
            "checklist": {
                "financial": False,
                "payment": False,
                "physical": False,
                "inspection": False,
                "contractor": False,
                "documentation": False
            },
            "notes": "",
            "outcome": None # None, "No issue identified", "Requires clarification", "Escalate for further review"
        }
    return VERIFICATION_CACHE[work_id]

@app.post("/api/works/{work_id}/verification")
def update_verification(work_id: str, payload: dict = Body(...)):
    work = DATA_CACHE["raw_works_dict"].get(work_id)
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")

    old_state = VERIFICATION_CACHE.get(work_id, {})
    
    # Check if a new state is being initialized
    if not old_state and payload:
        add_audit_event(work_id, "Verification Started", "Human verification workflow initiated", "Auditor")

    # Audit completed checklist items
    if "checklist" in payload:
        old_cl = old_state.get("checklist", {})
        new_cl = payload.get("checklist", {})
        for k, v in new_cl.items():
            if v and not old_cl.get(k, False):
                add_audit_event(work_id, "Checklist Item Confirmed", f"Verified checklist item: {k}", "Auditor")
    
    if "notes" in payload:
        old_note = old_state.get("notes", "")
        new_note = payload.get("notes", "")
        if new_note != old_note and new_note.strip():
            add_audit_event(work_id, "Note Added", f"Reviewer note updated", "Auditor")
            
    if "outcome" in payload:
        old_outcome = old_state.get("outcome")
        new_outcome = payload.get("outcome")
        if new_outcome and new_outcome != old_outcome:
            add_audit_event(work_id, "Outcome Saved", f"Outcome: {new_outcome}", "Auditor")

    if "status" in payload:
        old_status = old_state.get("status")
        new_status = payload.get("status")
        if new_status and new_status != old_status:
            add_audit_event(work_id, "Status Changed", f"Verification status: {new_status}", "Auditor")

    # Merge payload with old state so that updating one part doesn't erase others
    VERIFICATION_CACHE[work_id] = {**old_state, **payload}
    save_verification_data()
    return VERIFICATION_CACHE[work_id]

@app.get("/api/works/{work_id}/audit")
def get_audit(work_id: str):
    return AUDIT_TRAIL.get(work_id, [])

@app.post("/api/works/{work_id}/audit")
def post_audit(work_id: str, payload: dict = Body(...)):
    work = DATA_CACHE["raw_works_dict"].get(work_id)
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")

    event_type = payload.get("event")
    details = payload.get("remarks")
    user = payload.get("actor") or "System"
    add_audit_event(work_id, event_type, details, user)
    return {"status": "ok"}

@app.get("/api/audit")
def get_all_audit_events():
    """Return all audit events across all works, flattened into a single list."""
    all_events = []

    for work_id, events in AUDIT_TRAIL.items():
        for evt in events:
            all_events.append({
                "work_id": work_id,
                "timestamp": evt.get("timestamp"),
                "event_type": evt.get("event_type"),
                "details": evt.get("details"),
                "user": evt.get("user"),
            })

    # Sort newest-first by timestamp
    all_events.sort(
        key=lambda x: x.get("timestamp") or "",
        reverse=True
    )

    return all_events



