import { GoogleGenAI, Chat, FunctionDeclaration, Type } from "@google/genai";
import { AIRecommendation, Feel } from "../types";

// Get API key from environment (set by vite.config.ts)
// Vite injects these at build time via define in vite.config.ts
const API_KEY = (process.env.API_KEY || process.env.GEMINI_API_KEY) as string | undefined;

// Debug logging (remove in production)
if (typeof window !== 'undefined') {
  console.log('API_KEY check:', {
    hasAPI_KEY: !!process.env.API_KEY,
    hasGEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    API_KEY_value: process.env.API_KEY ? '***' + process.env.API_KEY.slice(-4) : 'undefined',
    GEMINI_API_KEY_value: process.env.GEMINI_API_KEY ? '***' + process.env.GEMINI_API_KEY.slice(-4) : 'undefined'
  });
}

if (!API_KEY || API_KEY === 'undefined' || API_KEY === 'PLACEHOLDER_API_KEY' || API_KEY === 'null') {
  console.error("Gemini API key is not set. Please check your .env.local file.");
  console.error("Expected GEMINI_API_KEY in .env.local");
  // Don't throw immediately - allow the app to load, but chat will show an error
}

let ai: GoogleGenAI | null = null;
if (API_KEY && API_KEY !== 'undefined' && API_KEY !== 'PLACEHOLDER_API_KEY' && API_KEY !== 'null') {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
    console.log('✅ Gemini AI initialized successfully');
  } catch (error) {
    console.error("Failed to initialize Gemini AI:", error);
  }
} else {
  console.warn('⚠️ Gemini AI not initialized - API key missing or invalid');
}

const recommendArtisansFunctionDeclaration: FunctionDeclaration = {
  name: 'recommendArtisans',
  description: 'Finds and recommends up to five local artisans or service professionals like plumbers, electricians, painters, etc., based on the service needed and the user\'s location.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      service: {
        type: Type.STRING,
        description: 'The type of artisan service required, e.g., "Plumber", "Electrician", "Mover".',
      },
      location: {
        type: Type.STRING,
        description: 'The user\'s location where the service is needed, e.g., "Ikeja, Lagos".',
      },
    },
    required: ['service', 'location'],
  },
};

const scheduleAppointmentFunctionDeclaration: FunctionDeclaration = {
  name: 'scheduleAppointment',
  description: 'Schedules, reschedules, or cancels a property viewing appointment for the user.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      propertyTitle: {
        type: Type.STRING,
        description: 'The title of the property for the appointment, e.g., "Modern 3-Bedroom Duplex".',
      },
      action: {
        type: Type.STRING,
        description: 'The action to perform: "schedule", "reschedule", or "cancel".',
      },
       dateTime: {
        type: Type.STRING,
        description: 'The requested date and time for the appointment in ISO 8601 format, e.g., "2024-08-15T14:00:00". Required for "schedule" and "reschedule".',
      },
    },
    required: ['propertyTitle', 'action'],
  },
};

const processPaymentFunctionDeclaration: FunctionDeclaration = {
  name: 'processPayment',
  description: 'Processes the payment for a booked property after an appointment has been scheduled and the user wants to proceed with payment.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      propertyTitle: {
        type: Type.STRING,
        description: 'The title of the property being paid for, e.g., "Modern 3-Bedroom Duplex".',
      },
      accommodationType: {
        type: Type.STRING,
        description: 'A brief description of the accommodation type, e.g., "Entire Duplex", "Standard Queen Room".',
      },
      amount: {
        type: Type.NUMBER,
        description: 'The total amount to be paid for the booking.',
      },
      currency: {
        type: Type.STRING,
        description: 'The currency of the payment, e.g., "NGN".',
      },
    },
    required: ['propertyTitle', 'accommodationType', 'amount', 'currency'],
  },
};


export const startNewChatSession = (): Chat => {
    if (!ai) {
        throw new Error("Gemini API is not initialized. Please check your API key configuration.");
    }
    // FIX: Replaced backticks (`) with single quotes (') inside the systemInstruction string to prevent parsing errors.
    const chat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are Anna, the ShelTrify AI, the platform's expert assistant. Your role is to help users with all of ShelTrify's services by engaging them in a friendly, professional conversation.

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
    *   **For 'Hotel' bookings:** Ask for location, check-in/check-out dates, number of guests, and budget. IMPORTANT: When recommending hotels, you MUST suggest ONLY genuine, reliable hotel booking websites where users can book directly. Provide actual booking links from reputable platforms like Booking.com, Hotels.com, Agoda, Expedia, or the hotel's official website. NEVER suggest fake or unreliable websites. Format hotel suggestions as clickable links with the hotel name, location, and direct booking URL. Example format: "Here are some reliable hotel booking options for [Location]:\n\n1. **Booking.com** - [Location Hotels](https://www.booking.com/searchresults.html?ss=[Location])\n2. **Hotels.com** - [Location Hotels](https://www.hotels.com/search.do?q-destination=[Location])\n3. **Agoda** - [Location Hotels](https://www.agoda.com/search?city=[Location])\n\nYou can also check the official websites of specific hotels in [Location] for direct bookings."
    *   **For other types:** Ask a relevant clarifying question.
4.  **Gather Core Details (Location & Budget):** After clarifying the accommodation type, gather the remaining key information:
    *   **Location:** The city, area, or neighborhood.
    *   **Budget:** Their approximate budget and preferred rental period (e.g., per year, per month). You MUST acknowledge that the budget is a key factor that determines the options available.
5.  **Recommend After Gathering Info:** Only when you have the accommodation type, specific details (like bedroom count), location, AND budget, should you start recommending properties.
6.  **Show Properties, Don't Just Talk:** This is critical. To recommend properties, you **MUST** embed their details in a special JSON array format: '[PROPERTIES: [{...}, {...}]]'.
    *   **The ONLY Method:** You **MUST** use the '[PROPERTIES]' tag containing a JSON array. Even for a single property, it must be in an array: '[PROPERTIES: [{...}]]'.
    *   **Text Descriptions are Forbidden:** You are **strictly forbidden** from describing property features in regular text. ALWAYS use the '[PROPERTIES]' tag. A short intro like "Based on your needs, here are some options:" is acceptable, but the '[PROPERTIES]' tag must immediately follow.
    *   **Using SITE DATA:** When SITE DATA is available, you MUST use the exact listings from it. Use the exact "id", "title", "price", "location", "bedrooms", "amenities", "imageUrl", and "videoUrl" from the SITE DATA. Do NOT modify these values.
    *   **Correct JSON Array Format:** The JSON **MUST** follow this exact structure: '[PROPERTIES: [{ "id": 123, "title": "A Great House", "imageUrl": "https://images.unsplash.com/...", "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID", "price": "₦2.5M/year", "location": "Lekki, Lagos", "bedrooms": 3, "amenities": ["Close to School", "Hospital Nearby", "Good Roads"], "propertyType": "Duplex" }, { "id": 124, "title": "Another Place", ... }]]'.
        *   "id" MUST be the exact ID from SITE DATA if available, otherwise use a unique number
        *   "imageUrl" should use the value from SITE DATA if available, otherwise use a high-quality, realistic image URL from unsplash.com
        *   "videoUrl" should use the value from SITE DATA if available, otherwise it's optional but highly encouraged. It MUST be a valid YouTube video URL.
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
- Format hotel suggestions with clear, clickable links
- Include the hotel name, location, and direct booking URL
- Always verify that the links you provide are real and functional
- If you're unsure about a hotel website's legitimacy, only suggest well-known booking platforms

**Core Task 2: Assisting with Other Services**
If the user asks about other services, provide a helpful explanation and guide them. **DO NOT** use the '[PROPERTIES]' tag for these services.

*   **Artisan/Local Services (Movers, Plumbers, Carpenters, Tutors, etc.):**
    *   When a user requests a specific artisan like a plumber or painter, you **MUST** use the 'recommendArtisans' function, providing the service type and the location they mentioned.
    *   If the user makes a general inquiry about artisans, explain: "ShelTrify connects you with a network of trusted local professionals through our Marketplace and Community Forum."
    *   Action: Encourage them to explore those sections of the app for reliable help. You can suggest a reply like "Tell me more about the Marketplace".

*   **Platform Features (Provide these brief explanations):**
    *   **ShelTrify Wallet:** "It's a feature to earn, save, and manage rewards called SWC (ShelTrify Wallet Coins). You can earn SWC from referrals or by using our 'Save for Rent' feature. SWC can then be used to pay for services or boost listings."
    *   **Marketplace:** "It's our one-stop shop for home-related goods like furniture and electronics, building materials, and a place to find and hire local artisans like plumbers and electricians."
    *   **Feels & Rental Wahala:** "They are our short-form video feeds. 'Feels' is for real estate inspiration and beautiful property tours, while 'Rental Wahala' is for funny, relatable moments about the challenges of renting."
    *   **Community Forum:** "It's a space where renters, landlords, and agents can connect, share experiences, ask questions, and get trusted advice on everything related to property."
    *   **Logistics (Transport Booking, Trip Planner):** "ShelTrify provides tools and partnerships to help you plan your entire journey, from booking transport to navigating your new area. You can explore these features right from the main menu."

**General Context & Personality:**
*   **Keep the Conversation Going:** Never end a response abruptly without guiding the user. Always end by asking a follow-up question (e.g., "What do you think of these options?", "Is there anything else I can help with?") or providing suggested replies with the '[SUGGESTIONS]' tag to ensure the conversation continues smoothly.
*   **User Favorites & Filters:** Prompts may contain '[USER FAVORITES: ...]' or '[USER FILTERS: ...]'. Use this context to tailor your recommendations.
*   **Post-Payment Flow:** On receiving a system message like '[SYSTEM: Payment for '...' is complete.]', you **MUST** confirm it was successful, then ask for the user's full name, email, WhatsApp/mobile, occupation, and full address for their receipt. After they provide details, confirm you've received them and ask if you can help further.
*   **Personality:** Be friendly, professional, and use the user's name if they provide it. Mention the live AI video assistant, Anna, or Premium benefits when appropriate. For example, you can mention, "Remember, you can save any property you like. Premium users also get instant alerts for updates on their saved homes."
`,
           tools: [{functionDeclarations: [scheduleAppointmentFunctionDeclaration, processPaymentFunctionDeclaration, recommendArtisansFunctionDeclaration]}],
        },
    });
    return chat;
};

export const generatePropertyImage = async (propertyDetails: { title: string; propertyType?: string; amenities?: string[] }) => {
    if (!ai) {
        console.warn("Gemini API not initialized, skipping image generation");
        return null;
    }
    try {
        const prompt = `A professional, photorealistic, bright, and appealing real estate photograph of the exterior of: ${propertyDetails.title}. Property type: ${propertyDetails.propertyType}. Key features: ${propertyDetails.amenities?.join(', ')}. The image should look like a professional real estate listing photo. No people, text, or watermarks.`;

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '4:3',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        return null;
    } catch (error) {
        console.error("Error generating property image:", error);
        return null;
    }
};

export const getMarketInsights = async (query: string) => {
    try {
        const fullPrompt = `You are a real estate market analyst for the Nigerian rental market. Your goal is to provide concise, data-driven insights based on the latest information from the web. Answer the user's query clearly.
        
        User Query: "${query}"

        Provide a direct answer. Do not use conversational filler. Format your answer with markdown for readability (e.g., use bullet points for lists).`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        const text = response.text;
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        // Ensure groundingChunks is an array before returning
        return { text, sources: Array.isArray(groundingChunks) ? groundingChunks : [] };
    } catch (error) {
        console.error("Error getting market insights:", error);
        throw new Error("Failed to fetch market insights from the AI.");
    }
};

export const getAIRecommendationsForFeels = async (likedVideos: Feel[]): Promise<AIRecommendation[]> => {
    try {
        const likedVideoSummary = likedVideos.map(v => `- Title/Caption: "${v.caption}" by ${v.author.handle}`).join('\n');

        const prompt = `You are a creative content curator for a short-form video platform called 'ShelTrify Feels'. The platform is all about real estate, featuring property tours, rental life, funny moments ('Rental Wahala'), and design tips.

Based on this user's liked videos, please recommend 3 new, unique, and engaging video ideas that they would likely enjoy watching and creating.

Here are the videos the user has liked:
${likedVideoSummary || "- The user hasn't liked any videos yet. Recommend some popular and diverse real estate topics to get them started (e.g., a luxury tour, a funny rental moment, a quick design hack)."}

For each recommendation, provide a catchy title and a short, exciting caption suitable for a short-form video platform. The caption should include relevant hashtags. Keep the tone fun, inspiring, and relatable.`;

        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: 'A catchy, short title for the video idea.',
                    },
                    caption: {
                        type: Type.STRING,
                        description: 'An engaging caption for the video, including 1-3 relevant hashtags.',
                    },
                },
                required: ['title', 'caption'],
                propertyOrdering: ["title", "caption"],
            },
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonStr = response.text.trim();
        const recommendations = JSON.parse(jsonStr);
        
        const recommendationsWithImages: AIRecommendation[] = recommendations.map((rec: any, index: number) => ({
            ...rec,
            imageUrl: `https://source.unsplash.com/random/400x300?house,interior&sig=${Date.now() + index}`
        }));

        return recommendationsWithImages;

    } catch (error) {
        console.error("Error getting AI recommendations:", error);
        throw new Error("Failed to fetch AI recommendations from the creative assistant.");
    }
};