"""
Lambda entry point for 센드온 AI 스튜디오 backend.

IMPORTANT: SSE/streaming is NOT supported via AWS Lambda + API Gateway.
For streaming responses, use AWS Fargate or ECS deployment instead.
For Lambda: endpoints return complete JSON responses (non-streaming fallback).
The non-streaming fallback is already implemented in be/app/routes/messages.py
(checks Accept header — if not 'text/event-stream', returns complete JSON).
"""
from mangum import Mangum
from app.main import app

handler = Mangum(app, lifespan="off")
