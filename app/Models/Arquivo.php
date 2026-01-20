<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Arquivo extends Model
{
    use HasFactory;

    protected $table = 'arquivos';

    protected $fillable = [
        'nome',
        'url',
        'user_id',
        'extensao',
    ];

    public function getUrlAttribute($value)
    {
        return asset("storage/{$value}");
    }
}
