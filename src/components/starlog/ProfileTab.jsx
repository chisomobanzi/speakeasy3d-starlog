import { useState } from 'react';
import { User, Award, BookOpen, Star, Settings, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDecks } from '../../hooks/useDecks';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function ProfileTab() {
  const { user, profile, isVerified } = useAuth();
  const { decks } = useDecks();

  // Calculate stats
  const totalWords = decks.reduce((sum, d) => sum + (d.word_count || 0), 0);
  const totalDecks = decks.length;

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Profile header */}
      <Card className="text-center py-6">
        <Avatar
          src={profile?.avatar_url}
          name={profile?.display_name || user?.email}
          size="xl"
          className="mx-auto mb-4"
        />
        <h2 className="text-xl font-bold text-white">
          {profile?.display_name || 'Language Learner'}
        </h2>
        {profile?.username && (
          <p className="text-slate-400">@{profile.username}</p>
        )}

        <div className="flex items-center justify-center gap-2 mt-3">
          {isVerified && (
            <Badge variant="success" icon={Award}>Verified</Badge>
          )}
          {profile?.verified_languages?.length > 0 && (
            <Badge variant="primary">
              {profile.verified_languages.length} language{profile.verified_languages.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-starlog-400">{totalWords}</p>
          <p className="text-sm text-slate-500">Words</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-starlog-400">{totalDecks}</p>
          <p className="text-sm text-slate-500">Decks</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-starlog-400">
            {profile?.contribution_count || 0}
          </p>
          <p className="text-sm text-slate-500">Contributions</p>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="space-y-2">
        <Link to="/settings/profile">
          <Card hover className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-white">Edit Profile</p>
                <p className="text-sm text-slate-500">Update your info and avatar</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Card>
        </Link>

        <Link to="/settings">
          <Card hover className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-white">Settings</p>
                <p className="text-sm text-slate-500">App preferences and account</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Card>
        </Link>
      </div>

      {/* Verification CTA */}
      {!isVerified && (
        <Card className="bg-gradient-to-br from-starlog-500/10 to-starlog-600/10 border-starlog-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-starlog-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-starlog-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Become a Verified Contributor</h3>
              <p className="text-sm text-slate-400 mb-3">
                Help preserve languages by reviewing community entries. Verified contributors can approve new vocabulary.
              </p>
              <Button variant="outline" size="sm">
                Learn More
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Learning streak (placeholder) */}
      <Card>
        <h3 className="font-medium text-white mb-3">Learning Streak</h3>
        <div className="flex items-center gap-2 mb-3">
          <div className="text-3xl font-bold text-starlog-400">0</div>
          <div className="text-slate-500">days</div>
        </div>
        <p className="text-sm text-slate-500">
          Start reviewing words daily to build your streak!
        </p>
      </Card>
    </div>
  );
}
