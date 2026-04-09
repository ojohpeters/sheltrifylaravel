import React, { useState } from 'react';
import { getMarketInsights } from '../services/geminiService';
import { GroundingChunk } from '../types';
import { CloseIcon, ChartBarIcon, LinkIcon } from './icons';

interface MarketInsightsModalProps {
    onClose: () => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
    </div>
);

const ResultDisplay: React.FC<{ text: string, sources: GroundingChunk[] }> = ({ text, sources }) => {
    // A simple markdown-like renderer to handle basic formatting
    const SimpleMarkdown: React.FC<{ text: string }> = ({ text: markdownText }) => {
        const lines = markdownText.split('\n');
        return (
            <div className="prose prose-sm max-w-none dark:prose-invert text-inherit">
                {lines.map((line, i) => {
                    if (line.startsWith('* ')) {
                        return <li key={i} className="my-1 ml-4">{line.substring(2)}</li>;
                    }
                     if (line.startsWith('### ')) {
                        return <h3 key={i} className="text-lg font-semibold mt-3 mb-1">{line.substring(4)}</h3>;
                    }
                    if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.substring(3)}</h2>
                    }
                    if (!line.trim()) {
                         return <p key={i} className="my-1">&nbsp;</p>;
                    }
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                        <p key={i} className="my-1">
                            {parts.filter(part => part).map((part, j) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={j}>{part.slice(2, -2)}</strong>;
                                }
                                return part;
                            })}
                        </p>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="mt-4">
            <SimpleMarkdown text={text} />
            {sources && sources.length > 0 && (
                <div className="mt-6">
                    <h4 className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary border-t border-light-border dark:border-dark-border pt-3">Sources</h4>
                    <ul className="mt-2 space-y-2">
                        {sources.map((source, index) => (
                            <li key={index}>
                                <a 
                                    href={source.web.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-start gap-2 text-xs text-blue-500 dark:text-blue-400 hover:underline"
                                >
                                    <LinkIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span className="truncate">{source.web.title || source.web.uri}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export const MarketInsightsModal: React.FC<MarketInsightsModalProps> = ({ onClose }) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ text: string; sources: GroundingChunk[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const exampleQueries = [
        "Average rent for a 2-bedroom in Lekki?",
        "Most popular neighborhoods in Abuja for families?",
        "Rental price trends in Port Harcourt over the last year?",
    ];

    const handleSubmit = async (e: React.FormEvent, currentQuery?: string) => {
        e.preventDefault();
        const queryToSubmit = currentQuery || query;
        if (!queryToSubmit.trim()) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await getMarketInsights(queryToSubmit);
            setResult(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
            `}</style>
            <div 
                className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-2xl p-6 text-light-text-primary dark:text-dark-text-primary flex flex-col max-h-[90vh] animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
                    <CloseIcon className="w-6 h-6" />
                </button>
                
                <div className="flex items-center gap-3 mb-4">
                    <ChartBarIcon className="w-8 h-8 text-brand-primary" />
                    <div>
                        <h2 className="text-xl font-bold">Market Insights</h2>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Get real-time rental market data powered by Google Search.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., What are the safest neighborhoods in Ibadan with good schools?"
                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition resize-y"
                        rows={3}
                        disabled={isLoading}
                    />
                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2 mb-3">
                        Try an example:
                        {exampleQueries.map((ex, i) => (
                             <button key={i} type="submit" onClick={(e) => { setQuery(ex); handleSubmit(e, ex); }} className="ml-2 underline hover:text-brand-primary">{ex}</button>
                        ))}
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        className="w-full bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-brand-secondary transition-colors disabled:bg-brand-secondary/50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Getting Insights...' : 'Get Insights'}
                    </button>
                </form>

                <div className="mt-4 flex-grow overflow-y-auto border-t border-light-border dark:border-dark-border -mx-6 px-6 pt-4">
                    {isLoading && <LoadingSpinner />}
                    {error && <p className="text-center text-red-500">{error}</p>}
                    {result && <ResultDisplay text={result.text} sources={result.sources} />}
                </div>
            </div>
        </div>
    );
};
