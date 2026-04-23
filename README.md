# PolicyAI — Sentiment Analysis System

AI-powered web application to analyze public policy feedback using NLP.

---

## Prerequisites

| Tool    | Version  | Download |
|---------|----------|----------|
| Python  | 3.9 – 3.12 | https://python.org |
| Node.js | 18 +     | https://nodejs.org |

---

## Quick Start

### macOS / Linux
```bash
chmod +x start.sh
./start.sh
```

### Windows
Double-click `start.bat`

Then open **http://localhost:3000** in your browser.

---

## Login
| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `admin123` |

---

## How to Use

1. **Login** with the credentials above
2. Click **Analyze** in the sidebar
3. Upload any CSV file with a column containing comment/feedback text
4. Use the included `sample_feedback.csv` to test immediately
5. View the **interactive dashboard** with sentiment charts
6. Export results as **CSV** or **PDF**
7. Check **History** to revisit past analyses

---

## CSV Format

Your CSV should have a text column. Column names like `comment`, `feedback`, or `text` are auto-detected. Example:

```csv
comment,source,date
"This policy is very helpful.","public","2024-01-10"
"The compliance deadline is unrealistic.","industry","2024-01-11"
```

Max 500 rows per analysis (for demo performance — removable in `app.py`).

---

## Project Structure

```
policy-sentiment-app/
├── backend/
│   ├── app.py              ← Flask API server
│   ├── requirements.txt    ← Python dependencies
│   └── .env                ← Config (JWT secret)
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/          ← Login, Dashboard, Upload, Results, History
│   │   ├── components/     ← Layout/sidebar
│   │   └── utils/          ← API client, Auth context
│   └── package.json
├── sample_feedback.csv     ← Test data
├── start.sh                ← macOS/Linux launcher
└── start.bat               ← Windows launcher
```

---

## AI Model

Uses **DistilBERT** (distilbert-base-uncased-finetuned-sst-2-english) via HuggingFace Transformers.  
Downloaded automatically on first run (~260 MB). No API key required.

---

## Troubleshooting

**Port already in use:**
```bash
# Kill port 5000
lsof -ti:5000 | xargs kill -9
# Kill port 3000
lsof -ti:3000 | xargs kill -9
```

**Model download slow:** First analysis takes 30–60 seconds to download the model. Subsequent runs are fast.

**Windows: `npm` not recognized:** Restart your terminal after installing Node.js.
