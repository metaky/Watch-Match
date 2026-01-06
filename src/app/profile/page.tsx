'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui';
import { User, Users, CheckCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
    const router = useRouter();
    const {
        user1Name,
        user2Name,
        setUserName,
        activeProfile
    } = useAppStore();

    const [u1Name, setU1Name] = useState(user1Name);
    const [u2Name, setU2Name] = useState(user2Name);
    const [isSaved, setIsSaved] = useState(false);

    // Update local state when store changes (e.g. on mount)
    useEffect(() => {
        setU1Name(user1Name);
        setU2Name(user2Name);
    }, [user1Name, user2Name]);

    const handleSave = () => {
        setUserName('user1', u1Name);
        setUserName('user2', u2Name);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-40">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-text-secondary" />
                </button>
                <h1 className="text-2xl font-bold text-text-primary">Profile Preferences</h1>
            </div>

            {/* Profile Section */}
            <div className="grid gap-6">
                {/* User 1 Card */}
                <div className={cn(
                    "card border-2 transition-colors",
                    activeProfile === 'user1' ? "border-accent-primary/50" : "border-transparent"
                )}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="font-bold text-text-primary">
                                Your Profile {activeProfile === 'user1' && <span className="text-xs font-normal text-accent-primary ml-2">(Active)</span>}
                            </h2>
                            <p className="text-sm text-text-secondary">How you appear in the app</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary pl-1">Display Name</label>
                        <input
                            type="text"
                            value={u1Name}
                            onChange={(e) => setU1Name(e.target.value)}
                            className="w-full bg-bg-elevated border border-border-default rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none transition-all"
                            placeholder="Enter your name"
                        />
                    </div>
                </div>

                {/* User 2 Card */}
                <div className={cn(
                    "card border-2 transition-colors",
                    activeProfile === 'user2' ? "border-accent-primary/50" : "border-transparent"
                )}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Users className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <h2 className="font-bold text-text-primary">
                                Partner&apos;s Profile {activeProfile === 'user2' && <span className="text-xs font-normal text-accent-primary ml-2">(Active)</span>}
                            </h2>
                            <p className="text-sm text-text-secondary">Your shared screen partner</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary pl-1">Partner Name</label>
                        <input
                            type="text"
                            value={u2Name}
                            onChange={(e) => setU2Name(e.target.value)}
                            className="w-full bg-bg-elevated border border-border-default rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none transition-all"
                            placeholder="Enter partner name"
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="fixed bottom-24 left-0 right-0 px-4 max-w-[480px] mx-auto z-10">
                <Button
                    onClick={handleSave}
                    className="w-full py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2"
                    variant={isSaved ? "success" : "primary"}
                >
                    {isSaved ? (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            Saved Successfully
                        </>
                    ) : (
                        "Save Changes"
                    )}
                </Button>
            </div>
        </div>
    );
}
