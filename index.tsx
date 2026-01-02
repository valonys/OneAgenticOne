import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { auth, type GoogleUser } from './auth-oauth2';

import type { Message, Agent, AgentRole, RagSources, UploadedFileState } from './types';
import { AGENT_ROLES, UserAvatar, AssistantAvatar } from './constants';

// Import conversation storage
declare global {
    interface Window {
        conversationStorage: any;
    }
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const TOTAL_TOKEN_LIMIT = 10000;

const AppLogo: React.FC<{ className?: string }> = ({ className }) => (
    <img 
        src="https://github.com/valonys/DigiTwin/blob/29dd50da95bec35a5abdca4bdda1967f0e5efff6/ValonyLabs_Logo.png?raw=true" 
        alt="Valony Labs Logo"
        className={className}
    />
);

const LoginScreen: React.FC = memo(() => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showGuestForm, setShowGuestForm] = useState(false);
    const [guestName, setGuestName] = useState('');

    const handleGoogleSignIn = async () => {
        setError(null);
        setIsLoading(true);
        try {
            await auth.signIn();
            // The OAuth flow will handle the redirect
        } catch (err: any) {
            setError(`Sign-in failed: ${err.message}. Please try guest mode instead.`);
            console.error("Google OAuth Error:", err);
            setIsLoading(false);
        }
    };
    
    const handleGuestSignIn = () => {
        if (!showGuestForm) {
            setShowGuestForm(true);
            return;
        }

        if (!guestName.trim()) {
            setError('Please enter your name');
            return;
        }

        setError(null);
        setIsLoading(true);
        try {
            auth.signInAsGuest(guestName.trim());
            setIsLoading(false);
        } catch (err: any) {
            setError(`Guest sign-in failed: ${err.message}`);
            console.error("Guest sign-in error:", err);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-900 font-sans">
            <div className="w-full max-w-sm p-8 space-y-6 bg-gray-800 rounded-2xl shadow-2xl">
                <div className="text-center">
                    <div className="logo-container">
                        <img 
                            src="https://github.com/valonys/DigiTwin/blob/29dd50da95bec35a5abdca4bdda1967f0e5efff6/ValonyLabs_Logo.png?raw=true" 
                            width="70" 
                            alt="ValonyLabs Logo"
                            className="mx-auto"
                        />
                    </div>
                    <h1 className="mt-4 text-3xl font-bold text-white">AgenticOne</h1>
                    <p className="mt-2 text-cyan-400">Choose your sign-in method</p>
                </div>
                
                <div className="space-y-4">
                    {/* Guest Login Form */}
                    {!showGuestForm ? (
                        <button 
                            onClick={handleGuestSignIn}
                            disabled={isLoading}
                            className="w-full py-3 px-4 border border-gray-600 rounded-lg shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Continue as Guest
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="guestName" className="block text-sm font-medium text-gray-300 mb-2">
                                    What should we call you?
                                </label>
                                <input
                                    id="guestName"
                                    type="text"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => {
                                        setShowGuestForm(false);
                                        setGuestName('');
                                        setError(null);
                                    }}
                                    className="flex-1 py-2 px-4 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleGuestSignIn}
                                    disabled={isLoading || !guestName.trim()}
                                    className="flex-1 py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {isLoading ? 'Signing in...' : 'Continue'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Google Login Button */}
                    <button 
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full py-3 px-4 border border-gray-600 rounded-lg shadow-sm text-sm font-medium text-white bg-white hover:bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {isLoading ? 'Signing in...' : 'Continue with Google'}
                    </button>
                </div>
                
                {error && <p role="alert" className="text-center text-red-400 text-sm mt-4">{error}</p>}
            </div>
        </div>
    );
});

const Header: React.FC<{ user: GoogleUser; onSignOut: () => void; tokenCount: number; totalTokenLimit: number; onToggleHistory: () => void; showHistory: boolean; conversationCount?: number }> = memo(({ user, onSignOut, tokenCount, totalTokenLimit, onToggleHistory, showHistory, conversationCount = 0 }) => (
     <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center shadow-md flex-shrink-0">
        <div className="flex items-center gap-4">
            <AppLogo className="h-10 w-auto" />
            <div>
                <h1 className="text-xl font-bold text-white">AgenticOne</h1>
                <p className="text-xs text-cyan-400">AI Beyond Compare</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
             <div className="text-sm text-right">
                <span className="font-medium text-white truncate">{user.name || user.email}</span>
                <p className="text-gray-400">Tokens: {tokenCount.toLocaleString()} / {totalTokenLimit.toLocaleString()}</p>
            </div>
            <button
                onClick={onToggleHistory}
                className={`py-2 px-3 border rounded-lg shadow-sm text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 relative ${
                    showHistory 
                        ? 'border-cyan-500 bg-cyan-900 text-cyan-100' 
                        : 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600'
                }`}
                title="Chat History"
            >
                📋 History
                {conversationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {conversationCount > 99 ? '99+' : conversationCount}
                    </span>
                )}
            </button>
            <button
                onClick={onSignOut}
                className="py-2 px-4 border border-gray-600 rounded-lg shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all"
            >
                Sign Out
            </button>
        </div>
    </header>
));

const formatContent = (text: string): string => {
    let formatted = text
        // Convert markdown bullet points to proper bullet points
        .replace(/^\s*(\*\*|\*|-)\s+/gm, '• ')
        // Convert numbered lists to proper format
        .replace(/^\s*(\d+\.)\s+/gm, '$1 ')
        // Convert bold text (remove asterisks but keep content)
        .replace(/\*\*(.*?)\*\*/g, '$1')
        // Convert italic text (remove asterisks but keep content)
        .replace(/\*(.*?)\*/g, '$1')
        // Clean up multiple newlines
        .replace(/\n{3,}/g, '\n\n')
        // Ensure proper spacing around bullet points
        .replace(/(\n•\s)/g, '\n• ')
        // Clean up any remaining markdown artifacts
        .replace(/^\s*[-*+]\s+/gm, '• ');
    
    return formatted;
};

const ChatBubble: React.FC<{ message: Message; isStreaming?: boolean }> = memo(({ message, isStreaming = false }) => {
    const agentForMessage = message.agentId ? AGENT_ROLES[message.agentId] : null;
    const isUser = message.role === 'user';

    return (
        <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
            {!isUser && agentForMessage && <AssistantAvatar avatarUrl={agentForMessage.avatar} className="h-8 w-8 flex-shrink-0 mt-1" />}
            <div className={`w-full max-w-2xl rounded-xl px-5 py-3 ${isUser ? 'bg-blue-900' : 'bg-gray-800'} ${isStreaming ? 'border-l-2 border-cyan-400' : ''}`}>
                <div className="text-white whitespace-pre-wrap">
                    {isUser ? message.content : formatContent(message.content)}
                    {isStreaming && (
                        <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse">|</span>
                    )}
                </div>
                {isStreaming && (
                    <div className="mt-2 text-xs text-cyan-400 flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-cyan-400"></div>
                        <span>Streaming response...</span>
                    </div>
                )}
            </div>
            {isUser && <UserAvatar className="h-8 w-8 flex-shrink-0 mt-1" />}
        </div>
    );
});

const LoadingBubble: React.FC<{ agent: Agent }> = memo(({ agent }) => (
    <div className="flex items-start gap-4">
        <AssistantAvatar avatarUrl={agent.avatar} className="h-8 w-8 flex-shrink-0 mt-1" />
        <div className="w-full max-w-2xl rounded-xl px-5 py-4 bg-gray-800">
            <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400"></div>
                <span className="ml-3 text-gray-400">Assistant is thinking...</span>
            </div>
        </div>
    </div>
));

const App: React.FC = () => {
    const [user, setUser] = useState<GoogleUser | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState<AgentRole>('METHODS_SPECIALIST');
    const [ragSources, setRagSources] = useState<RagSources>({
        standards: true,
        internal: true,
        sensors: false,
        workorders: false,
    });
    const [chatHistories, setChatHistories] = useState<Partial<Record<AgentRole, Message[]>>>({});
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFileState[]>([]);
    const [fileError, setFileError] = useState<string | null>(null);
    const [tokenCount, setTokenCount] = useState(0);
    const [queryHistory, setQueryHistory] = useState<Array<{id: string, query: string, agent: string, timestamp: Date}>>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [allConversations, setAllConversations] = useState<Array<{
        agentRole: AgentRole;
        agentName: string;
        messages: Message[];
        lastUpdated: string;
        messageCount: number;
    }>>([]);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportRequest, setReportRequest] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            if (currentUser && Object.keys(chatHistories).length === 0) {
                // Load saved conversations from localStorage
                const savedConversations = window.conversationStorage?.getAllUserConversations(currentUser.email) || {};
                
                const initialHistories: Partial<Record<AgentRole, Message[]>> = {};
                (Object.keys(AGENT_ROLES) as AgentRole[]).forEach(key => {
                    // Use saved conversation if available, otherwise create welcome message
                    if (savedConversations[key] && savedConversations[key].length > 0) {
                        initialHistories[key] = savedConversations[key];
                        console.log(`📂 Loaded ${savedConversations[key].length} messages for ${key}`);
                    } else {
                        initialHistories[key] = [
                            {
                                role: 'assistant',
                                content: AGENT_ROLES[key].getWelcomeMessage(currentUser.name || 'there'),
                                agentId: key,
                            }
                        ];
                    }
                });
                setChatHistories(initialHistories);
                
                // Load user session data
                const sessionData = window.conversationStorage?.loadUserSession(currentUser.email);
                if (sessionData) {
                    if (sessionData.selected_agent) {
                        setSelectedAgent(sessionData.selected_agent);
                    }
                    if (sessionData.rag_sources) {
                        setRagSources(sessionData.rag_sources);
                    }
                    if (sessionData.uploaded_files) {
                        setUploadedFiles(sessionData.uploaded_files);
                    }
                    console.log(`📂 Loaded user session for ${currentUser.email}`);
                }
            }
            setIsAuthLoading(false);
        });

        // Fallback timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            console.warn('Auth initialization timeout, proceeding with fallback');
            setIsAuthLoading(false);
        }, 10000); // 10 second timeout

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, [chatHistories]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistories[selectedAgent]]);

    // Save conversations to localStorage whenever chatHistories change
    useEffect(() => {
        if (user && Object.keys(chatHistories).length > 0) {
            Object.entries(chatHistories).forEach(([agentRole, messages]) => {
                if (messages && messages.length > 0) {
                    window.conversationStorage?.saveConversationToLocal(user.email, agentRole, messages);
                }
            });
        }
    }, [chatHistories, user]);

    // Load all conversations for history sidebar
    const loadAllConversations = useCallback(() => {
        if (!user || !window.conversationStorage) return;
        
        const conversations = window.conversationStorage.getAllUserConversations(user.email);
        const conversationList: Array<{
            agentRole: AgentRole;
            agentName: string;
            messages: Message[];
            lastUpdated: string;
            messageCount: number;
        }> = [];
        
        Object.entries(conversations).forEach(([agentRole, messages]) => {
            if (messages && Array.isArray(messages) && messages.length > 0) {
                const agent = AGENT_ROLES[agentRole as AgentRole];
                if (agent) {
                    // Get last message timestamp
                    const lastMessage = messages[messages.length - 1];
                    const timestamp = lastMessage.timestamp || lastMessage.createdAt || new Date().toISOString();
                    
                    conversationList.push({
                        agentRole: agentRole as AgentRole,
                        agentName: agent.name,
                        messages: messages as Message[],
                        lastUpdated: timestamp,
                        messageCount: messages.length
                    });
                }
            }
        });
        
        // Sort by last updated (most recent first)
        conversationList.sort((a, b) => {
            const dateA = new Date(a.lastUpdated).getTime();
            const dateB = new Date(b.lastUpdated).getTime();
            return dateB - dateA;
        });
        
        setAllConversations(conversationList);
    }, [user]);

    // Load conversations when user changes or history is opened
    useEffect(() => {
        if (user) {
            loadAllConversations();
        }
    }, [user, loadAllConversations]);
    
    // Refresh conversations when history sidebar is opened
    useEffect(() => {
        if (user && showHistory) {
            loadAllConversations();
        }
    }, [showHistory, user, loadAllConversations]);

    // Refresh conversations when chat histories change
    useEffect(() => {
        if (user && showHistory) {
            loadAllConversations();
        }
    }, [chatHistories, user, showHistory, loadAllConversations]);

    // Save user session data whenever relevant state changes
    useEffect(() => {
        if (user) {
            window.conversationStorage?.saveUserSession(
                user.email,
                user.name || 'Guest',
                selectedAgent,
                ragSources,
                uploadedFiles
            );
        }
    }, [user, selectedAgent, ragSources, uploadedFiles]);
    
    const handleSignOut = useCallback(async () => {
        try {
            // Clear user data from localStorage
            if (user) {
                window.conversationStorage?.clearUserData(user.email);
            }
            auth.signOut();
            setChatHistories({}); // Clear chat history on sign out
        } catch (error) {
            console.error("Sign out error:", error);
        }
    }, [user]);

    const handleSendMessage = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        const currentInput = input;
        setInput('');

        // Add to query history
        const historyEntry = {
            id: Date.now().toString(),
            query: input.trim(),
            agent: AGENT_ROLES[selectedAgent].name,
            timestamp: new Date()
        };
        setQueryHistory(prev => [historyEntry, ...prev.slice(0, 49)]); // Keep last 50 queries

        const currentAgentHistory = chatHistories[selectedAgent] || [];
        setChatHistories(prev => ({
            ...prev,
            [selectedAgent]: [...currentAgentHistory, userMessage],
        }));
        
        setIsLoading(true);

        try {
            const agent = AGENT_ROLES[selectedAgent];
            const selectedSources = Object.entries(ragSources)
                .filter(([, value]) => value)
                .map(([key]) => key)
                .join(', ');

            const promptWithContext = `Using data from: [${selectedSources}].\n\n${currentInput}`;
            
            const historyForAPI = currentAgentHistory.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const readyFiles = uploadedFiles.filter(f => f.status === 'ready').map(f => f.file);
            const fileParts = readyFiles.map(file => ({
                inlineData: { mimeType: file.mimeType, data: file.data }
            }));
            
            const userParts = [...fileParts, { text: promptWithContext }];
            const inputContents = [...historyForAPI, { role: 'user', parts: userParts }];

            // Count input tokens
            const { totalTokens: inputTokens } = await ai.models.countTokens({ model: 'gemini-2.5-pro', contents: inputContents });
            setTokenCount(prev => prev + inputTokens);
            
            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-2.5-pro',
                contents: inputContents,
                config: { systemInstruction: agent.systemPrompt },
            });

            setIsLoading(false);
            setIsStreaming(true);

            let firstChunk = true;
            let fullResponse = '';
            for await (const chunk of responseStream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    fullResponse += chunkText;
                    if (firstChunk) {
                        const newAssistantMessage: Message = { role: 'assistant', content: chunkText, agentId: selectedAgent };
                        setChatHistories(prev => ({ ...prev, [selectedAgent]: [...(prev[selectedAgent] || []), newAssistantMessage] }));
                        firstChunk = false;
                    } else {
                        setChatHistories(prev => {
                            const agentHistory = prev[selectedAgent] || [];
                            const lastMessage = agentHistory[agentHistory.length - 1];
                            const updatedMessage = { ...lastMessage, content: lastMessage.content + chunkText };
                            return {
                                ...prev,
                                [selectedAgent]: [...agentHistory.slice(0, -1), updatedMessage]
                            };
                        });
                    }
                }
            }
            
            setIsStreaming(false);

            // Count output tokens
             const { totalTokens: outputTokens } = await ai.models.countTokens({ model: 'gemini-2.5-pro', contents: [{ role: 'model', parts: [{ text: fullResponse }]}] });
            setTokenCount(prev => prev + outputTokens);

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const errorMessage: Message = {
                role: 'assistant',
                content: "Sorry, I encountered an error. Please try again.",
                agentId: selectedAgent,
            };
            setChatHistories(prev => ({ ...prev, [selectedAgent]: [...(prev[selectedAgent] || []), errorMessage] }));
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
    }, [input, isLoading, chatHistories, selectedAgent, ragSources, uploadedFiles]);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        setFileError(null);
        const filesToUpload = Array.from(e.target.files);

        if (uploadedFiles.length + filesToUpload.length > MAX_FILES) {
            setFileError(`You can upload a maximum of ${MAX_FILES} files.`);
            e.target.value = '';
            return;
        }

        const currentFileCount = uploadedFiles.length;

        const processFile = (file: File): Promise<UploadedFileState | null> => {
            return new Promise((resolve) => {
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    setFileError(`File "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`);
                    resolve(null);
                    return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    const base64Data = result.substring(result.indexOf(',') + 1);
                    resolve({
                        file: {
                            name: file.name,
                            mimeType: file.type || 'application/octet-stream',
                            data: base64Data,
                        },
                        status: 'uploading',
                        progress: 0,
                    });
                };
                reader.onerror = () => {
                     setFileError(`Error reading file "${file.name}".`);
                     resolve(null);
                };
                reader.readAsDataURL(file);
            });
        };

        const newFilesPromises = filesToUpload.map(processFile);
        const newFiles = (await Promise.all(newFilesPromises)).filter(f => f !== null) as UploadedFileState[];
        
        setUploadedFiles(prev => [...prev, ...newFiles]);
        e.target.value = '';
        
        newFiles.forEach((_, index) => {
            const fileIndex = currentFileCount + index;
            const uploadInterval = setInterval(() => {
                setUploadedFiles(prev => prev.map((f, i) => {
                    if (i === fileIndex && f.progress < 100) {
                        return { ...f, progress: f.progress + 10 };
                    }
                    return f;
                }));
            }, 100);

            setTimeout(() => {
                clearInterval(uploadInterval);
                setUploadedFiles(prev => prev.map((f, i) => i === fileIndex ? { ...f, status: 'processing', progress: 100 } : f));
                setTimeout(() => {
                    setUploadedFiles(prev => prev.map((f, i) => i === fileIndex ? { ...f, status: 'ready' } : f));
                }, 1500);
            }, 1000);
        });
    }, [uploadedFiles]);

    const handleGenerateReport = useCallback(async () => {
        if (!user) return;
        
        const currentChatHistory = chatHistories[selectedAgent] || [];
        if (!currentChatHistory.length) return;
        
        setIsGeneratingReport(true);
        try {
            // Extract conversation data for report generation
            const conversationData = currentChatHistory.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: new Date().toISOString()
            }));
            
            // Create analysis data from the conversation
            const analysisData = {
                findings: conversationData
                    .filter(msg => msg.role === 'assistant')
                    .map(msg => msg.content)
                    .slice(0, 5), // Get last 5 assistant responses
                recommendations: [],
                technical_details: `Conversation with ${AGENT_ROLES[selectedAgent].name} on ${new Date().toLocaleDateString()}`,
                uploaded_files: uploadedFiles.filter(f => f.status === 'ready').map(f => ({
                    filename: f.file.name,
                    size: f.file.data.length,
                    type: f.file.mimeType
                }))
            };

            // Map agent roles to backend specialist types
            const specialistTypeMap: Record<AgentRole, string> = {
                'CORROSION_ENGINEER': 'corrosion_engineer',
                'SUBSEA_ENGINEER': 'subsea_engineer', 
                'METHODS_SPECIALIST': 'methods_specialist',
                'DISCIPLINE_HEAD': 'discipline_head'
            };

            const specialistType = specialistTypeMap[selectedAgent];
            const customerRequest = reportRequest || `Generate a comprehensive report based on my conversation with ${AGENT_ROLES[selectedAgent].name}`;
            const userEmail = user.email || 'user@example.com';

            // Call the backend report generation API
            const response = await fetch('http://localhost:8000/api/reports/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    specialist_type: specialistType,
                    customer_request: customerRequest,
                    user_email: userEmail,
                    analysis_data: JSON.stringify(analysisData)
                })
            });

            if (!response.ok) {
                throw new Error(`Report generation failed: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.status === 'success') {
                // Open the generated report in a new tab
                // The report_id doesn't include .html, but the actual file does
                const reportUrl = `http://localhost:8000/api/reports/preview/${result.report.report_id}.html`;
                window.open(reportUrl, '_blank');
                
                // Add a success message to the chat
                const successMessage: Message = {
                    role: 'assistant',
                    content: `📄 **Report Generated Successfully!**\n\nYour professional report has been generated and is ready for download. The report includes:\n\n• Executive Summary\n• Detailed Analysis\n• Risk Assessment\n• Recommendations\n• Technical Specifications\n\n[View Report](${reportUrl})`,
                    agentId: selectedAgent
                };
                
                setChatHistories(prev => ({
                    ...prev,
                    [selectedAgent]: [...(prev[selectedAgent] || []), successMessage]
                }));
            } else {
                throw new Error(result.message || 'Report generation failed');
            }
            
        } catch (error) {
            console.error('Report generation error:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: `❌ **Report Generation Failed**\n\nSorry, I couldn't generate the report. Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support if the issue persists.`,
                agentId: selectedAgent
            };
            
            setChatHistories(prev => ({
                ...prev,
                [selectedAgent]: [...(prev[selectedAgent] || []), errorMessage]
            }));
        } finally {
            setIsGeneratingReport(false);
            setReportModalOpen(false);
            setReportRequest('');
        }
    }, [user, chatHistories, selectedAgent, uploadedFiles, reportRequest]);

    if (isAuthLoading) {
         return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400 mx-auto mb-4"></div>
                    <p className="text-cyan-400">Loading AgenticOne...</p>
                    <p className="text-gray-500 text-sm mt-2">Initializing Google OAuth</p>
                </div>
            </div>
         );
    }

    if (!user) {
        return <LoginScreen />;
    }
    
    const currentAgent = AGENT_ROLES[selectedAgent];
    const currentChatHistory = chatHistories[selectedAgent] || [];
    
    return (
        <div className="flex flex-col h-screen font-sans bg-slate-950 text-gray-100">
            <Header 
                user={user} 
                onSignOut={handleSignOut} 
                tokenCount={tokenCount} 
                totalTokenLimit={TOTAL_TOKEN_LIMIT} 
                onToggleHistory={() => setShowHistory(!showHistory)} 
                showHistory={showHistory}
                conversationCount={allConversations.length}
            />
            
            {/* Agent Console */}
            <div className="border-b border-slate-800 bg-[radial-gradient(900px_320px_at_5%_-10%,rgba(14,165,233,0.2),transparent),radial-gradient(700px_260px_at_95%_0%,rgba(34,197,94,0.18),transparent)]">
                <div className="px-6 py-6">
                    <AgentRoster selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Chat History Sidebar */}
                {showHistory && (
                    <aside className="w-1/4 min-w-[300px] max-w-[400px] bg-gray-800 border-r border-gray-700 flex flex-col h-full overflow-hidden history-sidebar">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-white">Chat History</h2>
                                <p className="text-xs text-gray-400 mt-1">
                                    {allConversations.length} conversation{allConversations.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-gray-400 hover:text-white text-xl p-1 rounded hover:bg-gray-700 transition-colors"
                                title="Close History"
                                aria-label="Close history"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {allConversations.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">💬</div>
                                    <p className="text-gray-400 text-sm">No conversations yet</p>
                                    <p className="text-gray-500 text-xs mt-1">Start chatting to see history</p>
                                </div>
                            ) : (
                                allConversations.map((conv, index) => {
                                    const lastMessage = conv.messages[conv.messages.length - 1];
                                    // Find last user message (reverse search)
                                    let lastUserMessage: Message | undefined;
                                    for (let i = conv.messages.length - 1; i >= 0; i--) {
                                        if (conv.messages[i].role === 'user') {
                                            lastUserMessage = conv.messages[i];
                                            break;
                                        }
                                    }
                                    const preview = lastUserMessage?.content || lastMessage?.content || 'No messages';
                                    const previewText = typeof preview === 'string' ? preview : JSON.stringify(preview);
                                    const truncatedPreview = previewText.length > 60 
                                        ? previewText.substring(0, 60) + '...' 
                                        : previewText;
                                    
                                    const date = new Date(conv.lastUpdated);
                                    const isToday = date.toDateString() === new Date().toDateString();
                                    const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString();
                                    
                                    let timeDisplay: string;
                                    if (isToday) {
                                        timeDisplay = `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                    } else if (isYesterday) {
                                        timeDisplay = `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                    } else {
                                        timeDisplay = date.toLocaleDateString([], { 
                                            month: 'short', 
                                            day: 'numeric',
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        });
                                    }
                                    
                                    const isActive = selectedAgent === conv.agentRole;
                                    
                                    return (
                                        <div
                                            key={`${conv.agentRole}-${index}`}
                                            onClick={() => {
                                                setSelectedAgent(conv.agentRole);
                                                setChatHistories(prev => ({
                                                    ...prev,
                                                    [conv.agentRole]: conv.messages
                                                }));
                                                setShowHistory(false);
                                            }}
                                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                                                isActive 
                                                    ? 'bg-cyan-900 border border-cyan-600' 
                                                    : 'bg-gray-700 hover:bg-gray-600'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                                        isActive 
                                                            ? 'bg-cyan-700 text-cyan-100' 
                                                            : 'bg-gray-600 text-cyan-400'
                                                    }`}>
                                                        {conv.agentName}
                                                    </span>
                                                    {isActive && (
                                                        <span className="text-xs text-cyan-300">Active</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                                                {truncatedPreview}
                                            </p>
                                            
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-400">
                                                    {conv.messageCount} message{conv.messageCount !== 1 ? 's' : ''}
                                                </span>
                                                <span className="text-gray-500">
                                                    {timeDisplay}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        
                        {allConversations.length > 0 && (
                            <div className="p-4 border-t border-gray-700 flex-shrink-0">
                                <button
                                    onClick={() => {
                                        if (user && window.conversationStorage) {
                                            window.conversationStorage.clearUserData(user.email);
                                            setChatHistories({});
                                            setAllConversations([]);
                                            // Reset to welcome messages
                                            const initialHistories: Partial<Record<AgentRole, Message[]>> = {};
                                            (Object.keys(AGENT_ROLES) as AgentRole[]).forEach(key => {
                                                initialHistories[key] = [{
                                                    role: 'assistant',
                                                    content: AGENT_ROLES[key].getWelcomeMessage(user.name || 'there'),
                                                    agentId: key,
                                                }];
                                            });
                                            setChatHistories(initialHistories);
                                        }
                                    }}
                                    className="w-full py-2 px-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors border border-red-800/50"
                                    title="Clear all chat history"
                                >
                                    🗑️ Clear All History
                                </button>
                            </div>
                        )}
                    </aside>
                )}

                <aside className="w-1/4 min-w-[300px] bg-gray-800 p-6 overflow-y-auto border-r border-gray-700 flex flex-col gap-6">
                    <div>
                        <h2 className="text-lg font-bold text-white mb-4">Data Sources</h2>
                        <RagSourceSelector ragSources={ragSources} onSetRagSources={setRagSources} />
                    </div>
                </aside>

                <main className="flex-1 p-6 flex flex-col bg-gray-900 overflow-y-auto">
                    <div className="mb-6 flex-shrink-0">
                        <h1 className="text-3xl font-bold text-gray-200">{currentAgent.name}</h1>
                        <h2 className="text-lg text-cyan-400 mt-1">Welcome, {user.name || user.email}</h2>
                    </div>

                    <div ref={chatContainerRef} role="log" className="flex-1 space-y-6 overflow-y-auto pr-4 -mr-4">
                        {currentChatHistory.map((msg, index) => (
                            <ChatBubble 
                                key={index} 
                                message={msg} 
                                isStreaming={isStreaming && index === currentChatHistory.length - 1 && msg.role === 'assistant'}
                            />
                        ))}
                        {isLoading && <LoadingBubble agent={currentAgent} />}
                    </div>

                    <div className="mt-6 flex-shrink-0">
                        {/* Uploaded Files Display */}
                        {uploadedFiles.length > 0 && (
                            <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-cyan-400">📎 Attached Files:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {uploadedFiles.map((file, index) => (
                                        <div key={index} className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-lg text-sm">
                                            <span className="text-gray-300">{file.file.name}</span>
                                            <button
                                                onClick={() => setUploadedFiles(files => files.filter((_, i) => i !== index))}
                                                className="text-red-400 hover:text-red-300 text-xs"
                                                aria-label={`Remove ${file.file.name}`}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {fileError && <p className="text-red-400 text-sm mt-2">{fileError}</p>}
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="flex items-center bg-gray-800 rounded-lg p-2 focus-within:ring-2 focus-within:ring-cyan-500 transition-shadow">
                            {/* File Upload Button */}
                            <label className="p-2 text-gray-400 hover:text-cyan-400 cursor-pointer transition-colors" title="Attach files">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv"
                                    aria-label="Upload files"
                                />
                                <span className="text-xl">📎</span>
                            </label>
                            
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`Chat with ${currentAgent.name}...`}
                                className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:ring-0"
                                disabled={isLoading}
                                aria-label="Chat input"
                            />
                            
                            {/* Generate Report Button */}
                            <button
                                type="button"
                                onClick={() => setReportModalOpen(true)}
                                className="ml-2 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors"
                                disabled={isLoading || currentChatHistory.length <= 1}
                                title="Generate professional report from conversation"
                                aria-label="Generate report"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </button>
                            
                            <button
                                type="submit"
                                className="ml-2 p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-colors"
                                disabled={isLoading || !input.trim()}
                                aria-label="Send message"
                                aria-busy={isLoading}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </main>
            </div>
            
            {/* Report Generation Modal */}
            {reportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Generate Professional Report</h3>
                            <button
                                onClick={() => setReportModalOpen(false)}
                                className="text-gray-400 hover:text-white text-xl"
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <label htmlFor="reportRequest" className="block text-sm font-medium text-gray-300 mb-2">
                                Report Description (Optional)
                            </label>
                            <textarea
                                id="reportRequest"
                                value={reportRequest}
                                onChange={(e) => setReportRequest(e.target.value)}
                                placeholder={`Describe what you want in the report (e.g., "Focus on corrosion analysis and recommendations")`}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                rows={3}
                            />
                        </div>
                        
                        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                            <h4 className="text-sm font-medium text-cyan-400 mb-2">Report will include:</h4>
                            <ul className="text-sm text-gray-300 space-y-1">
                                <li>• Executive Summary</li>
                                <li>• Conversation Analysis</li>
                                <li>• Key Findings & Recommendations</li>
                                <li>• Risk Assessment</li>
                                <li>• Technical Specifications</li>
                                <li>• Professional Formatting</li>
                            </ul>
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setReportModalOpen(false)}
                                className="flex-1 py-2 px-4 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerateReport}
                                disabled={isGeneratingReport}
                                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                            >
                                {isGeneratingReport ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Generating...
                                    </div>
                                ) : (
                                    'Generate Report'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AgentRoster: React.FC<{ selectedAgent: AgentRole, onSelectAgent: (agentId: AgentRole) => void }> = memo(({ selectedAgent, onSelectAgent }) => (
    <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Agent control deck</p>
                <h2 className="text-2xl font-semibold text-white mt-2">Choose your specialist agent</h2>
                <p className="text-sm text-gray-400 mt-2 max-w-2xl">
                    Each agent is tuned for a distinct discipline. Pick one to anchor the analysis and keep the conversation focused.
                </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-slate-900/70 px-4 py-2 text-xs uppercase tracking-widest text-cyan-200">
                Active agent
                <span className="text-white/90">{AGENT_ROLES[selectedAgent].name}</span>
            </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Object.values(AGENT_ROLES).map(agent => {
                const isActive = selectedAgent === agent.id;
                return (
                    <button
                        key={agent.id}
                        onClick={() => onSelectAgent(agent.id)}
                        aria-pressed={isActive}
                        className={`group relative rounded-2xl border px-5 py-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                            isActive
                                ? 'border-cyan-400/70 bg-slate-900/90 shadow-lg shadow-cyan-500/10'
                                : 'border-slate-700/80 bg-slate-900/70 hover:-translate-y-0.5 hover:border-cyan-400/50 hover:bg-slate-900/90'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <AssistantAvatar avatarUrl={agent.avatar} className="h-11 w-11 border border-slate-700/80 bg-slate-800/60" />
                                <div>
                                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Agent</p>
                                    <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                                </div>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                                isActive ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-800/70 text-gray-300'
                            }`}>
                                {isActive ? 'Active' : 'Select'}
                            </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-400 min-h-[72px]">{agent.description}</p>
                        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                            <span className="uppercase tracking-[0.25em]">Specialist</span>
                            <span className="text-cyan-300/70 group-hover:text-cyan-200">Engage</span>
                        </div>
                    </button>
                );
            })}
        </div>
    </div>
));

const RagSourceSelector: React.FC<{ ragSources: RagSources, onSetRagSources: React.Dispatch<React.SetStateAction<RagSources>> }> = memo(({ ragSources, onSetRagSources }) => (
    <div>
        <h3 className="text-lg font-semibold text-cyan-400 mb-3">2. Configure Data Sources</h3>
        <div className="space-y-2">
            {Object.keys(ragSources).map(sourceKey => (
                 <label key={sourceKey} className="flex items-center p-3 rounded-lg bg-gray-700 cursor-pointer hover:bg-gray-600 transition-colors">
                    <input
                        type="checkbox"
                        checked={ragSources[sourceKey as keyof RagSources]}
                        onChange={() => onSetRagSources(prev => ({ ...prev, [sourceKey]: !prev[sourceKey as keyof RagSources] }))}
                        className="h-5 w-5 rounded bg-gray-800 border-gray-600 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-700"
                    />
                    <span className="ml-3 text-white capitalize">{sourceKey}</span>
                </label>
            ))}
        </div>
    </div>
));

const KnowledgeBaseUploader: React.FC<{ 
    uploadedFiles: UploadedFileState[], 
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onRemoveFile: (index: number) => void,
    fileError: string | null 
}> = memo(({ uploadedFiles, onFileChange, onRemoveFile, fileError }) => {
    const DocumentIcon: React.FC<{ className?: string }> = ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    );
    const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
    );
    
    return (
        <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">3. Specialized Knowledge</h3>
            <p className="text-sm text-gray-400 mb-3">
                Upload documents to create a persistent, vectorized knowledge base.
                (Max {MAX_FILES} files, {MAX_FILE_SIZE_MB}MB each)
            </p>
            <div className="mt-2">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-700 rounded-lg font-medium text-cyan-400 hover:text-cyan-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-cyan-500 hover:bg-gray-600 block border-2 border-dashed border-gray-500 p-6 text-center transition-colors">
                    <span>Upload files</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={onFileChange} />
                </label>
            </div>
            {fileError && <div role="alert" className="mt-2 text-sm text-red-400">{fileError}</div>}
            {uploadedFiles.length > 0 && (
                <div className="mt-4">
                    <h4 className="font-semibold text-gray-300">Uploaded Files:</h4>
                    <ul className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-2">
                        {uploadedFiles.map((f, index) => (
                            <li key={index} className="bg-gray-700 p-2 rounded-md space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center truncate min-w-0">
                                        <DocumentIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                                        <span className="text-sm text-white truncate" title={f.file.name}>{f.file.name}</span>
                                    </div>
                                    <div className="flex items-center flex-shrink-0 pl-2">
                                       {f.status === 'processing' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                                       {f.status === 'ready' && <CheckCircleIcon className="h-5 w-5 text-green-400" />}
                                       <button onClick={() => onRemoveFile(index)} className="text-red-400 hover:text-red-500 p-1 rounded-full ml-2 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label={`Remove ${f.file.name}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                                {f.status === 'uploading' && (
                                     <div className="w-full bg-gray-600 rounded-full h-1.5">
                                        <div className="bg-cyan-500 h-1.5 rounded-full transition-all duration-150" style={{width: `${f.progress}%`}}></div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
});

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
