'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Film, Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
    onSuccess?: () => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
    const { signIn, signUp, authError, clearError, isAuthLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);
        clearError();

        // Validation
        if (!email.trim() || !password) {
            setValidationError('Please fill in all fields.');
            return;
        }

        if (isSignUp && password !== confirmPassword) {
            setValidationError('Passwords do not match.');
            return;
        }

        if (isSignUp && password.length < 6) {
            setValidationError('Password must be at least 6 characters.');
            return;
        }

        setIsSubmitting(true);

        try {
            if (isSignUp) {
                await signUp(email, password);
            } else {
                await signIn(email, password);
            }
            onSuccess?.();
        } catch {
            // Error is handled by AuthContext
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setValidationError(null);
        clearError();
        setConfirmPassword('');
    };

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-bg-app flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-app flex flex-col items-center justify-center px-4">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-4">
                        <Film className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Watch Match</h1>
                    <p className="text-text-secondary mt-2">Find what you both want to watch</p>
                </div>

                {/* Form Card */}
                <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-semibold text-white mb-6">
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1.5">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                autoComplete="email"
                                className="w-full px-4 py-3 bg-bg-app border border-border-subtle rounded-xl text-white placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                                    className="w-full px-4 py-3 pr-12 bg-bg-app border border-border-subtle rounded-xl text-white placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password (Sign Up only) */}
                        {isSignUp && (
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1.5">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    className="w-full px-4 py-3 bg-bg-app border border-border-subtle rounded-xl text-white placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                                />
                            </div>
                        )}

                        {/* Error Message */}
                        {(validationError || authError) && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                                <p className="text-sm text-red-400">{validationError || authError}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                                </>
                            ) : (
                                isSignUp ? 'Create Account' : 'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Toggle Sign In / Sign Up */}
                    <div className="mt-6 text-center">
                        <p className="text-text-secondary text-sm">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="text-accent-primary hover:text-indigo-400 font-medium transition-colors"
                            >
                                {isSignUp ? 'Sign In' : 'Create One'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-text-tertiary text-xs mt-6">
                    Movie & TV discovery for two
                </p>
            </div>
        </div>
    );
}
