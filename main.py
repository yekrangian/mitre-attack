from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Import the endpoint routers and configuration
from endpoints import feedback, procedure_example
from config import Config

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
    
    # Validate configuration
    Config.validate()
    
    uvicorn.run(
        app, 
        host=Config.APP_HOST, 
        port=Config.APP_PORT,
        log_level="info" if Config.APP_DEBUG else "warning"
    )