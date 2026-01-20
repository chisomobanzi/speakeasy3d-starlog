import { useState } from 'react';
import { User, Bell, Globe, Shield, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
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
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'privacy', label: 'Privacy', icon: Shield },
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
        </div>
      </div>
    </div>
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
