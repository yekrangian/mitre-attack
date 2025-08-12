from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import sys
import os
import time

# Add the utils directory to the path so we can import the LLM client and logger
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'utils'))
from llm_client import LLMClient
from logger import app_logger

# Create router for procedure example endpoints
router = APIRouter(prefix="/api/procedure", tags=["procedure"])

# Request/Response models
class ProcedureRequest(BaseModel):
    technique_name: str
    technique_description: str

class ProcedureResponse(BaseModel):
    technique_name: str
    procedure_example: str
    message: str

# Prompt template for procedure generation
PROCEDURE_PROMPT_TEMPLATE = """You are a cybersecurity expert. Based on the following MITRE ATT&CK Technique description, provide a realistic and educational procedure example that demonstrates how this technique might be used in practice.

Technique: {technique_name}
Description: {technique_description}

Please provide:
1. A brief overview of the technique's purpose
2. A step-by-step procedure example (3-5 steps) that shows how this technique could be executed
3. Common tools or methods that might be used
4. Potential indicators of this technique being used
5. Brief defensive recommendations

Keep the response educational and focused on understanding the technique for defensive purposes. Do not provide detailed attack instructions that could be misused.

Response:"""

# Dependency to get LLM client
def get_llm_client():
    """Dependency to get LLM client instance"""
    try:
        return LLMClient()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"LLM client initialization failed: {str(e)}")

@router.post("/generate", response_model=ProcedureResponse)
async def generate_procedure_example(
    request: ProcedureRequest,
    llm_client: LLMClient = Depends(get_llm_client)
):
    """
    Generate a procedure example based on MITRE Technique description using LLM
    
    Args:
        request: Contains technique name and description
        llm_client: LLM client instance injected via dependency
        
    Returns:
        Generated procedure example
    """
    try:
        # Validate input
        if not request.technique_name or not request.technique_description:
            raise HTTPException(
                status_code=400, 
                detail="Both technique_name and technique_description are required"
            )
        
        # Build the prompt using the template
        prompt = PROCEDURE_PROMPT_TEMPLATE.format(
            technique_name=request.technique_name,
            technique_description=request.technique_description
        )
        
        # Log LLM request
        app_logger.log_llm_request(request.technique_name, len(prompt))
        
        # Generate procedure example using LLM
        start_time = time.time()
        procedure_example = await llm_client.generate_procedure_example(prompt)
        response_time = time.time() - start_time
        
        # Log successful LLM response
        app_logger.log_llm_response(request.technique_name, len(procedure_example), response_time)
        
        return ProcedureResponse(
            technique_name=request.technique_name,
            procedure_example=procedure_example,
            message="Procedure example generated successfully!"
        )
        
    except Exception as e:
        # Log the error for debugging
        app_logger.log_llm_error(request.technique_name, e)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate procedure example: {str(e)}"
        )

@router.get("/health")
async def health_check(llm_client: LLMClient = Depends(get_llm_client)):
    """Health check endpoint to test LLM connection"""
    try:
        is_healthy = llm_client.test_connection()
        if is_healthy:
            return {"status": "healthy", "message": "LLM connection is working"}
        else:
            return {"status": "unhealthy", "message": "LLM connection failed"}
    except Exception as e:
        return {"status": "error", "message": f"Health check failed: {str(e)}"}

@router.get("/test")
async def test_endpoint():
    """Simple test endpoint to verify the router is working"""
    return {"message": "Procedure example endpoint is working!"}

@router.get("/debug")
async def debug_endpoint():
    """Debug endpoint to check environment and dependencies"""
    try:
        # Check if OpenAI API key is available
        openai_api_key = os.getenv("OPENAI_API_KEY")
        api_key_status = "Set" if openai_api_key else "Not Set"
        
        # Check if we can create an LLM client
        try:
            llm_client = LLMClient()
            llm_status = "Available"
        except Exception as e:
            llm_status = f"Error: {str(e)}"
        
        return {
            "status": "debug_info",
            "openai_api_key": api_key_status,
            "llm_client": llm_status,
            "environment": {
                "OPENAI_MODEL": os.getenv("OPENAI_MODEL", "Not Set"),
                "OPENAI_MAX_TOKENS": os.getenv("OPENAI_MAX_TOKENS", "Not Set"),
                "OPENAI_TEMPERATURE": os.getenv("OPENAI_TEMPERATURE", "Not Set")
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
