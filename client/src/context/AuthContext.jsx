import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, AlertTriangle } from 'lucide-react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(() => {
        const cached = localStorage.getItem('cached_profile');
        return cached ? JSON.parse(cached) : null;
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProfile = async (userId, forceUpdate = false) => {
        // Optimization: Don't fetch if we already have the profile in memory, unless forced
        // We allow fetching even if cached to ensure role updates are reflected
        // if (!forceUpdate && profile && profile.id === userId) {
        //    console.log("Using cached profile state for:", userId);
        //    return;
        // }

        try {
            console.log("Fetching profile for:", userId);

            // Allow 2.5 seconds max for profile fetch (Faster user experience)
            const profilePromise = supabase
                .from('profiles')
                .select('id, username, role, first_name, last_name, email, student_id, phone')
                .eq('id', userId)
                .maybeSingle();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timeout')), 2500)
            );

            const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

            console.log("Supabase response:", { data, error });

            if (error) {
                console.error("Error fetching profile:", error);
            }

            if (data) {
                console.log("Profile loaded:", data.role);
                setProfile(data);
                localStorage.setItem('cached_profile', JSON.stringify(data));
            } else {
                console.warn("No profile found for user:", userId);
            }
        } catch (error) {
            console.error("Critical error fetching profile:", error);
            // Even if profile fails, we don't crash, just have no profile data
        }
    };

    useEffect(() => {
        let mounted = true;

        // Timeout removed to allow Supabase cold starts to complete


        const initAuth = async () => {
            try {
                console.log("Initializing Auth...");
                // Get initial session with timeout
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth Init Timeout')), 3000));

                const sessionResponse = await Promise.race([sessionPromise, timeoutPromise]);
                console.log("Session Response:", sessionResponse);

                const { data: { session }, error } = sessionResponse;

                if (error) throw error;

                if (mounted) {
                    if (session?.user) {
                        console.log("Found user:", session.user.email);
                        setUser(session.user);
                        // Only fetch if profile is not already loaded or ID mismatch
                        if (!profile || profile.id !== session.user.id) {
                            await fetchProfile(session.user.id);
                        }
                    } else {
                        console.log("No active session");
                        setUser(null);
                        setProfile(null);
                        localStorage.removeItem('cached_profile'); // Ensure cache is cleared if no session
                    }
                }
            } catch (err) {
                console.warn("Auth initialization finished with warning (defaulting to guest):", err);
                // If init fails (timeout or network), we default to Guest mode instead of crashing
                // This allows the user to at least see the site and try logging in manually
                if (mounted) {
                    setUser(null);
                    setProfile(null);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth State Change:", event);
            if (!mounted) return;

            if (session?.user) {
                // Only update if user changed or profile is missing
                const currentUser = user;
                // Note: 'user' in closure might be stale, so we rely on session logic or state setters callback if needed.
                // But simpler: just fetch if we need to.

                setUser(session.user);

                // Fetch profile only if not loaded or user changed? 
                // Actually safer to Always fetch on SIGNED_IN to get updates, 
                // BUT don't clear it first.
                await fetchProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
            }
            // Note: We don't clear on other events to prevent flashing
            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const value = {
        signUp: (data) => supabase.auth.signUp(data),
        signIn: (data) => supabase.auth.signInWithPassword(data),
        signOut: async () => {
            // 1. Manually clear Supabase tokens from LocalStorage IMMEDIATELY
            try {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-') || key.includes('supabase') || key === 'cached_profile') {
                        localStorage.removeItem(key);
                    }
                });
            } catch (err) {
                console.error("Error clearing local storage:", err);
            }

            setUser(null);
            setProfile(null);

            const { error } = await supabase.auth.signOut();
            if (error) console.error("Error signing out:", error);
        },
        fetchProfile, // <--- EXPOSED NOW
        user,
        profile,
        loading
    };

    // Loading check removed to allow app to render immediately


    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col space-y-4 p-4 text-center">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Connection Error</h3>
                <p className="text-gray-600">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
