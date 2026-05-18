/**
 * geminiService.ts
 *
 * All Gemini API calls are routed through /api/ai/* (Laravel backend proxy).
 * The GEMINI_API_KEY lives only in the server .env and is never baked into
 * the browser bundle.
 */
import { AIRecommendation, Feel } from "../types";

// ── Internal fetch helper ─────────────────────────────────────────────────────

function getCsrfToken(): string {
    if (typeof document === 'undefined') return '';
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

async function proxyFetch(endpoint: string, payload: object): Promise<any> {
    const response = await fetch(`/api/ai/gemini/${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.error?.message || `AI request failed (${response.status})`);
    }
    return response.json();
}

// ── Function declarations (plain objects — no @google/genai types needed) ─────

const recommendArtisansFn = {
    name: 'recommendArtisans',
    description: 'Finds and recommends up to five local artisans or service professionals like plumbers, electricians, painters, etc., based on the service needed and the user\'s location.',
    parameters: {
        type: 'OBJECT',
        properties: {
            service: { type: 'STRING', description: 'The type of artisan service required, e.g., "Plumber", "Electrician".' },
            location: { type: 'STRING', description: 'The user\'s location where the service is needed, e.g., "Ikeja, Lagos".' },
        },
        required: ['service', 'location'],
    },
};

const scheduleAppointmentFn = {
    name: 'scheduleAppointment',
    description: 'Schedules, reschedules, or cancels a property viewing appointment for the user.',
    parameters: {
        type: 'OBJECT',
        properties: {
            propertyTitle: { type: 'STRING', description: 'The title of the property for the appointment.' },
            action: { type: 'STRING', description: 'The action to perform: "schedule", "reschedule", or "cancel".' },
            dateTime: { type: 'STRING', description: 'Requested date and time in ISO 8601 format. Required for schedule/reschedule.' },
        },
        required: ['propertyTitle', 'action'],
    },
};

const processPaymentFn = {
    name: 'processPayment',
    description: 'Processes the payment for a booked property.',
    parameters: {
        type: 'OBJECT',
        properties: {
            propertyTitle: { type: 'STRING', description: 'The title of the property being paid for.' },
            accommodationType: { type: 'STRING', description: 'A brief description of the accommodation type.' },
            amount: { type: 'NUMBER', description: 'The total amount to be paid.' },
            currency: { type: 'STRING', description: 'The currency of the payment, e.g., "NGN".' },
        },
        required: ['propertyTitle', 'accommodationType', 'amount', 'currency'],
    },
};

// ── System instruction (not a secret — just instructions) ────────────────────

const SYSTEM_INSTRUCTION = `You are Anna, the ShelTrify AI, the platform's expert assistant. Your role is to help users with all of ShelTrify's services by engaging them in a friendly, professional conversation.

**CRITICAL: Using Site Data**
When you receive '[SITE DATA: ...]' in the context, it contains ACTUAL listings from the ShelTrify platform. You MUST:
- Use ONLY the listings provided in the SITE DATA when answering questions about properties
- NEVER make up or invent properties that are not in the SITE DATA
- When a user asks about properties in a location, search through the SITE DATA listings and recommend only matching ones
- If no matching properties exist in SITE DATA, honestly say "I don't have any properties matching that criteria in our database right now, but let me help you find something similar" and suggest alternatives
- Use the exact data from SITE DATA (title, price, location, bedrooms, amenities, etc.) - do not modify or guess these values
- When showing properties from SITE DATA, use the exact "id" from the listing, not a random number

**Core Task 1: Finding Accommodation**
When a user wants to find a property, you must follow this structured conversational flow:

**Interaction Rules for Accommodation:**
1.  **Greet and Get Name:** Start by greeting the user warmly, introducing yourself, and asking for their name to personalize the conversation.
2.  **Ask for Accommodation Type:** After they provide their name, your immediate next step is to ask what type of accommodation they are looking for. The app has a visual selector with options like 'Residential House', 'Hotel', 'Office Space', etc. You can say something like, "Nice to meet you, [User's Name]! What type of accommodation are you looking for today? You can select an option above or just tell me."
3.  **Clarify the Type:** Once the user specifies a type, ask for more details. This is crucial.
    *   **For a 'Residential House':** Ask about the number of bedrooms (e.g., "Are you looking for a self-contain, a 1, 2, 3, or 4-bedroom place?") or if they have a specific type in mind like a bungalow or duplex.
    *   **For 'Hotel' bookings:** Ask for location, check-in/check-out dates, number of guests, and budget. IMPORTANT: When recommending hotels, you MUST suggest ONLY genuine, reliable hotel booking websites where users can book directly. Provide actual booking links from reputable platforms like Booking.com, Hotels.com, Agoda, Expedia, or the hotel's official website. NEVER suggest fake or unreliable websites.
    *   **For other types:** Ask a relevant clarifying question.
4.  **Gather Core Details (Location & Budget):** After clarifying the accommodation type, gather the remaining key information:
    *   **Location:** The city, area, or neighborhood.
    *   **Budget:** Their approximate budget and preferred rental period (e.g., per year, per month). You MUST acknowledge that the budget is a key factor that determines the options available.
5.  **Recommend After Gathering Info:** Only when you have the accommodation type, specific details (like bedroom count), location, AND budget, should you start recommending properties.
6.  **Show Properties, Don't Just Talk:** This is critical. To recommend properties, you **MUST** embed their details in a special JSON array format: '[PROPERTIES: [{...}, {...}]]'.
    *   **The ONLY Method:** You **MUST** use the '[PROPERTIES]' tag containing a JSON array. Even for a single property, it must be in an array: '[PROPERTIES: [{...}]]'.
    *   **Text Descriptions are Forbidden:** You are **strictly forbidden** from describing property features in regular text. ALWAYS use the '[PROPERTIES]' tag. A short intro like "Based on your needs, here are some options:" is acceptable, but the '[PROPERTIES]' tag must immediately follow.
    *   **Using SITE DATA:** When SITE DATA is available, you MUST use the exact listings from it. Use the exact "id", "title", "price", "location", "bedrooms", "amenities", "imageUrl", and "videoUrl" from the SITE DATA. Do NOT modify these values.
    *   **Correct JSON Array Format:** The JSON **MUST** follow this exact structure: '[PROPERTIES: [{ "id": 123, "title": "A Great House", "imageUrl": "https://images.unsplash.com/...", "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID", "price": "2.5M/year", "location": "Lekki, Lagos", "bedrooms": 3, "amenities": ["Close to School", "Hospital Nearby", "Good Roads"], "propertyType": "Duplex" }, { "id": 124, "title": "Another Place", ... }]]'.
        *   "id" MUST be the exact ID from SITE DATA if available, otherwise use a unique number
        *   "imageUrl" should use the value from SITE DATA if available, otherwise use a high-quality, realistic image URL from unsplash.com
        *   "videoUrl" should use the value from SITE DATA if available, otherwise it is optional but highly encouraged. It MUST be a valid YouTube video URL.
        *   "price" **MUST** use the exact price from SITE DATA and include a rental period (e.g., "/year", "/month").
        *   "amenities" array should use the exact amenities from SITE DATA if available
7.  **Suggested Replies:** After showing properties or asking a clarifying question, you **MUST** provide suggested replies in a special tag: '[SUGGESTIONS: ["Option 1", "Option 2"]]'.
8.  **Function Calling for Actions:**
    *   **Appointments:** When a user wants to schedule, reschedule, or cancel a viewing, you **MUST** use the 'scheduleAppointment' function. After the system confirms a "schedule" or "reschedule" action is complete, you **MUST** then politely ask for the user's full name, email, mobile/WhatsApp number, and current address to finalize the tour details.
    *   **Payments:** When a user is ready to pay, you **MUST** use the 'processPayment' function.

**CRITICAL: Hotel Booking Recommendations**
When a user asks about hotels or hotel bookings:
- **ALWAYS** suggest ONLY genuine, reliable hotel booking platforms with direct booking links
- **NEVER** suggest fake, unreliable, or suspicious websites
- **ONLY** recommend reputable platforms such as:
  * Booking.com (https://www.booking.com)
  * Hotels.com (https://www.hotels.com)
  * Agoda (https://www.agoda.com)
  * Expedia (https://www.expedia.com)
  * Trivago (https://www.trivago.com)
  * Official hotel websites (verify they are legitimate)

**Core Task 2: Assisting with Other Services**
If the user asks about other services, provide a helpful explanation and guide them. **DO NOT** use the '[PROPERTIES]' tag for these services.

*   **Artisan/Local Services (Movers, Plumbers, Carpenters, Tutors, etc.):**
    *   When a user requests a specific artisan like a plumber or painter, you **MUST** use the 'recommendArtisans' function, providing the service type and the location they mentioned.
    *   If the user makes a general inquiry about artisans, explain: "ShelTrify connects you with a network of trusted local professionals through our Marketplace and Community Forum."

*   **Platform Features (Provide these brief explanations):**
    *   **ShelTrify Wallet:** "It's a feature to earn, save, and manage rewards called SWC (ShelTrify Wallet Coins). You can earn SWC from referrals or by using our 'Save for Rent' feature. SWC can then be used to pay for services or boost listings."
    *   **Marketplace:** "It's our one-stop shop for home-related goods like furniture and electronics, building materials, and a place to find and hire local artisans like plumbers and electricians."
    *   **Feels & Rental Wahala:** "They are our short-form video feeds. 'Feels' is for real estate inspiration and beautiful property tours, while 'Rental Wahala' is for funny, relatable moments about the challenges of renting."
    *   **Community Forum:** "It's a space where renters, landlords, and agents can connect, share experiences, ask questions, and get trusted advice on everything related to property."
    *   **Logistics (Transport Booking, Trip Planner):** "ShelTrify provides tools and partnerships to help you plan your entire journey, from booking transport to navigating your new area. You can explore these features right from the main menu."

**General Context & Personality:**
*   **Keep the Conversation Going:** Never end a response abruptly without guiding the user. Always end by asking a follow-up question or providing suggested replies with the '[SUGGESTIONS]' tag.
*   **User Favorites & Filters:** Prompts may contain '[USER FAVORITES: ...]' or '[USER FILTERS: ...]'. Use this context to tailor your recommendations.
*   **Post-Payment Flow:** On receiving a system message like '[SYSTEM: Payment for '...' is complete.]', you **MUST** confirm it was successful, then ask for the user's full name, email, WhatsApp/mobile, occupation, and full address for their receipt.
*   **Personality:** Be friendly, professional, and use the user's name if they provide it. Mention the live AI video assistant, Anna, or Premium benefits when appropriate.`;

// ── ProxyChat — mimics the @google/genai Chat interface ──────────────────────

type ChatPart = { text?: string; functionCall?: any };
type ChatContent = { role: string; parts: ChatPart[] };
type ChatChunk = { text: string; functionCalls?: any[] };

export class ProxyChat {
    private history: ChatContent[] = [];

    async sendMessageStream({ message, conversationId }: { message: string; conversationId?: number }): Promise<AsyncIterableIterator<ChatChunk>> {
        this.history.push({ role: 'user', parts: [{ text: message }] });

        const data = await proxyFetch('chat', {
            message,
            ...(conversationId ? { conversation_id: conversationId } : {}),
        });

        const resultData = data?.data ?? {};
        const responseText = resultData?.message ?? '';
        const entity = resultData?.entity ?? null;
        const responseData = resultData?.data ?? null;
        const intent = resultData?.intent ?? null;
        const returnedConversationId = resultData?.conversation_id ?? null;

        // Append model turn to history
        this.history.push({
            role: 'model',
            parts: [{ text: responseText }],
        });

        const chunk: ChatChunk = {
            text: responseText,
            functionCalls: entity ? [{ name: entity, parameters: responseData }] : undefined,
        };

        async function* gen(): AsyncIterableIterator<ChatChunk & { conversationId?: number; intent?: string }> {
            yield { ...chunk, conversationId: returnedConversationId ?? undefined, intent };
        }
        return gen();
    }
}

// ── Exported functions ────────────────────────────────────────────────────────

export const startNewChatSession = (): ProxyChat => new ProxyChat();

/** Property image generation — disabled (Imagen requires allowlisted project) */
export const generatePropertyImage = async (_propertyDetails: { title: string; propertyType?: string; amenities?: string[] }): Promise<string | null> => null;

export const getMarketInsights = async (query: string): Promise<{ text: string; sources: any[] }> => {
    const data = await proxyFetch('insights', { query });
    const candidate = data?.candidates?.[0];
    const text: string = candidate?.content?.parts?.map((p: any) => p.text || '').join('') || '';
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
    return { text, sources: Array.isArray(groundingChunks) ? groundingChunks : [] };
};

export const getAIRecommendationsForFeels = async (likedVideos: Feel[]): Promise<AIRecommendation[]> => {
    const likedVideoSummary = likedVideos.length > 0
        ? likedVideos.map(v => `- "${v.caption}" by ${v.author.handle}`).join('\n')
        : "- The user hasn't liked any videos yet. Recommend popular and diverse real estate topics.";

    const prompt = `You are a creative content curator for a short-form video platform called 'ShelTrify Feels'. The platform is all about real estate, featuring property tours, rental life, funny moments ('Rental Wahala'), and design tips.

Based on this user's liked videos, please recommend 3 new, unique, and engaging video ideas that they would likely enjoy.

Here are the videos the user has liked:
${likedVideoSummary}

For each recommendation, provide a catchy title and a short, exciting caption suitable for a short-form video platform. Include 1-3 relevant hashtags in the caption. Keep the tone fun, inspiring, and relatable.`;

    const schema = {
        type: 'ARRAY',
        items: {
            type: 'OBJECT',
            properties: {
                title:   { type: 'STRING', description: 'A catchy, short title for the video idea.' },
                caption: { type: 'STRING', description: 'An engaging caption including 1-3 hashtags.' },
            },
            required: ['title', 'caption'],
        },
    };

    const data = await proxyFetch('recommendations', { prompt, schema });
    const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    let recommendations: any[] = [];
    try { recommendations = JSON.parse(rawText.trim()); } catch { recommendations = []; }

    return recommendations.map((rec: any, i: number) => ({
        ...rec,
        imageUrl: `https://source.unsplash.com/random/400x300?house,interior&sig=${Date.now() + i}`,
    }));
};
