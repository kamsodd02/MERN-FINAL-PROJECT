from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
from enum import Enum
import uuid


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


class ValidationRules(BaseModel):
    min: Optional[Union[int, float]] = None
    max: Optional[Union[int, float]] = None
    pattern: Optional[str] = None
    customError: Optional[str] = None
    fileTypes: Optional[List[str]] = None
    maxFileSize: Optional[int] = None  # in bytes


class QuestionOption(BaseModel):
    id: str
    text: str
    value: Optional[Any] = None
    isOther: bool = False
    image: Optional[str] = None  # URL
    score: Optional[int] = None  # For quiz scoring


class ConditionalLogic(BaseModel):
    conditions: List[Dict[str, Any]] = []
    action: str = "show"  # "show", "hide", "skip"


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


class QuestionnaireSettings(BaseModel):
    allowAnonymous: bool = True
    showProgress: bool = True
    deadline: Optional[Dict[str, Any]] = None
    theme: Dict[str, Any] = {}
    notifications: bool = True
    version: int = 1


class QuestionnaireBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "survey"
    questions: List[Question] = []
    settings: QuestionnaireSettings = QuestionnaireSettings()


class QuestionnaireCreate(QuestionnaireBase):
    workspaceId: str


class QuestionnaireUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    questions: Optional[List[Question]] = None
    settings: Optional[QuestionnaireSettings] = None


class QuestionnaireResponse(QuestionnaireBase):
    id: str
    creator: Dict[str, Any]
    workspace: Dict[str, Any]
    status: str
    collaborators: List[Dict[str, Any]] = []
    stats: Dict[str, Any] = {}
    createdAt: datetime
    updatedAt: datetime
    publishedAt: Optional[datetime] = None


# Response Models
class Answer(BaseModel):
    questionId: str
    questionType: QuestionType
    answer: Any
    metadata: Dict[str, Any] = {}
    answeredAt: datetime = Field(default_factory=datetime.utcnow)


class ResponseMetadata(BaseModel):
    sessionId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    startedAt: datetime = Field(default_factory=datetime.utcnow)
    submittedAt: Optional[datetime] = None
    lastModifiedAt: Optional[datetime] = None
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None
    referrer: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    completionTime: Optional[int] = None  # in seconds
    pageViews: Optional[int] = None
    questionViews: Optional[int] = None
    utmSource: Optional[str] = None
    utmMedium: Optional[str] = None
    utmCampaign: Optional[str] = None
    utmTerm: Optional[str] = None
    utmContent: Optional[str] = None


class ResponseCreate(BaseModel):
    answers: List[Answer]
    metadata: ResponseMetadata = ResponseMetadata()
    respondentInfo: Optional[Dict[str, Any]] = None


class ResponseUpdate(BaseModel):
    answers: Optional[List[Answer]] = None
    metadata: Optional[ResponseMetadata] = None


class ResponseResponse(BaseModel):
    id: str
    questionnaire: str
    respondent: Optional[str] = None
    answers: List[Answer]
    metadata: ResponseMetadata
    status: str
    progress: Dict[str, Any] = {}
    scoring: Optional[Dict[str, Any]] = None
    qualityChecks: Dict[str, Any] = {}
    createdAt: datetime
    updatedAt: datetime


# Analytics Models
class DateRange(BaseModel):
    start: datetime
    end: datetime


class ResponseStats(BaseModel):
    total: int = 0
    completed: int = 0
    abandoned: int = 0
    completionRate: float = 0.0
    averageCompletionTime: float = 0.0
    medianCompletionTime: float = 0.0


class QuestionAnalytics(BaseModel):
    questionId: str
    questionType: QuestionType
    questionText: str
    totalResponses: int = 0
    skippedCount: int = 0
    analytics: Dict[str, Any] = {}
    textAnalysis: Optional[Dict[str, Any]] = None


class Demographics(BaseModel):
    deviceTypes: List[Dict[str, Any]] = []
    browsers: List[Dict[str, Any]] = []
    locations: List[Dict[str, Any]] = []
    languages: List[Dict[str, Any]] = []
    timezones: List[Dict[str, Any]] = []


class TimeAnalytics(BaseModel):
    hourlyDistribution: List[Dict[str, Any]] = []
    dailyDistribution: List[Dict[str, Any]] = []
    weeklyDistribution: List[Dict[str, Any]] = []
    monthlyDistribution: List[Dict[str, Any]] = []
    peakHours: List[Dict[str, Any]] = []
    peakDays: List[Dict[str, Any]] = []


class QualityMetrics(BaseModel):
    suspiciousResponses: int = 0
    averageSpeed: float = 0.0
    straightLiningScore: float = 0.0
    attentionCheckPassRate: float = 0.0


class AIInsights(BaseModel):
    generatedAt: datetime = Field(default_factory=datetime.utcnow)
    summary: str
    keyFindings: List[str] = []
    recommendations: List[str] = []
    sentimentOverview: Dict[str, Any] = {}
    correlations: List[Dict[str, Any]] = []


class AnalyticsResponse(BaseModel):
    questionnaire: str
    workspace: str
    dateRange: DateRange
    responseStats: ResponseStats
    questionAnalytics: List[QuestionAnalytics] = []
    demographics: Demographics
    timeAnalytics: TimeAnalytics
    qualityMetrics: QualityMetrics
    aiInsights: Optional[AIInsights] = None
    reportType: str = "custom"
    generatedBy: Optional[str] = None
    isPublic: bool = False
    lastUpdated: datetime = Field(default_factory=datetime.utcnow)
    createdAt: datetime = Field(default_factory=datetime.utcnow)


# Export Models
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


class ExportRequest(BaseModel):
    questionnaireId: str
    options: ExportOptions = ExportOptions()


# AI Analysis Models
class SentimentAnalysis(BaseModel):
    overall: str  # positive, negative, neutral
    score: float  # -1 to 1
    confidence: float
    aspects: List[Dict[str, Any]] = []


class TextAnalysisRequest(BaseModel):
    text: str
    questionId: Optional[str] = None
    questionnaireId: str


class TextAnalysisResponse(BaseModel):
    sentiment: SentimentAnalysis
    keywords: List[Dict[str, Any]] = []
    topics: List[Dict[str, Any]] = []
    summary: Optional[str] = None
    wordCount: int
    readabilityScore: Optional[float] = None


class InsightsRequest(BaseModel):
    questionnaireId: str
    dateRange: Optional[DateRange] = None
    focusAreas: Optional[List[str]] = None  # e.g., ["sentiment", "trends", "correlations"]


class InsightsResponse(BaseModel):
    questionnaireId: str
    insights: AIInsights
    processingTime: float
    dataPoints: int


# Error Models
class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    code: Optional[str] = None


class ValidationErrorResponse(ErrorResponse):
    errors: List[Dict[str, Any]] = []


# Health Check
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "1.0.0"
    services: Dict[str, Any] = {}


# File Upload
class FileUploadResponse(BaseModel):
    filename: str
    url: str
    size: int
    mimeType: str
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)