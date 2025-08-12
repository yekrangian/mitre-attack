import openai
import os
import sys
import time
from typing import Optional, Dict, Any
import logging

# Add the parent directory to the path to import config
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from config import Config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMClient:
    """Client for interacting with OpenAI LLM API"""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the LLM client with OpenAI API key"""
        self.api_key = api_key or Config.OPENAI_API_KEY
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass it to constructor.")
        
        openai.api_key = self.api_key
        self.client = openai.OpenAI(api_key=self.api_key)
    
    async def generate_procedure_example(self, prompt: str) -> str:
        """
        Generate a procedure example using the provided prompt
        
        Args:
            prompt: The complete prompt to send to the LLM
            
        Returns:
            Generated procedure example as a string
        """
        try:
            start_time = time.time()
            response = await self._call_openai(prompt)
            response_time = time.time() - start_time
            
            logger.info(f"OpenAI API call successful in {response_time:.3f}s")
            return response
            
        except Exception as e:
            logger.error(f"Error generating procedure example: {str(e)}")
            raise Exception(f"Failed to generate procedure example: {str(e)}")
    
    async def _call_openai(self, prompt: str) -> str:
        """Make the actual call to OpenAI API"""
        try:
            response = self.client.chat.completions.create(
                model=Config.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a cybersecurity expert specializing in MITRE ATT&CK techniques. Provide clear, educational examples."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=Config.OPENAI_MAX_TOKENS,
                temperature=Config.OPENAI_TEMPERATURE
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"OpenAI API call failed: {str(e)}")
            raise Exception(f"OpenAI API call failed: {str(e)}")
    
    def test_connection(self) -> bool:
        """Test if the OpenAI API connection is working"""
        try:
            # Make a simple test call
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5
            )
            return True
        except Exception as e:
            logger.error(f"Connection test failed: {str(e)}")
            return False
