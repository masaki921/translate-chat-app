import React, { useState, useEffect, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import * as supabaseService from './services/supabaseService.ts';
import { Profile } from './types.ts';
import AuthScreen from './screens/AuthScreen.tsx';
import FriendsListScreen from './screens/FriendsListScreen.tsx';
import ChatScreen from './screens/ChatScreen.tsx';
import AddFriendScreen from './screens/AddFriendScreen.tsx';
import VoiceCallScreen from './screens/VoiceCallScreen.tsx';
import { LocaleProvider, useLocale } from './contexts/LocaleContext.tsx';

type Screen = 'friends' | 'chat' | 'addFriend' | 'voiceCall';

const AppContent: React.FC = () => {
  const { t } = useLocale();

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [screen, setScreen] = useState<Screen>('friends');
  const [activeChatFriend, setActiveChatFriend] = useState<Profile | null>(null);

  useEffect(() => {
    // Set up session listener on mount
    const { data: authListener } = supabaseService.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Check for existing session right away
    supabaseService.getSession().then((currentSession) => {
      setSession(currentSession);
    });

    // Cleanup listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setProfileError(null);
    if (session?.user) {
      setIsLoading(true);
      const fetchProfileWithRetry = async (retries = 5, delay = 1000) => {
        try {
          const fetchedProfile = await supabaseService.getProfile(session.user.id);
          if (fetchedProfile) {
            setProfile(fetchedProfile);
            setIsLoading(false);
          } else if (retries > 0) {
            setTimeout(() => fetchProfileWithRetry(retries - 1, delay), delay);
          } else {
            setProfileError(t('profileLoadFailedGeneral'));
            setIsLoading(false);
          }
        } catch (error) {
            console.error("An unexpected error occurred while fetching profile:", error);
            setProfileError(t('profileLoadFailedUnexpected'));
            setIsLoading(false);
        }
      };
      fetchProfileWithRetry();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [session, t]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">{t('loading')}...</div>
      </div>
    );
  }
  
  if (profileError) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-800 p-4 text-center">
              <h1 className="text-2xl font-bold mb-4">{t('error')}</h1>
              <p className="mb-4">{profileError}</p>
              <button
                  onClick={() => supabaseService.signOut()}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                  {t('logout')}
              </button>
          </div>
      );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (!profile) {
     return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">{t('profileLoadFailed')}</div>
      </div>
    );
  }

  const handleSelectFriend = (friend: Profile) => {
    setActiveChatFriend(friend);
    setScreen('chat');
  };

  const handleBackToFriends = () => {
    setActiveChatFriend(null);
    setScreen('friends');
  };
  
  const handleGoToAddFriend = () => {
    setScreen('addFriend');
  };
  
  const handleLogout = async () => {
    await supabaseService.signOut();
    setScreen('friends'); // Reset screen stack
  };

  const handleStartVoiceCall = (friend: Profile) => {
    setActiveChatFriend(friend);
    setScreen('voiceCall');
  };

  const handleEndVoiceCall = () => {
    setScreen('chat'); // Return to the chat screen
  };

  const renderScreen = () => {
    switch (screen) {
      case 'chat':
        if (activeChatFriend) {
          return (
            <ChatScreen
              currentUser={profile}
              friend={activeChatFriend}
              onBack={handleBackToFriends}
              onStartVoiceCall={() => handleStartVoiceCall(activeChatFriend)}
            />
          );
        }
        return null;
      case 'addFriend':
        return <AddFriendScreen onBack={handleBackToFriends} currentUser={profile} />;
      case 'voiceCall':
        if (activeChatFriend) {
          return (
            <VoiceCallScreen
              friend={activeChatFriend}
              onEndCall={handleEndVoiceCall}
            />
          );
        }
        return null;
      case 'friends':
      default:
        return (
          <FriendsListScreen
            currentUser={profile}
            onSelectFriend={handleSelectFriend}
            onGoToAddFriend={handleGoToAddFriend}
            onLogout={handleLogout}
          />
        );
    }
  };

  return <div className="h-screen w-screen">{renderScreen()}</div>;
};


const App: React.FC = () => {
  return (
    <LocaleProvider>
      <AppContent />
    </LocaleProvider>
  );
};


export default App;