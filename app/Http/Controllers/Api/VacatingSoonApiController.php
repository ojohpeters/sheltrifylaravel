<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\FiltersListings;
use App\Http\Controllers\Controller;
use App\Models\VacatingMatch;
use App\Models\VacatingSoonListing;
use App\Models\WaitlistEntry;
use App\Services\VacatingMatcher;
use App\Support\ApartmentTypes;
use App\Support\MatchKey;
use App\Support\NigerianStates;
use App\Support\Phone;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * "Vacating Soon": flats with notice already given, and the seekers waiting.
 *
 * Built for a specific failure — thirty people asked for one neighbourhood in a
 * month and none of them were housed, because by the time a flat was listed it
 * was already gone. Capturing the flat at notice, rather than at listing, is
 * the whole point.
 */
class VacatingSoonApiController extends Controller
{
    use FiltersListings;

    /** Upcoming vacancies, contact details withheld until asked for. */
    public function index(Request $request)
    {
        $data = $request->validate([
            'page' => 'nullable|integer|min:1',
            'limit' => 'nullable|integer|min:1|max:60',
            'search' => 'nullable|string|max:120',
            'state' => 'nullable|string|max:200',
            'area' => 'nullable|string|max:400',
            'apartmentType' => 'nullable|string|max:200',
        ]);

        $page = max(1, (int) ($data['page'] ?? 1));
        $limit = max(1, min(60, (int) ($data['limit'] ?? 12)));

        $q = VacatingSoonListing::query()
            ->select(VacatingSoonListing::PUBLIC_COLUMNS)
            ->whereIn('status', ['available', 'reserved'])
            ->whereDate('vacate_date', '>=', now()->toDateString());

        if (filled($data['search'] ?? null)) {
            $s = '%'.$this->escapeLike($data['search']).'%';
            $q->where(function ($w) use ($s) {
                $w->where('area', 'like', $s)
                    ->orWhere('lga', 'like', $s)
                    ->orWhere('state', 'like', $s)
                    ->orWhere('apartment_type', 'like', $s);
            });
        }

        $facets = [
            'states' => $this->facetCounts(clone $q, 'state'),
            'areas' => $this->facetCounts(clone $q, 'area'),
            'apartmentTypes' => $this->facetCounts(clone $q, 'apartment_type'),
        ];

        if (filled($data['state'] ?? null)) {
            $this->whereInLower($q, 'state', $data['state']);
        }
        if (filled($data['area'] ?? null)) {
            // Pipe-separated: an area name can contain a comma.
            $this->whereInLower($q, 'area', $data['area'], '|');
        }
        if (filled($data['apartmentType'] ?? null)) {
            $this->whereInLower($q, 'apartment_type', $data['apartmentType'], '|');
        }

        $total = (clone $q)->count();

        $rows = $q->orderBy('vacate_date')
            ->skip(($page - 1) * $limit)
            ->take($limit)
            ->get();

        return $this->jsonOk([
            'vacating' => $rows,
            'facets' => $facets,
            'waitingCount' => WaitlistEntry::query()->whereIn('status', ['active', 'matched'])->count(),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => (int) ceil($total / $limit),
            ],
        ]);
    }

    /** Places already captured, so both forms can suggest instead of demanding spelling. */
    public function places(Request $request)
    {
        $state = $request->query('state');

        $areas = VacatingSoonListing::query()
            ->when($state, fn ($q) => $q->where('state_key', MatchKey::make($state)))
            ->distinct()
            ->orderBy('area')
            ->pluck('area');

        $waitlistAreas = WaitlistEntry::query()
            ->when($state, fn ($q) => $q->where('state_key', MatchKey::make($state)))
            ->pluck('areas')
            ->flatten();

        $lgas = VacatingSoonListing::query()
            ->when($state, fn ($q) => $q->where('state_key', MatchKey::make($state)))
            ->whereNotNull('lga')
            ->distinct()
            ->orderBy('lga')
            ->pluck('lga');

        return $this->jsonOk([
            'areas' => $areas->merge($waitlistAreas)
                ->filter()
                ->unique(fn ($a) => MatchKey::make($a))
                ->values()
                ->all(),
            'lgas' => $lgas->filter()->values()->all(),
            'apartmentTypes' => ApartmentTypes::ALL,
        ]);
    }

    /** A tenant gives notice — or an agent records that they have. */
    public function store(Request $request)
    {
        $data = $request->validate([
            'address' => 'nullable|string|max:255',
            'listingId' => 'nullable|integer|exists:listings,id',
            'state' => ['required', 'string', Rule::in(NigerianStates::ALL)],
            'lga' => 'nullable|string|max:80',
            'area' => 'required|string|max:120',
            'apartmentType' => ['required', 'string', Rule::in(ApartmentTypes::ALL)],
            'rentAmount' => 'nullable|numeric|min:0|max:100000000000',
            'vacateDate' => 'required|date|after_or_equal:today',
            'reason' => 'nullable|string|max:500',
            'contactName' => 'nullable|string|max:120',
            'whatsapp' => 'required|string|max:24',
            'imageUrl' => 'nullable|string|max:512',
        ]);

        $whatsapp = Phone::normalize($data['whatsapp']);

        if (! Phone::isValid($whatsapp)) {
            return $this->jsonErr('Enter a valid WhatsApp number, e.g. 0807 588 7105', 422);
        }

        // A double tap on a slow connection should not create two flats.
        $existing = VacatingSoonListing::query()
            ->where('whatsapp', $whatsapp)
            ->where('area_key', MatchKey::make($data['area']))
            ->where('apartment_type', $data['apartmentType'])
            ->whereDate('vacate_date', $data['vacateDate'])
            ->first();

        $vacating = $existing ?? new VacatingSoonListing();

        $vacating->fill([
            'user_id' => $request->user()?->id,
            'captured_by' => $request->user()?->id,
            'listing_id' => $data['listingId'] ?? null,
            'address' => $data['address'] ?? null,
            'state' => $data['state'],
            'lga' => $data['lga'] ?? null,
            'area' => trim($data['area']),
            'apartment_type' => $data['apartmentType'],
            'rent_amount' => $data['rentAmount'] ?? null,
            'vacate_date' => $data['vacateDate'],
            'reason' => $data['reason'] ?? null,
            'contact_name' => $data['contactName'] ?? null,
            'whatsapp' => $whatsapp,
            'image_url' => $data['imageUrl'] ?? null,
        ]);
        $vacating->save();

        $matches = VacatingMatcher::run($vacating);

        return $this->jsonOk([
            'vacating' => $vacating,
            // Worth showing the tenant: "eleven people are already waiting" is
            // the reason to tell us early rather than at the end of the month.
            'matchedSeekers' => $matches->count(),
        ], $matches->isEmpty()
            ? 'Thank you — your apartment has been recorded.'
            : 'Thank you — '.$matches->count().' '.($matches->count() === 1 ? 'person is' : 'people are').' already waiting for this area.',
            201);
    }

    /** A seeker joins the waitlist for one or more areas. */
    public function joinWaitlist(Request $request)
    {
        $data = $request->validate([
            'fullName' => 'required|string|max:120',
            'whatsapp' => 'required|string|max:24',
            'email' => 'nullable|email|max:191',
            'state' => ['required', 'string', Rule::in(NigerianStates::ALL)],
            'lga' => 'nullable|string|max:80',
            'areas' => 'required|array|min:1|max:5',
            'areas.*' => 'required|string|max:120',
            'apartmentType' => ['required', 'string', Rule::in(array_merge(ApartmentTypes::ALL, [ApartmentTypes::ANY]))],
            'budgetMin' => 'nullable|numeric|min:0|max:100000000000',
            'budgetMax' => 'nullable|numeric|min:0|max:100000000000',
            'moveInDate' => 'nullable|date',
        ]);

        $whatsapp = Phone::normalize($data['whatsapp']);

        if (! Phone::isValid($whatsapp)) {
            return $this->jsonErr('Enter a valid WhatsApp number, e.g. 0807 588 7105', 422);
        }

        // Re-joining for the same state and size updates the areas rather than
        // stacking duplicate entries the team then has to de-duplicate by hand.
        $entry = WaitlistEntry::query()
            ->where('whatsapp', $whatsapp)
            ->where('state_key', MatchKey::make($data['state']))
            ->where('apartment_type', $data['apartmentType'])
            ->whereIn('status', ['active', 'matched'])
            ->first() ?? new WaitlistEntry();

        $entry->fill([
            'user_id' => $request->user()?->id ?? $entry->user_id,
            'full_name' => trim($data['fullName']),
            'whatsapp' => $whatsapp,
            'email' => $data['email'] ?? $request->user()?->email,
            'state' => $data['state'],
            'lga' => $data['lga'] ?? null,
            'areas' => array_values(array_unique(array_map('trim', $data['areas']))),
            'apartment_type' => $data['apartmentType'],
            'budget_min' => $data['budgetMin'] ?? null,
            'budget_max' => $data['budgetMax'] ?? null,
            'move_in_date' => $data['moveInDate'] ?? null,
            'status' => 'active',
        ]);
        $entry->save();

        // Anything already captured that fits, so joining today surfaces the
        // flat recorded yesterday instead of waiting for the next one.
        $matches = VacatingMatcher::runForSeeker($entry);

        return $this->jsonOk([
            'waitlist' => $entry,
            'matchesFound' => $matches->count(),
        ], $matches->isEmpty()
            ? 'You are on the waitlist. You will be notified as soon as an apartment in this area becomes available.'
            : 'You are on the waitlist — and '.$matches->count().' '.($matches->count() === 1 ? 'apartment' : 'apartments').' already match. We will be in touch.',
            201);
    }

    // ── Admin ───────────────────────────────────────────────────────────────

    /** Everything captured, newest notice first. */
    public function adminVacating(Request $request)
    {
        $rows = VacatingSoonListing::query()
            ->with(['user:id,full_name,email', 'matches'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->orderBy('vacate_date')
            ->limit(500)
            ->get()
            ->map(fn (VacatingSoonListing $v) => array_merge($v->toArray(), [
                'matchCount' => $v->matches->count(),
                'daysToVacate' => (int) now()->startOfDay()->diffInDays($v->vacate_date, false),
            ]));

        return $this->jsonOk(['vacating' => $rows]);
    }

    /** Who is waiting, and for where. */
    public function adminWaitlist(Request $request)
    {
        $rows = WaitlistEntry::query()
            ->with(['user:id,full_name,email'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->orderByDesc('created_at')
            ->limit(500)
            ->get();

        // The demand board: which areas people are asking for and cannot get.
        $demand = WaitlistEntry::query()
            ->whereIn('status', ['active', 'matched'])
            ->pluck('areas')
            ->flatten()
            ->filter()
            ->groupBy(fn ($area) => MatchKey::make($area))
            ->map(fn ($group) => ['value' => $group->first(), 'count' => $group->count()])
            ->sortByDesc('count')
            ->values()
            ->all();

        return $this->jsonOk(['waitlist' => $rows, 'demand' => $demand]);
    }

    /** Matches, each with the message to send and the number to send it to. */
    public function adminMatches(Request $request)
    {
        $rows = VacatingMatch::query()
            ->with(['vacating', 'waitlistEntry'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->orderByDesc('created_at')
            ->limit(500)
            ->get()
            ->filter(fn (VacatingMatch $m) => $m->vacating && $m->waitlistEntry)
            ->map(fn (VacatingMatch $m) => array_merge($m->toArray(), [
                // Automated WhatsApp needs the Business Cloud API and an
                // approved template; until then the team sends these by hand,
                // one tap each.
                'whatsappUrl' => VacatingMatcher::whatsAppLink($m->vacating, $m->waitlistEntry),
            ]))
            ->values();

        return $this->jsonOk(['matches' => $rows]);
    }

    public function adminUpdateVacating(Request $request, string $id)
    {
        $data = $request->validate([
            'status' => ['nullable', 'string', Rule::in(['available', 'reserved', 'taken', 'withdrawn', 'expired'])],
            'adminNotes' => 'nullable|string|max:1000',
        ]);

        $vacating = VacatingSoonListing::query()->find($id);

        if (! $vacating) {
            return $this->jsonErr('Not found', 404);
        }

        if (array_key_exists('status', $data) && $data['status'] !== null) {
            $vacating->status = $data['status'];
        }
        if (array_key_exists('adminNotes', $data)) {
            $vacating->admin_notes = $data['adminNotes'];
        }
        $vacating->save();

        return $this->jsonOk($vacating, 'Updated');
    }

    public function adminUpdateWaitlist(Request $request, string $id)
    {
        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(['active', 'matched', 'fulfilled', 'cancelled'])],
        ]);

        $entry = WaitlistEntry::query()->find($id);

        if (! $entry) {
            return $this->jsonErr('Not found', 404);
        }

        $entry->status = $data['status'];
        $entry->save();

        return $this->jsonOk($entry, 'Updated');
    }

    public function adminUpdateMatch(Request $request, string $id)
    {
        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(['new', 'contacted', 'viewing', 'closed', 'dropped'])],
            'notes' => 'nullable|string|max:1000',
        ]);

        $match = VacatingMatch::query()->find($id);

        if (! $match) {
            return $this->jsonErr('Not found', 404);
        }

        $match->status = $data['status'];

        if ($data['status'] === 'contacted' && $match->notified_at === null) {
            $match->notified_at = now();
        }
        if (array_key_exists('notes', $data)) {
            $match->notes = $data['notes'];
        }
        $match->save();

        return $this->jsonOk($match, 'Updated');
    }

    /** Re-run the matcher after an edit, or after new seekers have joined. */
    public function adminRematch(string $id)
    {
        $vacating = VacatingSoonListing::query()->find($id);

        if (! $vacating) {
            return $this->jsonErr('Not found', 404);
        }

        $matches = VacatingMatcher::run($vacating);

        return $this->jsonOk(
            ['created' => $matches->count()],
            $matches->isEmpty() ? 'No new seekers matched.' : $matches->count().' new '.($matches->count() === 1 ? 'seeker' : 'seekers').' matched.'
        );
    }

    /** Reveals the tenant's number, and counts that someone asked. */
    public function contact(string $id)
    {
        $vacating = VacatingSoonListing::query()->find($id);

        if (! $vacating || ! $vacating->isOpen()) {
            return $this->jsonErr('This apartment is no longer available', 404);
        }

        $vacating->increment('contact_views');

        return $this->jsonOk([
            'name' => $vacating->contact_name,
            'whatsapp' => $vacating->whatsapp,
            'address' => $vacating->address,
        ]);
    }
}
