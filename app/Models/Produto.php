<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Produto extends Model
{
    protected $table = 'produtos';

    protected $fillable = [
        'nome',
        'categoria',
        'perguntas',
        'frase_ativacao',
        'explicacao_honorarios',
        'video_honorarios',
        'contrato',
    ];
}
