<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeelsVideo;
use App\Models\FeelsVideoComment;
use Illuminate\Http\Request;

class FeelsApiController extends Controller
{
    public function index()
    {
        $videos = FeelsVideo::query()->where('is_active', true)
            ->with(['user:id,email,full_name,avatar_url,role'])
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
        $v = FeelsVideo::create([
            'user_id' => $request->user()->id,
            'video_url' => $data['videoUrl'],
            'caption' => $data['caption'] ?? null,
            'music' => $data['music'] ?? null,
        ]);
        $v->load(['user:id,email,full_name,avatar_url,role']);

        return $this->jsonOk($v, 'Video uploaded successfully', 201);
    }

    public function update(Request $request, string $id)
    {
        $v = FeelsVideo::query()->find($id);
        if (! $v) {
            return $this->jsonErr('Video not found', 404);
        }
        $user = $request->user();
        if ((string) $v->user_id !== (string) $user->id && $user->role !== 'ADMIN') {
            return $this->jsonErr('You can only update your own videos', 403);
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
        $v->load(['user:id,email,full_name,avatar_url,role']);

        return $this->jsonOk($v, 'Video updated successfully');
    }

    public function destroy(Request $request, string $id)
    {
        $v = FeelsVideo::query()->find($id);
        if (! $v) {
            return $this->jsonErr('Video not found', 404);
        }
        $user = $request->user();
        if ((string) $v->user_id !== (string) $user->id && $user->role !== 'ADMIN') {
            return $this->jsonErr('You can only delete your own videos', 403);
        }
        $v->delete();

        return $this->jsonOk(null, 'Video deleted successfully');
    }

    public function like(string $id)
    {
        $v = FeelsVideo::query()->find($id);
        if (! $v) {
            return $this->jsonErr('Video not found', 404);
        }
        $v->increment('likes');
        $v->load(['user:id,email,full_name,avatar_url,role']);

        return $this->jsonOk($v->fresh(), 'Video liked');
    }

    public function commentsIndex(string $id)
    {
        $v = FeelsVideo::query()->find($id);
        if (! $v) {
            return $this->jsonErr('Video not found', 404);
        }
        $list = FeelsVideoComment::query()->where('feels_video_id', $id)
            ->with('user:id,email,full_name,avatar_url')->orderByDesc('created_at')->get();

        return $this->jsonOk($list);
    }

    public function commentsStore(Request $request, string $id)
    {
        $data = $request->validate(['text' => 'required|string']);
        $v = FeelsVideo::query()->find($id);
        if (! $v) {
            return $this->jsonErr('Video not found', 404);
        }
        FeelsVideoComment::create([
            'feels_video_id' => $id,
            'user_id' => $request->user()->id,
            'text' => trim($data['text']),
            'created_at' => now(),
        ]);
        $v->increment('comments');
        $v->load(['user:id,email,full_name,avatar_url,role']);

        return $this->jsonOk($v->fresh(), 'Comment added');
    }
}
