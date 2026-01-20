<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FollowupConfig extends Model
{
    protected $table = 'followup_config';

    protected $casts = [
        'step_cadence' => 'array',
        'msg_cadence' => 'array',
        'title_cadence' => 'array',
        'auto_message' => 'boolean'
    ];

    protected $fillable = [
        'cod_agent',
        'step_cadence',
        'msg_cadence',
        'title_cadence',
        'start_hours',
        'end_hours',
        'auto_message',
        'followup_from',
        'followup_to'
    ];

    public static function selectByCodAgent($codAgent)
    {
        return self::where('cod_agent', $codAgent)->first();
    }
}
