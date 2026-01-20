<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Criativo extends Model
{
    use HasFactory;

    protected $table = 'criativos';

    protected $fillable = [
        'nome',
        'url',
        'user_id',
        'extensao',
        'categoria_id',
        'titulo',
        'conteudo',
    ];

    public function getUrlAttribute($value)
    {
        return asset("storage/{$value}");
    }
}
