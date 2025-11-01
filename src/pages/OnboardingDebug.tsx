import { useState, useEffect } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import * as onboardingService from '../services/onboardingService';
import { OnboardingState, ONBOARDING_STEPS, OnboardingStep } from '../types/onboarding';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function OnboardingDebug() {
  const { family: currentFamily } = useFamily();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadState();
  }, [currentFamily]);

  const loadState = async () => {
    if (!currentFamily) {
      setError('No family selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const s = await onboardingService.getOnboardingState(currentFamily.id);
      setState(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load state');
    } finally {
      setLoading(false);
    }
  };

  const init = async () => {
    if (!currentFamily) return;

    try {
      setLoading(true);
      setError(null);
      const s = await onboardingService.initializeOnboarding(currentFamily.id);
      setState(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize');
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (step: OnboardingStep) => {
    if (!currentFamily) return;

    try {
      setLoading(true);
      setError(null);
      await onboardingService.completeStep(currentFamily.id, step);
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete step');
    } finally {
      setLoading(false);
    }
  };

  const skipStep = async (step: OnboardingStep) => {
    if (!currentFamily) return;

    try {
      setLoading(true);
      setError(null);
      await onboardingService.skipStep(currentFamily.id, step);
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip step');
    } finally {
      setLoading(false);
    }
  };

  const goToStep = async (step: OnboardingStep) => {
    if (!currentFamily) return;

    try {
      setLoading(true);
      setError(null);
      await onboardingService.goToStep(currentFamily.id, step);
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to go to step');
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!currentFamily) return;

    if (!confirm('Are you sure you want to reset onboarding?')) return;

    try {
      setLoading(true);
      setError(null);
      await onboardingService.resetOnboarding(currentFamily.id);
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset');
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    if (!currentFamily) return;

    try {
      setLoading(true);
      setError(null);
      await onboardingService.completeOnboarding(currentFamily.id);
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const markCalendarSynced = async (calendarType: string) => {
    if (!currentFamily) return;

    try {
      setLoading(true);
      setError(null);
      await onboardingService.markCalendarSynced(currentFamily.id, calendarType);
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark calendar synced');
    } finally {
      setLoading(false);
    }
  };

  if (!currentFamily) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Onboarding Debug</h1>
        <Card className="p-6">
          <p className="text-red-500">No family selected. Please create or select a family first.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Onboarding Debug</h1>
      <p className="text-gray-600 mb-6">Family: {currentFamily.name}</p>

      {error && (
        <Card className="p-4 mb-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      <div className="flex gap-2 mb-6">
        <Button onClick={init} disabled={loading}>
          Initialize Onboarding
        </Button>
        <Button onClick={loadState} disabled={loading} variant="outline">
          Reload State
        </Button>
        <Button onClick={reset} disabled={loading} variant="destructive">
          Reset
        </Button>
        <Button onClick={completeOnboarding} disabled={loading} variant="default">
          Complete Onboarding
        </Button>
      </div>

      {loading && (
        <Card className="p-6 mb-6">
          <p className="text-gray-600">Loading...</p>
        </Card>
      )}

      {state && !loading && (
        <>
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Current State</h2>
            <div className="space-y-2">
              <p><strong>Current Step:</strong> {state.currentStep}</p>
              <p><strong>Completed Steps:</strong> {state.completedSteps.join(', ') || 'None'}</p>
              <p><strong>Skipped Steps:</strong> {state.skippedSteps.join(', ') || 'None'}</p>
              <p><strong>Calendars Synced:</strong> {state.calendarsSynced.join(', ') || 'None'}</p>
              <p><strong>Started At:</strong> {state.startedAt.toLocaleString()}</p>
              <p><strong>Last Updated:</strong> {state.lastUpdatedAt.toLocaleString()}</p>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Steps Control</h2>
            <div className="space-y-3">
              {ONBOARDING_STEPS.map((step) => {
                const isCompleted = state.completedSteps.includes(step);
                const isSkipped = state.skippedSteps.includes(step);
                const isCurrent = state.currentStep === step;

                return (
                  <div
                    key={step}
                    className={`flex items-center gap-3 p-3 rounded ${
                      isCurrent ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">
                      {isCompleted ? '✅' : isSkipped ? '⏭️' : '⬜'}
                    </span>
                    <span className="flex-1 font-medium">{step}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => goToStep(step)}
                        disabled={loading}
                        variant="outline"
                      >
                        Go To
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => completeStep(step)}
                        disabled={loading || isCompleted}
                        variant="default"
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => skipStep(step)}
                        disabled={loading || isSkipped}
                        variant="secondary"
                      >
                        Skip
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Calendar Sync Control</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => markCalendarSynced('google')}
                disabled={loading}
                variant={state.calendarsSynced.includes('google') ? 'default' : 'outline'}
              >
                {state.calendarsSynced.includes('google') ? '✓' : ''} Google Calendar
              </Button>
              <Button
                onClick={() => markCalendarSynced('outlook')}
                disabled={loading}
                variant={state.calendarsSynced.includes('outlook') ? 'default' : 'outline'}
              >
                {state.calendarsSynced.includes('outlook') ? '✓' : ''} Outlook Calendar
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Profile Data</h2>
            <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              <pre className="text-xs">{JSON.stringify(state.profile, null, 2)}</pre>
            </div>
          </Card>
        </>
      )}

      {!state && !loading && (
        <Card className="p-6">
          <p className="text-gray-600">
            No onboarding state found. Click "Initialize Onboarding" to start.
          </p>
        </Card>
      )}
    </div>
  );
}
