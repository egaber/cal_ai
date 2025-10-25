import React, { useState, useEffect } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import { llmService, LLMModel } from '@/services/llmService';
import { modelConfigService } from '@/services/modelConfigService';
import { getGeminiApiKey, getAzureOpenAIApiKey } from '@/config/gemini';

const MobileSettings = () => {
  const [models, setModels] = useState<LLMModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [azureOpenAIApiKey, setAzureOpenAIApiKey] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Load API keys
    const geminiKey = getGeminiApiKey();
    if (geminiKey) {
      setGeminiApiKey(geminiKey);
      llmService.setGeminiKey(geminiKey);
    }

    const azureKey = getAzureOpenAIApiKey();
    if (azureKey) {
      setAzureOpenAIApiKey(azureKey);
      llmService.setAzureOpenAIKey(azureKey);
    }

    loadModels();
  }, []);

  const loadModels = async () => {
    const availableModels = await llmService.getAvailableModels();
    setModels(availableModels);
    
    const currentModel = modelConfigService.findModel(availableModels);
    setSelectedModel(currentModel);
  };

  const handleSaveAISettings = () => {
    let saved = false;

    if (geminiApiKey) {
      localStorage.setItem('gemini_api_key', geminiApiKey);
      llmService.setGeminiKey(geminiApiKey);
      saved = true;
    }

    if (azureOpenAIApiKey) {
      localStorage.setItem('azure_openai_api_key', azureOpenAIApiKey);
      llmService.setAzureOpenAIKey(azureOpenAIApiKey);
      saved = true;
    }

    if (selectedModel) {
      modelConfigService.setSelectedModel(selectedModel);
      saved = true;
    }

    if (saved) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      loadModels();
    }
  };
  const handleOpenWhatsApp = () => {
    const phoneNumber = '14155238886';
    const message = 'join knowledge-dog';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in a new window/tab
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="h-full bg-white overflow-y-auto" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">הגדרות</h1>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* WhatsApp Connection Section */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">חיבור ל-WhatsApp</h2>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              התחבר ל-WhatsApp שלנו כדי לקבל עדכונים והתראות ישירות לטלפון שלך
            </p>

            <button
              onClick={handleOpenWhatsApp}
              className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3"
            >
              <MessageCircle className="w-5 h-5" />
              <span>פתח ב-WhatsApp</span>
            </button>

            <p className="text-xs text-gray-500 mt-3 text-center">
              ישלח הודעה ל-+1 (415) 523-8886
            </p>
          </div>

          {/* AI Model Selection Section */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">בחירת מודל AI</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מודל נבחר
                </label>
                <select
                  value={selectedModel?.id || ''}
                  onChange={(e) => {
                    const model = models.find(m => m.id === e.target.value);
                    if (model) {
                      setSelectedModel(model);
                    }
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-purple-200 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {models.length === 0 ? (
                    <option value="">אין מודלים זמינים - הגדר מפתחות API</option>
                  ) : (
                    models.map((model) => (
                      <option key={`${model.provider}-${model.id}`} value={model.id}>
                        {model.name} ({model.vendor})
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  עדיפות ברירת מחדל: VS Code LM API (Copilot) → Azure GPT-4.1
                </p>
              </div>

              <div className="border-t border-purple-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">הגדרות API</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gemini API Key (אופציונלי)
                    </label>
                    <input
                      type="password"
                      placeholder="הזן מפתח API של Gemini"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Azure OpenAI API Key (אופציונלי)
                    </label>
                    <input
                      type="password"
                      placeholder="הזן מפתח API של Azure OpenAI"
                      value={azureOpenAIApiKey}
                      onChange={(e) => setAzureOpenAIApiKey(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveAISettings}
                className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>שמור הגדרות AI</span>
              </button>
            </div>
          </div>

          {/* Additional Settings Sections (placeholder for future features) */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">אודות</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>גרסה: 1.0.0</p>
              <p>מערכת ניהול משימות חכמה</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          הגדרות AI נשמרו בהצלחה
        </div>
      )}
    </div>
  );
};

export default MobileSettings;
