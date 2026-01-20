<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistoricoPersonalizacaoAgente extends Model
{
    protected $table = 'historico_personalizacao_agente';

    protected $fillable = [
        'alteracoes',
        'personalizacao_id',
    ];
}
