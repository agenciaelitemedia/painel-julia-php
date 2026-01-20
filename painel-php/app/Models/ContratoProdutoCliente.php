<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContratoProdutoCliente extends Model
{
    protected $table = 'contratos_produtos_cliente';

    protected $fillable = [
        'nome',
        'user_id',
        'produto_cliente_id',
        'url',
    ];


    public function getVideoHonorariosAttribute($value)
    {
        if ($value) {
            return asset("storage/{$value}");
        } else {
            return null;
        }
    }
}
