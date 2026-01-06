// Release Year Filter - Multi-select decade buttons with custom range option
'use client';

import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReleaseDecade, YearRange } from '@/types/content';

interface ReleaseYearFilterProps {
    selectedDecades: ReleaseDecade[];
    customRange: YearRange | null;
    onDecadesChange: (decades: ReleaseDecade[]) => void;
    onCustomRangeChange: (range: YearRange | null) => void;
}

const DECADE_OPTIONS: { id: ReleaseDecade; label: string }[] = [
    { id: '2020s', label: '2020s' },
    { id: '2010s', label: '2010s' },
    { id: '2000s', label: '2000s' },
    { id: '1990s', label: '1990s' },
    { id: 'older', label: 'Older' },
];

export function ReleaseYearFilter({
    selectedDecades,
    customRange,
    onDecadesChange,
    onCustomRangeChange,
}: ReleaseYearFilterProps) {
    const [showCustomRange, setShowCustomRange] = useState(customRange !== null);

    const toggleDecade = (decade: ReleaseDecade) => {
        // Clear custom range if selecting decades
        if (customRange) {
            onCustomRangeChange(null);
        }

        if (selectedDecades.includes(decade)) {
            onDecadesChange(selectedDecades.filter((d) => d !== decade));
        } else {
            onDecadesChange([...selectedDecades, decade]);
        }
    };

    const getDisplayText = (): string => {
        if (customRange?.start && customRange?.end) {
            return `${customRange.start}–${customRange.end}`;
        }
        if (customRange?.start) {
            return `After ${customRange.start}`;
        }
        if (customRange?.end) {
            return `Before ${customRange.end}`;
        }
        if (selectedDecades.length === 0) {
            return 'Any';
        }
        if (selectedDecades.length === 1) {
            return selectedDecades[0];
        }
        return `${selectedDecades.length} selected`;
    };

    const handleCustomRangeToggle = () => {
        if (showCustomRange) {
            setShowCustomRange(false);
            onCustomRangeChange(null);
        } else {
            setShowCustomRange(true);
            // Clear decade selection when entering custom range
            onDecadesChange([]);
            onCustomRangeChange({ start: null, end: null });
        }
    };

    const currentYear = new Date().getFullYear();

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between pl-1">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                    Release Year
                </h3>
                <span className="text-text-primary text-sm font-medium">
                    {getDisplayText()}
                </span>
            </div>

            {/* Decade buttons */}
            {!showCustomRange && (
                <div className="grid grid-cols-3 gap-3">
                    {DECADE_OPTIONS.map((option) => {
                        const isSelected = selectedDecades.includes(option.id);
                        return (
                            <button
                                key={option.id}
                                onClick={() => toggleDecade(option.id)}
                                className={cn(
                                    'py-3 rounded-lg text-sm font-medium transition-all active:scale-95',
                                    isSelected
                                        ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20'
                                        : 'bg-bg-card border border-border-default text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                                )}
                            >
                                {option.label}
                            </button>
                        );
                    })}

                    {/* Custom Range button */}
                    <button
                        onClick={handleCustomRangeToggle}
                        className={cn(
                            'py-3 rounded-lg text-sm font-medium transition-all active:scale-95',
                            'bg-bg-card border border-border-default text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
                            'flex items-center justify-center gap-1.5'
                        )}
                    >
                        <Calendar className="w-4 h-4" />
                        Custom
                    </button>
                </div>
            )}

            {/* Custom range inputs */}
            {showCustomRange && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-text-tertiary mb-1 block">From</label>
                            <input
                                type="number"
                                min={1900}
                                max={currentYear}
                                placeholder="1900"
                                value={customRange?.start ?? ''}
                                onChange={(e) =>
                                    onCustomRangeChange({
                                        ...customRange,
                                        start: e.target.value ? parseInt(e.target.value) : null,
                                        end: customRange?.end ?? null,
                                    })
                                }
                                className={cn(
                                    'w-full px-3 py-2.5 rounded-lg',
                                    'bg-bg-card border border-border-default',
                                    'text-text-primary text-sm',
                                    'focus:outline-none focus:border-accent-primary',
                                    'placeholder:text-text-tertiary'
                                )}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-tertiary mb-1 block">To</label>
                            <input
                                type="number"
                                min={1900}
                                max={currentYear}
                                placeholder={currentYear.toString()}
                                value={customRange?.end ?? ''}
                                onChange={(e) =>
                                    onCustomRangeChange({
                                        ...customRange,
                                        start: customRange?.start ?? null,
                                        end: e.target.value ? parseInt(e.target.value) : null,
                                    })
                                }
                                className={cn(
                                    'w-full px-3 py-2.5 rounded-lg',
                                    'bg-bg-card border border-border-default',
                                    'text-text-primary text-sm',
                                    'focus:outline-none focus:border-accent-primary',
                                    'placeholder:text-text-tertiary'
                                )}
                            />
                        </div>
                    </div>

                    {/* Back to decades button */}
                    <button
                        onClick={handleCustomRangeToggle}
                        className="flex items-center gap-1 text-xs font-medium text-text-tertiary hover:text-text-secondary transition-colors"
                    >
                        <X className="w-3 h-3" />
                        Back to Decades
                    </button>
                </div>
            )}
        </div>
    );
}
