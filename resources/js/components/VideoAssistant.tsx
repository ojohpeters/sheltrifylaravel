import React, { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveSession, FunctionDeclaration, Type } from '@google/genai';
import {
    CloseIcon,
    MicIcon,
    MicrophoneSlashIcon,
    VideoCameraIcon,
    VideoCameraSlashIcon,
    PhoneXMarkIcon,
    UserIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    PlayCircleIcon,
    MapIcon,
    WalletIcon,
    StarIcon,
    ShoppingCartIcon,
    LightbulbIcon
} from './icons';
import { generatePropertyImage } from '../services/geminiService';

interface VideoAssistantProps {
    onClose: () => void;
}

// --- Audio Encoding/Decoding Helpers ---
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
// --- End Helpers ---

// --- Function Declarations for Gemini ---
const displayPropertyFunctionDeclaration: FunctionDeclaration = {
  name: 'displayProperty',
  description: 'Displays property visuals to the user. Only the property title is needed; the system will generate a representative image.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'The title or name of the property, e.g., "Modern 3-Bedroom Duplex in Lekki".',
      },
      videoUrl: {
        type: Type.STRING,
        description: 'An optional YouTube video URL for a virtual tour of the property.',
      },
    },
    required: ['title'],
  },
};

const showAmenitiesFunctionDeclaration: FunctionDeclaration = {
  name: 'showAmenities',
  description: 'Displays a list of nearby amenities for a given property.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      propertyTitle: {
        type: Type.STRING,
        description: 'The title of the property for which to show amenities.',
      },
      amenities: {
        type: Type.ARRAY,
        description: 'A list of amenities to display, e.g., ["School Nearby", "24/7 Power", "Shopping Mall"].',
        items: { type: Type.STRING },
      },
    },
    required: ['propertyTitle', 'amenities'],
  },
};

const explainServiceFunctionDeclaration: FunctionDeclaration = {
  name: 'explainService',
  description: 'Provides a brief explanation of a specific ShelTrify service to the user.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      serviceName: {
        type: Type.STRING,
        description: 'The name of the service to explain.',
        enum: ['wallet', 'premium', 'marketplace', 'rental wahala', 'feels', 'investment'],
      },
    },
    required: ['serviceName'],
  },
};


// --- Sub-components ---
const PropertyDisplay: React.FC<{ property: any; onClose: () => void }> = ({ property, onClose }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    };

    const getYouTubeEmbedUrl = (url: string) => {
        if (!url) return null;
        try {
            const videoUrl = new URL(url);
            const videoId = videoUrl.searchParams.get('v') || videoUrl.pathname.split('/').pop();
            return `https://www.youtube.com/embed/${videoId}`;
        } catch (e) {
            return null;
        }
    };
    const embedUrl = getYouTubeEmbedUrl(property.videoUrl);

    return (
        <div className="w-full h-full bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary flex flex-col p-3">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-sm truncate">{property.title}</h4>
                <button onClick={onClose}><CloseIcon className="w-4 h-4" /></button>
            </div>
            <div className="flex-grow relative group">
                {property.images && property.images.length > 0 && (
                     <img src={property.images[currentImageIndex]} alt={property.title} className="w-full h-full object-cover rounded-md" />
                )}
                {property.images && property.images.length > 1 && (
                    <>
                        <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeftIcon /></button>
                        <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRightIcon /></button>
                    </>
                )}
            </div>
            {embedUrl && (
                 <a href={property.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs flex items-center justify-center gap-2 bg-light-card dark:bg-dark-card p-2 rounded-md hover:bg-light-border dark:hover:bg-dark-border">
                    <PlayCircleIcon className="w-5 h-5 text-red-500"/>
                    Watch Video Tour
                </a>
            )}
        </div>
    );
};

const AmenitiesDisplay: React.FC<{ data: { title: string, amenities: string[] }, onClose: () => void }> = ({ data, onClose }) => (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 p-4">
        <div className="w-full max-w-sm bg-light-card dark:bg-dark-card rounded-xl shadow-2xl overflow-hidden border border-light-border dark:border-dark-border p-5 animate-fade-in">
             <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-lg flex items-center gap-2"><MapIcon className="w-5 h-5 text-brand-primary"/> Amenities</h4>
                <button onClick={onClose}><CloseIcon className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">For: <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">{data.title}</span></p>
            <ul className="space-y-2">
                {data.amenities.map((amenity, index) => (
                    <li key={index} className="flex items-center gap-3 bg-light-bg dark:bg-dark-bg p-2 rounded-md">
                        <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
                        <span>{amenity}</span>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

const serviceDescriptions: Record<string, { title: string, description: string, icon: React.ReactNode }> = {
    wallet: { title: "ShelTrify Wallet", description: "Your hub for earnings, savings, and rewards. Earn SWC (ShelTrify Wallet Coins) through referrals and activities, and use them to pay for services or withdraw as cash.", icon: <WalletIcon className="w-6 h-6 text-brand-primary"/> },
    premium: { title: "Premium Subscription", description: "Get ahead with priority access to new listings, personalized recommendations from consultants, and exclusive discounts to find your perfect accommodation faster.", icon: <StarIcon className="w-6 h-6 text-brand-primary"/> },
    marketplace: { title: "Marketplace", description: "A one-stop shop for everything home-related, from furniture and electronics to building materials and connections with local artisans.", icon: <ShoppingCartIcon className="w-6 h-6 text-brand-primary"/> },
    'rental wahala': { title: "Rental Wahala Feeds", description: "A fun, curated feed of short, relatable videos capturing the unique challenges and humorous side of renting in Nigeria.", icon: <LightbulbIcon className="w-6 h-6 text-brand-primary"/> },
    feels: { title: "Feels", description: "A short-form video feed for real estate inspiration, featuring engaging video tours, design ideas, and moments to make your property search more enjoyable.", icon: <PlayCircleIcon className="w-6 h-6 text-brand-primary"/> },
    investment: { title: "Investment Deals", description: "An opportunity for investors and the diaspora to earn competitive ROI by funding property acquisition, renovation, and other high-yield real estate trades managed by the ShelTrify team.", icon: <UserIcon className="w-6 h-6 text-brand-primary"/> },
};

const ServiceExplanationDisplay: React.FC<{ service: string, onClose: () => void }> = ({ service, onClose }) => {
    const details = serviceDescriptions[service] || { title: "Service", description: "Details about this service.", icon: <StarIcon className="w-6 h-6 text-brand-primary"/> };
    return (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 p-4">
            <div className="w-full max-w-sm bg-light-card dark:bg-dark-card rounded-xl shadow-2xl overflow-hidden border border-light-border dark:border-dark-border p-5 animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                     <h4 className="font-bold text-lg flex items-center gap-2">{details.icon} {details.title}</h4>
                    <button onClick={onClose}><CloseIcon className="w-5 h-5" /></button>
                </div>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{details.description}</p>
            </div>
        </div>
    );
};

const FollowUpForm: React.FC<{ transcripts: { speaker: 'user' | 'model'; text: string }[], onClose: () => void }> = ({ transcripts, onClose }) => {
    const conversationSummary = transcripts
        .filter(t => t.text.trim() !== '')
        .map(t => `${t.speaker === 'model' ? 'Anna' : 'You'}: ${t.text}`)
        .join('\n\n');

    const handleFormSubmit = (e: FormEvent) => {
        e.preventDefault();
        alert('Your request has been sent to the ShelTrify team. We will follow up with you shortly!');
        onClose();
    };

    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleFormSubmit} className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border p-8 rounded-lg max-w-lg w-full animate-fade-in">
                <style>{`
                    @keyframes fade-in {
                        from { opacity: 0; transform: scale(0.95); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                `}</style>
                <h3 className="text-xl font-bold">Follow-up Request</h3>
                <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2 mb-4">Please confirm your details. A summary of your conversation will be sent to our team to find the perfect match for you.</p>
                <div className="space-y-4">
                    <input type="text" placeholder="Full Name" required className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" />
                    <input type="email" placeholder="Your Email Address" required className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" />
                    <input type="tel" placeholder="Phone / WhatsApp Number" required className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition" />
                    <div>
                        <label className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Conversation Summary</label>
                        <textarea
                            readOnly
                            value={conversationSummary}
                            rows={6}
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition resize-none"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-light-border dark:bg-dark-border rounded-md hover:bg-opacity-80">Skip</button>
                    <button type="submit" className="px-4 py-2 text-sm font-semibold bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Submit for Follow-up</button>
                </div>
            </form>
        </div>
    );
};


const VideoAssistant: React.FC<VideoAssistantProps> = ({ onClose }) => {
    const [status, setStatus] = useState<'requesting' | 'connecting' | 'connected' | 'error'>('requesting');
    const [error, setError] = useState<string | null>(null);
    const [transcripts, setTranscripts] = useState<{ speaker: 'user' | 'model'; text: string; isFinal: boolean }[]>([]);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [propertyToShow, setPropertyToShow] = useState<any | null>(null);
    const [showFollowUpForm, setShowFollowUpForm] = useState(false);
    const [amenitiesToShow, setAmenitiesToShow] = useState<{title: string, amenities: string[]} | null>(null);
    const [serviceToExplain, setServiceToExplain] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const transcriptContainerRef = useRef<HTMLDivElement>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioRefs = useRef<{
        inputAudioContext: AudioContext | null,
        outputAudioContext: AudioContext | null,
        scriptProcessor: ScriptProcessorNode | null,
        mediaSource: MediaStreamAudioSourceNode | null,
        sources: Set<AudioBufferSourceNode>,
        nextStartTime: number,
    }>({
        inputAudioContext: null,
        outputAudioContext: null,
        scriptProcessor: null,
        mediaSource: null,
        sources: new Set(),
        nextStartTime: 0,
    }).current;
    
    const cleanup = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioRefs.scriptProcessor) {
            audioRefs.scriptProcessor.disconnect();
            audioRefs.scriptProcessor = null;
        }
        if (audioRefs.mediaSource) {
            audioRefs.mediaSource.disconnect();
            audioRefs.mediaSource = null;
        }
        if (audioRefs.inputAudioContext && audioRefs.inputAudioContext.state !== 'closed') {
            audioRefs.inputAudioContext.close();
        }
        if (audioRefs.outputAudioContext && audioRefs.outputAudioContext.state !== 'closed') {
            audioRefs.outputAudioContext.close();
        }
        if(sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
    }, [audioRefs]);

    const initialize = useCallback(async () => {
        setStatus('requesting');
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setStatus('connecting');

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            audioRefs.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioRefs.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('connected');
                        const source = audioRefs.inputAudioContext!.createMediaStreamSource(stream);
                        audioRefs.mediaSource = source;
                        const scriptProcessor = audioRefs.inputAudioContext!.createScriptProcessor(4096, 1, 1);
                        audioRefs.scriptProcessor = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioRefs.inputAudioContext!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            setTranscripts(prev => {
                                const last = prev[prev.length - 1];
                                if (last && last.speaker === 'user' && !last.isFinal) {
                                    last.text += text;
                                    return [...prev];
                                }
                                return [...prev, { speaker: 'user', text, isFinal: false }];
                            });
                        }
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            setTranscripts(prev => {
                                const last = prev[prev.length - 1];
                                if (last && last.speaker === 'model' && !last.isFinal) {
                                    last.text += text;
                                    return [...prev];
                                }
                                return [...prev, { speaker: 'model', text, isFinal: false }];
                            });
                        }
                        if (message.serverContent?.turnComplete) {
                            setTranscripts(prev => prev.map(t => ({ ...t, isFinal: true })));
                        }

                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'displayProperty') {
                                    const propertyDetails = fc.args;
                                    const generatedImageUrl = await generatePropertyImage({ title: propertyDetails.title });
                                    const propertyWithGeneratedImage = { ...propertyDetails, images: generatedImageUrl ? [generatedImageUrl] : ['https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=2070'] };
                                    setPropertyToShow(propertyWithGeneratedImage);
                                    sessionPromiseRef.current?.then((session) => {
                                        session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: "OK, I have generated and displayed an image of the property to the user." } } });
                                    });
                                }
                                if (fc.name === 'showAmenities') {
                                    setAmenitiesToShow({ title: fc.args.propertyTitle, amenities: fc.args.amenities });
                                    sessionPromiseRef.current?.then((session) => {
                                        session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: "OK, I have displayed the amenities for the user." } } });
                                    });
                                }
                                if (fc.name === 'explainService') {
                                    setServiceToExplain(fc.args.serviceName);
                                    sessionPromiseRef.current?.then((session) => {
                                        session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: "OK, I have displayed an explanation of the service to the user." } } });
                                    });
                                }
                            }
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && audioRefs.outputAudioContext) {
                            audioRefs.nextStartTime = Math.max(audioRefs.nextStartTime, audioRefs.outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), audioRefs.outputAudioContext, 24000, 1);
                            const source = audioRefs.outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(audioRefs.outputAudioContext.destination);
                            source.addEventListener('ended', () => audioRefs.sources.delete(source));
                            source.start(audioRefs.nextStartTime);
                            audioRefs.nextStartTime += audioBuffer.duration;
                            audioRefs.sources.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                       console.error(e);
                       setError('Connection lost. You can try reconnecting or end the call to send a follow-up request.');
                       setStatus('error');
                    },
                    onclose: () => {
                       cleanup();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: `You are Anna, ShelTrify's expert AI video assistant. Your primary role is to engage users in a friendly and professional real-time video and voice conversation to help them with their real estate and related needs. You are fully multilingual and should respond to the user in their preferred language.

**Your Core Task:**
1.  **Greet the user warmly.** If they share their name, use it to make the conversation more personal.
2.  **Understand their needs** by asking clarifying questions based on ShelTrify's wide range of services.
3.  **Provide helpful information** and guide them through their options.
4.  When a user expresses interest in seeing a property, **you must use the \`displayProperty\` tool** to show them visuals. Say something like, "I can show you an example of that right now," then call the function with a creative title. The system will generate an image.
5.  When discussing a property, you can use the **\`showAmenities\` function** to visually display its nearby facilities.
6.  If a property has a video tour available, you should proactively offer to show it.
7.  If a user asks about a ShelTrify feature, **you MUST use the \`explainService\` function** to provide a clear explanation of services like ShelTrify Wallet, Premium Subscription, Marketplace, Rental Wahala, Feels, and Investment Deals.

**ShelTrify Service Categories (Your Knowledge Base):**
You MUST keep the conversation focused on these services.
- **Residential & Commercial Properties:** Houses, hotels, offices, business premises, short lets, student hostels.
- **Booking & Logistics:** Transport booking, event venues, trip planning.
- **Financial Services:** Rent-to-own plans, rent loans, investment deals.
- **Platform Features:** The ShelTrify Wallet, Marketplace, Feels & Rental Wahala feeds, Premium subscription.

Maintain a stable, helpful, and focused conversation. Be conversational and natural, like a real human assistant on a video call.`,
                    tools: [{ functionDeclarations: [displayPropertyFunctionDeclaration, showAmenitiesFunctionDeclaration, explainServiceFunctionDeclaration] }],
                },
            });

        } catch (err) {
            console.error(err);
            setError('Could not access camera/microphone. Please check browser permissions and try reconnecting.');
            setStatus('error');
        }
    }, [cleanup, audioRefs]);

    useEffect(() => {
        initialize();
        return () => cleanup();
    }, [initialize, cleanup]);
    
    useEffect(() => {
        transcriptContainerRef.current?.scrollTo(0, transcriptContainerRef.current.scrollHeight);
    }, [transcripts]);

    const handleToggleCamera = () => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            videoTrack.enabled = !isCameraOn;
            setIsCameraOn(!isCameraOn);
        }
    };

    const handleToggleMic = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            audioTrack.enabled = !isMicOn;
            setIsMicOn(!isMicOn);
        }
    };

    const handleEndCall = () => {
        cleanup();
        setShowFollowUpForm(true);
    };

    const handleReconnect = () => {
        cleanup();
        initialize();
    };

    const renderStatus = () => {
        switch (status) {
            case 'requesting': return 'Requesting permissions...';
            case 'connecting': return 'Connecting to Anna...';
            case 'error': return error;
            case 'connected': return "You're connected with Anna";
            default: return '';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary">
            {showFollowUpForm && <FollowUpForm transcripts={transcripts} onClose={onClose} />}

            <div className={`relative w-full h-full flex flex-col p-4 md:p-8 ${showFollowUpForm ? 'invisible' : ''}`}>
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">Live Assistant: Anna</h2>
                        <p className={`text-sm min-h-[20px] ${status === 'error' ? 'text-red-400 font-semibold' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>{renderStatus()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-light-card dark:hover:bg-dark-card transition-colors">
                        <CloseIcon />
                    </button>
                </header>

                <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                    <div className="lg:col-span-2 relative w-full h-full bg-light-card dark:bg-dark-card rounded-lg overflow-hidden border border-light-border dark:border-dark-border">
                        <video
                            src="https://storage.googleapis.com/aai-web-template-assets/sheltrify/anna-talking-loop-v2.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
                         <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-2 py-1 rounded-md pointer-events-none">Anna</div>

                        <div className="absolute bottom-4 right-4 w-40 h-32 md:w-60 md:h-44 bg-light-bg dark:bg-dark-bg rounded-lg overflow-hidden border-2 border-light-border dark:border-dark-border shadow-2xl z-10">
                            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100"></video>
                            {!isCameraOn && (
                                <div className="absolute inset-0 bg-light-bg dark:bg-dark-bg flex items-center justify-center">
                                    <VideoCameraSlashIcon className="w-8 h-8 text-light-text-secondary dark:text-dark-text-secondary" />
                                </div>
                            )}
                            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-md">You</div>
                        </div>

                        {propertyToShow && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 p-4">
                                <div className="w-full max-w-lg h-auto max-h-[90%] bg-light-card dark:bg-dark-card rounded-xl shadow-2xl overflow-hidden border border-light-border dark:border-dark-border">
                                    <PropertyDisplay property={propertyToShow} onClose={() => setPropertyToShow(null)} />
                                </div>
                            </div>
                        )}
                        {amenitiesToShow && <AmenitiesDisplay data={amenitiesToShow} onClose={() => setAmenitiesToShow(null)} />}
                        {serviceToExplain && <ServiceExplanationDisplay service={serviceToExplain} onClose={() => setServiceToExplain(null)} />}
                    </div>

                    <div className="bg-light-card dark:bg-dark-card rounded-lg flex flex-col p-4 border border-light-border dark:border-dark-border">
                        <h3 className="text-lg font-bold mb-3 flex-shrink-0">Live Transcript</h3>
                        <div ref={transcriptContainerRef} className="flex-grow overflow-y-auto space-y-4 pr-2">
                             {transcripts.map((t, i) => (
                                <div key={i} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`px-4 py-2 rounded-lg max-w-sm ${t.speaker === 'user' ? 'bg-brand-primary text-white' : 'bg-light-bg dark:bg-dark-bg'} ${!t.isFinal ? 'opacity-70' : ''}`}>
                                       <span className="font-bold capitalize">{t.speaker === 'model' ? 'Anna' : 'You'}: </span> {t.text}
                                    </div>
                                </div>
                            ))}
                            {transcripts.length === 0 && status === 'connected' && (
                                <div className="text-center text-light-text-secondary dark:text-dark-text-secondary h-full flex items-center justify-center">
                                    <p>Anna is listening. How can I help you today?</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
                
                <footer className="mt-6 flex justify-center items-center gap-4 flex-shrink-0">
                    {status === 'error' ? (
                        <>
                            <button 
                                onClick={handleReconnect}
                                className="px-6 py-3 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                aria-label="Reconnect call"
                            >
                                Reconnect
                            </button>
                            <button onClick={handleEndCall} className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors text-white" aria-label="End call and send follow-up">
                                <PhoneXMarkIcon />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleToggleMic} disabled={status !== 'connected'} className="p-4 rounded-full bg-light-card dark:bg-dark-card hover:bg-light-border dark:hover:bg-dark-border transition-colors disabled:opacity-50" aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}>
                                {isMicOn ? <MicIcon /> : <MicrophoneSlashIcon />}
                            </button>
                            <button onClick={handleToggleCamera} disabled={status !== 'connected'} className="p-4 rounded-full bg-light-card dark:bg-dark-card hover:bg-light-border dark:hover:bg-dark-border transition-colors disabled:opacity-50" aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}>
                                {isCameraOn ? <VideoCameraIcon /> : <VideoCameraSlashIcon />}
                            </button>
                            <button onClick={handleEndCall} className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors text-white" aria-label="End call">
                               <PhoneXMarkIcon />
                            </button>
                        </>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default VideoAssistant;