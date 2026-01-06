// Range Slider - Reusable slider component for score and runtime filters
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface RangeSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    formatValue: (value: number) => string;
    formatMin?: string;
    formatMax?: string;
    icon?: React.ReactNode;
}

export function RangeSlider({
    label,
    value,
    min,
    max,
    step,
    onChange,
    formatValue,
    formatMin,
    formatMax,
    icon,
}: RangeSliderProps) {
    return (
        <div className="space-y-2">
            {/* Header with label and value */}
            <div className="flex items-center justify-between pl-1">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                    {label}
                </h3>
                <div className="flex items-center gap-1 text-accent-primary">
                    {icon}
                    <span className="font-bold text-sm">{formatValue(value)}</span>
                </div>
            </div>

            {/* Slider container */}
            <div
                className={cn(
                    'h-14 bg-bg-card rounded-xl flex items-center px-4',
                    'border border-border-default shadow-sm'
                )}
            >
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-full"
                />
            </div>

            {/* Min/Max labels */}
            <div className="flex justify-between px-1 text-[10px] text-text-tertiary font-bold uppercase tracking-wide">
                <span>{formatMin ?? min}</span>
                <span>{formatMax ?? max}</span>
            </div>
        </div>
    );
}
