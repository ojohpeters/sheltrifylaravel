<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RentalWahalaVideo;
use Illuminate\Http\Request;

class RentalWahalaApiController extends Controller
{
    public function index()
    {
        $videos = RentalWahalaVideo::query()->where('is_active', true)
            ->with(['user:id,email,full_name,avatar_url'])
            ->orderByDesc('created_at')->get();

        return $this->jsonOk($videos);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'videoUrl' => 'required|string',
            'caption' => 'nullable|string',
            'music' => 'nullable|string',
        ]);
        $v = RentalWahalaVideo::create([
            'user_id' => $request->user()->id,
            'video_url' => $data['videoUrl'],
            'caption' => $data['caption'] ?? null,
            'music' => $data['music'] ?? null,
        ]);
        $v->load(['user:id,email,full_name,avatar_url']);

        return $this->jsonOk($v, 'Video uploaded successfully', 201);
    }

    public function update(Request $request, string $id)
    {
        $v = RentalWahalaVideo::query()->find($id);
        if (! $v) {
            return $this->jsonErr('Video not found', 404);
        }
        $data = $request->validate([
            'videoUrl' => 'sometimes|string',
            'caption' => 'nullable|string',
            'music' => 'nullable|string',
        ]);
        $v->update(array_filter([
            'video_url' => $data['videoUrl'] ?? $v->video_url,
            'caption' => $data['caption'] ?? $v->caption,
            'music' => $data['music'] ?? $v->music,
        ]));
        $v->load(['user:id,email,full_name,avatar_url']);

        return $this->jsonOk($v, 'Video updated successfully');
    }

    public function destroy(string $id)
    {
        $v = RentalWahalaVideo::query()->find($id);
        if (! $v) {
            return $this->jsonErr('Video not found', 404);
        }
        $v->delete();

        return $this->jsonOk(null, 'Video deleted successfully');
    }

    public function like(string $id)
    {
        $v = RentalWahalaVideo::query()->find($id);
        if (! $v) {
            return $this->jsonErr('Video not found', 404);
        }
        $v->increment('likes');

        return $this->jsonOk($v->fresh(), 'Video liked');
    }
}
