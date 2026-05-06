<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * Proxies Gemini API calls from the frontend so the API key never touches
 * the browser bundle or git history.
 */
class AiProxyController extends Controller
{
    private const BASE = 'https://generativelanguage.googleapis.com/v1beta';

    private function key(): ?string
    {
        return env('GEMINI_API_KEY');
    }

    private function call(string $model, array $payload): \Illuminate\Http\JsonResponse
    {
        $key = $this->key();
        if (! $key) {
            return response()->json(['error' => ['message' => 'AI service not configured on server.']], 503);
        }

        $url = self::BASE . "/models/{$model}:generateContent?key={$key}";

        $response = Http::timeout(90)->post($url, $payload);

        return response()->json($response->json(), $response->status());
    }

    /** General chat endpoint — used by the chatbot */
    public function chat(Request $request): \Illuminate\Http\JsonResponse
    {
        $model   = $request->input('model', 'gemini-2.5-flash');
        $payload = ['contents' => $request->input('contents', [])];

        $si = $request->input('systemInstruction');
        if ($si) {
            $payload['system_instruction'] = ['parts' => [['text' => $si]]];
        }

        $tools = $request->input('tools');
        if ($tools) {
            $payload['tools'] = $tools;
        }

        $gc = $request->input('generationConfig');
        if ($gc) {
            $payload['generation_config'] = $gc;
        }

        return $this->call($model, $payload);
    }

    /** Market insights — uses Google Search grounding */
    public function insights(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = $request->input('query', '');

        $systemPrompt = 'You are a real estate market analyst for the Nigerian rental market. '
            . 'Provide concise, data-driven insights. Answer clearly using markdown bullet points.';

        $payload = [
            'system_instruction' => ['parts' => [['text' => $systemPrompt]]],
            'contents'           => [['role' => 'user', 'parts' => [['text' => $query]]]],
            'tools'              => [['google_search' => (object) []]],
        ];

        return $this->call('gemini-2.5-flash', $payload);
    }

    /** Feels recommendations — structured JSON output */
    public function recommendations(Request $request): \Illuminate\Http\JsonResponse
    {
        $prompt = $request->input('prompt', '');
        $schema = $request->input('schema');

        $payload = [
            'contents' => [['role' => 'user', 'parts' => [['text' => $prompt]]]],
        ];

        if ($schema) {
            $payload['generation_config'] = [
                'response_mime_type' => 'application/json',
                'response_schema'    => $schema,
            ];
        }

        return $this->call('gemini-2.5-flash', $payload);
    }
}
