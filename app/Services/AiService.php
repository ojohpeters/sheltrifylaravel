<?php

namespace App\Services;

use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Models\Artisan;
use App\Models\CommunityPost;
use App\Models\FeelsVideo;
use App\Models\GlobalTale;
use App\Models\InvestmentOpportunity;
use App\Models\Listing;
use App\Models\MarketplaceProduct;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    private string $apiKey;
    private string $model = 'gemini-2.0-flash';
    private string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key', '');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public entry point
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Process a user message: interpret intent, query DB, generate response.
     * Returns the assistant reply + structured data for the frontend.
     */
    public function chat(string $userMessage, User $user, AiConversation $conversation): array
    {
        // Build conversation history (last 6 messages for context)
        $history = $conversation->messages()
            ->orderBy('created_at')
            ->get(['role', 'content'])
            ->map(fn ($m) => ['role' => $m->role, 'content' => $m->content])
            ->toArray();

        // Step 1: Parse intent
        $intent = $this->interpretIntent($userMessage, $history, $user);

        // Step 2: Execute DB query
        $results = $this->executeIntent($intent, $user);

        // Step 3: Generate natural language reply
        $reply = $this->generateResponse($userMessage, $intent, $results, $user);

        // Step 4: Persist both messages
        $conversation->messages()->createMany([
            [
                'role'            => 'user',
                'content'         => $userMessage,
                'intent'          => $intent,
                'result_metadata' => null,
            ],
            [
                'role'            => 'assistant',
                'content'         => $reply,
                'intent'          => null,
                'result_metadata' => [
                    'entity' => $results['entity'] ?? null,
                    'count'  => is_array($results['data'] ?? null) ? count($results['data']) : null,
                ],
            ],
        ]);

        $conversation->update([
            'last_message_at' => now(),
            'title'           => $conversation->title ?? mb_substr($userMessage, 0, 60),
        ]);

        return [
            'message'  => $reply,
            'intent'   => $intent,
            'entity'   => $results['entity'] ?? null,
            'data'     => $results['data'] ?? null,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 1 — Intent parsing via Gemini
    // ─────────────────────────────────────────────────────────────────────────

    private function interpretIntent(string $message, array $history, User $user): array
    {
        $userName  = $user->full_name ?? 'User';
        $userRole  = $user->role;
        $recentCtx = '';
        foreach (array_slice($history, -4) as $h) {
            $recentCtx .= "\n{$h['role']}: {$h['content']}";
        }

        $prompt = <<<PROMPT
You are an AI intent-parser for Sheltrify — a Nigerian real estate, marketplace, investment, and community platform.

User info:
- Name: {$userName}
- Role: {$userRole}

Recent conversation:{$recentCtx}

User message: "{$message}"

Parse the intent and respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "action": "search|list|get|stats|recommend|compare|book|none",
  "entity": "listings|products|investments|opportunities|posts|feels|tales|wallet|appointments|artisans|notifications|dashboard|platform|user",
  "filters": {
    "location": null,
    "state": null,
    "city": null,
    "min_price": null,
    "max_price": null,
    "bedrooms": null,
    "bathrooms": null,
    "property_type": null,
    "listing_type": null,
    "furnished": null,
    "parking": null,
    "category": null,
    "risk_level": null,
    "sector": null,
    "min_roi": null,
    "search_query": null,
    "status": null,
    "featured": null,
    "tags": null,
    "brand": null,
    "service_type": null
  },
  "sort": "newest|popular|price_asc|price_desc|roi_desc|rating",
  "limit": 10,
  "is_personal": false,
  "plain_answer": false,
  "context_summary": "one-line summary of what the user wants"
}

Rules:
- is_personal=true when the user asks about THEIR OWN data (my listings, my wallet, my orders, my investments)
- plain_answer=true when no DB query is needed (greetings, platform explanations, how-to questions)
- min_price/max_price should be integers in Naira (e.g. "500k" → 500000, "2M" → 2000000)
- Extract bedrooms as integer from phrases like "3-bedroom", "two bed"
- Map property types: flat/apartment → apartment, house → house, duplex → duplex, studio → studio, land → land
- Map listing types: "for rent" → rent, "for sale" → sale, "shortlet" → shortlet
PROMPT;

        $raw = $this->callGemini($prompt, true);
        if ($raw === null) {
            throw new \RuntimeException('AI service is temporarily unavailable. Please try again later.');
        }
        $intent = $this->extractJson($raw);

        return $intent ?? [
            'action'          => 'none',
            'entity'          => 'listings',
            'filters'         => [],
            'sort'            => 'newest',
            'limit'           => 10,
            'is_personal'     => false,
            'plain_answer'    => true,
            'context_summary' => $message,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 2 — DB query execution
    // ─────────────────────────────────────────────────────────────────────────

    private function executeIntent(array $intent, User $user): array
    {
        if ($intent['plain_answer'] ?? false) {
            return ['entity' => null, 'data' => null];
        }

        $entity     = $intent['entity'] ?? 'listings';
        $filters    = $intent['filters'] ?? [];
        $sort       = $intent['sort'] ?? 'newest';
        $limit      = min((int) ($intent['limit'] ?? 10), 50);
        $isPersonal = (bool) ($intent['is_personal'] ?? false);
        $owner      = $isPersonal ? $user : null;

        return match ($entity) {
            'listings'      => $this->queryListings($filters, $sort, $limit, $owner),
            'products'      => $this->queryProducts($filters, $sort, $limit, $owner),
            'investments',
            'opportunities' => $this->queryInvestments($filters, $sort, $limit, $owner),
            'posts'         => $this->queryPosts($filters, $sort, $limit, $owner),
            'feels'         => $this->queryFeels($filters, $sort, $limit),
            'tales'         => $this->queryTales($filters, $sort, $limit),
            'artisans'      => $this->queryArtisans($filters, $sort, $limit),
            'wallet'        => $this->getUserWallet($user),
            'appointments'  => $this->getUserAppointments($user),
            'notifications' => $this->getUserNotifications($user),
            'dashboard'     => $this->getUserDashboard($user),
            'platform'      => $this->getPlatformStats(),
            default         => ['entity' => null, 'data' => null],
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Query helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function queryListings(array $f, string $sort, int $limit, ?User $owner): array
    {
        $q = Listing::query()->where('is_active', true);

        if ($owner) {
            $q->where('user_id', $owner->id);
        }
        if (!empty($f['search_query'])) {
            $s = '%' . $f['search_query'] . '%';
            $q->where(fn ($w) => $w->where('title', 'like', $s)
                ->orWhere('description', 'like', $s)
                ->orWhere('location', 'like', $s));
        }
        if (!empty($f['location']))  $q->where('location', 'like', '%' . $f['location'] . '%');
        if (!empty($f['state']))     $q->where('state', 'like', '%' . $f['state'] . '%');
        if (!empty($f['city']))      $q->where('city', 'like', '%' . $f['city'] . '%');
        if (!empty($f['bedrooms']))  $q->where('bedrooms', '>=', (int) $f['bedrooms']);
        if (!empty($f['bathrooms'])) $q->where('bathrooms', '>=', (int) $f['bathrooms']);
        if (!empty($f['property_type'])) $q->where('property_type', $f['property_type']);
        if (!empty($f['listing_type']))  $q->where('listing_type', $f['listing_type']);
        if (isset($f['furnished']) && $f['furnished'] !== null) $q->where('furnished', (bool) $f['furnished']);
        if (isset($f['parking'])   && $f['parking']   !== null) $q->where('parking', (bool) $f['parking']);
        if (!empty($f['status'])) $q->where('status', $f['status']);

        $this->applyPriceFilter($q, $f);
        $this->applySort($q, $sort);

        $items = $q->with(['user:id,full_name,phone,is_verified'])
            ->withCount(['favorites', 'appointments'])
            ->limit($limit)
            ->get()
            ->map(fn ($l) => $this->formatListing($l));

        return ['entity' => 'listings', 'data' => $items->toArray()];
    }

    private function queryProducts(array $f, string $sort, int $limit, ?User $owner): array
    {
        $q = MarketplaceProduct::query()->where('is_approved', true)->where('is_active', true);

        if ($owner) {
            $q->where('user_id', $owner->id)->withoutGlobalScopes();
        }
        if (!empty($f['search_query'])) {
            $s = '%' . $f['search_query'] . '%';
            $q->where(fn ($w) => $w->where('name', 'like', $s)->orWhere('description', 'like', $s));
        }
        if (!empty($f['category'])) $q->where('category', 'like', '%' . $f['category'] . '%');
        if (!empty($f['brand']))    $q->where('brand', 'like', '%' . $f['brand'] . '%');
        if (!empty($f['featured'])) $q->where('featured', true);

        $this->applyPriceFilter($q, $f);

        match ($sort) {
            'price_asc'  => $q->orderBy('price'),
            'price_desc' => $q->orderByDesc('price'),
            'popular'    => $q->orderByDesc('views_count'),
            default      => $q->orderByDesc('created_at'),
        };

        $items = $q->with('user:id,full_name')->limit($limit)->get();

        return ['entity' => 'products', 'data' => $items->toArray()];
    }

    private function queryInvestments(array $f, string $sort, int $limit, ?User $owner): array
    {
        if ($owner) {
            // Return user's own investments with opportunity details
            $items = $owner->investments()
                ->with('opportunity')
                ->orderByDesc('created_at')
                ->limit($limit)
                ->get();
            return ['entity' => 'my_investments', 'data' => $items->toArray()];
        }

        $q = InvestmentOpportunity::query()->whereIn('status', ['Open', 'Coming Soon']);

        if (!empty($f['risk_level'])) $q->where('risk_level', $f['risk_level']);
        if (!empty($f['sector']))     $q->where('sector', 'like', '%' . $f['sector'] . '%');
        if (!empty($f['featured']))   $q->where('featured', true);
        if (!empty($f['min_roi']))    $q->where('expected_roi', '>=', (float) $f['min_roi']);
        if (!empty($f['min_price'])) $q->where('min_investment', '>=', (float) $f['min_price']);
        if (!empty($f['max_price'])) $q->where('min_investment', '<=', (float) $f['max_price']);

        match ($sort) {
            'roi_desc'   => $q->orderByDesc('expected_roi'),
            'price_asc'  => $q->orderBy('min_investment'),
            'price_desc' => $q->orderByDesc('min_investment'),
            default      => $q->orderByDesc('created_at'),
        };

        $items = $q->withCount('investments')->limit($limit)->get();

        return ['entity' => 'opportunities', 'data' => $items->toArray()];
    }

    private function queryPosts(array $f, string $sort, int $limit, ?User $owner): array
    {
        $q = CommunityPost::query();

        if ($owner) $q->where('user_id', $owner->id);
        if (!empty($f['category'])) $q->where('category', 'like', '%' . $f['category'] . '%');
        if (!empty($f['search_query'])) {
            $s = '%' . $f['search_query'] . '%';
            $q->where(fn ($w) => $w->where('title', 'like', $s)->orWhere('content', 'like', $s));
        }

        match ($sort) {
            'popular' => $q->orderByDesc('likes'),
            default   => $q->orderByDesc('created_at'),
        };

        $items = $q->with('user:id,full_name,avatar_url')->withCount('comments')->limit($limit)->get();

        return ['entity' => 'posts', 'data' => $items->toArray()];
    }

    private function queryFeels(array $f, string $sort, int $limit): array
    {
        $q = FeelsVideo::query()->where('is_active', true);

        if (!empty($f['search_query'])) {
            $q->where('caption', 'like', '%' . $f['search_query'] . '%');
        }

        match ($sort) {
            'popular' => $q->orderByDesc('likes'),
            default   => $q->orderByDesc('created_at'),
        };

        $items = $q->with('user:id,full_name,avatar_url')->limit($limit)->get();

        return ['entity' => 'feels', 'data' => $items->toArray()];
    }

    private function queryTales(array $f, string $sort, int $limit): array
    {
        $q = GlobalTale::query()->where('is_active', true);

        if (!empty($f['category'])) $q->where('category', 'like', '%' . $f['category'] . '%');
        if (!empty($f['search_query'])) {
            $s = '%' . $f['search_query'] . '%';
            $q->where(fn ($w) => $w->where('title', 'like', $s)->orWhere('content', 'like', $s));
        }
        if (!empty($f['featured'])) $q->where('featured', true);

        match ($sort) {
            'popular' => $q->orderByDesc('views_count'),
            default   => $q->orderByDesc('created_at'),
        };

        $items = $q->with('user:id,full_name,avatar_url')->limit($limit)->get();

        return ['entity' => 'tales', 'data' => $items->toArray()];
    }

    private function queryArtisans(array $f, string $sort, int $limit): array
    {
        $q = Artisan::query();

        if (!empty($f['service_type'])) $q->where('service', 'like', '%' . $f['service_type'] . '%');
        if (!empty($f['location']))     $q->where('location', 'like', '%' . $f['location'] . '%');
        if (!empty($f['state']))        $q->where('state', 'like', '%' . $f['state'] . '%');
        if (!empty($f['city']))         $q->where('city', 'like', '%' . $f['city'] . '%');
        if (!empty($f['search_query'])) {
            $s = '%' . $f['search_query'] . '%';
            $q->where(fn ($w) => $w->where('name', 'like', $s)
                ->orWhere('service', 'like', $s)
                ->orWhere('location', 'like', $s));
        }

        match ($sort) {
            'rating' => $q->orderByDesc('rating'),
            default  => $q->orderByDesc('created_at'),
        };

        $items = $q->limit($limit)->get();

        return ['entity' => 'artisans', 'data' => $items->toArray()];
    }

    private function getUserWallet(User $user): array
    {
        $wallet = $user->wallet;
        $recentTransactions = $user->hasMany(\App\Models\PaymentTransaction::class, 'user_id')
            ->getQuery()
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['reference', 'amount', 'swc_amount', 'type', 'status', 'created_at']);

        return [
            'entity' => 'wallet',
            'data'   => [
                'wallet'             => $wallet?->toArray(),
                'recent_transactions' => $recentTransactions->toArray(),
            ],
        ];
    }

    private function getUserAppointments(User $user): array
    {
        $items = $user->appointments()
            ->with('listing:id,title,location,price,image_url')
            ->orderByDesc('date_time')
            ->limit(20)
            ->get();

        return ['entity' => 'appointments', 'data' => $items->toArray()];
    }

    private function getUserNotifications(User $user): array
    {
        $items = \App\Models\Notification::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return ['entity' => 'notifications', 'data' => $items->toArray()];
    }

    private function getUserDashboard(User $user): array
    {
        $wallet   = $user->wallet;
        $listings = $user->listings()->count();
        $products = $user->marketplaceProducts()->count();
        $posts    = $user->communityPosts()->count();
        $appointments = $user->appointments()->count();
        $investments  = $user->hasMany(\App\Models\Investment::class, 'user_id')->getQuery()->count();
        $unreadNotifs = \App\Models\Notification::where('user_id', $user->id)->whereNull('read_at')->count();

        return [
            'entity' => 'dashboard',
            'data'   => [
                'wallet'            => $wallet?->toArray(),
                'listings_count'    => $listings,
                'products_count'    => $products,
                'posts_count'       => $posts,
                'appointments_count' => $appointments,
                'investments_count' => $investments,
                'unread_notifications' => $unreadNotifs,
            ],
        ];
    }

    private function getPlatformStats(): array
    {
        return [
            'entity' => 'platform',
            'data'   => [
                'total_users'        => User::count(),
                'total_listings'     => Listing::where('is_active', true)->count(),
                'total_products'     => MarketplaceProduct::where('is_approved', true)->count(),
                'total_posts'        => CommunityPost::count(),
                'total_investments'  => InvestmentOpportunity::where('status', 'Open')->count(),
                'total_artisans'     => Artisan::count(),
                'total_tales'        => GlobalTale::where('is_active', true)->count(),
            ],
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 3 — Natural language response generation
    // ─────────────────────────────────────────────────────────────────────────

    private function generateResponse(string $userMessage, array $intent, array $results, User $user): string
    {
        $entity  = $results['entity'] ?? null;
        $data    = $results['data'] ?? null;
        $count   = is_array($data) ? count($data) : null;
        $summary = $intent['context_summary'] ?? $userMessage;

        // For plain answers, ask Gemini to answer directly
        if ($intent['plain_answer'] ?? false) {
            $prompt = <<<PROMPT
You are a helpful AI assistant for Sheltrify — a Nigerian real estate, marketplace, and community platform.
Answer this question concisely and helpfully (2-3 sentences max):

"{$userMessage}"

Context: The platform has listings for rent/sale, a marketplace, community posts, investment opportunities, artisan services, and wallet features using SWC (Sheltrify Wallet Credits) as internal currency. 1 SWC ≈ ₦4.50 NGN.
PROMPT;
            $reply = $this->callGemini($prompt);
            if ($reply === null) {
                throw new \RuntimeException('AI service is temporarily unavailable. Please try again later.');
            }
            return $reply;
        }

        // Summarize the DB results
        $preview = '';
        if (is_array($data) && $count > 0) {
            $sample  = array_slice($data, 0, 3);
            $preview = json_encode($sample, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } elseif (is_array($data) && !is_numeric(array_key_first($data ?? []))) {
            $preview = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }

        $countStr = $count !== null ? "{$count} result(s) found" : 'data retrieved';

        $prompt = <<<PROMPT
You are a helpful AI assistant for Sheltrify — a Nigerian real estate, marketplace, and community platform.

The user asked: "{$userMessage}"
Query summary: {$summary}
Entity queried: {$entity}
{$countStr}

Sample data:
{$preview}

Generate a warm, helpful response (2-4 sentences). Guidelines:
- Be specific: mention prices (in ₦), locations, key details from the data
- Use Nigerian context (Lagos, Abuja, Port Harcourt, Lekki, Victoria Island, etc.)
- If 0 results: suggest alternatives, broaden the search, or explain what's available
- For wallet data: format SWC balance clearly
- Do NOT list every item — summarize and highlight the most relevant
- End with a helpful follow-up suggestion or offer to refine the search
PROMPT;

        $reply = $this->callGemini($prompt);
        if ($reply === null) {
            throw new \RuntimeException('AI service is temporarily unavailable. Please try again later.');
        }
        return $reply;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Gemini API helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function callGemini(string $prompt, bool $jsonMode = false): ?string
    {
        if (empty($this->apiKey)) {
            Log::error('Gemini API key is not configured');
            return null;
        }

        $payload = [
            'contents' => [
                ['role' => 'user', 'parts' => [['text' => $prompt]]],
            ],
        ];

        if ($jsonMode) {
            $payload['generationConfig'] = ['responseMimeType' => 'application/json'];
        }

        try {
            $response = Http::timeout(60)
                ->post("{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}", $payload);

            if ($response->successful()) {
                $body = $response->json();
                if (empty($body['candidates'][0]['content']['parts'][0]['text'])) {
                    Log::warning('Gemini returned empty response', ['body' => $body]);
                }
                return $body['candidates'][0]['content']['parts'][0]['text'] ?? null;
            }

            Log::warning('Gemini API error response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        } catch (\Throwable $e) {
            Log::error('Gemini API exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function extractJson(string $raw): ?array
    {
        // Strip markdown code fences if present
        $clean = preg_replace('/^```(?:json)?\s*/m', '', $raw);
        $clean = preg_replace('/\s*```$/m', '', $clean);
        $clean = trim($clean);

        $decoded = json_decode($clean, true);
        return is_array($decoded) ? $decoded : null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Utility helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function applyPriceFilter($q, array $f): void
    {
        // Listings store price as string (e.g. "₦500,000"), products as float
        // Try numeric comparison first; fall back to LIKE for string prices
        if (!empty($f['min_price'])) {
            $min = (float) $f['min_price'];
            $q->where(function ($w) use ($min) {
                $w->whereRaw('CAST(price AS DECIMAL(15,2)) >= ?', [$min])
                  ->orWhere('price', '>=', $min);
            });
        }
        if (!empty($f['max_price'])) {
            $max = (float) $f['max_price'];
            $q->where(function ($w) use ($max) {
                $w->whereRaw('CAST(price AS DECIMAL(15,2)) <= ?', [$max])
                  ->orWhere('price', '<=', $max);
            });
        }
    }

    private function applySort($q, string $sort): void
    {
        match ($sort) {
            'price_asc'  => $q->orderBy('price'),
            'price_desc' => $q->orderByDesc('price'),
            'popular'    => $q->orderByDesc('views_count'),
            default      => $q->orderByDesc('is_boosted')->orderByDesc('created_at'),
        };
    }

    private function formatListing($l): array
    {
        $arr = $l->toArray();
        $arr['favorites_count']    = $l->favorites_count ?? 0;
        $arr['appointments_count'] = $l->appointments_count ?? 0;
        return $arr;
    }
}
