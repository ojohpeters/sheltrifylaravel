<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GlobalTale;
use Illuminate\Http\Request;

class GlobalTalesApiController extends Controller
{
    protected function formatStory(GlobalTale $story): array
    {
        $story->loadMissing('user');

        return [
            'id' => (string) $story->id,
            'title' => $story->title,
            'content' => $story->content,
            'imageUrl' => $story->image_url,
            'videoUrl' => $story->video_url,
            'category' => $story->category,
            'readTime' => $story->read_time,
            'author' => [
                'name' => $story->user->full_name ?: explode('@', $story->user->email)[0],
                'avatarUrl' => $story->user->avatar_url ?: 'https://via.placeholder.com/50',
            ],
            'createdAt' => $story->created_at?->toIso8601String(),
        ];
    }

    public function index(Request $request)
    {
        $limit = min(200, max(1, (int) $request->query('limit', 50)));
        $q = GlobalTale::query()->where('is_active', true)->with('user');
        if ($request->filled('category')) {
            $q->where('category', $request->query('category'));
        }
        $stories = $q->orderByDesc('created_at')->limit($limit)->get();

        return $this->jsonOk($stories->map(fn ($s) => $this->formatStory($s))->values());
    }

    public function show(string $id)
    {
        $story = GlobalTale::query()->with('user')->find($id);
        if (! $story || ! $story->is_active) {
            return $this->jsonErr('Story not found', 404);
        }

        return $this->jsonOk($this->formatStory($story));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string',
            'content' => 'required|string',
            'imageUrl' => 'nullable|string',
            'videoUrl' => 'nullable|string',
            'category' => 'nullable|string',
            'readTime' => 'nullable|integer|min:1',
        ]);
        $wordCount = str_word_count($data['content']);
        $readTime = $data['readTime'] ?? max(1, (int) ceil($wordCount / 200));

        $story = GlobalTale::create([
            'user_id' => $request->user()->id,
            'title' => $data['title'],
            'content' => $data['content'],
            'image_url' => $data['imageUrl'] ?? null,
            'video_url' => $data['videoUrl'] ?? null,
            'category' => $data['category'] ?? 'General',
            'read_time' => $readTime,
        ]);
        $story->load('user');

        return $this->jsonOk($this->formatStory($story), 'Story created successfully');
    }

    public function update(Request $request, string $id)
    {
        $story = GlobalTale::query()->find($id);
        if (! $story) {
            return $this->jsonErr('Story not found', 404);
        }
        if ((string) $story->user_id !== (string) $request->user()->id) {
            return $this->jsonErr('You can only edit your own stories', 403);
        }
        $data = $request->validate([
            'title' => 'sometimes|string',
            'content' => 'sometimes|string',
            'imageUrl' => 'nullable|string',
            'videoUrl' => 'nullable|string',
            'category' => 'nullable|string',
            'readTime' => 'nullable|integer|min:1',
        ]);
        $updates = [];
        if (isset($data['title'])) {
            $updates['title'] = $data['title'];
        }
        if (isset($data['content'])) {
            $updates['content'] = $data['content'];
            $updates['read_time'] = $data['readTime'] ?? max(1, (int) ceil(str_word_count($data['content']) / 200));
        }
        if (array_key_exists('imageUrl', $data)) {
            $updates['image_url'] = $data['imageUrl'];
        }
        if (array_key_exists('videoUrl', $data)) {
            $updates['video_url'] = $data['videoUrl'];
        }
        if (isset($data['category'])) {
            $updates['category'] = $data['category'];
        }
        if (isset($data['readTime']) && ! isset($data['content'])) {
            $updates['read_time'] = $data['readTime'];
        }
        $story->update($updates);
        $story->load('user');

        return $this->jsonOk($this->formatStory($story->fresh()), 'Story updated successfully');
    }

    public function destroy(Request $request, string $id)
    {
        $story = GlobalTale::query()->find($id);
        if (! $story) {
            return $this->jsonErr('Story not found', 404);
        }
        if ((string) $story->user_id !== (string) $request->user()->id) {
            return $this->jsonErr('You can only delete your own stories', 403);
        }
        $story->delete();

        return $this->jsonOk(null, 'Story deleted successfully');
    }
}
