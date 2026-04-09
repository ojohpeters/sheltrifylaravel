<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfessionalProfile extends Model
{
    protected $fillable = [
        'user_id', 'professional_type', 'company_name', 'license_number',
        'license_url', 'nin_number', 'cac_number', 'cac_document_url',
        'professional_body', 'membership_id', 'membership_doc_url',
        'business_address', 'years_experience', 'bio',
        'status', 'rejection_reason', 'approved_at', 'approved_by',
    ];

    protected function casts(): array
    {
        return ['approved_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
