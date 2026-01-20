<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CategoriaCriativo extends Model
{
    use HasFactory;

    protected $table = 'categorias_criativos';

    protected $fillable = [
        'nome',
    ];
}
