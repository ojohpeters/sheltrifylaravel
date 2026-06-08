<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Generic transactional email for notifications. The same payload that
 * goes into the DB notifications table is rendered into a simple email.
 */
class NotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $recipientName,
        public string $mailSubject,
        public string $bodyText,
        public ?array $data = null,
        public ?string $ctaUrl = null,
        public ?string $ctaLabel = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->mailSubject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.notification',
            with: [
                'recipientName' => $this->recipientName,
                'bodyText'      => $this->bodyText,
                'data'          => $this->data ?? [],
                'ctaUrl'        => $this->ctaUrl,
                'ctaLabel'      => $this->ctaLabel,
                'appName'       => config('app.name', 'ShelTrify'),
            ],
        );
    }
}
