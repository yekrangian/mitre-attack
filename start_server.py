#!/usr/bin/env python3
"""
Startup script for MITRE ATT&CK Feedback API
"""
import uvicorn
from main import app

if __name__ == "__main__":
    print("🚀 Starting MITRE ATT&CK Feedback API...")
    print("📊 API will be available at: http://localhost:8000")
    print("📁 Feedback will be saved to: feedback.csv")
    print("🌐 Frontend will be served at: http://localhost:8000")
    print("📚 API documentation at: http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop the server")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=True  # Auto-reload on file changes
    ) 