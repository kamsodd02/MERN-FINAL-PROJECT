from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import ValidationError
import httpx
import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import json
import pandas as pd
from pathlib import Path

from models import (
    HealthResponse, ErrorResponse, ValidationErrorResponse,
    TextAnalysisRequest, TextAnalysisResponse, InsightsRequest, InsightsResponse,
    ExportRequest, ExportFormat, ExportOptions,
    QuestionnaireResponse, ResponseCreate, ResponseResponse,
    AnalyticsResponse, DateRange
)
from utils import DataProcessor, ExcelExporter, InsightsGenerator

# Initialize FastAPI app
app = FastAPI(
    title="MERN Questionnaire Platform - FastAPI Backend",
    description="AI-powered analytics and data processing service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # React dev server
        "https://questionnaire-platform.com",
        "*"  # Allow all in development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:5000")
UPLOAD_DIR = Path("uploads")
EXPORT_DIR = Path("exports")

# Create directories
UPLOAD_DIR.mkdir(exist_ok=True)
EXPORT_DIR.mkdir(exist_ok=True)

# Global HTTP client for Node.js backend communication
http_client = httpx.AsyncClient(timeout=30.0)

# Dependency for authentication
async def get_current_user(token: str = Query(..., alias="token")):
    """Verify JWT token with Node.js backend"""
    try:
        response = await http_client.get(
            f"{NODE_BACKEND_URL}/api/auth/verify",
            headers={"Authorization": f"Bearer {token}"}
        )

        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")

        return response.json()["user"]
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Authentication service unavailable")

# Error handlers
@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc):
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })

    return ValidationErrorResponse(
        error="Validation Error",
        message="Request data validation failed",
        errors=errors
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return ErrorResponse(
        error="HTTP Error",
        message=exc.detail,
        code=f"HTTP_{exc.status_code}"
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return ErrorResponse(
        error="Internal Server Error",
        message="An unexpected error occurred",
        code="INTERNAL_ERROR"
    )

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        services={
            "fastapi": "running",
            "node_backend": "checking..."
        }
    )

# AI Analysis Endpoints
@app.post("/api/analysis/text", response_model=TextAnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """Analyze sentiment and extract insights from text"""
    try:
        # Clean the text
        cleaned_text = DataProcessor.clean_text(request.text)

        if not cleaned_text:
            return TextAnalysisResponse(
                sentiment={
                    "overall": "neutral",
                    "score": 0.0,
                    "confidence": 0.0,
                    "aspects": []
                },
                keywords=[],
                topics=[],
                wordCount=0
            )

        # Perform text analysis
        analysis_result = DataProcessor.analyze_text_responses([cleaned_text])

        # Extract sentiment
        sentiment_data = analysis_result["sentiment"]
        overall_sentiment = "neutral"
        if sentiment_data["positive"] > sentiment_data["negative"]:
            overall_sentiment = "positive"
        elif sentiment_data["negative"] > sentiment_data["positive"]:
            overall_sentiment = "negative"

        # Calculate sentiment score (-1 to 1)
        sentiment_score = (sentiment_data["positive"] - sentiment_data["negative"]) / 100

        return TextAnalysisResponse(
            sentiment={
                "overall": overall_sentiment,
                "score": sentiment_score,
                "confidence": 0.8,  # Placeholder confidence score
                "aspects": []  # Could be enhanced with aspect-based sentiment analysis
            },
            keywords=analysis_result["keywords"],
            topics=[],  # Could be enhanced with topic modeling
            wordCount=analysis_result["wordCount"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text analysis failed: {str(e)}")

@app.post("/api/analysis/insights", response_model=InsightsResponse)
async def generate_insights(request: InsightsRequest, background_tasks: BackgroundTasks):
    """Generate AI-powered insights for questionnaire data"""
    try:
        # Fetch questionnaire data from Node.js backend
        questionnaire_response = await http_client.get(
            f"{NODE_BACKEND_URL}/api/questionnaires/{request.questionnaireId}"
        )

        if questionnaire_response.status_code != 200:
            raise HTTPException(status_code=404, detail="Questionnaire not found")

        questionnaire = questionnaire_response.json()

        # Fetch analytics data
        analytics_params = {}
        if request.dateRange:
            analytics_params.update({
                "startDate": request.dateRange.start.isoformat(),
                "endDate": request.dateRange.end.isoformat()
            })

        analytics_response = await http_client.get(
            f"{NODE_BACKEND_URL}/api/questionnaires/{request.questionnaireId}/analytics",
            params=analytics_params
        )

        analytics = analytics_response.json() if analytics_response.status_code == 200 else {}

        # Generate insights
        summary = InsightsGenerator.generate_summary(analytics)
        key_findings = InsightsGenerator.identify_key_findings(analytics)
        recommendations = InsightsGenerator.generate_recommendations(analytics)
        sentiment_overview = InsightsGenerator.analyze_sentiment_trends(analytics)

        # Create AI insights object
        ai_insights = {
            "generatedAt": datetime.utcnow(),
            "summary": summary,
            "keyFindings": key_findings,
            "recommendations": recommendations,
            "sentimentOverview": sentiment_overview,
            "correlations": []  # Could be enhanced with correlation analysis
        }

        # Background task to save insights back to Node.js backend
        background_tasks.add_task(
            save_insights_to_backend,
            request.questionnaireId,
            ai_insights
        )

        return InsightsResponse(
            questionnaireId=request.questionnaireId,
            insights=ai_insights,
            processingTime=1.5,  # Placeholder processing time
            dataPoints=len(analytics.get("questionAnalytics", []))
        )

    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Backend service unavailable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insights generation failed: {str(e)}")

# Export Endpoints
@app.post("/api/export")
async def export_responses(request: ExportRequest, background_tasks: BackgroundTasks):
    """Export questionnaire responses to various formats"""
    try:
        # Fetch responses from Node.js backend
        export_params = {
            "format": "json",  # Always fetch as JSON first
            "includeMetadata": request.options.includeMetadata,
            "startDate": request.options.dateRange.start.isoformat() if request.options.dateRange else None,
            "endDate": request.options.dateRange.end.isoformat() if request.options.dateRange else None
        }

        # Remove None values
        export_params = {k: v for k, v in export_params.items() if v is not None}

        responses_response = await http_client.get(
            f"{NODE_BACKEND_URL}/api/questionnaires/{request.questionnaireId}/responses/export",
            params=export_params
        )

        if responses_response.status_code != 200:
            raise HTTPException(status_code=404, detail="Responses not found")

        response_data = responses_response.json()

        # Fetch questionnaire structure
        questionnaire_response = await http_client.get(
            f"{NODE_BACKEND_URL}/api/questionnaires/{request.questionnaireId}"
        )

        if questionnaire_response.status_code != 200:
            raise HTTPException(status_code=404, detail="Questionnaire not found")

        questionnaire = questionnaire_response.json()

        # Process data based on export format
        if request.options.format == ExportFormat.EXCEL:
            # Create DataFrames
            responses_df = ExcelExporter.create_response_dataframe(
                response_data.get("responses", []),
                questionnaire
            )

            # Create analytics summary (placeholder)
            analytics_summary = {
                "responseStats": {
                    "total": len(response_data.get("responses", [])),
                    "completed": len([r for r in response_data.get("responses", []) if r.get("status") == "completed"]),
                    "completionRate": 85.5
                }
            }
            analytics_df = ExcelExporter.create_analytics_dataframe(analytics_summary)

            # Generate filename
            filename = f"questionnaire_{request.questionnaireId}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
            filepath = EXPORT_DIR / filename

            # Export to Excel
            ExcelExporter.export_to_excel(responses_df, analytics_df, str(filepath))

            return FileResponse(
                path=filepath,
                filename=filename,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )

        elif request.options.format == ExportFormat.CSV:
            # Create DataFrame and export to CSV
            responses_df = ExcelExporter.create_response_dataframe(
                response_data.get("responses", []),
                questionnaire
            )

            filename = f"questionnaire_{request.questionnaireId}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
            filepath = EXPORT_DIR / filename

            responses_df.to_csv(filepath, index=False)

            return FileResponse(
                path=filepath,
                filename=filename,
                media_type="text/csv"
            )

        elif request.options.format == ExportFormat.JSON:
            # Return JSON data directly
            return response_data

        else:
            raise HTTPException(status_code=400, detail="Unsupported export format")

    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Backend service unavailable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

# File Upload Endpoint
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload file (for file upload questions)"""
    try:
        # Validate file size (10MB limit)
        file_size = 0
        content = await file.read()
        file_size = len(content)

        if file_size > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=413, detail="File too large (max 10MB)")

        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        # Return file information
        return {
            "filename": unique_filename,
            "originalFilename": file.filename,
            "url": f"/uploads/{unique_filename}",
            "size": file_size,
            "mimeType": file.content_type,
            "uploadedAt": datetime.utcnow()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

# Background task to save insights
async def save_insights_to_backend(questionnaire_id: str, insights: Dict[str, Any]):
    """Save generated insights back to Node.js backend"""
    try:
        await http_client.post(
            f"{NODE_BACKEND_URL}/api/questionnaires/{questionnaire_id}/insights",
            json=insights,
            headers={"Content-Type": "application/json"}
        )
    except Exception as e:
        print(f"Failed to save insights: {e}")

# Cleanup old export files (could be run periodically)
@app.on_event("startup")
async def startup_event():
    """Application startup tasks"""
    print("🚀 FastAPI backend starting...")

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown tasks"""
    await http_client.aclose()
    print("👋 FastAPI backend shutting down...")

# Additional utility endpoints
@app.get("/api/questionnaires/{questionnaire_id}/analytics")
async def get_questionnaire_analytics(questionnaire_id: str):
    """Proxy analytics requests to Node.js backend"""
    try:
        response = await http_client.get(
            f"{NODE_BACKEND_URL}/api/questionnaires/{questionnaire_id}/analytics"
        )
        return response.json()
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Backend service unavailable")

@app.get("/api/questionnaires/{questionnaire_id}")
async def get_questionnaire(questionnaire_id: str):
    """Proxy questionnaire requests to Node.js backend"""
    try:
        response = await http_client.get(
            f"{NODE_BACKEND_URL}/api/questionnaires/{questionnaire_id}"
        )
        return response.json()
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Backend service unavailable")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)