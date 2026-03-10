import json
import os
import random
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if GEMINI_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
else:
    model = None


def _call_gemini(prompt: str) -> str:
    if model:
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini API error: {e}")
            return None
    return None


def analyze_resume(text: str, target_role: str = "Software Engineer") -> dict:
    prompt = f"""Analyze this resume for a {target_role} position. Return a JSON object with:
{{
    "ats_score": <0-100>,
    "overall_score": <0-100>,
    "formatting_score": <0-100>,
    "content_score": <0-100>,
    "impact_score": <0-100>,
    "strengths": ["strength1", "strength2", ...],
    "weaknesses": ["weakness1", "weakness2", ...],
    "suggestions": ["suggestion1", "suggestion2", ...],
    "keywords_found": ["keyword1", "keyword2", ...],
    "keywords_missing": ["keyword1", "keyword2", ...],
    "section_analysis": {{
        "contact_info": {{"score": <0-100>, "feedback": "..."}},
        "summary": {{"score": <0-100>, "feedback": "..."}},
        "experience": {{"score": <0-100>, "feedback": "..."}},
        "education": {{"score": <0-100>, "feedback": "..."}},
        "skills": {{"score": <0-100>, "feedback": "..."}},
        "projects": {{"score": <0-100>, "feedback": "..."}}
    }}
}}
Only return valid JSON, no markdown.

Resume text:
{text[:3000]}"""

    result = _call_gemini(prompt)
    if result:
        try:
            clean = result.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1].rsplit("```", 1)[0]
            return json.loads(clean)
        except:
            pass

    # DEMO data
    return {
        "ats_score": random.randint(55, 88),
        "overall_score": random.randint(60, 85),
        "formatting_score": random.randint(50, 95),
        "content_score": random.randint(55, 90),
        "impact_score": random.randint(45, 85),
        "strengths": [
            "Strong technical skills section with relevant technologies",
            "Good project descriptions with measurable outcomes",
            "Education section is well-structured",
            "Resume length is appropriate for experience level"
        ],
        "weaknesses": [
            "Missing quantifiable achievements in experience section",
            "No professional summary or objective statement",
            "Skills section could be better categorized",
            "Limited use of action verbs"
        ],
        "suggestions": [
            "Add a compelling professional summary at the top",
            "Quantify achievements (e.g., 'Improved performance by 40%')",
            "Include relevant certifications or online courses",
            "Add links to GitHub profile or portfolio website",
            "Use stronger action verbs like 'Architected', 'Spearheaded', 'Optimized'",
            "Tailor keywords to match the target job description"
        ],
        "keywords_found": ["Python", "JavaScript", "SQL", "Git", "REST API", "Agile"],
        "keywords_missing": ["CI/CD", "Docker", "Cloud (AWS/GCP)", "System Design", "Microservices", "Testing Frameworks"],
        "section_analysis": {
            "contact_info": {"score": 80, "feedback": "Contact info present but consider adding LinkedIn and GitHub links"},
            "summary": {"score": 40, "feedback": "Missing professional summary. Add a 2-3 line summary highlighting key skills and career goals"},
            "experience": {"score": 65, "feedback": "Experience listed but lacks quantifiable impact metrics. Use the STAR method"},
            "education": {"score": 85, "feedback": "Education section is well-structured with relevant details"},
            "skills": {"score": 70, "feedback": "Good skill listing but consider categorizing into Technical, Tools, and Soft Skills"},
            "projects": {"score": 75, "feedback": "Projects demonstrate practical skills. Add tech stack and links to live demos"}
        }
    }


def generate_interview_questions(role: str, company: str = "General", difficulty: str = "medium", category: str = "technical", num_questions: int = 5) -> list:
    prompt = f"""Generate {num_questions} {difficulty} difficulty {category} interview questions for a {role} position at {company}. 
Return a JSON array where each element is:
{{
    "id": <number>,
    "question": "...",
    "category": "{category}",
    "difficulty": "{difficulty}",
    "expected_points": ["key point 1", "key point 2", ...],
    "time_limit_seconds": <120-300>,
    "hint": "brief hint"
}}
Only return valid JSON, no markdown."""

    result = _call_gemini(prompt)
    if result:
        try:
            clean = result.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1].rsplit("```", 1)[0]
            return json.loads(clean)
        except:
            pass

    # DEMO questions by category
    tech_questions = [
        {
            "id": 1, "question": "Explain the difference between process and thread. When would you use one over the other?",
            "category": "technical", "difficulty": difficulty,
            "expected_points": ["Process has own memory space", "Threads share memory", "Process isolation vs thread efficiency", "Use cases for each"],
            "time_limit_seconds": 180, "hint": "Think about memory management and resource sharing"
        },
        {
            "id": 2, "question": "What is the time complexity of common operations in a hash table? What happens during hash collisions?",
            "category": "technical", "difficulty": difficulty,
            "expected_points": ["O(1) average for insert/search/delete", "Collision resolution: chaining or open addressing", "Worst case O(n)", "Load factor importance"],
            "time_limit_seconds": 180, "hint": "Consider average vs worst case scenarios"
        },
        {
            "id": 3, "question": "Explain the SOLID principles in object-oriented design with examples.",
            "category": "technical", "difficulty": difficulty,
            "expected_points": ["Single Responsibility", "Open/Closed", "Liskov Substitution", "Interface Segregation", "Dependency Inversion"],
            "time_limit_seconds": 240, "hint": "Each letter stands for a design principle"
        },
        {
            "id": 4, "question": "How would you design a URL shortener service like bit.ly? Discuss the system architecture.",
            "category": "technical", "difficulty": difficulty,
            "expected_points": ["Hashing/encoding approach", "Database design", "Scalability considerations", "Caching strategy", "Analytics"],
            "time_limit_seconds": 300, "hint": "Think about encoding, storage, and redirection"
        },
        {
            "id": 5, "question": "What are database indexes? Explain B-tree and hash indexes with their use cases.",
            "category": "technical", "difficulty": difficulty,
            "expected_points": ["Index purpose and structure", "B-tree for range queries", "Hash for equality lookups", "Trade-offs: write speed vs read speed"],
            "time_limit_seconds": 180, "hint": "Consider different query patterns"
        },
        {
            "id": 6, "question": "Explain the concept of closures in programming with a practical example.",
            "category": "technical", "difficulty": difficulty,
            "expected_points": ["Function with reference to outer scope", "Lexical scoping", "Data encapsulation use case", "Memory implications"],
            "time_limit_seconds": 150, "hint": "A function that remembers its environment"
        },
        {
            "id": 7, "question": "What is the difference between SQL and NoSQL databases? When would you choose each?",
            "category": "technical", "difficulty": difficulty,
            "expected_points": ["Schema vs schemaless", "ACID vs BASE", "Vertical vs horizontal scaling", "Use case examples"],
            "time_limit_seconds": 180, "hint": "Think about data structure and scalability needs"
        }
    ]

    behavioral_questions = [
        {
            "id": 1, "question": "Tell me about a time you faced a major setback in a project. How did you handle it?",
            "category": "behavioral", "difficulty": difficulty,
            "expected_points": ["Specific situation", "Actions taken", "Lessons learned", "Positive outcome"],
            "time_limit_seconds": 180, "hint": "Use the STAR method: Situation, Task, Action, Result"
        },
        {
            "id": 2, "question": "Describe a situation where you had to learn a new technology quickly. How did you approach it?",
            "category": "behavioral", "difficulty": difficulty,
            "expected_points": ["Learning strategy", "Time management", "Resource utilization", "Application of knowledge"],
            "time_limit_seconds": 180, "hint": "Focus on your learning methodology"
        },
        {
            "id": 3, "question": "How do you prioritize tasks when working on multiple projects simultaneously?",
            "category": "behavioral", "difficulty": difficulty,
            "expected_points": ["Priority framework", "Communication with stakeholders", "Time management tools", "Handling deadlines"],
            "time_limit_seconds": 150, "hint": "Think about frameworks like Eisenhower matrix"
        },
        {
            "id": 4, "question": "Tell me about a time you disagreed with a team member. How did you resolve the conflict?",
            "category": "behavioral", "difficulty": difficulty,
            "expected_points": ["Active listening", "Finding common ground", "Professional communication", "Resolution outcome"],
            "time_limit_seconds": 180, "hint": "Emphasize collaboration and empathy"
        },
        {
            "id": 5, "question": "Describe your most challenging project. What made it challenging and how did you overcome the difficulties?",
            "category": "behavioral", "difficulty": difficulty,
            "expected_points": ["Challenge identification", "Problem-solving approach", "Team collaboration", "Final outcome and learning"],
            "time_limit_seconds": 240, "hint": "Choose a project that shows growth"
        }
    ]

    hr_questions = [
        {
            "id": 1, "question": "Where do you see yourself in 5 years?",
            "category": "hr", "difficulty": difficulty,
            "expected_points": ["Career growth vision", "Alignment with company", "Continuous learning", "Leadership aspirations"],
            "time_limit_seconds": 120, "hint": "Show ambition aligned with the company"
        },
        {
            "id": 2, "question": "Why should we hire you over other candidates?",
            "category": "hr", "difficulty": difficulty,
            "expected_points": ["Unique value proposition", "Relevant skills", "Cultural fit", "Enthusiasm"],
            "time_limit_seconds": 150, "hint": "Focus on what makes you unique"
        },
        {
            "id": 3, "question": "What are your salary expectations?",
            "category": "hr", "difficulty": difficulty,
            "expected_points": ["Market research", "Flexible range", "Value-based reasoning", "Professional negotiation"],
            "time_limit_seconds": 120, "hint": "Research market rates beforehand"
        },
        {
            "id": 4, "question": "What motivates you to do your best work?",
            "category": "hr", "difficulty": difficulty,
            "expected_points": ["Intrinsic motivation", "Growth mindset", "Impact-driven", "Team contribution"],
            "time_limit_seconds": 120, "hint": "Be genuine and specific"
        },
        {
            "id": 5, "question": "How do you handle pressure and stressful situations?",
            "category": "hr", "difficulty": difficulty,
            "expected_points": ["Stress management techniques", "Prioritization", "Past examples", "Positive outcome"],
            "time_limit_seconds": 150, "hint": "Give concrete examples"
        }
    ]

    question_map = {
        "technical": tech_questions,
        "behavioral": behavioral_questions,
        "hr": hr_questions
    }

    questions = question_map.get(category, tech_questions)
    random.shuffle(questions)
    selected = questions[:num_questions]
    for i, q in enumerate(selected):
        q["id"] = i + 1
    return selected


def evaluate_interview_answers(questions: list, answers: list) -> dict:
    qa_text = ""
    for i, (q, a) in enumerate(zip(questions, answers)):
        qa_text += f"\nQ{i+1}: {q.get('question', '')}\nA{i+1}: {a}\nExpected points: {', '.join(q.get('expected_points', []))}\n"

    prompt = f"""Evaluate these interview answers. Return JSON:
{{
    "evaluations": [
        {{
            "question_id": <number>,
            "score": <0-100>,
            "feedback": "detailed feedback",
            "strengths": ["..."],
            "improvements": ["..."]
        }}
    ],
    "overall_score": <0-100>,
    "overall_feedback": "summary feedback",
    "communication_score": <0-100>,
    "technical_depth_score": <0-100>,
    "confidence_score": <0-100>
}}
Only valid JSON.
{qa_text}"""

    result = _call_gemini(prompt)
    if result:
        try:
            clean = result.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1].rsplit("```", 1)[0]
            return json.loads(clean)
        except:
            pass

    # DEMO evaluation
    evaluations = []
    total = 0
    for i, (q, a) in enumerate(zip(questions, answers)):
        answer_text = str(a).strip()
        if len(answer_text) < 10:
            score = random.randint(15, 35)
            feedback = "Your answer is too brief. Try to elaborate with specific examples and cover the key points."
            strengths = ["Attempted the question"]
            improvements = ["Provide more detailed explanations", "Use specific examples", "Cover all expected points"]
        elif len(answer_text) < 50:
            score = random.randint(35, 55)
            feedback = "Decent attempt but needs more depth. Include concrete examples and address all aspects of the question."
            strengths = ["Shows basic understanding", "Addressed the core question"]
            improvements = ["Add specific examples from experience", "Elaborate on technical details", "Structure your answer using STAR method"]
        elif len(answer_text) < 150:
            score = random.randint(55, 75)
            feedback = "Good answer with reasonable detail. Could be stronger with more specific metrics and examples."
            strengths = ["Good understanding of the topic", "Reasonable detail provided", "Clear communication"]
            improvements = ["Quantify achievements where possible", "Add more technical depth", "Connect to real-world scenarios"]
        else:
            score = random.randint(72, 92)
            feedback = "Strong answer with good detail and examples. Shows solid understanding and communication skills."
            strengths = ["Comprehensive answer", "Good use of examples", "Clear and structured response", "Demonstrates expertise"]
            improvements = ["Could be more concise in some areas", "Add metrics for even more impact"]
        
        total += score
        evaluations.append({
            "question_id": i + 1,
            "score": score,
            "feedback": feedback,
            "strengths": strengths,
            "improvements": improvements
        })

    overall = total // max(len(questions), 1)
    return {
        "evaluations": evaluations,
        "overall_score": overall,
        "overall_feedback": f"Your overall performance scored {overall}/100. {'Excellent work!' if overall >= 75 else 'Good effort, with room for improvement.' if overall >= 50 else 'Keep practicing to improve your responses.'}",
        "communication_score": random.randint(max(overall - 15, 30), min(overall + 15, 100)),
        "technical_depth_score": random.randint(max(overall - 20, 25), min(overall + 10, 100)),
        "confidence_score": random.randint(max(overall - 10, 35), min(overall + 15, 100))
    }


def analyze_skill_gap(target_role: str, current_skills: list, experience_level: str = "fresher") -> dict:
    skills_text = ", ".join(current_skills) if current_skills else "Not specified"
    
    prompt = f"""Analyze the skill gap for a {experience_level} targeting a {target_role} position.
Current skills: {skills_text}

Return JSON:
{{
    "overall_readiness": <0-100>,
    "current_skills_assessment": [
        {{"skill": "...", "proficiency": <0-100>, "relevance": "high/medium/low"}}
    ],
    "required_skills": [
        {{"skill": "...", "importance": "critical/important/nice-to-have", "current_level": <0-100>, "target_level": <0-100>}}
    ],
    "gap_analysis": {{
        "critical_gaps": ["..."],
        "moderate_gaps": ["..."],
        "minor_gaps": ["..."]
    }},
    "roadmap": [
        {{
            "phase": 1,
            "title": "...",
            "duration": "...",
            "skills": ["..."],
            "resources": [{{"name": "...", "type": "course/book/practice", "url": "...", "priority": "high/medium/low"}}],
            "milestones": ["..."]
        }}
    ],
    "estimated_time_to_ready": "..."
}}
Only valid JSON."""

    result = _call_gemini(prompt)
    if result:
        try:
            clean = result.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1].rsplit("```", 1)[0]
            return json.loads(clean)
        except:
            pass

    # DEMO skill gap analysis
    role_skills = {
        "Software Engineer": {
            "critical": ["Data Structures & Algorithms", "System Design", "Problem Solving", "OOP Concepts"],
            "important": ["Database Management", "API Design", "Version Control (Git)", "Testing"],
            "nice": ["Cloud Computing", "CI/CD", "Docker/Kubernetes", "Agile Methodology"]
        },
        "Frontend Developer": {
            "critical": ["HTML/CSS", "JavaScript", "React/Vue/Angular", "Responsive Design"],
            "important": ["TypeScript", "State Management", "REST APIs", "Testing"],
            "nice": ["Next.js", "Performance Optimization", "Accessibility", "Design Systems"]
        },
        "Data Scientist": {
            "critical": ["Python", "Statistics", "Machine Learning", "Data Analysis"],
            "important": ["SQL", "Deep Learning", "Data Visualization", "Feature Engineering"],
            "nice": ["MLOps", "Big Data (Spark)", "NLP", "Cloud ML Services"]
        },
        "Backend Developer": {
            "critical": ["Server-side Language", "Database Design", "API Development", "Authentication"],
            "important": ["Caching", "Message Queues", "Microservices", "Security"],
            "nice": ["GraphQL", "gRPC", "Containerization", "Monitoring"]
        }
    }

    role_data = role_skills.get(target_role, role_skills["Software Engineer"])
    current_lower = [s.lower() for s in current_skills]

    required_skills = []
    for skill in role_data["critical"]:
        has = any(skill.lower() in cs or cs in skill.lower() for cs in current_lower)
        required_skills.append({
            "skill": skill, "importance": "critical",
            "current_level": random.randint(50, 80) if has else random.randint(5, 25),
            "target_level": 85
        })
    for skill in role_data["important"]:
        has = any(skill.lower() in cs or cs in skill.lower() for cs in current_lower)
        required_skills.append({
            "skill": skill, "importance": "important",
            "current_level": random.randint(40, 75) if has else random.randint(5, 20),
            "target_level": 75
        })
    for skill in role_data["nice"]:
        has = any(skill.lower() in cs or cs in skill.lower() for cs in current_lower)
        required_skills.append({
            "skill": skill, "importance": "nice-to-have",
            "current_level": random.randint(30, 65) if has else random.randint(0, 15),
            "target_level": 60
        })

    critical_gaps = [s["skill"] for s in required_skills if s["importance"] == "critical" and s["current_level"] < 50]
    moderate_gaps = [s["skill"] for s in required_skills if s["importance"] == "important" and s["current_level"] < 40]
    minor_gaps = [s["skill"] for s in required_skills if s["importance"] == "nice-to-have" and s["current_level"] < 30]

    avg_level = sum(s["current_level"] for s in required_skills) / max(len(required_skills), 1)
    readiness = min(100, int(avg_level * 1.2))

    return {
        "overall_readiness": readiness,
        "current_skills_assessment": [
            {"skill": s, "proficiency": random.randint(40, 85), "relevance": random.choice(["high", "medium", "low"])}
            for s in current_skills[:10]
        ],
        "required_skills": required_skills,
        "gap_analysis": {
            "critical_gaps": critical_gaps,
            "moderate_gaps": moderate_gaps,
            "minor_gaps": minor_gaps
        },
        "roadmap": [
            {
                "phase": 1, "title": "Foundation Building", "duration": "2-3 weeks",
                "skills": critical_gaps[:2] if critical_gaps else ["Core Fundamentals"],
                "resources": [
                    {"name": "LeetCode - Easy Problems", "type": "practice", "url": "https://leetcode.com", "priority": "high"},
                    {"name": "GeeksforGeeks DSA Course", "type": "course", "url": "https://geeksforgeeks.org", "priority": "high"}
                ],
                "milestones": ["Complete 50 easy problems", "Understand basic data structures"]
            },
            {
                "phase": 2, "title": "Intermediate Mastery", "duration": "3-4 weeks",
                "skills": moderate_gaps[:2] if moderate_gaps else ["Intermediate Concepts"],
                "resources": [
                    {"name": "System Design Primer", "type": "course", "url": "https://github.com/donnemartin/system-design-primer", "priority": "high"},
                    {"name": "Designing Data-Intensive Applications", "type": "book", "url": "#", "priority": "medium"}
                ],
                "milestones": ["Complete 30 medium problems", "Design 3 systems end-to-end"]
            },
            {
                "phase": 3, "title": "Advanced Preparation", "duration": "2-3 weeks",
                "skills": minor_gaps[:2] if minor_gaps else ["Advanced Topics"],
                "resources": [
                    {"name": "Mock Interview Practice", "type": "practice", "url": "#", "priority": "high"},
                    {"name": "Company-specific preparation", "type": "practice", "url": "#", "priority": "high"}
                ],
                "milestones": ["Complete 5 mock interviews", "Achieve 80%+ scores consistently"]
            },
            {
                "phase": 4, "title": "Final Polish", "duration": "1-2 weeks",
                "skills": ["Communication Skills", "Resume Optimization", "Confidence Building"],
                "resources": [
                    {"name": "Pramp - Mock Interviews", "type": "practice", "url": "https://pramp.com", "priority": "high"},
                    {"name": "Resume Builder & Review", "type": "practice", "url": "#", "priority": "medium"}
                ],
                "milestones": ["Perfect resume score", "Complete 3 full mock interviews", "Apply to target companies"]
            }
        ],
        "estimated_time_to_ready": "8-12 weeks" if readiness < 50 else "4-6 weeks" if readiness < 70 else "2-3 weeks"
    }
