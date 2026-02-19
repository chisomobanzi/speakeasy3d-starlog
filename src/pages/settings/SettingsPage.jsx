import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Bell, Globe, Globe2, Shield, LogOut, Smartphone, Upload, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { generatePairingCode } from '../../lib/starlog-api';
import { useSourceRegistry } from '../../hooks/useSourceRegistry';
import { useAppStore } from '../../stores/appStore';
import { LANGUAGES } from '../../lib/languages';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Textarea } from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';

export default function SettingsPage() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { success, error } = useToast();

  const [activeSection, setActiveSection] = useState('profile');
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    username: profile?.username || '',
    native_language: profile?.native_language || 'en',
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error: updateError } = await updateProfile({
      display_name: formData.display_name.trim(),
      username: formData.username.trim().toLowerCase(),
      native_language: formData.native_language,
    });
    setSaving(false);

    if (updateError) {
      error(updateError.message || 'Failed to update profile');
    } else {
      success('Profile updated!');
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'sources', label: 'Sources', icon: Globe2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'devices', label: 'VR Pairing', icon: Smartphone },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left
                ${activeSection === section.id
                  ? 'bg-starlog-500/10 text-starlog-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <section.icon className="w-5 h-5" />
              {section.label}
            </button>
          ))}

          <hr className="border-slate-800 my-4" />

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </nav>

        {/* Content */}
        <div>
          {activeSection === 'profile' && (
            <Card>
              <h2 className="text-lg font-semibold text-white mb-6">Profile</h2>

              <div className="flex items-center gap-4 mb-6">
                <Avatar
                  src={profile?.avatar_url}
                  name={profile?.display_name || user?.email}
                  size="xl"
                />
                <div>
                  <Button variant="secondary" size="sm">Change avatar</Button>
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG. Max 2MB.</p>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Display Name"
                  value={formData.display_name}
                  onChange={handleInputChange('display_name')}
                  placeholder="How should we call you?"
                />

                <Input
                  label="Username"
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  placeholder="your_username"
                  hint="Lowercase letters, numbers, and underscores only"
                />

                <Input
                  label="Email"
                  value={user?.email || ''}
                  disabled
                  hint="Contact support to change your email"
                />

                <div className="pt-4">
                  <Button
                    variant="primary"
                    onClick={handleSaveProfile}
                    loading={saving}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <h2 className="text-lg font-semibold text-white mb-6">Notifications</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-800">
                  <div>
                    <p className="font-medium text-white">Daily review reminders</p>
                    <p className="text-sm text-slate-400">Get reminded to review your vocabulary</p>
                  </div>
                  <ToggleSwitch defaultChecked />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-slate-800">
                  <div>
                    <p className="font-medium text-white">Community activity</p>
                    <p className="text-sm text-slate-400">Updates on community decks you follow</p>
                  </div>
                  <ToggleSwitch />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-white">Verification requests</p>
                    <p className="text-sm text-slate-400">New entries needing review (verified users)</p>
                  </div>
                  <ToggleSwitch defaultChecked />
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'language' && (
            <Card>
              <h2 className="text-lg font-semibold text-white mb-6">Language Preferences</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Native Language
                  </label>
                  <select
                    value={formData.native_language}
                    onChange={handleInputChange('native_language')}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-starlog-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="pt">Portuguese</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                  </select>
                  <p className="text-sm text-slate-500 mt-1">
                    Translations will default to this language
                  </p>
                </div>

                <div className="pt-4">
                  <Button variant="primary" onClick={handleSaveProfile} loading={saving}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'privacy' && (
            <Card>
              <h2 className="text-lg font-semibold text-white mb-6">Privacy & Data</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-800">
                  <div>
                    <p className="font-medium text-white">Public profile</p>
                    <p className="text-sm text-slate-400">Allow others to see your profile</p>
                  </div>
                  <ToggleSwitch />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-slate-800">
                  <div>
                    <p className="font-medium text-white">Show contributions</p>
                    <p className="text-sm text-slate-400">Display your community contributions publicly</p>
                  </div>
                  <ToggleSwitch defaultChecked />
                </div>

                <div className="pt-6">
                  <h3 className="font-medium text-white mb-3">Danger Zone</h3>
                  <Button variant="danger">Delete Account</Button>
                  <p className="text-sm text-slate-500 mt-2">
                    This will permanently delete your account and all data.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'sources' && (
            <SourcesSection />
          )}

          {activeSection === 'devices' && (
            <VRPairingSection />
          )}
        </div>
      </div>
    </div>
  );
}

// VR Pairing code generator
function VRPairingSection() {
  const { error: toastError } = useToast();
  const [code, setCode] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [generating, setGenerating] = useState(false);
  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const startCountdown = useCallback((expiry) => {
    clearTimer();
    const update = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiry) - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearTimer();
        setCode(null);
      }
    };
    update();
    timerRef.current = setInterval(update, 1000);
  }, [clearTimer]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generatePairingCode(supabase);
      setCode(result.code);
      setExpiresAt(result.expires_at);
      startCountdown(result.expires_at);
    } catch (err) {
      toastError(err.message || 'Failed to generate pairing code');
    } finally {
      setGenerating(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-white mb-2">VR Pairing</h2>
      <p className="text-sm text-slate-400 mb-6">
        Link your Constellations VR headset to your Starlog account. Generate a code here, then enter it on the VR numpad.
      </p>

      {code && secondsLeft > 0 ? (
        <div className="text-center space-y-4">
          <p className="text-sm text-slate-400">Enter this code in your VR headset</p>
          <p className="text-5xl font-mono font-bold text-white tracking-[0.3em]">
            {code}
          </p>
          <p className="text-sm text-slate-400">
            Expires in <span className="text-starlog-400 font-medium">{formatTime(secondsLeft)}</span>
          </p>
          <Button variant="secondary" onClick={handleGenerate} loading={generating}>
            Generate New Code
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <Button variant="primary" onClick={handleGenerate} loading={generating}>
            Generate Pairing Code
          </Button>
        </div>
      )}
    </Card>
  );
}

// Sources management section
function SourcesSection() {
  const { success: toastSuccess, error: toastError } = useToast();
  const activeLanguage = useAppStore((s) => s.activeLanguage);
  const { sources, importableSources, loading: registryLoading } = useSourceRegistry(activeLanguage);

  const [importLanguage, setImportLanguage] = useState('');
  const [importing, setImporting] = useState(false);
  const [importJob, setImportJob] = useState(null);
  const pollRef = useRef(null);

  // Cleanup poll on unmount
  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const builtinSources = sources.filter(s => s.is_builtin && s.is_searchable);
  const provenanceSources = sources.filter(s => s.source_type === 'provenance');

  // Start Wiktionary import for a language
  const handleStartImport = async () => {
    if (!importLanguage) return;
    setImporting(true);
    setImportJob(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('import-wiktionary', {
        body: { language_code: importLanguage, batch_size: 50 },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });

      if (res.error) throw res.error;

      const result = res.data;
      setImportJob(result);

      // If there's a cmcontinue token, start polling / auto-continue
      if (result.cmcontinue && result.job_id) {
        pollImport(result.job_id, result.cmcontinue, importLanguage);
      } else {
        setImporting(false);
        toastSuccess(`Imported ${result.inserted} words from Wiktionary`);
      }
    } catch (err) {
      setImporting(false);
      toastError(err.message || 'Import failed');
    }
  };

  // Continue importing batches
  const pollImport = async (jobId, continueToken, langCode) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('import-wiktionary', {
        body: {
          language_code: langCode,
          batch_size: 50,
          continue_from: continueToken,
          job_id: jobId,
        },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });

      if (res.error) throw res.error;

      const result = res.data;
      setImportJob(prev => ({
        ...result,
        inserted: (prev?.inserted || 0) + result.inserted,
        processed: (prev?.processed || 0) + result.processed,
      }));

      if (result.cmcontinue) {
        // Continue after a short delay
        pollRef.current = setTimeout(() => {
          pollImport(jobId, result.cmcontinue, langCode);
        }, 2000);
      } else {
        setImporting(false);
        toastSuccess(`Import complete!`);
      }
    } catch (err) {
      setImporting(false);
      toastError(err.message || 'Import batch failed');
    }
  };

  const handleStopImport = () => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
    setImporting(false);
    toastSuccess('Import paused');
  };

  const langName = LANGUAGES.find(l => l.code === importLanguage)?.name;
  const progressPct = importJob?.total_in_category
    ? Math.min(100, Math.round(((importJob.processed || 0) / importJob.total_in_category) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Built-in search sources */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-2">Search Sources</h2>
        <p className="text-sm text-slate-400 mb-4">
          Dictionary sources used when searching in the Lookup tab.
        </p>

        <div className="space-y-1">
          {builtinSources.map(source => (
            <div
              key={source.id}
              className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: source.core_color }}
                />
                <div>
                  <p className="font-medium text-white text-sm">{source.name}</p>
                  <p className="text-xs text-slate-500">{source.description}</p>
                  {source.supported_languages && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      {source.supported_languages.map(c =>
                        LANGUAGES.find(l => l.code === c)?.name || c
                      ).join(', ')} only
                    </p>
                  )}
                </div>
              </div>
              <SourceToggle sourceId={source.id} />
            </div>
          ))}
        </div>
      </Card>

      {/* Constellation provenance sources */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-2">Constellation Sources</h2>
        <p className="text-sm text-slate-400 mb-4">
          Provenance labels shown in the constellation. Toggle visibility from the constellation sidebar.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {provenanceSources.map(source => (
            <div
              key={source.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50"
            >
              <span className="text-sm" style={{ color: source.core_color }}>
                {source.symbol}
              </span>
              <div>
                <p className="text-sm text-white">{source.short_name}</p>
                <p className="text-xs text-slate-500">{source.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Wiktionary bulk import */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-2">Wiktionary Import</h2>
        <p className="text-sm text-slate-400 mb-4">
          Bulk-import vocabulary from Wiktionary into your constellation. Words are classified into semantic domains automatically.
        </p>

        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-1">Language</label>
              <select
                value={importLanguage}
                onChange={(e) => setImportLanguage(e.target.value)}
                disabled={importing}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-starlog-500"
              >
                <option value="">Select language...</option>
                {LANGUAGES.map(({ code, name }) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>

            {importing ? (
              <Button variant="secondary" onClick={handleStopImport}>
                Pause
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleStartImport}
                disabled={!importLanguage}
                loading={importing}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            )}
          </div>

          {/* Import progress */}
          {importJob && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">
                  {importing ? 'Importing' : 'Imported'} {langName || importLanguage}...
                </span>
                <span className="text-slate-400">
                  {importJob.inserted || 0} words
                  {importJob.total_in_category ? ` / ~${importJob.total_in_category.toLocaleString()} in category` : ''}
                </span>
              </div>

              {importJob.total_in_category > 0 && (
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-starlog-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}

              {importing && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing batch... {importJob.errors > 0 && `(${importJob.errors} errors)`}
                </div>
              )}

              {!importing && importJob.errors > 0 && (
                <p className="text-xs text-yellow-400">
                  Completed with {importJob.errors} errors
                </p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Search source toggle that reads/writes appStore
function SourceToggle({ sourceId }) {
  const enabled = useAppStore((s) => s.enabledSources.includes(sourceId));
  const toggle = useAppStore((s) => s.toggleSource);

  return (
    <button
      onClick={() => toggle(sourceId)}
      className={`
        relative w-11 h-6 rounded-full transition-colors
        ${enabled ? 'bg-starlog-500' : 'bg-slate-700'}
      `}
    >
      <span
        className={`
          absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

// Simple toggle switch component
function ToggleSwitch({ defaultChecked = false }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`
        relative w-11 h-6 rounded-full transition-colors
        ${checked ? 'bg-starlog-500' : 'bg-slate-700'}
      `}
    >
      <span
        className={`
          absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}
