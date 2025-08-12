from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import csv
import os
from datetime import datetime
import uuid
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the utils directory to the path so we can import the logger
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'utils'))
from logger import app_logger

# Create router for feedback endpoints
router = APIRouter(prefix="/api/feedback", tags=["feedback"])

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

# CSV file path - loaded from environment variable or default
FEEDBACK_CSV = os.getenv("FEEDBACK_CSV", "feedback.csv")

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

@router.post("/", response_model=FeedbackResponse)
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
        
        # Log successful feedback submission
        app_logger.log_feedback("SUBMIT", feedback.technique, feedback.feedback_type, True)
        
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
        # Log failed feedback submission
        app_logger.log_feedback("SUBMIT", feedback.technique, feedback.feedback_type, False)
        raise HTTPException(status_code=500, detail=f"Error saving feedback: {str(e)}")

@router.get("/")
async def get_feedback():
    """Get all feedback from CSV"""
    try:
        if not os.path.exists(FEEDBACK_CSV):
            app_logger.log_feedback("GET", "ALL", "N/A", True)
            return {"feedback": []}
        
        feedback_list = []
        with open(FEEDBACK_CSV, 'r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                feedback_list.append(row)
        
        app_logger.log_feedback("GET", "ALL", f"{len(feedback_list)} items", True)
        return {"feedback": feedback_list}
        
    except Exception as e:
        app_logger.log_feedback("GET", "ALL", "N/A", False)
        raise HTTPException(status_code=500, detail=f"Error reading feedback: {str(e)}")

@router.delete("/")
async def clear_feedback():
    """Clear all feedback (recreate CSV with headers only)"""
    try:
        ensure_csv_exists()
        app_logger.log_feedback("CLEAR", "ALL", "N/A", True)
        return {"message": "All feedback cleared successfully!"}
        
    except Exception as e:
        app_logger.log_feedback("CLEAR", "ALL", "N/A", False)
        raise HTTPException(status_code=500, detail=f"Error clearing feedback: {str(e)}")

@router.get("/download")
async def download_feedback():
    """Download feedback CSV file"""
    try:
        if not os.path.exists(FEEDBACK_CSV):
            raise HTTPException(status_code=404, detail="No feedback file found")
        
        return {"message": "Feedback CSV is available at /feedback.csv"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error accessing feedback file: {str(e)}")
