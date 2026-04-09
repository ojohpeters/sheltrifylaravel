<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiConversation;
use App\Models\Listing;
use App\Services\AiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AiApiController extends Controller
{
    public function __construct(private readonly AiService $ai) {}

    // ─────────────────────────────────────────────────────────────────────────
    // AI Chat
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Start or continue an AI conversation.
     * The AI interprets the message, queries the DB, and responds in natural language.
     * Optionally pass conversation_id to continue an existing thread.
     */
    public function chat(Request $request)
    {
        $request->validate([
            'message'         => 'required|string|max:1000',
            'conversation_id' => 'nullable|integer',
        ]);

        $user = $request->user();

        // Find or create conversation
        $conversation = null;
        if ($request->filled('conversation_id')) {
            $conversation = AiConversation::where('user_id', $user->id)
                ->find($request->input('conversation_id'));
        }

        if (!$conversation) {
            $conversation = AiConversation::create([
                'user_id' => $user->id,
                'title'   => null,
            ]);
        }

        $result = $this->ai->chat($request->input('message'), $user, $conversation);

        return $this->jsonOk([
            'conversation_id' => $conversation->id,
            'message'         => $result['message'],
            'entity'          => $result['entity'],
            'data'            => $result['data'],
            'intent'          => $result['intent'],
        ]);
    }

    /**
     * List all AI conversations for the authenticated user.
     */
    public function conversations(Request $request)
    {
        $conversations = AiConversation::where('user_id', $request->user()->id)
            ->orderByDesc('last_message_at')
            ->withCount('messages')
            ->limit(50)
            ->get();

        return $this->jsonOk(['conversations' => $conversations]);
    }

    /**
     * Get a specific conversation with its message history.
     */
    public function conversationShow(Request $request, int $id)
    {
        $conversation = AiConversation::where('user_id', $request->user()->id)
            ->with(['messages' => fn ($q) => $q->orderBy('created_at')])
            ->findOrFail($id);

        return $this->jsonOk(['conversation' => $conversation]);
    }

    /**
     * Delete a conversation.
     */
    public function conversationDestroy(Request $request, int $id)
    {
        $conversation = AiConversation::where('user_id', $request->user()->id)->findOrFail($id);
        $conversation->delete();

        return $this->jsonOk(['message' => 'Conversation deleted.']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Legacy endpoints (kept for backwards compatibility)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns aggregated site data for external AI agents.
     */
    public function siteData(Request $request)
    {
        $q = Listing::query()->where('is_active', true);
        if ($request->filled('location')) {
            $q->where('location', 'like', '%' . $request->query('location') . '%');
        }
        if ($request->filled('propertyType')) {
            $q->where('property_type', $request->query('propertyType'));
        }

        $listings = $q->with(['user:id,full_name,email,phone,is_verified'])
            ->withCount(['favorites', 'appointments'])
            ->orderByDesc('is_boosted')
            ->orderByDesc('created_at')
            ->limit(1000)
            ->get();

        $locationStats = Listing::query()->where('is_active', true)
            ->select('location', DB::raw('count(*) as cnt'), DB::raw('avg(bedrooms) as avg_bed'))
            ->groupBy('location')->get()
            ->map(fn ($r) => ['location' => $r->location, 'count' => $r->cnt, 'avgBedrooms' => $r->avg_bed]);

        $typeStats = Listing::query()->where('is_active', true)
            ->select('property_type', DB::raw('count(*) as cnt'))
            ->groupBy('property_type')->get()
            ->map(fn ($r) => ['type' => $r->property_type, 'count' => $r->cnt]);

        $prices  = Listing::query()->where('is_active', true)->pluck('price')->take(1000);
        $numeric = [];
        foreach ($prices as $p) {
            if (preg_match('/₦?([\d.]+)([KM])?/i', $p, $m)) {
                $v = (float) $m[1];
                if (strtoupper($m[2] ?? '') === 'K') $v *= 1000;
                if (strtoupper($m[2] ?? '') === 'M') $v *= 1_000_000;
                $numeric[] = $v;
            }
        }

        return $this->jsonOk([
            'listings'   => $listings,
            'statistics' => [
                'totalListings' => $listings->count(),
                'locations'     => $locationStats,
                'propertyTypes' => $typeStats,
                'priceRange'    => count($numeric) ? [
                    'min' => min($numeric),
                    'max' => max($numeric),
                    'avg' => array_sum($numeric) / count($numeric),
                ] : null,
            ],
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Simple keyword search on listings.
     */
    public function searchListings(Request $request)
    {
        $q = Listing::query()->where('is_active', true);
        if ($request->filled('query')) {
            $s = '%' . $request->query('query') . '%';
            $q->where(fn ($w) => $w->where('title', 'like', $s)
                ->orWhere('description', 'like', $s)
                ->orWhere('location', 'like', $s));
        }
        if ($request->filled('location'))     $q->where('location', 'like', '%' . $request->query('location') . '%');
        if ($request->filled('propertyType')) $q->where('property_type', $request->query('propertyType'));
        if ($request->filled('bedrooms'))     $q->where('bedrooms', '>=', (int) $request->query('bedrooms'));

        $listings = $q->with(['user:id,full_name,is_verified'])
            ->orderByDesc('is_boosted')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return $this->jsonOk(['listings' => $listings, 'count' => $listings->count()]);
    }
}
