const handleComplete = async () => {
  console.log('[handleComplete] clicked. user:', user);
  if (!user) {
    console.error('[handleComplete] ABORTED — no user in auth context');
    return;
  }
  setSaving(true);

  try {
    const stored = localStorage.getItem('sb-fugkizfjmdmcjonegswv-auth-token');
    const session = stored ? JSON.parse(stored) : null;
    const accessToken = session?.access_token;
    if (!accessToken) throw new Error('No access token found in localStorage');

    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;

    console.log('[handleComplete] upserting profile via raw fetch...');
    const profileRes = await fetch(`${baseUrl}/rest/v1/profiles?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        id: user.id,
        background_story: data.backgroundStory,
        resume_text: data.resumeText,
        onboarding_complete: true,
      }),
    });
    console.log('[handleComplete] profile response status:', profileRes.status);
    if (!profileRes.ok) console.error('[handleComplete] profile error body:', await profileRes.text());

    console.log('[handleComplete] inserting target org via raw fetch...');
    const orgRes = await fetch(`${baseUrl}/rest/v1/target_orgs`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        user_id: user.id,
        name: data.orgName,
        career_page_url: data.orgUrl,
        reason: data.orgReason,
      }),
    });
    console.log('[handleComplete] org response status:', orgRes.status);
    if (!orgRes.ok) console.error('[handleComplete] org error body:', await orgRes.text());

    console.log('[handleComplete] done, navigating');
    setOnboardingComplete(true);
    setSaving(false);
    navigate('/dashboard');
  } catch (err) {
    console.error('[handleComplete] CAUGHT EXCEPTION:', err);
    setSaving(false);
  }
};
