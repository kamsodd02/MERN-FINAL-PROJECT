# MERN Questionnaire Platform - FastAPI Backend Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Utility Functions](#utility-functions)
6. [Error Handling](#error-handling)
7. [Configuration](#configuration)

---

## 🎯 Overview

The FastAPI backend is a specialized microservice for AI-powered analytics, data processing, and export functionality in the MERN Questionnaire Platform. It handles computationally intensive tasks separately from the main Node.js backend to ensure optimal performance and scalability.

### Key Responsibilities
- **AI-Powered Text Analysis**: Sentiment analysis, keyword extraction, topic modeling
- **Data Export**: Multi-format export (Excel, CSV, JSON) with advanced formatting
- **Insights Generation**: Automated analysis and recommendations
- **File Processing**: Upload handling and data validation
- **Background Processing**: Asynchronous task execution

### Technology Stack
- **FastAPI**: High-performance async web framework
- **Pydantic**: Data validation and serialization
- **Pandas**: Data manipulation and analysis
- **OpenPyXL**: Excel file generation
- **TextBlob**: Natural language processing
- **NLTK**: Advanced text processing
- **httpx**: Async HTTP client for backend communication

---

## 🏗️ Architecture

### Service Architecture
```
┌─────────────────┐    ┌─────────────────┐
│   Node.js       │    │   FastAPI       │
│   Backend       │◄──►│   Backend       │
│   (Port 5000)   │    │   (Port 8000)   │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
                    │
         ┌─────────────────────┐
         │   Shared Database   │
         │   (MongoDB)         │
         └─────────────────────┘
```

### Design Principles
- **Microservices**: Independent scaling and deployment
- **Async Processing**: Non-blocking operations for performance
- **Graceful Degradation**: Fallback mechanisms for missing dependencies
- **Data Validation**: Comprehensive input validation with Pydantic
- **Error Isolation**: Isolated error handling per service

### Communication Flow
1. **Frontend** → **Node.js Backend** → **FastAPI Backend**
2. FastAPI processes AI/ML workloads
3. Results returned through Node.js backend
4. Background tasks for heavy processing

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:8000
```

### Authentication
FastAPI endpoints can optionally verify JWT tokens with the Node.js backend:
```
Authorization: Bearer <jwt_token>
```

---

## 🤖 AI Analysis Endpoints

### POST /api/analysis/text
Analyze sentiment and extract insights from text responses.

**Request Body:**
```json
{
  "text": "I love this product! The customer service is excellent and delivery was fast.",
  "questionId": "q1",
  "questionnaireId": "64f1a2b3c4d5e6f7g8h9i0j1"
}
```

**Response (200):**
```json
{
  "sentiment": {
    "overall": "positive",
    "score": 0.8,
    "confidence": 0.85,
    "aspects": [
      {
        "aspect": "product",
        "sentiment": "positive",
        "score": 0.9
      },
      {
        "aspect": "service",
        "sentiment": "positive",
        "score": 0.7
      }
    ]
  },
  "keywords": [
    {
      "word": "love",
      "count": 1,
      "relevance": 15.2
    },
    {
      "word": "product",
      "count": 1,
      "relevance": 12.8
    },
    {
      "word": "service",
      "count": 1,
      "relevance": 10.5
    }
  ],
  "topics": [
    {
      "topic": "Customer Satisfaction",
      "confidence": 0.92,
      "keywords": ["love", "excellent", "fast"]
    }
  ],
  "summary": "Strong positive sentiment with focus on product quality and service excellence.",
  "wordCount": 12,
  "readabilityScore": 78.5
}
```

### POST /api/analysis/insights
Generate comprehensive AI insights for questionnaire data.

**Request Body:**
```json
{
  "questionnaireId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "dateRange": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-31T23:59:59.000Z"
  },
  "focusAreas": ["sentiment", "trends", "correlations"]
}
```

**Response (200):**
```json
{
  "questionnaireId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "insights": {
    "generatedAt": "2024-01-31T12:00:00.000Z",
    "summary": "This customer feedback survey received 150 responses with an 85% completion rate. Overall sentiment is positive with some recurring themes around delivery times.",
    "keyFindings": [
      "85% of respondents rated customer service 4+ out of 5",
      "Delivery speed is the most frequently mentioned improvement area",
      "Mobile app usage correlates with higher satisfaction scores",
      "Peak response time is Tuesday-Thursday afternoons"
    ],
    "recommendations": [
      "Implement faster delivery options for premium customers",
      "Enhance mobile app features based on user feedback",
      "Schedule customer service training focused on response times",
      "Consider follow-up surveys for low-satisfaction respondents"
    ],
    "sentimentOverview": {
      "overall": "positive",
      "trends": [
        {
          "period": "Week 1",
          "sentiment": "neutral",
          "responseCount": 45
        },
        {
          "period": "Week 2",
          "sentiment": "positive",
          "responseCount": 67
        }
      ],
      "distribution": {
        "positive": 65,
        "neutral": 25,
        "negative": 10
      }
    },
    "correlations": [
      {
        "variables": ["mobile_app_usage", "satisfaction_score"],
        "correlation": 0.72,
        "significance": "strong",
        "insight": "Mobile app users are significantly more satisfied"
      }
    ]
  },
  "processingTime": 2.3,
  "dataPoints": 150
}
```

---

## 📊 Export Endpoints

### POST /api/export
Export questionnaire responses in various formats.

**Request Body:**
```json
{
  "questionnaireId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "options": {
    "format": "excel",
    "includeMetadata": true,
    "includeQualityChecks": false,
    "dateRange": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-31T23:59:59.000Z"
    },
    "questionIds": ["q1", "q2", "q3"],
    "status": "completed",
    "anonymize": false
  }
}
```

**Response (200) - Excel File:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="questionnaire_64f1a2b3c4d5e6f7g8h9i0j1_20240131_120000.xlsx"
```

**Excel File Structure:**
- **Sheet 1: Responses** - Individual response data
- **Sheet 2: Analytics** - Summary statistics and insights

**Response (200) - CSV File:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="questionnaire_64f1a2b3c4d5e6f7g8h9i0j1_20240131_120000.csv"
```

**Response (200) - JSON File:**
```json
{
  "questionnaire": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "title": "Customer Feedback Survey",
    "questions": [...]
  },
  "responses": [
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "answers": [...],
      "metadata": {...},
      "submittedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "analytics": {
    "totalResponses": 150,
    "completionRate": 85.5,
    "averageCompletionTime": 245.3
  },
  "exportedAt": "2024-01-31T12:00:00.000Z",
  "exportOptions": {...}
}
```

---

## 📤 File Upload Endpoint

### POST /api/upload
Upload files (for file upload questions).

**Request Body:** (Form Data)
```
file: <uploaded_file>
```

**Response (200):**
```json
{
  "filename": "abc123def456.jpg",
  "originalFilename": "customer_photo.jpg",
  "url": "/uploads/abc123def456.jpg",
  "size": 2048576,
  "mimeType": "image/jpeg",
  "uploadedAt": "2024-01-31T12:00:00.000Z"
}
```

---

## 🔍 Proxy Endpoints

### GET /api/questionnaires/{questionnaire_id}
Proxy questionnaire data from Node.js backend.

### GET /api/questionnaires/{questionnaire_id}/analytics
Proxy analytics data from Node.js backend.

---

## 📋 Data Models

### Core Models

#### Question Types
```python
class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    CHECKBOXES = "checkboxes"
    TEXT_SHORT = "text_short"
    TEXT_LONG = "text_long"
    RATING = "rating"
    SCALE = "scale"
    DATE = "date"
    TIME = "time"
    DATETIME = "datetime"
    FILE_UPLOAD = "file_upload"
    MATRIX = "matrix"
    RANKING = "ranking"
    DEMOGRAPHIC = "demographic"
```

#### Validation Rules
```python
class ValidationRules(BaseModel):
    min: Optional[Union[int, float]] = None
    max: Optional[Union[int, float]] = None
    pattern: Optional[str] = None
    customError: Optional[str] = None
    fileTypes: Optional[List[str]] = None
    maxFileSize: Optional[int] = None
```

#### Question Structure
```python
class Question(BaseModel):
    id: str
    type: QuestionType
    title: str
    description: Optional[str] = None
    helpText: Optional[str] = None
    required: bool = False
    isVisible: bool = True
    options: List[QuestionOption] = []
    validation: ValidationRules = ValidationRules()
    logic: ConditionalLogic = ConditionalLogic()
```

#### Response Structure
```python
class Answer(BaseModel):
    questionId: str
    questionType: QuestionType
    answer: Any
    metadata: Dict[str, Any] = {}
    answeredAt: datetime = Field(default_factory=datetime.utcnow)

class ResponseCreate(BaseModel):
    answers: List[Answer]
    metadata: ResponseMetadata = ResponseMetadata()
    respondentInfo: Optional[Dict[str, Any]] = None
```

### Analytics Models

#### Sentiment Analysis
```python
class SentimentAnalysis(BaseModel):
    overall: str  # positive, negative, neutral
    score: float  # -1 to 1
    confidence: float
    aspects: List[Dict[str, Any]] = []

class TextAnalysisResponse(BaseModel):
    sentiment: SentimentAnalysis
    keywords: List[Dict[str, Any]] = []
    topics: List[Dict[str, Any]] = []
    summary: Optional[str] = None
    wordCount: int
    readabilityScore: Optional[float] = None
```

#### AI Insights
```python
class AIInsights(BaseModel):
    generatedAt: datetime = Field(default_factory=datetime.utcnow)
    summary: str
    keyFindings: List[str] = []
    recommendations: List[str] = []
    sentimentOverview: Dict[str, Any] = {}
    correlations: List[Dict[str, Any]] = []

class InsightsResponse(BaseModel):
    questionnaireId: str
    insights: AIInsights
    processingTime: float
    dataPoints: int
```

### Export Models

#### Export Options
```python
class ExportFormat(str, Enum):
    EXCEL = "excel"
    CSV = "csv"
    JSON = "json"
    PDF = "pdf"

class ExportOptions(BaseModel):
    format: ExportFormat = ExportFormat.EXCEL
    includeMetadata: bool = True
    includeQualityChecks: bool = False
    dateRange: Optional[DateRange] = None
    questionIds: Optional[List[str]] = None
    status: Optional[str] = None
    anonymize: bool = False
```

---

## 🛠️ Utility Functions

### DataProcessor Class

#### Text Processing
```python
@staticmethod
def clean_text(text: str) -> str:
    """Clean and normalize text data"""

@staticmethod
def analyze_text_responses(texts: List[str]) -> Dict[str, Any]:
    """Perform comprehensive text analysis"""

@staticmethod
def extract_keywords(texts: List[str], max_keywords: int = 10) -> List[Dict[str, Any]]:
    """Extract keywords from text responses"""
```

#### Statistical Analysis
```python
@staticmethod
def calculate_completion_rate(total_responses: int, completed_responses: int) -> float:
    """Calculate completion rate percentage"""

@staticmethod
def analyze_rating_distribution(ratings: List[Union[int, float]], max_rating: int = 5) -> Dict[str, Any]:
    """Analyze rating scale distributions"""

@staticmethod
def detect_straight_lining(answers: List[Any]) -> float:
    """Detect straight-lining patterns in responses"""
```

#### Quality Assessment
```python
@staticmethod
def calculate_response_quality_score(response_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate overall response quality score"""
```

### ExcelExporter Class

#### Data Export
```python
@staticmethod
def create_response_dataframe(responses: List[Dict[str, Any]], questionnaire: Dict[str, Any]) -> pd.DataFrame:
    """Create a pandas DataFrame from response data"""

@staticmethod
def create_analytics_dataframe(analytics: Dict[str, Any]) -> pd.DataFrame:
    """Create analytics summary DataFrame"""

@staticmethod
def export_to_excel(responses_df: pd.DataFrame, analytics_df: pd.DataFrame, filename: str) -> str:
    """Export data to Excel file with multiple sheets"""
```

### InsightsGenerator Class

#### AI Analysis
```python
@staticmethod
def generate_summary(analytics: Dict[str, Any]) -> str:
    """Generate a human-readable summary of analytics"""

@staticmethod
def identify_key_findings(analytics: Dict[str, Any]) -> List[str]:
    """Identify key findings from analytics data"""

@staticmethod
def generate_recommendations(analytics: Dict[str, Any]) -> List[str]:
    """Generate actionable recommendations"""

@staticmethod
def analyze_sentiment_trends(analytics: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze sentiment trends across responses"""
```

---

## ⚠️ Error Handling

### Error Response Format
```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "details": {
    "field": "specific_field",
    "code": "ERROR_CODE",
    "additional_info": "..."
  }
}
```

### Common Errors

#### Validation Errors
```json
{
  "error": "ValidationError",
  "message": "Request data validation failed",
  "details": {
    "errors": [
      {
        "field": "text",
        "message": "Text field is required",
        "type": "missing"
      }
    ]
  }
}
```

#### Processing Errors
```json
{
  "error": "ProcessingError",
  "message": "Failed to process text analysis",
  "details": {
    "code": "TEXT_ANALYSIS_FAILED",
    "reason": "TextBlob library not available"
  }
}
```

#### File Upload Errors
```json
{
  "error": "FileUploadError",
  "message": "File upload failed",
  "details": {
    "code": "FILE_TOO_LARGE",
    "maxSize": "10MB",
    "actualSize": "15MB"
  }
}
```

### HTTP Status Codes
- **200**: Success
- **400**: Bad Request (validation error)
- **401**: Unauthorized (invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **413**: Payload Too Large (file upload)
- **422**: Unprocessable Entity (validation failed)
- **500**: Internal Server Error
- **503**: Service Unavailable (backend communication failed)

---

## ⚙️ Configuration

### Environment Variables
```bash
# Backend Communication
NODE_BACKEND_URL=http://localhost:5000

# File Storage
UPLOAD_DIR=uploads
EXPORT_DIR=exports

# Optional Dependencies
TEXTBLOB_AVAILABLE=true
NLTK_AVAILABLE=true

# Performance
MAX_WORKERS=4
REQUEST_TIMEOUT=30
```

### Dependencies
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-multipart==0.0.6
openpyxl==3.1.2
pandas==2.1.4
textblob==0.17.1
httpx==0.25.2
nltk==3.8.1
```

### Optional Dependencies
- **textblob**: For advanced sentiment analysis
- **nltk**: For advanced text processing and keyword extraction
- **pandas**: For data manipulation (required)
- **openpyxl**: For Excel export (required)

### Startup Process
1. **Import Validation**: Check for required dependencies
2. **Directory Creation**: Create upload and export directories
3. **NLTK Setup**: Download required NLTK data
4. **HTTP Client**: Initialize connection to Node.js backend
5. **Background Tasks**: Start background task processor

### Health Checks
- **Dependencies**: Check if optional libraries are available
- **File System**: Verify upload/export directories exist
- **Backend Connection**: Test connection to Node.js backend
- **Memory Usage**: Monitor memory consumption
- **Processing Queue**: Check background task queue status

---

## 🚀 Deployment

### Development
```bash
cd backend-fastapi
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Production
```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Health Monitoring
- **Endpoint**: `GET /health`
- **Metrics**: Response time, memory usage, error rate
- **Logs**: Structured logging with request IDs
- **Alerts**: Automatic alerts for service degradation

---

## 📈 Performance Considerations

### Optimization Strategies
- **Async Processing**: All I/O operations are asynchronous
- **Background Tasks**: Heavy processing moved to background
- **Caching**: Response caching for repeated requests
- **Connection Pooling**: HTTP client connection reuse
- **Memory Management**: Efficient data processing with pandas

### Scalability Features
- **Horizontal Scaling**: Multiple FastAPI instances
- **Load Balancing**: Nginx or cloud load balancers
- **Background Queues**: Redis-based task queues for heavy processing
- **CDN Integration**: Static file serving optimization

### Monitoring & Metrics
- **Response Times**: Track API endpoint performance
- **Error Rates**: Monitor error frequency and types
- **Resource Usage**: CPU, memory, and disk monitoring
- **Background Jobs**: Track task queue status and processing times

---

*This FastAPI documentation is automatically kept in sync with the codebase. Last updated: January 2024*