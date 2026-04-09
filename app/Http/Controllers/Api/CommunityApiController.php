<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommunityComment;
use App\Models\CommunityPost;
use Illuminate\Http\Request;

class CommunityApiController extends Controller
{
    public function postsIndex(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = max(1, min(100, (int) $request->query('limit', 20)));
        $q = CommunityPost::query()->withCount('comments');
        if ($request->filled('category')) {
            $q->where('category', $request->query('category'));
        }
        $total = (clone $q)->count();
        $posts = $q->with([
            'user:id,email,full_name,avatar_url',
            'comments' => fn ($c) => $c->with('user:id,email,full_name,avatar_url')->orderByDesc('created_at')->limit(5),
        ])->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();

        return $this->jsonOk([
            'posts' => $posts,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => (int) ceil($total / $limit),
            ],
        ]);
    }

    public function postShow(string $id)
    {
        $post = CommunityPost::query()->withCount('comments')->with([
            'user:id,email,full_name,avatar_url',
            'comments' => fn ($c) => $c->with('user:id,email,full_name,avatar_url')->orderByDesc('created_at'),
        ])->find($id);
        if (! $post) {
            return $this->jsonErr('Post not found', 404);
        }

        return $this->jsonOk($post);
    }

    public function postStore(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string',
            'content' => 'nullable|string',
            'category' => 'nullable|string',
            'imageUrl' => 'nullable|string',
            'videoUrl' => 'nullable|string',
        ]);

        $post = CommunityPost::create([
            'user_id' => $request->user()->id,
            'title' => $data['title'],
            'content' => $data['content'] ?? null,
            'category' => $data['category'] ?? 'General',
            'image_url' => $data['imageUrl'] ?? null,
            'video_url' => $data['videoUrl'] ?? null,
        ]);
        $post->load(['user:id,email,full_name,avatar_url', 'comments.user:id,email,full_name,avatar_url']);

        return $this->jsonOk($post, 'Post created successfully', 201);
    }

    public function like(string $id)
    {
        $post = CommunityPost::query()->find($id);
        if (! $post) {
            return $this->jsonErr('Post not found', 404);
        }
        $post->increment('likes');

        return $this->jsonOk($post->fresh(), 'Post liked');
    }

    public function love(string $id)
    {
        $post = CommunityPost::query()->find($id);
        if (! $post) {
            return $this->jsonErr('Post not found', 404);
        }
        $post->increment('loves');

        return $this->jsonOk($post->fresh(), 'Post loved');
    }

    public function comment(Request $request, string $id)
    {
        $data = $request->validate(['text' => 'required|string']);
        $post = CommunityPost::query()->find($id);
        if (! $post) {
            return $this->jsonErr('Post not found', 404);
        }
        $comment = CommunityComment::create([
            'post_id' => $id,
            'user_id' => $request->user()->id,
            'text' => $data['text'],
            'created_at' => now(),
        ]);
        $post->increment('replies');
        $comment->load('user:id,email,full_name,avatar_url');

        return $this->jsonOk($comment, 'Comment added', 201);
    }

    public function postDestroy(Request $request, string $id)
    {
        $post = CommunityPost::query()->find($id);
        if (! $post) {
            return $this->jsonErr('Post not found', 404);
        }
        if ((string) $post->user_id !== (string) $request->user()->id) {
            return $this->jsonErr('You can only delete your own posts', 403);
        }
        $post->delete();

        return $this->jsonOk(null, 'Post deleted successfully');
    }
}
