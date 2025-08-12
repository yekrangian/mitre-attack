import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional

class AppLogger:
    """Centralized logging for the MITRE ATT&CK application"""
    
    def __init__(self, log_file: str = "app.log"):
        self.log_file = log_file
        self._setup_logger()
    
    def _setup_logger(self):
        """Setup the main application logger"""
        # Create logs directory if it doesn't exist
        os.makedirs('logs', exist_ok=True)
        
        # Configure the main logger
        self.logger = logging.getLogger('mitre_attack_app')
        self.logger.setLevel(logging.INFO)
        
        # Prevent duplicate handlers
        if not self.logger.handlers:
            # File handler for app.log
            file_handler = logging.FileHandler(self.log_file, encoding='utf-8')
            file_handler.setLevel(logging.INFO)
            
            # Console handler for development
            console_handler = logging.StreamHandler()
            console_handler.setLevel(logging.INFO)
            
            # Create formatter
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            
            file_handler.setFormatter(formatter)
            console_handler.setFormatter(formatter)
            
            self.logger.addHandler(file_handler)
            self.logger.addHandler(console_handler)
    
    def log_request(self, method: str, path: str, client_ip: str, user_agent: str = None):
        """Log incoming API requests"""
        self.logger.info(
            f"REQUEST: {method} {path} | IP: {client_ip} | UA: {user_agent or 'Unknown'}"
        )
    
    def log_response(self, method: str, path: str, status_code: int, response_time: float):
        """Log API responses"""
        self.logger.info(
            f"RESPONSE: {method} {path} | Status: {status_code} | Time: {response_time:.3f}s"
        )
    
    def log_error(self, method: str, path: str, error: Exception, status_code: int = 500):
        """Log API errors"""
        self.logger.error(
            f"ERROR: {method} {path} | Status: {status_code} | Error: {str(error)} | Type: {type(error).__name__}"
        )
    
    def log_llm_request(self, technique_name: str, prompt_length: int):
        """Log LLM API requests"""
        self.logger.info(
            f"LLM_REQUEST: Technique: {technique_name} | Prompt Length: {prompt_length} chars"
        )
    
    def log_llm_response(self, technique_name: str, response_length: int, response_time: float):
        """Log LLM API responses"""
        self.logger.info(
            f"LLM_RESPONSE: Technique: {technique_name} | Response Length: {response_length} chars | Time: {response_time:.3f}s"
        )
    
    def log_llm_error(self, technique_name: str, error: Exception):
        """Log LLM API errors"""
        self.logger.error(
            f"LLM_ERROR: Technique: {technique_name} | Error: {str(error)} | Type: {type(error).__name__}"
        )
    
    def log_feedback(self, action: str, technique: str, feedback_type: str, success: bool):
        """Log feedback operations"""
        status = "SUCCESS" if success else "FAILED"
        self.logger.info(
            f"FEEDBACK: {action} | Technique: {technique} | Type: {feedback_type} | Status: {status}"
        )
    
    def log_system(self, message: str, level: str = "INFO"):
        """Log system-level messages"""
        if level.upper() == "ERROR":
            self.logger.error(f"SYSTEM: {message}")
        elif level.upper() == "WARNING":
            self.logger.warning(f"SYSTEM: {message}")
        else:
            self.logger.info(f"SYSTEM: {message}")

# Global logger instance
app_logger = AppLogger()
