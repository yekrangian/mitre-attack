from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import csv
import os
from datetime import datetime
import uuid

app = FastAPI(title="MITRE ATT&CK Feedback API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (HTML, CSS, JS) at /static
app.mount("/static", StaticFiles(directory="."), name="static")

# Feedback model
class FeedbackItem(BaseModel):
    technique: str
    stride: str
    cia: str
    feedback_type: str  # "thumbs_up" or "thumbs_down"
    sid: str = ""  # User SID for thumbs down feedback
    comment: str = ""  # Optional comment for feedback

class FeedbackResponse(BaseModel):
    id: str
    technique: str
    stride: str
    cia: str
    feedback_type: str
    timestamp: str
    sid: str
    comment: str
    message: str

# CSV file path
FEEDBACK_CSV = "feedback.csv"

def ensure_csv_exists():
    """Ensure feedback.csv exists with headers"""
    if not os.path.exists(FEEDBACK_CSV):
        with open(FEEDBACK_CSV, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(['ID', 'Technique', 'STRIDE', 'CIA', 'Feedback Type', 'SID', 'Comment', 'Timestamp'])

def append_feedback_to_csv(feedback_data: dict):
    """Append feedback to CSV file"""
    ensure_csv_exists()
    
    with open(FEEDBACK_CSV, 'a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow([
            feedback_data['id'],
            feedback_data['technique'],
            feedback_data['stride'],
            feedback_data['cia'],
            feedback_data['feedback_type'],
            feedback_data.get('sid', ''),  # Include SID
            feedback_data.get('comment', ''),  # Include comment
            feedback_data['timestamp']
        ])

@app.get("/")
async def read_index():
    """Serve the main index.html file"""
    return FileResponse("index.html")

@app.get("/index.html")
async def read_index_html():
    """Serve the main index.html file"""
    return FileResponse("index.html")

@app.get("/network.html")
async def read_network_html():
    """Serve the network.html file"""
    return FileResponse("network.html")

@app.post("/api/feedback", response_model=FeedbackResponse)
async def submit_feedback(feedback: FeedbackItem):
    """Submit feedback and save to CSV"""
    try:
        # Generate unique ID and timestamp
        feedback_id = f"fb_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}"
        timestamp = datetime.now().isoformat()
        
        # Prepare feedback data
        feedback_data = {
            'id': feedback_id,
            'technique': feedback.technique,
            'stride': feedback.stride,
            'cia': feedback.cia,
            'feedback_type': feedback.feedback_type,
            'sid': feedback.sid,
            'comment': feedback.comment,
            'timestamp': timestamp
        }
        
        # Append to CSV
        append_feedback_to_csv(feedback_data)
        
        return FeedbackResponse(
            id=feedback_id,
            technique=feedback.technique,
            stride=feedback.stride,
            cia=feedback.cia,
            feedback_type=feedback.feedback_type,
            timestamp=timestamp,
            sid=feedback.sid,
            comment=feedback.comment,
            message="Feedback submitted successfully!"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving feedback: {str(e)}")

@app.get("/api/feedback")
async def get_feedback():
    """Get all feedback from CSV"""
    try:
        if not os.path.exists(FEEDBACK_CSV):
            return {"feedback": []}
        
        feedback_list = []
        with open(FEEDBACK_CSV, 'r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                feedback_list.append(row)
        
        return {"feedback": feedback_list}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading feedback: {str(e)}")

@app.delete("/api/feedback")
async def clear_feedback():
    """Clear all feedback (recreate CSV with headers only)"""
    try:
        ensure_csv_exists()
        return {"message": "All feedback cleared successfully!"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing feedback: {str(e)}")

@app.get("/api/feedback/download")
async def download_feedback():
    """Download feedback CSV file"""
    try:
        if not os.path.exists(FEEDBACK_CSV):
            raise HTTPException(status_code=404, detail="No feedback file found")
        
        return {"message": "Feedback CSV is available at /feedback.csv"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error accessing feedback file: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)