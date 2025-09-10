import {
  TranscriptionServiceInterface,
  TranscriptMetadata,
} from '../../types/cpd.types';

class TranscriptionService implements TranscriptionServiceInterface {
  
  // Medical terms dictionary for detection and correction
  private medicalTerms: string[] = [
    'medication', 'patient', 'diagnosis', 'treatment', 'nursing', 'clinical',
    'assessment', 'intervention', 'care plan', 'documentation', 'procedure',
    'protocol', 'guideline', 'evidence-based', 'best practice', 'quality',
    'safety', 'risk assessment', 'infection control', 'hand hygiene',
    'wound care', 'medication administration', 'vital signs', 'blood pressure',
    'pulse', 'temperature', 'respiratory', 'cardiovascular', 'neurological',
    'gastrointestinal', 'musculoskeletal', 'endocrine', 'renal', 'hepatic',
    'dermatology', 'oncology', 'pediatric', 'geriatric', 'mental health',
    'psychiatry', 'psychology', 'rehabilitation', 'palliative', 'emergency',
    'critical care', 'intensive care', 'operating theatre', 'anaesthesia',
    'recovery', 'discharge planning', 'continuity of care', 'multidisciplinary',
    'interprofessional', 'collaboration', 'communication', 'documentation',
    'record keeping', 'confidentiality', 'consent', 'capacity', 'safeguarding',
    'advocacy', 'ethics', 'professional standards', 'NMC', 'revalidation',
    'CPD', 'reflection', 'supervision', 'mentorship', 'leadership',
  ];

  // Common medical term corrections
  private termCorrections: { [key: string]: string } = {
    'medecine': 'medicine',
    'medicacion': 'medication',
    'patien': 'patient',
    'diagnoses': 'diagnosis',
    'treatement': 'treatment',
    'assesment': 'assessment',
    'proceedure': 'procedure',
    'protacol': 'protocol',
    'evidance': 'evidence',
    'qualaty': 'quality',
    'safty': 'safety',
    'infaction': 'infection',
    'higene': 'hygiene',
    'administracion': 'administration',
    'respitory': 'respiratory',
    'cardiovasculer': 'cardiovascular',
    'neurlogical': 'neurological',
    'gastrointestinal': 'gastrointestinal',
    'muscloskeletal': 'musculoskeletal',
    'endocrin': 'endocrine',
    'pediatrik': 'pediatric',
    'geriatrik': 'geriatric',
    'rehabilitacion': 'rehabilitation',
    'pallitive': 'palliative',
    'emergancy': 'emergency',
    'intensiv': 'intensive',
    'anaestesia': 'anaesthesia',
    'recovary': 'recovery',
    'discharg': 'discharge',
    'multidisciplinry': 'multidisciplinary',
    'interprofesional': 'interprofessional',
    'colaboration': 'collaboration',
    'comunicacion': 'communication',
    'confidencialaty': 'confidentiality',
    'safguarding': 'safeguarding',
    'advocasy': 'advocacy',
    'ethiks': 'ethics',
    'profesional': 'professional',
    'revalidacion': 'revalidation',
    'refleccion': 'reflection',
    'supervicion': 'supervision',
    'mentorshp': 'mentorship',
    'ledership': 'leadership',
  };

  async transcribeAudio(audioUri: string): Promise<{
    transcript: string;
    confidence: number;
    metadata: Partial<TranscriptMetadata>;
  }> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      // Mock transcription - in real app would call Whisper, Google STT, or similar
      const mockTranscripts = [
        "Today I attended a clinical skills workshop focused on wound care management. The session covered advanced dressing techniques and infection prevention protocols. I learned about the importance of proper assessment before applying dressings and how to document findings accurately. This knowledge will help improve patient outcomes in my daily practice.",
        
        "I completed a reflection on a challenging patient interaction where effective communication was crucial. The situation involved explaining medication side effects to an anxious patient. I used active listening techniques and provided clear, simple explanations. This experience reinforced the importance of patient-centered communication in nursing practice.",
        
        "Attended a multidisciplinary team meeting discussing discharge planning for complex patients. The session emphasized the role of each team member and how effective collaboration improves continuity of care. I gained insights into social services referrals and community support options available to patients.",
        
        "Participated in a medication safety training session covering high-risk medications and double-checking procedures. The training highlighted common medication errors and prevention strategies. I learned about the five rights of medication administration and proper documentation requirements.",
        
        "Completed an online module on infection control practices, focusing on hand hygiene and personal protective equipment use. The course covered evidence-based guidelines for preventing healthcare-associated infections. I reflected on current practices in my workplace and identified areas for improvement.",
      ];
      
      const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      const confidence = 85 + Math.random() * 10; // 85-95% confidence
      
      // Detect medical terms in transcript
      const detectedTerms = this.detectMedicalTerms(transcript);
      
      const metadata: Partial<TranscriptMetadata> = {
        confidence,
        language: 'en-GB',
        medicalTermsDetected: detectedTerms,
        editHistory: [],
      };

      return {
        transcript,
        confidence,
        metadata,
      };
    } catch (error) {
      console.error('Transcription failed:', error);
      throw new Error('Failed to transcribe audio. Please try again.');
    }
  }

  detectMedicalTerms(text: string): string[] {
    const lowerText = text.toLowerCase();
    const detectedTerms: string[] = [];
    
    for (const term of this.medicalTerms) {
      if (lowerText.includes(term.toLowerCase())) {
        detectedTerms.push(term);
      }
    }
    
    // Remove duplicates and sort
    return [...new Set(detectedTerms)].sort();
  }

  correctMedicalTerms(text: string): string {
    let correctedText = text;
    
    // Apply term corrections
    for (const [incorrect, correct] of Object.entries(this.termCorrections)) {
      const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
      correctedText = correctedText.replace(regex, correct);
    }
    
    return correctedText;
  }

  // Validate transcript for common issues
  validateTranscript(text: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check minimum length
    if (text.length < 10) {
      issues.push('Transcript is too short');
      suggestions.push('Add more detail about your learning experience');
    }
    
    // Check for medical terms
    const medicalTerms = this.detectMedicalTerms(text);
    if (medicalTerms.length === 0) {
      issues.push('No medical or nursing terms detected');
      suggestions.push('Include specific medical terminology related to your learning');
    }
    
    // Check for learning outcomes indicators
    const learningIndicators = [
      'learned', 'gained', 'understood', 'improved', 'developed',
      'knowledge', 'skills', 'experience', 'insight', 'reflection'
    ];
    
    const hasLearningIndicators = learningIndicators.some(indicator =>
      text.toLowerCase().includes(indicator)
    );
    
    if (!hasLearningIndicators) {
      issues.push('No clear learning outcomes identified');
      suggestions.push('Describe what you learned or how you developed');
    }
    
    // Check for proper sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 2) {
      issues.push('Consider writing in complete sentences');
      suggestions.push('Structure your reflection with clear sentences');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  }

  // Extract learning outcomes from text using simple NLP
  extractLearningOutcomes(text: string): string[] {
    const outcomes: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Pattern matching for learning statements
    const patterns = [
      /i learned (.*?)(?:\.|,|$)/gi,
      /i gained (.*?)(?:\.|,|$)/gi,
      /i understood (.*?)(?:\.|,|$)/gi,
      /i developed (.*?)(?:\.|,|$)/gi,
      /this helped me (.*?)(?:\.|,|$)/gi,
      /i now understand (.*?)(?:\.|,|$)/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 5) {
          outcomes.push(match[1].trim());
        }
      }
    }
    
    // If no patterns found, try to extract from context
    if (outcomes.length === 0) {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
      
      // Look for sentences with learning-related keywords
      for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase();
        if (lowerSentence.includes('learn') || 
            lowerSentence.includes('understand') || 
            lowerSentence.includes('knowledge') ||
            lowerSentence.includes('skill')) {
          outcomes.push(sentence.trim());
        }
      }
    }
    
    return outcomes.slice(0, 3); // Limit to 3 outcomes
  }

  // Generate summary from transcript
  generateSummary(text: string, maxLength: number = 100): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length === 0) return text.substring(0, maxLength);
    
    // Take first sentence and key sentences
    let summary = sentences[0].trim();
    
    if (summary.length < maxLength && sentences.length > 1) {
      // Add sentences until we reach max length
      for (let i = 1; i < sentences.length && summary.length < maxLength; i++) {
        const nextSentence = sentences[i].trim();
        if (summary.length + nextSentence.length + 2 <= maxLength) {
          summary += '. ' + nextSentence;
        } else {
          break;
        }
      }
    }
    
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3) + '...';
    }
    
    return summary;
  }
}

export default new TranscriptionService();