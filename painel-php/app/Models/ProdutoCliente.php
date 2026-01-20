<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProdutoCliente extends Model
{
    protected $table = 'produtos_clientes';

    protected $fillable = [
        'nome',
        'categoria',
        'perguntas',
        'frase_ativacao',
        'explicacao_honorarios',
        'video_honorarios',
        'contrato',
        'user_id',
        'produto_id',
        'documentos_solicitados'
    ];


    public function getVideoHonorariosAttribute($value)
    {
        if ($value) {
            return asset("storage/{$value}");
        } else {
            return null;
        }
    }



    public function getContratoAttribute($value)
    {
        if ($value) {
            return asset("storage/{$value}");
        } else {
            return null;
        }
    }
}
