<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class viewCicloMessage extends Model
{
    use HasFactory;

    protected $connection = 'pgsql';
    protected $table = 'view_ciclo_messages';

    // Método estático para selecionar campos específicos e pegar um único registro
    public static function selectTotalByCodAgentAll($codAgent)
    {
        return self::where('cod_agent', $codAgent)
            ->select('*') // Adicione os campos que você deseja selecionar
            ->get();
    }

    // Método estático para selecionar campos específicos e pegar um único registro
    public static function selectTotalByCodAgentFirst($codAgent)
    {
        return self::where('cod_agent', $codAgent)
            ->select('*') // Adicione os campos que você deseja selecionar
            ->first();
    }

}
