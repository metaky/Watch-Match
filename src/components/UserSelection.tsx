'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore, UserProfile } from '@/store/useAppStore';

export function UserSelection() {
    const { selectProfile, hasSelectedProfile, user1Name, user2Name } = useAppStore();
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Delay showing to avoid flash if already selected (though gate will handle this, this is double safety)
        if (!hasSelectedProfile) {
            setIsVisible(true);
        }
    }, [hasSelectedProfile]);

    const handleSelect = (profile: UserProfile) => {
        setIsExiting(true);
        setTimeout(() => {
            selectProfile(profile);
            setIsVisible(false);
        }, 600); // Wait for exit animation
    };

    if (!isVisible && hasSelectedProfile) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex flex-col md:flex-row bg-bg-app transition-opacity duration-500 ease-in-out ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
            {/* Kyle's Side */}
            <button
                onClick={() => handleSelect('user1')}
                className="group relative flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500 hover:flex-[1.2] active:scale-95 focus:outline-hidden"
            >
                <div className="absolute inset-0 bg-linear-to-br from-slate-900 to-slate-800 opacity-100 transition-opacity duration-500 group-hover:opacity-90"></div>

                {/* Decorative Watercolor Blob */}
                <div className="absolute inset-0 overflow-hidden mix-blend-overlay opacity-30">
                    <svg viewBox="0 0 200 200" className="w-full h-full fill-current text-indigo-500 animate-[spin_60s_linear_infinite]" style={{ transformOrigin: 'center' }}>
                        <path d="M42.7,-62.9C55.0,-52.8,64.5,-40.8,69.5,-27.4C74.5,-14.0,75.0,0.8,70.6,13.8C66.2,26.8,56.9,38.0,46.1,47.7C35.3,57.4,23.0,65.6,9.4,68.9C-4.2,72.2,-19.1,70.6,-31.6,63.9C-44.1,57.2,-54.2,45.3,-61.4,31.7C-68.6,18.1,-72.9,2.8,-69.5,-10.8C-66.1,-24.4,-55.0,-36.3,-43.3,-46.6C-31.6,-56.9,-19.3,-65.6,-5.7,-67.6C7.9,-69.6,21.5,-64.9,30.4,-73.0" transform="translate(100 100)" />
                    </svg>
                </div>

                <div className="relative z-10 text-center transform transition-transform duration-500 group-hover:scale-110">
                    <div className="w-32 h-32 mb-6 rounded-full border-4 border-indigo-400/50 shadow-2xl overflow-hidden bg-slate-800 mx-auto">
                        <img
                            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=Katherine&accessories[]&accessoriesProbability=0&eyebrows=angryNatural,default,defaultNatural,flatNatural,frownNatural,raisedExcited,raisedExcitedNatural,sadConcerned,sadConcernedNatural,unibrowNatural,upDown,upDownNatural&facialHairColor=d6b370&facialHairProbability=100&hairColor=b58143&top=bob,longButNotTooLong`}
                            alt={user1Name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">{user1Name}</h2>
                    <p className="text-indigo-200 uppercase tracking-widest text-xs font-semibold">The Critic</p>
                </div>
            </button>

            {/* Divider */}
            <div className="hidden md:block w-px bg-white/10 relative z-20">
                <div className="absolute inset-y-0 -left-4 -right-4 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-bg-app border border-white/10 flex items-center justify-center text-text-tertiary font-serif italic text-sm">
                        or
                    </div>
                </div>
            </div>

            <div className="md:hidden h-px w-full bg-white/10 relative z-20">
                <div className="absolute inset-x-0 -top-4 -bottom-4 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-bg-app border border-white/10 flex items-center justify-center text-text-tertiary font-serif italic text-sm">
                        or
                    </div>
                </div>
            </div>

            {/* Melanie's Side */}
            <button
                onClick={() => handleSelect('user2')}
                className="group relative flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500 hover:flex-[1.2] active:scale-95 focus:outline-hidden"
            >
                <div className="absolute inset-0 bg-linear-to-br from-rose-950 to-pink-950 opacity-100 transition-opacity duration-500 group-hover:opacity-90"></div>

                {/* Decorative Watercolor Blob */}
                <div className="absolute inset-0 overflow-hidden mix-blend-overlay opacity-30">
                    <svg viewBox="0 0 200 200" className="w-full h-full fill-current text-pink-500 animate-[spin_70s_linear_infinite_reverse]" style={{ transformOrigin: 'center' }}>
                        <path d="M45.7,-70.5C58.9,-62.5,69.3,-50.2,76.5,-36.4C83.7,-22.6,87.7,-7.3,84.1,6.3C80.5,19.9,69.3,31.8,58.3,42.4C47.3,53.0,36.5,62.3,24.2,67.6C11.9,72.9,-1.9,74.2,-14.8,70.9C-27.7,67.6,-39.7,59.7,-51.2,49.8C-62.7,39.9,-73.7,28.0,-78.9,13.8C-84.1,-0.4,-83.5,-16.9,-76.3,-31.6C-69.1,-46.3,-55.3,-59.2,-40.8,-66.5C-26.3,-73.8,-11.1,-75.5,2.9,-79.9C16.9,-84.3,32.5,-84.8,45.7,-70.5" transform="translate(100 100)" />
                    </svg>
                </div>

                <div className="relative z-10 text-center transform transition-transform duration-500 group-hover:scale-110">
                    <div className="w-32 h-32 mb-6 rounded-full border-4 border-pink-400/50 shadow-2xl overflow-hidden bg-rose-900 mx-auto">
                        <img
                            src="https://api.dicebear.com/9.x/avataaars/svg?seed=Christopher&accessories=prescription02&accessoriesProbability=25&clothing=shirtCrewNeck&eyebrows=angryNatural,default,defaultNatural,flatNatural,frownNatural,raisedExcited,raisedExcitedNatural,sadConcerned,sadConcernedNatural,unibrowNatural,upDown,upDownNatural&facialHair[]&facialHairColor=d6b370&facialHairProbability=100&hairColor=d6b370&top=bob,longButNotTooLong,miaWallace"
                            alt={user2Name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">{user2Name}</h2>
                    <p className="text-pink-200 uppercase tracking-widest text-xs font-semibold">The Binge Watcher</p>
                </div>
            </button>
        </div>
    );
}
