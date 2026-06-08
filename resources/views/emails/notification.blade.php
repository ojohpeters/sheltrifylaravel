<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $appName }}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1f2937;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:24px 12px;">
        <tr>
            <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                    <tr>
                        <td style="padding:24px 28px;background:#0d6efd;color:#fff;">
                            <h1 style="margin:0;font-size:20px;font-weight:700;">{{ $appName }}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px;">
                            <p style="margin:0 0 12px;font-size:16px;">Hi {{ $recipientName ?: 'there' }},</p>
                            <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#374151;">
                                {{ $bodyText }}
                            </p>

                            @if(!empty($data['seekerName']) || !empty($data['seekerPhone']) || !empty($data['seekerEmail']))
                                <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:14px 0;">
                                    <p style="margin:0 0 6px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Contact details</p>
                                    @if(!empty($data['seekerName']))<p style="margin:2px 0;font-size:14px;"><strong>Name:</strong> {{ $data['seekerName'] }}</p>@endif
                                    @if(!empty($data['seekerPhone']))<p style="margin:2px 0;font-size:14px;"><strong>Phone:</strong> {{ $data['seekerPhone'] }}</p>@endif
                                    @if(!empty($data['seekerEmail']))<p style="margin:2px 0;font-size:14px;"><strong>Email:</strong> {{ $data['seekerEmail'] }}</p>@endif
                                    @if(!empty($data['productName']))<p style="margin:2px 0;font-size:14px;"><strong>Listing:</strong> {{ $data['productName'] }}</p>@endif
                                </div>
                            @endif

                            @if($ctaUrl)
                                <p style="margin:24px 0 8px;">
                                    <a href="{{ $ctaUrl }}" style="background:#0d6efd;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;display:inline-block;">{{ $ctaLabel ?: 'View on ShelTrify' }}</a>
                                </p>
                            @endif

                            <p style="margin:28px 0 0;font-size:12px;color:#9ca3af;">
                                You are receiving this because you have an account on {{ $appName }}.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
