import pandas as pd
import json
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timedelta
import re
from collections import Counter
import statistics
import math

# Optional imports for AI features
try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except ImportError:
    TEXTBLOB_AVAILABLE = False
    print("Warning: textblob not available. AI text analysis features will be limited.")

try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize, sent_tokenize
    NLTK_AVAILABLE = True
except ImportError:
    NLTK_AVAILABLE = False
    print("Warning: nltk not available. Advanced text processing features will be limited.")

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')


class DataProcessor:
    """Utility class for processing questionnaire response data"""

    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize text data"""
        if not text or not isinstance(text, str):
            return ""

        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())

        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s.,!?-]', '', text)

        return text

    @staticmethod
    def calculate_completion_rate(total_responses: int, completed_responses: int) -> float:
        """Calculate completion rate percentage"""
        if total_responses == 0:
            return 0.0
        return round((completed_responses / total_responses) * 100, 2)

    @staticmethod
    def calculate_average_completion_time(completion_times: List[int]) -> float:
        """Calculate average completion time in seconds"""
        if not completion_times:
            return 0.0
        return round(statistics.mean(completion_times), 2)

    @staticmethod
    def calculate_median_completion_time(completion_times: List[int]) -> float:
        """Calculate median completion time in seconds"""
        if not completion_times:
            return 0.0
        return round(statistics.median(completion_times), 2)

    @staticmethod
    def analyze_text_responses(texts: List[str]) -> Dict[str, Any]:
        """Perform comprehensive text analysis"""
        if not texts:
            return {
                "wordCount": 0,
                "averageLength": 0,
                "sentiment": {"positive": 0, "neutral": 0, "negative": 0},
                "keywords": []
            }

        # Clean texts
        cleaned_texts = [DataProcessor.clean_text(text) for text in texts if text]

        # Basic statistics
        word_counts = [len(text.split()) for text in cleaned_texts]
        total_words = sum(word_counts)
        average_length = total_words / len(cleaned_texts) if cleaned_texts else 0

        # Sentiment analysis
        sentiments = []
        for text in cleaned_texts:
            if text.strip():
                if TEXTBLOB_AVAILABLE:
                    blob = TextBlob(text)
                    polarity = blob.sentiment.polarity

                    if polarity > 0.1:
                        sentiments.append("positive")
                    elif polarity < -0.1:
                        sentiments.append("negative")
                    else:
                        sentiments.append("neutral")
                else:
                    # Fallback sentiment analysis
                    sentiments.append("neutral")

        sentiment_counts = Counter(sentiments)
        total_sentiments = len(sentiments)

        sentiment_percentages = {
            "positive": round((sentiment_counts.get("positive", 0) / total_sentiments) * 100, 1) if total_sentiments > 0 else 0,
            "neutral": round((sentiment_counts.get("neutral", 0) / total_sentiments) * 100, 1) if total_sentiments > 0 else 0,
            "negative": round((sentiment_counts.get("negative", 0) / total_sentiments) * 100, 1) if total_sentiments > 0 else 0
        }

        # Keyword extraction
        keywords = DataProcessor.extract_keywords(cleaned_texts)

        return {
            "wordCount": total_words,
            "averageLength": round(average_length, 2),
            "sentiment": sentiment_percentages,
            "keywords": keywords
        }

    @staticmethod
    def extract_keywords(texts: List[str], max_keywords: int = 10) -> List[Dict[str, Any]]:
        """Extract keywords from text responses"""
        if not texts:
            return []

        # Combine all texts
        combined_text = ' '.join(texts).lower()

        # Tokenize and remove stopwords
        if NLTK_AVAILABLE:
            stop_words = set(stopwords.words('english'))
            words = word_tokenize(combined_text)
        else:
            # Fallback tokenization
            stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
            words = combined_text.lower().split()

        # Filter words
        filtered_words = [
            word for word in words
            if word.isalnum() and
            len(word) > 2 and
            word not in stop_words
        ]

        # Count word frequencies
        word_counts = Counter(filtered_words)

        # Calculate relevance scores
        total_words = len(filtered_words)
        keywords = []

        for word, count in word_counts.most_common(max_keywords):
            relevance = round((count / total_words) * 100, 2)
            keywords.append({
                "word": word,
                "count": count,
                "relevance": relevance
            })

        return keywords

    @staticmethod
    def analyze_rating_distribution(ratings: List[Union[int, float]], max_rating: int = 5) -> Dict[str, Any]:
        """Analyze rating scale distributions"""
        if not ratings:
            return {
                "average": 0,
                "min": 0,
                "max": 0,
                "distribution": {}
            }

        # Calculate statistics
        average = round(statistics.mean(ratings), 2)
        min_rating = min(ratings)
        max_rating = max(ratings)

        # Create distribution
        distribution = {}
        for i in range(1, max_rating + 1):
            distribution[str(i)] = 0

        for rating in ratings:
            rating_str = str(int(rating))
            if rating_str in distribution:
                distribution[rating_str] += 1

        return {
            "average": average,
            "min": min_rating,
            "max": max_rating,
            "distribution": distribution
        }

    @staticmethod
    def detect_straight_lining(answers: List[Any]) -> float:
        """Detect straight-lining patterns in responses"""
        if len(answers) < 3:
            return 0.0

        # Convert answers to strings for comparison
        answer_strings = [str(answer) for answer in answers]

        # Check for identical answers
        if len(set(answer_strings)) == 1:
            return 100.0

        # Check for sequential patterns (1,2,3,4,5 or 5,4,3,2,1)
        try:
            numeric_answers = [float(ans) for ans in answer_strings if ans.replace('.', '').isdigit()]
            if len(numeric_answers) >= 3:
                # Check ascending
                ascending = all(numeric_answers[i] <= numeric_answers[i+1] for i in range(len(numeric_answers)-1))
                # Check descending
                descending = all(numeric_answers[i] >= numeric_answers[i+1] for i in range(len(numeric_answers)-1))

                if ascending or descending:
                    return 75.0
        except (ValueError, AttributeError):
            pass

        return 0.0

    @staticmethod
    def calculate_response_quality_score(response_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate overall response quality score"""
        score = 100
        flags = []

        # Speed check
        completion_time = response_data.get('completionTime', 0)
        question_count = response_data.get('questionCount', 1)

        if completion_time > 0 and question_count > 0:
            avg_time_per_question = completion_time / question_count
            if avg_time_per_question < 5:  # Less than 5 seconds per question
                score -= 30
                flags.append("too_fast")

        # Straight-lining check
        answers = response_data.get('answers', [])
        straight_line_score = DataProcessor.detect_straight_lining(answers)
        if straight_line_score > 50:
            score -= 25
            flags.append("straight_lining")

        # Missing data check
        total_answers = len(answers)
        if total_answers < question_count * 0.7:  # Less than 70% questions answered
            score -= 20
            flags.append("incomplete")

        return {
            "score": max(0, score),
            "flags": flags,
            "isSuspicious": score < 50
        }


class ExcelExporter:
    """Utility class for exporting data to Excel format"""

    @staticmethod
    def create_response_dataframe(responses: List[Dict[str, Any]], questionnaire: Dict[str, Any]) -> pd.DataFrame:
        """Create a pandas DataFrame from response data"""
        rows = []

        for response in responses:
            row = {
                'Response ID': str(response.get('_id', '')),
                'Submitted At': response.get('metadata', {}).get('submittedAt', ''),
                'Completion Time (seconds)': response.get('metadata', {}).get('completionTime', 0),
                'Status': response.get('status', 'unknown'),
                'IP Address': response.get('metadata', {}).get('ipAddress', ''),
                'User Agent': response.get('metadata', {}).get('userAgent', ''),
            }

            # Add question answers
            for answer in response.get('answers', []):
                question_id = answer.get('questionId', '')
                question_title = DataProcessor._get_question_title(questionnaire, question_id)
                answer_value = DataProcessor._format_answer(answer)

                row[f"Q: {question_title}"] = answer_value

            # Add scoring if available
            if response.get('scoring'):
                scoring = response['scoring']
                row['Total Score'] = scoring.get('totalScore', 0)
                row['Max Score'] = scoring.get('maxScore', 0)
                row['Percentage'] = scoring.get('percentage', 0)
                row['Grade'] = scoring.get('grade', '')
                row['Passed'] = scoring.get('passed', False)

            rows.append(row)

        return pd.DataFrame(rows)

    @staticmethod
    def _get_question_title(questionnaire: Dict[str, Any], question_id: str) -> str:
        """Get question title from questionnaire data"""
        questions = questionnaire.get('questions', [])
        for question in questions:
            if question.get('id') == question_id:
                return question.get('title', f'Question {question_id}')
        return f'Question {question_id}'

    @staticmethod
    def _format_answer(answer: Dict[str, Any]) -> str:
        """Format answer for Excel export"""
        answer_value = answer.get('answer', '')

        # Handle different answer types
        if isinstance(answer_value, list):
            return ', '.join(str(item) for item in answer_value)
        elif isinstance(answer_value, dict):
            return json.dumps(answer_value)
        else:
            return str(answer_value)

    @staticmethod
    def create_analytics_dataframe(analytics: Dict[str, Any]) -> pd.DataFrame:
        """Create analytics summary DataFrame"""
        summary_data = {
            'Metric': [
                'Total Responses',
                'Completed Responses',
                'Abandoned Responses',
                'Completion Rate (%)',
                'Average Completion Time (seconds)',
                'Median Completion Time (seconds)'
            ],
            'Value': [
                analytics.get('responseStats', {}).get('total', 0),
                analytics.get('responseStats', {}).get('completed', 0),
                analytics.get('responseStats', {}).get('abandoned', 0),
                analytics.get('responseStats', {}).get('completionRate', 0),
                analytics.get('responseStats', {}).get('averageCompletionTime', 0),
                analytics.get('responseStats', {}).get('medianCompletionTime', 0)
            ]
        }

        return pd.DataFrame(summary_data)

    @staticmethod
    def export_to_excel(responses_df: pd.DataFrame, analytics_df: pd.DataFrame, filename: str) -> str:
        """Export data to Excel file with multiple sheets"""
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            # Responses sheet
            responses_df.to_excel(writer, sheet_name='Responses', index=False)

            # Analytics sheet
            analytics_df.to_excel(writer, sheet_name='Analytics', index=False)

            # Auto-adjust column widths
            for sheet_name in writer.sheets:
                worksheet = writer.sheets[sheet_name]
                for column in worksheet.columns:
                    max_length = 0
                    column_letter = column[0].column_letter

                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except:
                            pass

                    adjusted_width = min(max_length + 2, 50)  # Max width of 50
                    worksheet.column_dimensions[column_letter].width = adjusted_width

        return filename


class InsightsGenerator:
    """AI-powered insights generation utility"""

    @staticmethod
    def generate_summary(analytics: Dict[str, Any]) -> str:
        """Generate a human-readable summary of analytics"""
        stats = analytics.get('responseStats', {})
        total = stats.get('total', 0)
        completed = stats.get('completed', 0)
        completion_rate = stats.get('completionRate', 0)

        summary = f"This questionnaire has received {total} responses, "
        summary += f"with {completed} completed ({completion_rate}% completion rate)."

        if completion_rate > 80:
            summary += " The response rate is excellent."
        elif completion_rate > 60:
            summary += " The response rate is good."
        else:
            summary += " Consider strategies to improve response rates."

        avg_time = stats.get('averageCompletionTime', 0)
        if avg_time > 0:
            summary += f" Average completion time is {avg_time} seconds."

        return summary

    @staticmethod
    def identify_key_findings(analytics: Dict[str, Any]) -> List[str]:
        """Identify key findings from analytics data"""
        findings = []

        # Response rate findings
        completion_rate = analytics.get('responseStats', {}).get('completionRate', 0)
        if completion_rate > 90:
            findings.append("Excellent completion rate indicates high engagement")
        elif completion_rate < 50:
            findings.append("Low completion rate suggests potential issues with survey design")

        # Time-based findings
        avg_time = analytics.get('responseStats', {}).get('averageCompletionTime', 0)
        if avg_time > 600:  # 10 minutes
            findings.append("Long average completion time may indicate complex questions")
        elif avg_time < 60:  # 1 minute
            findings.append("Very short completion time suggests questions may be too simple")

        # Quality findings
        quality = analytics.get('qualityMetrics', {})
        suspicious = quality.get('suspiciousResponses', 0)
        total = analytics.get('responseStats', {}).get('total', 1)

        if suspicious / total > 0.2:  # More than 20% suspicious
            findings.append("High number of suspicious responses detected")

        return findings

    @staticmethod
    def generate_recommendations(analytics: Dict[str, Any]) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []

        completion_rate = analytics.get('responseStats', {}).get('completionRate', 0)
        if completion_rate < 70:
            recommendations.append("Consider shortening the survey or adding progress indicators")
            recommendations.append("Review question wording for clarity")

        avg_time = analytics.get('responseStats', {}).get('averageCompletionTime', 0)
        if avg_time > 300:  # 5 minutes
            recommendations.append("Break long surveys into multiple pages")
            recommendations.append("Consider using simpler question types")

        # Check for unanswered questions
        question_analytics = analytics.get('questionAnalytics', [])
        low_response_questions = [
            qa for qa in question_analytics
            if qa.get('totalResponses', 0) < analytics.get('responseStats', {}).get('completed', 1) * 0.8
        ]

        if low_response_questions:
            recommendations.append(f"Review questions with low response rates: {[qa.get('questionText', '')[:50] for qa in low_response_questions[:3]]}")

        return recommendations

    @staticmethod
    def analyze_sentiment_trends(analytics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze sentiment trends across responses"""
        sentiment_overview = {
            "overall": "neutral",
            "trends": [],
            "distribution": {"positive": 0, "neutral": 0, "negative": 0}
        }

        # Aggregate sentiment from text analysis
        question_analytics = analytics.get('questionAnalytics', [])
        total_sentiment = {"positive": 0, "neutral": 0, "negative": 0}

        for qa in question_analytics:
            text_analysis = qa.get('textAnalysis', {})
            sentiment = text_analysis.get('sentiment', {})

            for key in total_sentiment:
                total_sentiment[key] += sentiment.get(key, 0)

        # Calculate overall sentiment
        if total_sentiment["positive"] > total_sentiment["negative"] + total_sentiment["neutral"]:
            sentiment_overview["overall"] = "positive"
        elif total_sentiment["negative"] > total_sentiment["positive"] + total_sentiment["neutral"]:
            sentiment_overview["overall"] = "negative"

        sentiment_overview["distribution"] = total_sentiment

        return sentiment_overview