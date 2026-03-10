import os
import json
import boto3
from typing import Dict, Any, List, Optional
from logging import getLogger

logger = getLogger(__name__)

# You can set this in your environment or rely on the ECS Task Role
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")

class BedrockClient:
    """Client for interacting with AWS Bedrock models"""
    
    def __init__(self):
        # When running in AWS ECS, boto3 automatically uses the Task Role credentials
        self.client = boto3.client(
            service_name='bedrock-runtime',
            region_name=AWS_REGION
        )
        
        # Default models (can be overridden)
        # We recommend Claude 3 Haiku for fast, cheap tasks (quizzes, routing)
        # And Claude 3.5 Sonnet or Llama 3 70B for complex tasks (coaching, explanations)
        self.default_text_model = "meta.llama3-8b-instruct-v1:0"
        self.default_vision_model = "anthropic.claude-3-haiku-20240307-v1:0"

    def _invoke_llama3(self, prompt: str, model_id: str) -> str:
        """Invoke Meta Llama 3 model on Bedrock"""
        body = json.dumps({
            "prompt": f"<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n",
            "max_gen_len": 1024,
            "temperature": 0.5,
            "top_p": 0.9
        })
        
        response = self.client.invoke_model(
            modelId=model_id,
            body=body,
            accept="application/json",
            contentType="application/json"
        )
        
        response_body = json.loads(response.get('body').read())
        return response_body.get('generation', '')

    def _invoke_claude3(self, prompt: str, model_id: str, system_prompt: str = None) -> str:
        """Invoke Anthropic Claude 3 model on Bedrock"""
        messages = [{"role": "user", "content": prompt}]
        
        body_dict = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "messages": messages,
            "temperature": 0.5
        }
        
        if system_prompt:
            body_dict["system"] = system_prompt
            
        body = json.dumps(body_dict)
        
        response = self.client.invoke_model(
            modelId=model_id,
            body=body,
            accept="application/json",
            contentType="application/json"
        )
        
        response_body = json.loads(response.get('body').read())
        return response_body.get('content', [{}])[0].get('text', '')

    def _invoke_claude3_with_image(self, prompt: str, image_base64: str, model_id: str) -> str:
        """Invoke Anthropic Claude 3 model with an image on Bedrock"""
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg", # Change if PNG etc.
                            "data": image_base64
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]
        
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "messages": messages,
            "temperature": 0.5
        })
        
        response = self.client.invoke_model(
            modelId=model_id,
            body=body,
            accept="application/json",
            contentType="application/json"
        )
        
        response_body = json.loads(response.get('body').read())
        return response_body.get('content', [{}])[0].get('text', '')

    def generate_text(self, prompt: str, system_prompt: str = None, model_id: str = None) -> str:
        """Generate text using the appropriate Bedrock model"""
        model = model_id or self.default_text_model
        
        try:
            if "llama" in model.lower():
                # For Llama, we combine system prompt into the main prompt if it exists
                full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
                return self._invoke_llama3(full_prompt, model)
            elif "claude" in model.lower():
                return self._invoke_claude3(prompt, model, system_prompt)
            else:
                logger.error(f"Unsupported model: {model}")
                return "I'm sorry, I couldn't generate a response."
                
        except Exception as e:
            logger.error(f"Bedrock API error: {str(e)}")
            raise Exception(f"Failed to generate text from AWS Bedrock: {str(e)}")

    def generate_with_image(self, prompt: str, image_base64: str, model_id: str = None) -> str:
        """Generate text based on an image using Claude 3"""
        model = model_id or self.default_vision_model
        
        try:
            return self._invoke_claude3_with_image(prompt, image_base64, model)
        except Exception as e:
            logger.error(f"Bedrock Vision API error: {str(e)}")
            raise Exception(f"Failed to analyze image with AWS Bedrock: {str(e)}")

# Create a singleton instance
bedrock_service = BedrockClient()
