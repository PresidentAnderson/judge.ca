from flask import Flask, request, jsonify
import spacy
import fitz  # PyMuPDF
from docx import Document
import re
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import json
import logging
from typing import Dict, List, Any
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load NLP models
try:
    nlp = spacy.load("en_core_web_sm")
    sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("AI models loaded successfully")
except Exception as e:
    logger.error(f"Error loading AI models: {e}")
    nlp = None
    sentence_model = None

class ResumeParser:
    def __init__(self):
        self.skills_pattern = re.compile(r'\b(?:python|javascript|java|react|node\.?js|angular|vue|sql|aws|docker|kubernetes|git|machine learning|ai|typescript|html|css|php|ruby|go|rust|swift|kotlin|c\+\+|c#|scala|r|matlab|tensorflow|pytorch|scikit-learn|pandas|numpy|flask|django|spring|laravel|express|mongodb|postgresql|mysql|redis|elasticsearch|apache|nginx|linux|windows|macos|agile|scrum|devops|ci/cd|jenkins|gitlab|github|jira|confluence|slack|teams|excel|powerpoint|word|project management|leadership|communication|problem solving|teamwork|analytical thinking|creativity|time management|adaptability|critical thinking|customer service|sales|marketing|finance|accounting|hr|legal|operations|supply chain|logistics|quality assurance|testing|debugging|troubleshooting|optimization|performance|security|encryption|networking|cloud computing|big data|data science|data analysis|business intelligence|machine learning|deep learning|neural networks|nlp|computer vision|robotics|iot|blockchain|cryptocurrency|fintech|edtech|healthcare|biotech|ecommerce|saas|b2b|b2c|api|rest|graphql|microservices|serverless|lambda|azure|gcp|terraform|ansible|puppet|chef|vagrant|maven|gradle|npm|pip|conda|jupyter|tableau|power bi|looker|salesforce|hubspot|marketo|mailchimp|google analytics|facebook ads|google ads|seo|sem|social media|content marketing|email marketing|affiliate marketing|influencer marketing|brand management|product management|ux|ui|design|figma|sketch|adobe|photoshop|illustrator|after effects|premiere|final cut|blender|unity|unreal|game development|mobile development|web development|frontend|backend|fullstack|database|api development|integration|automation|workflow|business process|lean|six sigma|iso|compliance|gdpr|hipaa|sox|pci|cybersecurity|penetration testing|ethical hacking|incident response|risk management|audit|compliance|governance)\\b', re.IGNORECASE)
        
        self.education_pattern = re.compile(r'\b(?:bachelor|master|phd|doctorate|mba|bs|ba|ms|ma|bsc|msc|degree|university|college|institute|certification|certified|diploma|associate)\b', re.IGNORECASE)
        
        self.experience_pattern = re.compile(r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)', re.IGNORECASE)

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text
        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
            return ""

    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file_path)
            text = []
            for paragraph in doc.paragraphs:
                text.append(paragraph.text)
            return '\n'.join(text)
        except Exception as e:
            logger.error(f"Error extracting DOCX text: {e}")
            return ""

    def extract_contact_info(self, text: str) -> Dict[str, Any]:
        """Extract contact information from resume text"""
        contact_info = {}
        
        # Email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        contact_info['email'] = emails[0] if emails else None
        
        # Phone
        phone_pattern = r'(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}'
        phones = re.findall(phone_pattern, text)
        contact_info['phone'] = phones[0] if phones else None
        
        # LinkedIn
        linkedin_pattern = r'(?:linkedin\.com/in/|linkedin\.com/pub/)([A-Za-z0-9\-\.]+)'
        linkedin = re.search(linkedin_pattern, text, re.IGNORECASE)
        contact_info['linkedin'] = linkedin.group(0) if linkedin else None
        
        return contact_info

    def extract_skills(self, text: str) -> List[str]:
        """Extract skills from resume text"""
        skills = set()
        matches = self.skills_pattern.findall(text)
        for match in matches:
            skills.add(match.lower())
        return list(skills)

    def extract_education(self, text: str) -> List[Dict[str, str]]:
        """Extract education information"""
        education = []
        lines = text.split('\n')
        
        for i, line in enumerate(lines):
            if self.education_pattern.search(line):
                education_entry = {
                    'degree': line.strip(),
                    'context': ' '.join(lines[max(0, i-1):i+2])
                }
                education.append(education_entry)
        
        return education

    def extract_experience_years(self, text: str) -> int:
        """Extract years of experience"""
        matches = self.experience_pattern.findall(text)
        if matches:
            return max([int(match) for match in matches])
        return 0

    def parse_resume(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """Main resume parsing function"""
        try:
            # Extract text based on file type
            if file_type.lower() == 'pdf':
                text = self.extract_text_from_pdf(file_path)
            elif file_type.lower() in ['docx', 'doc']:
                text = self.extract_text_from_docx(file_path)
            else:
                return {"error": "Unsupported file type"}

            if not text:
                return {"error": "Could not extract text from file"}

            # Parse resume data
            parsed_data = {
                'raw_text': text,
                'contact_info': self.extract_contact_info(text),
                'skills': self.extract_skills(text),
                'education': self.extract_education(text),
                'experience_years': self.extract_experience_years(text),
                'word_count': len(text.split())
            }

            # Use NLP for entity extraction if available
            if nlp:
                doc = nlp(text)
                entities = {
                    'persons': [ent.text for ent in doc.ents if ent.label_ == "PERSON"],
                    'organizations': [ent.text for ent in doc.ents if ent.label_ == "ORG"],
                    'locations': [ent.text for ent in doc.ents if ent.label_ in ["GPE", "LOC"]]
                }
                parsed_data['entities'] = entities

            return parsed_data

        except Exception as e:
            logger.error(f"Error parsing resume: {e}")
            return {"error": str(e)}

class JobMatcher:
    def __init__(self):
        self.parser = ResumeParser()

    def calculate_skill_match(self, resume_skills: List[str], job_skills: List[str]) -> float:
        """Calculate skill match percentage"""
        if not job_skills:
            return 0.0
        
        resume_skills_set = set(skill.lower() for skill in resume_skills)
        job_skills_set = set(skill.lower() for skill in job_skills)
        
        intersection = resume_skills_set.intersection(job_skills_set)
        return len(intersection) / len(job_skills_set) * 100

    def calculate_semantic_match(self, resume_text: str, job_description: str) -> float:
        """Calculate semantic similarity between resume and job description"""
        if not sentence_model:
            return 0.0
        
        try:
            # Create embeddings
            resume_embedding = sentence_model.encode([resume_text])
            job_embedding = sentence_model.encode([job_description])
            
            # Calculate cosine similarity
            similarity = cosine_similarity(resume_embedding, job_embedding)[0][0]
            return float(similarity * 100)
        except Exception as e:
            logger.error(f"Error calculating semantic match: {e}")
            return 0.0

    def match_resume_to_job(self, resume_data: Dict[str, Any], job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Match resume to job and return match analysis"""
        try:
            # Extract job requirements
            job_skills = job_data.get('required_skills', []) + job_data.get('preferred_skills', [])
            job_description = job_data.get('description', '') + ' ' + job_data.get('requirements', '')
            
            # Calculate different types of matches
            skill_match = self.calculate_skill_match(resume_data.get('skills', []), job_skills)
            semantic_match = self.calculate_semantic_match(resume_data.get('raw_text', ''), job_description)
            
            # Experience match
            required_experience = job_data.get('experience_years', 0)
            candidate_experience = resume_data.get('experience_years', 0)
            experience_match = min(100, (candidate_experience / max(required_experience, 1)) * 100)
            
            # Overall match score (weighted average)
            overall_match = (skill_match * 0.4 + semantic_match * 0.4 + experience_match * 0.2)
            
            match_analysis = {
                'overall_score': round(overall_match, 2),
                'skill_match': round(skill_match, 2),
                'semantic_match': round(semantic_match, 2),
                'experience_match': round(experience_match, 2),
                'matched_skills': list(set(resume_data.get('skills', [])).intersection(set(job_skills))),
                'missing_skills': list(set(job_skills) - set(resume_data.get('skills', []))),
                'experience_gap': max(0, required_experience - candidate_experience)
            }
            
            return match_analysis
            
        except Exception as e:
            logger.error(f"Error matching resume to job: {e}")
            return {"error": str(e)}

# Initialize matcher
matcher = JobMatcher()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "models_loaded": nlp is not None and sentence_model is not None})

@app.route('/parse-resume', methods=['POST'])
def parse_resume():
    """Parse uploaded resume file"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Save file temporarily
        file_path = f"/tmp/{file.filename}"
        file.save(file_path)
        
        # Determine file type
        file_type = file.filename.split('.')[-1].lower()
        
        # Parse resume
        result = matcher.parser.parse_resume(file_path, file_type)
        
        # Clean up temporary file
        os.remove(file_path)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in parse_resume endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/match-resume', methods=['POST'])
def match_resume():
    """Match parsed resume data to job requirements"""
    try:
        data = request.json
        resume_data = data.get('resume_data')
        job_data = data.get('job_data')
        
        if not resume_data or not job_data:
            return jsonify({"error": "Both resume_data and job_data are required"}), 400
        
        result = matcher.match_resume_to_job(resume_data, job_data)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in match_resume endpoint: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5001)), debug=False)