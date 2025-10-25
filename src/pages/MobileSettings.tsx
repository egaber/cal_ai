import React from 'react';
import { MessageCircle } from 'lucide-react';

const MobileSettings = () => {
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
    </div>
  );
};

export default MobileSettings;
