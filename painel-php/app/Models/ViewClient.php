<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ViewClient extends Model
{
    use HasFactory;

    protected $connection = 'pgsql';
    protected $table = 'view_clients';

    // Método estático para selecionar campos específicos e pegar um único registro
    public static function selectClientByCodAgent($codAgent)
    {
        return self::where('cod_agent', $codAgent)
            ->select('*') // Adicione os campos que você deseja selecionar
            ->first();
    }
}
