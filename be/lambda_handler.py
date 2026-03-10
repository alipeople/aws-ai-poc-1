"""
AWS Lambda entry point using Mangum adapter.

IMPORTANT: SSE/streaming responses are NOT supported via Lambda + API Gateway.
For streaming, use AWS Fargate or ECS deployment instead.
For Lambda: endpoints return complete JSON responses (non-streaming fallback).
"""
from mangum import Mangum
from app.main import app

handler = Mangum(app, lifespan="off")
