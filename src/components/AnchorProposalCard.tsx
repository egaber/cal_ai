import { useState } from 'react';
import { ProposedAnchor } from '@/types/planningChat';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  Edit2, 
  Clock, 
  MapPin, 
  Repeat, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AnchorProposalCardProps {
  anchor: ProposedAnchor;
  onApprove: (anchorId: string, modifications?: any) => void;
  onReject: (anchorId: string) => void;
  onModify?: (anchorId: string) => void;
}

/**
 * AnchorProposalCard - מציג הצעה לעוגן חוזר
 */
export const AnchorProposalCard = ({ 
  anchor, 
  onApprove, 
  onReject,
  onModify 
}: AnchorProposalCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);

  const getAnchorTypeIcon = () => {
    switch (anchor.type) {
      case 'framework': return '🏫';
      case 'travel': return '🚗';
      case 'preparation': return '📝';
      case 'coordination': return '👨‍👩‍👧‍👦';
      default: return '⭐';
    }
  };

  const getAnchorTypeName = () => {
    switch (anchor.type) {
      case 'framework': return 'מסגרת קבועה';
      case 'travel': return 'נסיעה';
      case 'preparation': return 'הכנה';
      case 'coordination': return 'תיאום';
      default: return 'אחר';
    }
  };

  const getDaysOfWeekText = () => {
    const days = anchor.event.recurrence.daysOfWeek || [];
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days.map(d => dayNames[d]).join(', ');
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const getConfidenceColor = () => {
    const conf = anchor.event.metadata.confidence;
    if (conf >= 0.8) return 'bg-green-100 text-green-800';
    if (conf >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  const getConfidenceText = () => {
    const conf = anchor.event.metadata.confidence;
    if (conf >= 0.8) return 'בטוח מאוד';
    if (conf >= 0.6) return 'בטוח';
    return 'בטחון בינוני';
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5">
      {/* Header */}
      <div className="p-4 bg-primary/10 border-b border-primary/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="text-3xl flex-shrink-0">
              {getAnchorTypeIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">
                  הצעה חכמה
                </span>
                <Badge variant="secondary" className={`text-xs ${getConfidenceColor()}`}>
                  {getConfidenceText()}
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {anchor.title}
              </h3>
              <p className="text-sm text-gray-600">
                {anchor.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-4 space-y-3">
        {/* Time */}
        <div className="flex items-center gap-3 text-sm">
          <Clock className="h-5 w-5 text-gray-400" />
          <div>
            <span className="font-medium">
              {formatTime(anchor.event.startTime)} - {formatTime(anchor.event.endTime)}
            </span>
          </div>
        </div>

        {/* Recurrence */}
        <div className="flex items-start gap-3 text-sm">
          <Repeat className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <div className="font-medium mb-1">
              {anchor.event.recurrence.frequency === 'weekly' && 'חוזר שבועי'}
              {anchor.event.recurrence.frequency === 'daily' && 'חוזר יומי'}
              {anchor.event.recurrence.frequency === 'monthly' && 'חוזר חודשי'}
            </div>
            <div className="text-gray-600">
              {getDaysOfWeekText()}
            </div>
          </div>
        </div>

        {/* Location */}
        {anchor.event.location && (
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-5 w-5 text-gray-400" />
            <span className="text-gray-700">{anchor.event.location}</span>
          </div>
        )}

        {/* Reasoning */}
        <div className="pt-3 border-t">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-900"
          >
            <span className="font-medium">למה אני מציע את זה?</span>
            {showDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {showDetails && (
            <p className="mt-2 text-sm text-gray-700 pr-2">
              {anchor.reasoning}
            </p>
          )}
        </div>

        {/* Benefits */}
        {anchor.benefits && anchor.benefits.length > 0 && (
          <div className="pt-3 border-t">
            <button
              onClick={() => setShowBenefits(!showBenefits)}
              className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-900"
            >
              <span className="font-medium">היתרונות ({anchor.benefits.length})</span>
              {showBenefits ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {showBenefits && (
              <ul className="mt-2 space-y-1">
                {anchor.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-gray-50 border-t flex gap-2">
        <Button
          onClick={() => onApprove(anchor.id)}
          className="flex-1 bg-green-600 hover:bg-green-700"
          size="lg"
        >
          <Check className="h-5 w-5 ml-2" />
          אשר והוסף
        </Button>
        
        {onModify && (
          <Button
            variant="outline"
            onClick={() => onModify(anchor.id)}
            size="lg"
          >
            <Edit2 className="h-4 w-4 ml-2" />
            ערוך
          </Button>
        )}
        
        <Button
          variant="outline"
          onClick={() => onReject(anchor.id)}
          className="text-red-600 hover:bg-red-50"
          size="lg"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Alternatives indicator */}
      {anchor.alternatives && anchor.alternatives.length > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 text-xs text-blue-700 text-center">
          יש {anchor.alternatives.length} אלטרנטיבות נוספות
        </div>
      )}
    </Card>
  );
};
