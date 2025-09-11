import { TranscriptionServiceInterface, TranscriptMetadata } from '../../types/cpd.types';

class TranscriptionService implements TranscriptionServiceInterface {
  
  async transcribeAudio(audioUri: string): Promise<{
    transcript: string;
    confidence: number;
    metadata: Partial<TranscriptMetadata>;
  }> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock transcription result
      const mockTranscripts = [
        "Today I attended a clinical skills workshop focused on advanced patient assessment techniques. I learned about systematic approaches to physical examination and how to identify subtle signs of deterioration. The session emphasized the importance of holistic patient care and effective communication with patients and their families.",
        "During my mentoring session with a junior colleague, I reflected on my leadership style and how I can better support new team members. We discussed challenging patient scenarios and I shared evidence-based strategies for managing complex clinical situations.",
        "I completed an online course on infection control protocols and updated my knowledge of the latest guidelines. The training covered hand hygiene practices, personal protective equipment use, and strategies for preventing healthcare-associated infections in various clinical settings.",
        "Today's reflection focuses on a challenging ethical dilemma I encountered in practice. I considered the principles of beneficence and autonomy while making decisions about patient care. This experience has reinforced the importance of involving patients in their care decisions and maintaining professional boundaries."
      ];
      
      const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      const confidence = 85 + Math.random() * 10; // 85-95%
      
      const metadata: Partial<TranscriptMetadata> = {
        confidence,
        language: 'en-GB',
        medicalTermsDetected: this.detectMedicalTerms(transcript),
        editHistory: [],
      };
      
      return {
        transcript,
        confidence,
        metadata,
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio. Please try again.');
    }
  }

  detectMedicalTerms(text: string): string[] {
    const medicalTerms = [
      'assessment', 'patient', 'clinical', 'diagnosis', 'treatment', 'medication',
      'symptoms', 'nursing', 'healthcare', 'protocol', 'guidelines', 'infection',
      'hygiene', 'sterile', 'vital signs', 'blood pressure', 'temperature',
      'respiratory', 'cardiovascular', 'neurological', 'gastrointestinal',
      'musculoskeletal', 'dermatological', 'psychiatric', 'pediatric', 'geriatric',
      'emergency', 'intensive care', 'surgery', 'anesthesia', 'pharmacy',
      'laboratory', 'radiology', 'pathology', 'rehabilitation', 'palliative',
      'wound care', 'catheter', 'IV', 'injection', 'prescription', 'dosage',
      'allergy', 'adverse reaction', 'contraindication', 'efficacy', 'therapeutic'
    ];
    
    const lowerText = text.toLowerCase();
    const detectedTerms: string[] = [];
    
    medicalTerms.forEach(term => {
      if (lowerText.includes(term.toLowerCase())) {
        detectedTerms.push(term);
      }
    });
    
    // Remove duplicates and return
    return Array.from(new Set(detectedTerms));
  }

  correctMedicalTerms(text: string): string {
    const corrections: { [key: string]: string } = {
      'BP': 'blood pressure',
      'HR': 'heart rate',
      'RR': 'respiratory rate',
      'O2': 'oxygen',
      'IV': 'intravenous',
      'IM': 'intramuscular',
      'PO': 'per oral',
      'PRN': 'as needed',
      'BID': 'twice daily',
      'TID': 'three times daily',
      'QID': 'four times daily',
      'NPO': 'nothing by mouth',
      'DNR': 'do not resuscitate',
      'ICU': 'intensive care unit',
      'ED': 'emergency department',
      'OR': 'operating room',
      'PACU': 'post-anesthesia care unit',
    };
    
    let correctedText = text;
    
    Object.entries(corrections).forEach(([abbrev, fullTerm]) => {
      const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
      correctedText = correctedText.replace(regex, fullTerm);
    });
    
    return correctedText;
  }

  // Additional helper methods for CPDTrackerScreen
  extractLearningOutcomes(transcript: string): string[] {
    const outcomes: string[] = [];
    
    // Look for learning-related phrases
    const learningPatterns = [
      /I learned (.*?)(?:\.|$)/gi,
      /I gained (.*?)(?:\.|$)/gi,
      /I developed (.*?)(?:\.|$)/gi,
      /I improved (.*?)(?:\.|$)/gi,
      /I enhanced (.*?)(?:\.|$)/gi,
      /I discovered (.*?)(?:\.|$)/gi,
      /I understood (.*?)(?:\.|$)/gi,
      /I realized (.*?)(?:\.|$)/gi,
    ];
    
    learningPatterns.forEach(pattern => {
      const matches = Array.from(transcript.matchAll(pattern));
      matches.forEach(match => {
        if (match[1] && match[1].trim().length > 5) {
          outcomes.push(`Enhanced understanding of ${match[1].trim().toLowerCase()}`);
        }
      });
    });
    
    // Add some default outcomes if none were extracted
    if (outcomes.length === 0) {
      const defaultOutcomes = [
        'Improved clinical knowledge through reflective practice',
        'Enhanced professional development through self-reflection',
        'Strengthened evidence-based practice skills',
      ];
      outcomes.push(defaultOutcomes[Math.floor(Math.random() * defaultOutcomes.length)]);
    }
    
    // Limit to 3 outcomes and remove duplicates
    return Array.from(new Set(outcomes)).slice(0, 3);
  }

  generateSummary(transcript: string, maxLength: number = 100): string {
    if (transcript.length <= maxLength) {
      return transcript;
    }
    
    // Try to find first sentence
    const sentences = transcript.split(/[.!?]+/);
    const firstSentence = sentences[0]?.trim();
    
    if (firstSentence && firstSentence.length <= maxLength) {
      return firstSentence;
    }
    
    // Fallback to truncation with word boundary
    const truncated = transcript.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.8) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
  }

  // Quality assessment
  assessTranscriptionQuality(transcript: string, confidence: number): {
    quality: 'high' | 'medium' | 'low';
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check confidence score
    if (confidence < 70) {
      issues.push('Low transcription confidence');
      suggestions.push('Consider re-recording with better audio quality');
    }
    
    // Check length
    if (transcript.length < 50) {
      issues.push('Very short transcript');
      suggestions.push('Add more detailed reflection');
    }
    
    // Check for incomplete sentences
    const sentences = transcript.split(/[.!?]+/);
    const incompleteSentences = sentences.filter(s => s.trim().length > 0 && s.trim().length < 10);
    if (incompleteSentences.length > sentences.length * 0.3) {
      issues.push('Many incomplete sentences detected');
      suggestions.push('Review and complete truncated thoughts');
    }
    
    // Determine overall quality
    let quality: 'high' | 'medium' | 'low';
    if (confidence >= 90 && transcript.length >= 100 && issues.length === 0) {
      quality = 'high';
    } else if (confidence >= 70 && transcript.length >= 50 && issues.length <= 2) {
      quality = 'medium';
    } else {
      quality = 'low';
    }
    
    return { quality, issues, suggestions };
  }

  // Format transcript for different purposes
  formatTranscript(
    transcript: string, 
    format: 'cpd' | 'reflection' | 'summary'
  ): string {
    switch (format) {
      case 'cpd':
        return `Professional Development Reflection:\n\n${transcript}\n\nThis reflection contributes to my ongoing professional development and meets NMC revalidation requirements.`;
      
      case 'reflection':
        return `Clinical Reflection:\n\nDescription: ${transcript}\n\nLearning Points: ${this.extractLearningOutcomes(transcript).join(', ')}\n\nFuture Actions: Continue to apply these insights in my professional practice.`;
      
      case 'summary':
        return this.generateSummary(transcript, 200);
      
      default:
        return transcript;
    }
  }
}

// Create singleton and static wrapper methods
const transcriptionServiceInstance = new TranscriptionService();

class TranscriptionServiceStatic {
  static async transcribeAudio(audioUri: string): Promise<{
    transcript: string;
    confidence: number;
    metadata: Partial<TranscriptMetadata>;
  }> {
    return transcriptionServiceInstance.transcribeAudio(audioUri);
  }

  static detectMedicalTerms(text: string): string[] {
    return transcriptionServiceInstance.detectMedicalTerms(text);
  }

  static correctMedicalTerms(text: string): string {
    return transcriptionServiceInstance.correctMedicalTerms(text);
  }

  static extractLearningOutcomes(transcript: string): string[] {
    return transcriptionServiceInstance.extractLearningOutcomes(transcript);
  }

  static generateSummary(transcript: string, maxLength: number = 100): string {
    return transcriptionServiceInstance.generateSummary(transcript, maxLength);
  }

  static assessTranscriptionQuality(transcript: string, confidence: number): {
    quality: 'high' | 'medium' | 'low';
    issues: string[];
    suggestions: string[];
  } {
    return transcriptionServiceInstance.assessTranscriptionQuality(transcript, confidence);
  }

  static formatTranscript(transcript: string, format: 'cpd' | 'reflection' | 'summary'): string {
    return transcriptionServiceInstance.formatTranscript(transcript, format);
  }
}

export default TranscriptionServiceStatic;