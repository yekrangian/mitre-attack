from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import time

# Import the endpoint routers and logger
from endpoints import feedback, procedure_example
from utils.logger import app_logger

# Application Configuration - loaded from environment variables
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", "8000"))
APP_DEBUG = os.getenv("APP_DEBUG", "false").lower() == "true"

app = FastAPI(title="MITRE ATT&CK API", version="1.0.0")

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

# Include the endpoint routers
app.include_router(feedback.router)
app.include_router(procedure_example.router)

# Logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware to log all requests and responses"""
    start_time = time.time()
    
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    # Log the request
    app_logger.log_request(request.method, request.url.path, client_ip, user_agent)
    
    # Process the request
    try:
        response = await call_next(request)
        response_time = time.time() - start_time
        
        # Log the response
        app_logger.log_response(request.method, request.url.path, response.status_code, response_time)
        
        return response
        
    except Exception as e:
        response_time = time.time() - start_time
        
        # Log the error
        app_logger.log_error(request.method, request.url.path, e, 500)
        
        # Re-raise the exception
        raise

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

@app.get("/health")
async def health_check():
    """Overall application health check"""
    return {
        "status": "healthy",
        "message": "MITRE ATT&CK application is running",
        "endpoints": [
            "/api/feedback",
            "/api/procedure"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    
    # Log application startup
    app_logger.log_system("Starting MITRE ATT&CK application", "INFO")
    app_logger.log_system(f"Host: {APP_HOST}, Port: {APP_PORT}", "INFO")
    
    # Validate OpenAI API key
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if openai_api_key:
        app_logger.log_system("OpenAI API key loaded successfully", "INFO")
    else:
        app_logger.log_system("Warning: OPENAI_API_KEY not set. LLM features will not work.", "WARNING")
    
    app_logger.log_system("Starting Uvicorn server...", "INFO")
    
    uvicorn.run(
        app, 
        host=APP_HOST, 
        port=APP_PORT,
        log_level="info" if APP_DEBUG else "warning"
    )