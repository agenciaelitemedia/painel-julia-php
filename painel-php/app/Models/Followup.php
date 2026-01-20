<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Followup extends Model
{
    use HasFactory;

    protected $table = 'followups';


    public static function selectByCodAgent($codClient, $state='SEND')
    {
        return self::where('cod_agent', $codClient)->where('state', $state)
            ->select('*')
            ->get();
    }
}
