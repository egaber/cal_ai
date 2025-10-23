import { useState, useMemo, useEffect, useRef } from 'react';
import { detectLanguage } from '../../mobile-task-app/src/utils/patterns';
import { getTagEmoji, TAG_STYLES, getInlineStyle } from '../../mobile-task-app/src/utils/tagStyles';
import { parseTask } from '../../mobile-task-app/src/services/taskParser';
import { correctFamilyNames } from '../../mobile-task-app/src/utils/nameCorrection';

// Speech recognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Simple demo page to test the parser
export default function MobileTaskDemo() {
  // Add CSS for placeholder
  const placeholderStyle = `
    [contenteditable][data-placeholder]:empty:before {
      content: attr(data-placeholder);
      color: #9ca3af;
      pointer-events: none;
      position: absolute;
    }
  `;
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<'he' | 'en'>('en');
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Parse the text in real-time
  const parsed = useMemo(() => {
    if (!text) return null;
    return parseTask(text);
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    if (newText) {
      setLanguage(detectLanguage(newText));
    }
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'he' ? 'he-IL' : 'en-US';
    
    // Improve recognition accuracy with hints
    // Note: This is a browser hint - not all browsers support it
    // But it can help improve accuracy for specific words
    try {
      // Add speech recognition hints for family names
      // This tells the browser these are important words to recognize
      (recognition as any).speechGrammarList = undefined; // Not widely supported yet
      
      // Alternative: Set maxAlternatives to get multiple recognition options
      recognition.maxAlternatives = 3; // Get top 3 alternatives
    } catch (e) {
      // Silently fail if not supported
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = text;
      let hasFinalResults = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Apply name correction to final transcript
          const corrected = correctFamilyNames(transcript);
          finalTranscript += (finalTranscript ? ' ' : '') + corrected;
          hasFinalResults = true;
        } else {
          // Also apply correction to interim for better preview
          interimTranscript += correctFamilyNames(transcript);
        }
      }

      // Update text with final + interim (both corrected)
      setText(finalTranscript + (interimTranscript ? ' ' + interimTranscript : ''));
      
      // Detect language from the transcribed text
      const newLang = detectLanguage(finalTranscript + interimTranscript);
      if (newLang !== language) {
        setLanguage(newLang);
        // Update recognition language
        recognition.lang = newLang === 'he' ? 'he-IL' : 'en-US';
      }

      // Auto-stop after 2 seconds of silence following final results
      if (hasFinalResults) {
        // Clear any existing timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        
        // Set new timeout to stop after 2 seconds of no new speech
        silenceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            stopRecording();
          }
        }, 2000);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    // Clear silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };


  // Example texts
  const examples = {
    he: 'לקחת את אלון לגן מחר בשעה 8:00',
    en: 'Take Alon to kindergarten tomorrow at 8:00',
    heReminder: 'להזכיר לאלה לקנות חלב היום',
    enPriority: 'Buy milk today P1',
  };

  return (
    <>
      <style>{placeholderStyle}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📱 Mobile Task Parser Demo v2.1
          </h1>
          <p className="text-gray-600">
            Test the real-time parsing engine (Foundation Phase 1)
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Type or speak a task (Hebrew or English)
              </label>
              {!isSupported && (
                <span className="text-xs text-red-500">Voice not supported in this browser</span>
              )}
            </div>
            <div className="relative">
              <textarea
                value={text}
                onChange={handleTextChange}
                placeholder="Try: 'Take Alon to kindergarten tomorrow at 8:00' or 'לקחת את אלון לגן מחר בשעה 8:00'"
                className="w-full min-h-[128px] px-4 py-3 pr-14 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none text-lg"
                dir={language === 'he' ? 'rtl' : 'ltr'}
              />
              {/* Microphone Button */}
              {isSupported && (
                <button
                  onClick={toggleRecording}
                  className={`absolute bottom-3 right-3 p-3 rounded-full transition-all ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white shadow-lg`}
                  title={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                  {isRecording ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <rect x="6" y="6" width="8" height="8" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
            {isRecording && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Recording... (speak in {language === 'he' ? 'Hebrew' : 'English'})
              </div>
            )}
          </div>

          {/* Live Parsing Preview */}
          {text && parsed && (
            <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-4">
              <div className="text-xs font-medium text-blue-800 mb-2 uppercase tracking-wide">
                ✨ Live Parsing
              </div>
              <div 
                className="text-lg leading-relaxed"
                dir={language === 'he' ? 'rtl' : 'ltr'}
              >
                {parsed.segments.map((segment, idx) => {
                  if (segment.type === 'text') {
                    return <span key={idx} className="text-gray-700">{segment.text}</span>;
                  }
                  const style = TAG_STYLES[segment.type];
                  return (
                    <span
                      key={idx}
                      className={`${style.backgroundColor} ${style.textColor} rounded px-1.5 py-0.5 font-medium mx-0.5`}
                      title={`${segment.type}: ${JSON.stringify(segment.value)}`}
                    >
                      {segment.text}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detected Language & Stats */}
          {text && parsed && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="text-gray-600">Detected:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                  {language === 'he' ? '🇮🇱 Hebrew' : '🇺🇸 English'}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                  {parsed.segments.length} segments ({parsed.tags.length} tags)
                </span>
                {parsed.requiresDriving && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-medium">
                    🚗 Driving: {parsed.drivingDuration}min
                  </span>
                )}
              </div>
              {/* Debug info */}
              <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded space-y-1">
                <div>Debug: {parsed.segments.filter(s => s.type !== 'text').length} non-text segments detected
                {parsed.segments.filter(s => s.type !== 'text').length > 0 && 
                  ` (${parsed.segments.filter(s => s.type !== 'text').map(s => s.type).join(', ')})`
                }</div>
                <div>Language detection: {language} | Text has {text.length} chars</div>
                <div>Hebrew char test: {(text.match(/[\u0590-\u05FF]/g) || []).length} Hebrew chars found</div>
              </div>
            </div>
          )}


          {/* Extracted Tags */}
          {text && parsed && parsed.tags.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extracted Tags:
              </label>
              <div className="flex flex-wrap gap-2">
                {parsed.tags.map((tag) => {
                  const style = TAG_STYLES[tag.type];
                  return (
                    <div
                      key={tag.id}
                      className={`${style.backgroundColor} ${style.textColor} ${style.borderColor} border rounded-full px-3 py-1 text-sm font-medium flex items-center gap-1`}
                    >
                      <span>{tag.emoji}</span>
                      <span>{tag.displayText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Example Buttons */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Try Examples:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => setText(examples.he)}
              className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all text-left text-sm"
            >
              <div className="font-medium">Hebrew with child + location</div>
              <div className="text-blue-100 text-xs mt-1">Should detect driving 🚗</div>
            </button>
            
            <button
              onClick={() => setText(examples.en)}
              className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all text-left text-sm"
            >
              <div className="font-medium">English equivalent</div>
              <div className="text-purple-100 text-xs mt-1">Same detection pattern</div>
            </button>
            
            <button
              onClick={() => setText(examples.heReminder)}
              className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all text-left text-sm"
            >
              <div className="font-medium">Hebrew reminder</div>
              <div className="text-green-100 text-xs mt-1">With family member</div>
            </button>
            
            <button
              onClick={() => setText(examples.enPriority)}
              className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all text-left text-sm"
            >
              <div className="font-medium">Priority task</div>
              <div className="text-red-100 text-xs mt-1">With P1 priority</div>
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">✅ Phase 1 Complete:</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Type system with comprehensive TypeScript interfaces</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Detection patterns for Hebrew & English (time, family, locations)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Visual tag styles for color-coded feedback</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Smart inference rules (child + location = driving 🚗)</span>
            </div>
          </div>
        </div>

        {/* Detection Capabilities */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">🎯 Detection Capabilities:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { emoji: '📅', label: 'Time Buckets' },
              { emoji: '🕐', label: 'Times' },
              { emoji: '👤', label: 'Owner' },
              { emoji: '👥', label: 'Involved' },
              { emoji: '📍', label: 'Locations' },
              { emoji: '🚗', label: 'Driving' },
              { emoji: '🔥', label: 'Priority' },
              { emoji: '🔄', label: 'Recurring' },
              { emoji: '⏰', label: 'Reminders' },
            ].map(({ emoji, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
              >
                <span className="text-xl">{emoji}</span>
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-xl p-6 text-white">
          <h3 className="font-semibold mb-3">🚀 Coming Next (Phase 2):</h3>
          <ul className="space-y-2 text-sm text-blue-50">
            <li>• Real-time visual highlighting as you type</li>
            <li>• Voice-to-text with streaming recognition</li>
            <li>• Interactive tag bubbles</li>
            <li>• Smart text input component</li>
            <li>• Full parser implementation</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pb-8">
          <p>Foundation built • Parser engine ready • UI components next</p>
        </div>
      </div>
    </div>
    </>
  );
}
