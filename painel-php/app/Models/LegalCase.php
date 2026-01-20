<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LegalCase extends Model
{
    protected $connection = 'pgsql';
    protected $table = 'legal_cases';

    protected $fillable = [
        'type',
        'name',
        'questions'
    ];

    public function scopeFilterByType($query, $type)
    {
        return $type ? $query->where('type', $type) : $query;
    }

    public function scopeFilterByName($query, $name)
    {
        return $name ? $query->where('name', 'ilike', "%{$name}%") : $query;
    }
}
