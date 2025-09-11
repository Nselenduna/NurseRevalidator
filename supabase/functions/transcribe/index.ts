// #scope:transcript
// WhisperAI Transcription Edge Function
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Medical terms list for enhanced accuracy
const MEDICAL_TERMS = [
  "hypertension", "diabetes mellitus", "myocardial infarction",
  "cerebrovascular accident", "chronic obstructive pulmonary disease",
  "cardiopulmonary resuscitation", "intravenous", "subcutaneous",
  "intramuscular", "tachycardia", "bradycardia", "arrhythmia",
  "hypoglycemia", "hyperglycemia", "metastasis", "auscultation",
  "dyspnea", "anaphylaxis", "hypothermia", "hyperthermia"
]

serve(async (req) => {
  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Parse request body
    const { audioPath, cpdId, userId } = await req.json()
    
    if (!audioPath || !cpdId || !userId) {
      return new Response(JSON.stringify({
        error: "Missing required parameters: audioPath, cpdId, or userId"
      }), { status: 400 })
    }
    
    // Get signed URL for audio file
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('audio')
      .createSignedUrl(audioPath, 60) // 60 seconds expiry
      
    if (signedUrlError) {
      return new Response(JSON.stringify({
        error: "Failed to get signed URL",
        details: signedUrlError
      }), { status: 500 })
    }
    
    // Call OpenAI Whisper API with medical context
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "whisper-1",
        file: signedUrlData.signedUrl,
        prompt: `This is a medical transcription for continuing professional development. It may include the following medical terms: ${MEDICAL_TERMS.join(", ")}. Please prioritize accuracy for medical terminology.`
      })
    })
    
    if (!response.ok) {
      return new Response(JSON.stringify({
        error: "Failed to transcribe audio",
        details: await response.text()
      }), { status: 500 })
    }
    
    const transcriptionResult = await response.json()
    
    // Store transcription in database
    const { data: transcriptionData, error: transcriptionError } = await supabase
      .from('cpd_transcriptions')
      .insert({
        cpd_id: cpdId,
        user_id: userId,
        audio_path: audioPath,
        transcription: transcriptionResult.text,
        language: transcriptionResult.language || 'en',
        created_at: new Date().toISOString()
      })
      .select()
      .single()
      
    if (transcriptionError) {
      return new Response(JSON.stringify({
        error: "Failed to save transcription",
        details: transcriptionError
      }), { status: 500 })
    }
    
    // Update CPD entry to link the transcription
    const { error: updateError } = await supabase
      .from('cpd_entries')
      .update({ 
        has_transcription: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', cpdId)
      .eq('user_id', userId)
      
    if (updateError) {
      return new Response(JSON.stringify({
        error: "Failed to update CPD entry",
        details: updateError
      }), { status: 500 })
    }
    
    // Return success response
    return new Response(JSON.stringify({
      success: true,
      transcription: transcriptionData
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
