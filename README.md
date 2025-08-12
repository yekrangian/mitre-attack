# MITRE ATT&CK Application

A web application for exploring MITRE ATT&CK techniques with feedback collection and AI-powered procedure examples.

## Features

- **MITRE ATT&CK Matrix**: Interactive matrix view of techniques organized by tactics
- **Feedback System**: Collect and manage user feedback on techniques
- **AI Procedure Examples**: Generate realistic procedure examples using OpenAI LLM
- **Responsive Design**: Modern UI with collapsible sidebar and smooth animations

## Backend Architecture

The backend has been refactored into a modular structure:

```
├── main.py                 # Main application entry point
├── config.py              # Configuration management
├── endpoints/             # API endpoint modules
│   ├── __init__.py
│   ├── feedback.py        # Feedback collection endpoints
│   └── procedure_example.py # LLM procedure generation endpoints
├── utils/                 # Utility modules
│   ├── __init__.py
│   └── llm_client.py      # OpenAI LLM client
└── requirements.txt       # Python dependencies
```

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env` file in the root directory:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Customize OpenAI settings
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=800
OPENAI_TEMPERATURE=0.7

# Application Configuration
APP_HOST=0.0.0.0
APP_PORT=8000
APP_DEBUG=false
```

### 3. Run the Application

```bash
python main.py
```

The application will be available at `http://localhost:8000`

## API Endpoints

### Feedback Endpoints
- `POST /api/feedback/` - Submit feedback
- `GET /api/feedback/` - Get all feedback
- `DELETE /api/feedback/` - Clear all feedback
- `GET /api/feedback/download` - Download feedback CSV

### Procedure Example Endpoints
- `POST /api/procedure/generate` - Generate procedure example using LLM
- `GET /api/procedure/health` - Check LLM connection health
- `GET /api/procedure/test` - Test endpoint functionality

### General Endpoints
- `GET /` - Main application
- `GET /health` - Overall application health check

## Frontend Integration

The frontend (`script.js`) needs to be updated to include the new Procedure button in technique modals. The button should:

1. Send a POST request to `/api/procedure/generate`
2. Include the technique name and description
3. Display the generated procedure example in the modal

## Configuration

All configuration is managed through environment variables and the `config.py` file. The application will warn if required configuration (like OpenAI API key) is missing.

## Development

- The backend uses FastAPI with async/await support
- LLM integration is handled through a dedicated client class
- Endpoints are organized into logical modules using FastAPI routers
- Configuration is centralized and environment-aware
