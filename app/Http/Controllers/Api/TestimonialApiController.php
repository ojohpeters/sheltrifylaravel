<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\Request;

class TestimonialApiController extends Controller
{
    /**
     * Approved testimonials for the landing page.
     *
     * The section previously shipped three invented reviews, including one from
     * "New York, USA" on a Nigerian property platform.
     */
    public function index()
    {
        $items = Testimonial::query()
            ->where('status', 'approved')
            ->with('user:id,full_name,avatar_url')
            ->latest()
            ->limit(12)
            ->get(['id', 'user_id', 'rating', 'body', 'location', 'created_at']);

        return $this->jsonOk(['testimonials' => $items]);
    }

    /** The signed-in user's own testimonial, so the form can show its status. */
    public function mine(Request $request)
    {
        return $this->jsonOk([
            'testimonial' => Testimonial::query()
                ->where('user_id', $request->user()->id)
                ->first(['id', 'rating', 'body', 'location', 'status']),
        ]);
    }

    /** Everything awaiting review, for the admin moderation queue. */
    public function pending()
    {
        return $this->jsonOk([
            'testimonials' => Testimonial::query()
                ->where('status', 'pending')
                ->with('user:id,full_name,email,avatar_url')
                ->latest()
                ->get(['id', 'user_id', 'rating', 'body', 'location', 'created_at']),
        ]);
    }

    /** Publish or reject a submission. */
    public function moderate(Request $request, string $id)
    {
        $data = $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $testimonial = Testimonial::query()->find($id);
        if (! $testimonial) {
            return $this->jsonErr('Testimonial not found', 404);
        }

        $testimonial->update(['status' => $data['status']]);

        return $this->jsonOk(
            ['testimonial' => $testimonial->only(['id', 'status'])],
            $data['status'] === 'approved' ? 'Published.' : 'Rejected.'
        );
    }

    /**
     * Submit or update feedback.
     *
     * Always lands as 'pending', including on an edit — otherwise an approved
     * testimonial could be quietly rewritten into anything after the fact and
     * stay on the front page.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'body' => 'required|string|min:10|max:1000',
            'location' => 'nullable|string|max:120',
        ]);

        $testimonial = Testimonial::updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'rating' => $data['rating'],
                'body' => $data['body'],
                'location' => $data['location'] ?? null,
                'status' => 'pending',
            ],
        );

        return $this->jsonOk(
            ['testimonial' => $testimonial->only(['id', 'rating', 'body', 'location', 'status'])],
            'Thank you. Your feedback will appear once our team reviews it.'
        );
    }
}
