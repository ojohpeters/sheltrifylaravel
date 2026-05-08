<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ContactApiController extends Controller
{
    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'subject' => 'required|string',
            'message' => 'required|string',
        ]);

        try {
            Mail::html(
                "<h2>New Contact Form Submission</h2><p><strong>Name:</strong> ".e($data['name'])."</p>".
                "<p><strong>Email:</strong> ".e($data['email'])."</p><p><strong>Subject:</strong> ".e($data['subject'])."</p><hr><p>".nl2br(e($data['message'])).'</p>',
                function ($m) use ($data) {
                    $m->to(config('services.contact.to'))
                        ->replyTo($data['email'])
                        ->subject('Contact Form: '.$data['subject']);
                }
            );
        } catch (\Throwable $e) {
            Log::error('Contact form email failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->jsonErr('Failed to send message. Please try again later.', 500);
        }

        return $this->jsonOk(null, 'Message sent successfully!');
    }
}
