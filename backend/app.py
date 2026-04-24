import os
import json
import uuid
import bcrypt
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from dotenv import load_dotenv

load_dotenv()

from flask_cors import CORS
CORS(app)

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-change-in-production")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)
jwt = JWTManager(app)

# ── Storage (file-based, no DB needed) ──────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(BASE_DIR, "..", "data")
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "uploads")
REPORT_DIR = os.path.join(BASE_DIR, "..", "reports")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
HIST_FILE  = os.path.join(DATA_DIR, "history.json")

for d in [DATA_DIR, UPLOAD_DIR, REPORT_DIR]:
    os.makedirs(d, exist_ok=True)

# ── Helpers ──────────────────────────────────────────────────────────────────
def load_json(path, default):
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return default

def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2, default=str)

def seed_default_user():
    users = load_json(USERS_FILE, {})
    if not users:
        pw = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode()
        users["admin"] = {"username": "admin", "password": pw,
                          "role": "admin", "name": "Admin User"}
        save_json(USERS_FILE, users)

seed_default_user()

# ── Sentiment engine (no GPU needed, uses distilbert) ────────────────────────
_pipeline = None

def get_pipeline():
    global _pipeline
    if _pipeline is None:
        from transformers import pipeline
        print("[INFO] Loading sentiment model (first run may take ~30s)…")
        _pipeline = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            truncation=True,
            max_length=512,
        )
        print("[INFO] Model loaded.")
    return _pipeline

LABEL_MAP = {"POSITIVE": "positive", "NEGATIVE": "negative"}

TOPICS = {
    "compliance":  ["compliance", "regulation", "standard", "rule", "requirement", "guideline"],
    "penalties":   ["penalty", "penalties", "fine", "enforcement", "consequence", "sanction", "punish"],
    "reporting":   ["report", "reporting", "submit", "submission", "document", "filing", "disclose"],
    "transparency":["transparent", "transparency", "open", "disclose", "accountability", "clarity"],
    "implementation": ["implement", "execute", "carry out", "deploy", "rollout", "adoption"],
}

def detect_topic(text: str) -> str:
    text_lower = text.lower()
    for topic, keywords in TOPICS.items():
        if any(k in text_lower for k in keywords):
            return topic
    return "others"

def analyze_comment(text: str) -> dict:
    nlp = get_pipeline()
    result = nlp(text[:512])[0]
    label      = LABEL_MAP.get(result["label"], "neutral")
    confidence = round(result["score"], 4)
    # Downgrade very uncertain predictions to neutral
    if confidence < 0.70:
        label = "neutral"
    flagged = label == "negative" and confidence >= 0.85
    return {
        "sentiment":   label,
        "confidence":  confidence,
        "topic":       detect_topic(text),
        "flagged":     flagged,
    }

def generate_summary(comments: list[str], sentiment: str) -> str:
    """Rule-based extractive summary (no extra API call needed)."""
    relevant = [c for c, s in comments if s == sentiment]
    if not relevant:
        return f"No {sentiment} feedback found."
    sample = relevant[:5]
    count  = len(relevant)
    total  = len(comments)
    pct    = round(count / total * 100, 1)
    intro  = {
        "positive": f"{pct}% of respondents ({count}/{total}) expressed support.",
        "neutral":  f"{pct}% of respondents ({count}/{total}) provided neutral observations.",
        "negative": f"{pct}% of respondents ({count}/{total}) raised concerns.",
    }.get(sentiment, "")
    themes = "; ".join(sample[:3])
    return f"{intro} Key themes: {themes[:300]}{'…' if len(themes) > 300 else ''}."

# ── Auth routes ───────────────────────────────────────────────────────────────
@app.route("/api/auth/login", methods=["POST"])
def login():
    data     = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "").encode()
    users    = load_json(USERS_FILE, {})
    user     = users.get(username)
    if not user or not bcrypt.checkpw(password, user["password"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401
    token = create_access_token(identity=username)
    return jsonify({"token": token, "user": {"username": username, "name": user["name"]}})

@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def me():
    username = get_jwt_identity()
    users    = load_json(USERS_FILE, {})
    user     = users.get(username, {})
    return jsonify({"username": username, "name": user.get("name", username)})

# ── Analysis route ────────────────────────────────────────────────────────────
@app.route("/api/analyze", methods=["POST"])
@jwt_required()
def analyze():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    if not file.filename.endswith(".csv"):
        return jsonify({"error": "Only CSV files are supported"}), 400

    # Save upload
    file_id   = str(uuid.uuid4())[:8]
    save_path = os.path.join(UPLOAD_DIR, f"{file_id}.csv")
    file.save(save_path)

    # Read CSV
    try:
        df = pd.read_csv(save_path)
    except Exception as e:
        return jsonify({"error": f"Could not read CSV: {e}"}), 400

    # Detect comment column
    col = request.form.get("column") or next(
        (c for c in df.columns if "comment" in c.lower() or "feedback" in c.lower() or "text" in c.lower()),
        df.columns[0]
    )
    if col not in df.columns:
        return jsonify({"error": f"Column '{col}' not found. Available: {list(df.columns)}"}), 400

    comments = df[col].dropna().astype(str).tolist()
    if len(comments) > 500:
        comments = comments[:500]   # cap for demo performance

    # Run analysis
    results = []
    for c in comments:
        r = analyze_comment(c)
        results.append({"comment": c, **r})

    result_df  = pd.DataFrame(results)
    analysis_id = f"analysis_{file_id}"
    out_path   = os.path.join(UPLOAD_DIR, f"{analysis_id}.json")
    result_df.to_json(out_path, orient="records", indent=2)

    # Aggregates
    sentiment_counts = result_df["sentiment"].value_counts().to_dict()
    topic_sentiment  = (
        result_df.groupby(["topic", "sentiment"])
        .size().reset_index(name="count")
        .to_dict(orient="records")
    )
    flagged      = result_df[result_df["flagged"] == True]["comment"].tolist()
    avg_conf     = round(float(result_df["confidence"].mean()), 4)
    comment_tuples = list(zip(result_df["comment"], result_df["sentiment"]))
    summaries    = {s: generate_summary(comment_tuples, s) for s in ["positive", "neutral", "negative"]}

    # Save to history
    history = load_json(HIST_FILE, [])
    history.insert(0, {
        "id":          analysis_id,
        "filename":    file.filename,
        "timestamp":   datetime.now(timezone.utc).isoformat(),
        "total":       len(results),
        "sentiment_counts": sentiment_counts,
        "avg_confidence":   avg_conf,
        "user":        get_jwt_identity(),
    })
    save_json(HIST_FILE, history[:50])

    return jsonify({
        "analysis_id":     analysis_id,
        "total":           len(results),
        "sentiment_counts": sentiment_counts,
        "topic_sentiment": topic_sentiment,
        "avg_confidence":  avg_conf,
        "flagged_count":   len(flagged),
        "flagged_comments": flagged[:10],
        "summaries":       summaries,
        "sample_results":  results[:20],
        "columns":         list(df.columns),
    })

# ── History ───────────────────────────────────────────────────────────────────
@app.route("/api/history", methods=["GET"])
@jwt_required()
def history():
    user    = get_jwt_identity()
    history = load_json(HIST_FILE, [])
    return jsonify([h for h in history if h.get("user") == user])

# ── Export CSV ────────────────────────────────────────────────────────────────
@app.route("/api/export/csv/<analysis_id>", methods=["GET"])
@jwt_required()
def export_csv(analysis_id):
    path = os.path.join(UPLOAD_DIR, f"{analysis_id}.json")
    if not os.path.exists(path):
        return jsonify({"error": "Analysis not found"}), 404
    df       = pd.read_json(path)
    out_path = os.path.join(REPORT_DIR, f"{analysis_id}.csv")
    df.to_csv(out_path, index=False)
    return send_file(out_path, as_attachment=True, download_name=f"{analysis_id}.csv")

# ── Export PDF ────────────────────────────────────────────────────────────────
@app.route("/api/export/pdf/<analysis_id>", methods=["GET"])
@jwt_required()
def export_pdf(analysis_id):
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors

    path = os.path.join(UPLOAD_DIR, f"{analysis_id}.json")
    if not os.path.exists(path):
        return jsonify({"error": "Analysis not found"}), 404

    df       = pd.read_json(path)
    out_path = os.path.join(REPORT_DIR, f"{analysis_id}.pdf")
    doc      = SimpleDocTemplate(out_path, pagesize=letter)
    styles   = getSampleStyleSheet()
    story    = []

    story.append(Paragraph("AI-Based Policy Feedback Sentiment Analysis", styles["Title"]))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles["Normal"]))
    story.append(Spacer(1, 20))

    story.append(Paragraph("Sentiment Distribution", styles["Heading2"]))
    counts = df["sentiment"].value_counts().to_dict()
    data   = [["Sentiment", "Count", "Percentage"]]
    total  = len(df)
    for s, c in counts.items():
        data.append([s.capitalize(), str(c), f"{round(c/total*100,1)}%"])
    t = Table(data, colWidths=[150, 100, 100])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a73e8")),
        ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
        ("GRID",       (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))

    story.append(Paragraph("Flagged Comments (High-Concern)", styles["Heading2"]))
    flagged = df[df["flagged"] == True]["comment"].tolist()[:10]
    for c in flagged:
        story.append(Paragraph(f"• {c[:200]}", styles["Normal"]))
    if not flagged:
        story.append(Paragraph("No comments flagged.", styles["Normal"]))

    doc.build(story)
    return send_file(out_path, as_attachment=True, download_name=f"{analysis_id}.pdf")

# ── Columns helper ────────────────────────────────────────────────────────────
@app.route("/api/columns", methods=["POST"])
@jwt_required()
def get_columns():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    file = request.files["file"]
    try:
        df = pd.read_csv(file)
        return jsonify({"columns": list(df.columns)})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
