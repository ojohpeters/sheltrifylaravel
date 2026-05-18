<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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

    /**
     * Send a fully-built payload to Gemini.
     * Uses withBody() + explicit application/json so Laravel's HTTP client
     * cannot fall back to form-encoded for any reason.
     */
    private function call(string $model, array $payload): \Illuminate\Http\JsonResponse
    {
        $key = $this->key();
        if (! $key) {
            return response()->json(['error' => ['message' => 'AI service not configured on server.']], 503);
        }

        $url = self::BASE . "/models/{$model}:generateContent?key={$key}";

        $jsonBody = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $response = Http::timeout(90)
            ->withHeaders(['Content-Type' => 'application/json', 'Accept' => 'application/json'])
            ->withBody($jsonBody, 'application/json')
            ->post($url);

        if (! $response->successful()) {
            Log::warning('Gemini API call failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
                'sentPayloadKeys' => array_keys($payload),
                'contentsCount'   => is_array($payload['contents'] ?? null) ? count($payload['contents']) : 0,
            ]);
        }

        return response()->json($response->json(), $response->status());
    }

    /**
     * Read the request body as JSON regardless of Laravel's content-type
     * detection. Falls back to $request->all() if the raw body is empty.
     */
    private function readBody(Request $request): array
    {
        $raw = $request->getContent();
        if (! empty($raw)) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }
        return $request->all();
    }

    /** General chat endpoint — used by the chatbot */
    public function chat(Request $request): \Illuminate\Http\JsonResponse
    {
        $body  = $this->readBody($request);
        $model = $body['model'] ?? 'gemini-2.5-flash';

        $contents = $body['contents'] ?? [];
        if (empty($contents)) {
            $raw = $request->getContent();
            Log::warning('AiProxyController::chat received empty contents', [
                'bodyKeys'    => array_keys($body),
                'rawBodyLen'  => strlen($raw),
                'contentType' => $request->header('Content-Type'),
            ]);
            return response()->json([
                'error' => ['message' => 'No message content provided.'],
                'debug' => [
                    'bodyKeys'    => array_keys($body),
                    'rawBodyLen'  => strlen($raw),
                    'rawBodyPrefix' => substr($raw, 0, 400),
                    'contentType' => $request->header('Content-Type'),
                    'allKeys'     => array_keys($request->all()),
                ],
            ], 400);
        }

        $payload = ['contents' => $contents];

        if (! empty($body['systemInstruction'])) {
            $payload['system_instruction'] = ['parts' => [['text' => $body['systemInstruction']]]];
        }

        if (! empty($body['tools'])) {
            $payload['tools'] = $body['tools'];
        }

        if (! empty($body['generationConfig'])) {
            $payload['generation_config'] = $body['generationConfig'];
        }

        return $this->call($model, $payload);
    }

    /** Market insights — uses Google Search grounding */
    public function insights(Request $request): \Illuminate\Http\JsonResponse
    {
        $body  = $this->readBody($request);
        $query = $body['query'] ?? '';

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
        $body   = $this->readBody($request);
        $prompt = $body['prompt'] ?? '';
        $schema = $body['schema'] ?? null;

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
