import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingData {
  backgroundStory: string;
  resumeText: string;
  orgName: string;
  orgUrl: string;
  orgReason: string;
}

interface StepProps {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-teal-600">Step {current} of {total}</span>
        <span className="text-sm text-gray-400">{Math.round((current / total) * 100)}% complete</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function CoachAvatar() {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center shadow-sm">
        <Briefcase className="w-5 h-5 text-white" />
      </div>
      <span className="text-lg font-semibold text-gray-800 tracking-tight">Drafted</span>
    </div>
  );
}

function Step1({ data, onChange, onNext }: StepProps) {
  const [touched, setTouched] = useState(false);
  const isValid = data.backgroundStory.trim().length >= 50;

  return (
    <div className="animate-fade-in">
      <CoachAvatar />
      <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
        Let's get you draft-ready.
      </h1>
      <p className="text-gray-500 mb-8 text-lg">
        Tell me about your background. Where are you coming from?
      </p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your background <span className="text-teal-600">*</span>
        </label>
        <textarea
          rows={6}
          value={data.backgroundStory}
          onChange={(e) => onChange({ backgroundStory: e.target.value })}
          onBlur={() => setTouched(true)}
          placeholder="e.g. I spent 8 years leading a nonprofit youth program and I'm transitioning into operations or project management roles."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm leading-relaxed transition-shadow hover:border-gray-300"
        />
        {touched && !isValid && (
          <p className="mt-1.5 text-xs text-red-500">
            Please share at least 50 characters about your background.
          </p>
        )}
        {data.backgroundStory.trim().length > 0 && (
          <p className="mt-1.5 text-xs text-gray-400 text-right">
            {data.backgroundStory.trim().length} characters
            {data.backgroundStory.trim().length < 50 && ` — ${50 - data.backgroundStory.trim().length} more to go`}
          </p>
        )}
      </div>

      <button
        onClick={() => {
          setTouched(true);
          if (isValid) onNext();
        }}
        className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function Step2({ data, onChange, onNext }: StepProps) {
  const [touched, setTouched] = useState(false);
  const isValid = data.resumeText.trim().length >= 100;

  return (
    <div className="animate-fade-in">
      <CoachAvatar />
      <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
        Drop in your resume.
      </h1>
      <p className="text-gray-500 mb-8 text-lg">
        Paste the text of your resume below. We'll use this to score your readiness for roles you care about.
      </p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resume text <span className="text-teal-600">*</span>
        </label>
        <textarea
          rows={10}
          value={data.resumeText}
          onChange={(e) => onChange({ resumeText: e.target.value })}
          onBlur={() => setTouched(true)}
          placeholder="Paste your full resume text here..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm leading-relaxed transition-shadow hover:border-gray-300 font-mono"
        />
        <p className="mt-2 text-xs text-gray-400">
          Copy and paste the full text of your resume. Don't worry about formatting.
        </p>
        {touched && !isValid && (
          <p className="mt-1 text-xs text-red-500">
            Please paste at least 100 characters of your resume.
          </p>
        )}
      </div>

      <button
        onClick={() => {
          setTouched(true);
          if (isValid) onNext();
        }}
        className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function Step3({ data, onChange, onNext }: StepProps) {
  const [touched, setTouched] = useState(false);
  const isValid = data.orgName.trim().length > 0;

  return (
    <div className="animate-fade-in">
      <CoachAvatar />
      <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
        Who's on your draft board?
      </h1>
      <p className="text-gray-500 mb-8 text-lg">
        Add the first organization you're targeting. This is the start of your draft board.
      </p>

      <div className="space-y-5 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization name <span className="text-teal-600">*</span>
          </label>
          <input
            type="text"
            value={data.orgName}
            onChange={(e) => onChange({ orgName: e.target.value })}
            onBlur={() => setTouched(true)}
            placeholder="e.g. City Year, Khan Academy, Salesforce.org"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition-shadow hover:border-gray-300"
          />
          {touched && !isValid && (
            <p className="mt-1.5 text-xs text-red-500">Organization name is required.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Career page URL <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            value={data.orgUrl}
            onChange={(e) => onChange({ orgUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition-shadow hover:border-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Why this org? <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={4}
            value={data.orgReason}
            onChange={(e) => onChange({ orgReason: e.target.value })}
            placeholder="e.g. Their mission aligns with my background in community development"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm leading-relaxed transition-shadow hover:border-gray-300"
          />
        </div>
      </div>

      <button
        onClick={() => {
          setTouched(true);
          if (isValid) onNext();
        }}
        className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function Step4({
  data,
  coachMessage,
  coachLoading,
  coachError,
  onComplete,
}: {
  data: OnboardingData;
  coachMessage: string;
  coachLoading: boolean;
  coachError: string;
  onComplete: () => void;
}) {
  return (
    <div className="animate-fade-in">
      <CoachAvatar />
      <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
        {coachLoading
          ? 'Hang tight — your coach is reviewing your profile.'
          : coachError
          ? 'Something went wrong.'
          : 'Your coach has a message for you.'}
      </h1>
      {coachLoading && (
        <p className="text-gray-500 mb-8 text-lg">
          Reading your background and resume. This takes just a moment.
        </p>
      )}

      {coachLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-5">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-teal-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-sm text-gray-400 font-medium">
              Analyzing your profile for {data.orgName || 'your target org'}…
            </p>
          </div>
        </div>
      )}

      {!coachLoading && coachError && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
          {coachError}
        </div>
      )}

      {!coachLoading && coachMessage && (
        <div className="mt-6 mb-8">
          <div className="bg-white border-l-4 border-teal-500 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
                Your Coach
              </span>
            </div>
            <p className="text-gray-700 leading-relaxed text-[15px]">{coachMessage}</p>
          </div>
        </div>
      )}

      {!coachLoading && (coachMessage || coachError) && (
        <button
          onClick={onComplete}
          className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors"
        >
          Enter your dashboard
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function Onboarding() {
  const { user, setOnboardingComplete } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [coachMessage, setCoachMessage] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState('');

  const [data, setData] = useState<OnboardingData>({
    backgroundStory: '',
    resumeText: '',
    orgName: '',
    orgUrl: '',
    orgReason: '',
  });

  const updateData = (updates: Partial<OnboardingData>) =>
    setData((prev) => ({ ...prev, ...updates }));

  const callCoachAPI = async () => {
    setCoachLoading(true);
    setCoachError('');

    const coachPrompt = `You are the Drafted AI coach. Drafted helps career changers with non-traditional backgrounds (ministry, nonprofit, education, community leadership) land roles where their experience is seen as an asset, not a liability.

A new user has just joined. Here is their background:
${data.backgroundStory}

Here is their resume:
${data.resumeText}

Their first target organization is: ${data.orgName}
Reason for interest: ${data.orgReason || 'Not specified'}

Your task:
1. Write a warm, personal 2-3 sentence welcome that acknowledges their specific background and reframes it as a strength — not generic encouragement, but something that shows you actually read what they shared.
2. Identify the single biggest translation challenge you see between their background and typical hiring language for their target org type.
3. Give them one concrete next action to take today (e.g., a specific section of their resume to rewrite, a type of contact to look for at their target org).

Keep it conversational, warm, and direct. No bullet points. Use plain language. Speak like a trusted advisor, not a chatbot. Max 150 words total.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          messages: [{ role: 'user', content: coachPrompt }],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } })?.error?.message || `API error ${response.status}`);
      }

      const result = await response.json() as { content?: Array<{ type: string; text?: string }> };
      const text = result.content?.[0]?.type === 'text' ? result.content[0].text ?? '' : '';
      setCoachMessage(text);
      localStorage.setItem('drafted_coach_welcome', text);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setCoachError(
        `We couldn't reach your coach right now (${message}). You can still enter your dashboard and your profile has been saved.`
      );
    } finally {
      setCoachLoading(false);
    }
  };

  const handleNext = () => {
    const next = step + 1;
    setStep(next);
    if (next === 4) {
      callCoachAPI();
    }
  };

 const handleComplete = async () => {
  console.log('[handleComplete] clicked. user:', user);
  if (!user) {
    console.error('[handleComplete] ABORTED — no user in auth context');
    return;
  }
  setSaving(true);

  const [profileResult, orgResult] = await Promise.all([
    supabase.from('profiles').upsert({
      id: user.id,
      background_story: data.backgroundStory,
      resume_text: data.resumeText,
      onboarding_complete: true,
    }),
    supabase.from('target_orgs').insert({
      user_id: user.id,
      name: data.orgName,
      career_page_url: data.orgUrl,
      reason: data.orgReason,
    }),
  ]);

  if (profileResult.error) console.error('[handleComplete] profiles upsert error:', profileResult.error);
  if (orgResult.error) console.error('[handleComplete] target_orgs insert error:', orgResult.error);

  console.log('[handleComplete] done, navigating to dashboard');
  setOnboardingComplete(true);
  setSaving(false);
  navigate('/dashboard');
};

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <ProgressBar current={step} total={4} />

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-10">
            {step === 1 && (
              <Step1 data={data} onChange={updateData} onNext={handleNext} />
            )}
            {step === 2 && (
              <Step2 data={data} onChange={updateData} onNext={handleNext} />
            )}
            {step === 3 && (
              <Step3 data={data} onChange={updateData} onNext={handleNext} />
            )}
            {step === 4 && (
              <Step4
                data={data}
                coachMessage={coachMessage}
                coachLoading={coachLoading}
                coachError={coachError}
                onComplete={saving ? () => {} : handleComplete}
              />
            )}
          </div>

          {step < 4 && (
            <p className="text-center text-xs text-gray-400 mt-6">
              Your information is private and only used to personalize your coaching.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
