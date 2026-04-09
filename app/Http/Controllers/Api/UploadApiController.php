<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadApiController extends Controller
{
    // Return a relative URL so it works regardless of APP_URL / port
    private function publicUrl(string $storagePath): string
    {
        return '/storage/' . $storagePath;
    }

    public function image(Request $request)
    {
        $request->validate([
            'image' => 'required|file|mimes:jpeg,jpg,png,gif,webp|max:10240', // 10 MB
        ]);

        $path = $request->file('image')->store('uploads/images', 'public');

        return $this->jsonOk([
            'url'      => $this->publicUrl($path),
            'filename' => basename($path),
            'size'     => $request->file('image')->getSize(),
            'mimetype' => $request->file('image')->getMimeType(),
        ], 'Image uploaded successfully');
    }

    public function video(Request $request)
    {
        $request->validate([
            'video' => 'required|file|mimes:mp4,mov,avi,webm,mkv|max:20480', // 20 MB
        ]);

        $path = $request->file('video')->store('uploads/videos', 'public');

        return $this->jsonOk([
            'url'      => $this->publicUrl($path),
            'filename' => basename($path),
            'size'     => $request->file('video')->getSize(),
            'mimetype' => $request->file('video')->getMimeType(),
        ], 'Video uploaded successfully');
    }

    public function media(Request $request)
    {
        $request->validate([
            'image' => 'nullable|file|mimes:jpeg,jpg,png,gif,webp|max:10240',
            'video' => 'nullable|file|mimes:mp4,mov,avi,webm,mkv|max:20480',
        ]);

        $out = [];
        if ($request->hasFile('image')) {
            $p = $request->file('image')->store('uploads/images', 'public');
            $out['imageUrl'] = $this->publicUrl($p);
        }
        if ($request->hasFile('video')) {
            $p = $request->file('video')->store('uploads/videos', 'public');
            $out['videoUrl'] = $this->publicUrl($p);
        }
        if ($out === []) {
            return $this->jsonErr('No files uploaded', 400);
        }

        return $this->jsonOk($out, 'Files uploaded successfully');
    }
}
