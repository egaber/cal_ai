import React, { useState, useEffect } from 'react';
import { MessageCircle, Sparkles, Phone, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { llmService, LLMModel } from '@/services/llmService';
import { modelConfigService } from '@/services/modelConfigService';
import { getGeminiApiKey, getAzureOpenAIApiKey } from '@/config/gemini';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const MobileSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [models, setModels] = useState<LLMModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [azureOpenAIApiKey, setAzureOpenAIApiKey] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('050');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

    // Load user's phone number and parse it
    if (user?.phoneNumber) {
      const phone = user.phoneNumber;
      // Parse Israeli phone number: +972501234567 or 972501234567 or +9720501234567 (with extra 0)
      const normalized = phone.replace(/[\s\-+]/g, '');
      
      if (normalized.startsWith('972')) {
        // Handle both formats: 972501234567 (correct) and 9720501234567 (with extra 0)
        let afterCountryCode = normalized.substring(3);
        
        // Remove leading 0 if present (common mistake)
        if (afterCountryCode.startsWith('0')) {
          afterCountryCode = afterCountryCode.substring(1);
        }
        
        if (afterCountryCode.length === 9) {
          // Extract prefix (50, 52, etc. - without the leading 0) and number
          const prefix = '0' + afterCountryCode.substring(0, 2); // Add back the 0 for display: 050, 052, etc.
          const number = afterCountryCode.substring(2); // Rest of the number (7 digits)
          setPhonePrefix(prefix);
          setPhoneNumber(number);
        } else {
          // Just show the full number as is
          setPhoneNumber(phone);
        }
      } else {
        // Just show the full number as is
        setPhoneNumber(phone);
      }
    }

    loadModels();
  }, [user]);

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
      setToastMessage('הגדרות AI נשמרו בהצלחה');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      loadModels();
    }
  };

  const handleSavePhoneNumber = async () => {
    if (!user || !phoneNumber) {
      setToastMessage('נא להזין מספר טלפון תקין');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      // Validate phone number (should be 7 digits after prefix)
      const cleanNumber = phoneNumber.trim().replace(/[\s-]/g, '');
      if (!cleanNumber.match(/^\d{7}$/)) {
        setToastMessage('נא להזין 7 ספרות (לדוגמה: 1234567)');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }

      // Construct full Israeli phone number in international format
      // Format: +972 + prefix WITHOUT leading 0 (50/52/etc) + number
      // Remove the leading 0 from prefix (050 -> 50)
      const prefixWithoutZero = phonePrefix.startsWith('0') ? phonePrefix.substring(1) : phonePrefix;
      const fullPhoneNumber = `+972${prefixWithoutZero}${cleanNumber}`;
      
      console.log('Saving phone number:', fullPhoneNumber);

      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        phoneNumber: fullPhoneNumber
      });

      setToastMessage(`מספר טלפון נשמר בהצלחה! 🎉\n${fullPhoneNumber}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error saving phone number:', error);
      setToastMessage('שגיאה בשמירת מספר טלפון');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
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
            
            <div className="space-y-4">
              {/* Phone Number Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline ml-1" />
                  מספר הטלפון שלך
                </label>
                
                <div className="flex gap-2" dir="ltr">
                  {/* Israel Flag + Country Code */}
                  <div className="flex items-center px-3 py-3 rounded-lg border border-green-200 bg-gray-50 text-gray-700 font-medium">
                    <span className="text-xl ml-2">🇮🇱</span>
                    <span>+972</span>
                  </div>
                  
                  {/* Prefix Dropdown (050, 052, 053, 054, 055, 058) */}
                  <select
                    value={phonePrefix}
                    onChange={(e) => setPhonePrefix(e.target.value)}
                    className="px-4 py-3 rounded-lg border border-green-200 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium"
                  >
                    <option value="050">050</option>
                    <option value="051">051</option>
                    <option value="052">052</option>
                    <option value="053">053</option>
                    <option value="054">054</option>
                    <option value="055">055</option>
                    <option value="058">058</option>
                  </select>
                  
                  {/* Rest of Number */}
                  <input
                    type="tel"
                    placeholder="1234567"
                    value={phoneNumber}
                    onChange={(e) => {
                      // Only allow digits and limit to 7 characters
                      const value = e.target.value.replace(/\D/g, '').slice(0, 7);
                      setPhoneNumber(value);
                    }}
                    maxLength={7}
                    className="flex-1 px-4 py-3 rounded-lg border border-green-200 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    הזן את מספר ה-WhatsApp שלך
                  </p>
                  {phoneNumber && (
                    <p className="text-xs font-medium text-green-600">
                      +972{phonePrefix}{phoneNumber}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSavePhoneNumber}
                className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                <span>שמור מספר טלפון</span>
              </button>

              <div className="border-t border-green-200 pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  התחבר ל-WhatsApp שלנו כדי לקבל עדכונים והתראות
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
            </div>
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

          {/* Family Memory Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">זיכרון המשפחה</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                צפה בכל הזיכרונות שהמערכת לומדת עליך ועל המשפחה שלך
              </p>

              <button
                onClick={() => navigate('/memory')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3"
              >
                <Brain className="w-5 h-5" />
                <span>צפה בזיכרונות</span>
              </button>

              <div className="text-xs text-gray-500 space-y-1">
                <p>🤖 זיכרונות נוצרים אוטומטית מהשיחות ב-WhatsApp</p>
                <p>👤 זיכרונות יכולים להיווצר גם באפליקציה</p>
              </div>
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
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default MobileSettings;
