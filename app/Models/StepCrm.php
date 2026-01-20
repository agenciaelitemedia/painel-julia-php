<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StepCrm extends Model
{
    protected $table = 'step_crm';
    protected $connection = 'pgsql';

    protected $fillable = [
        'cod_agent',
        'number',
        'step',
    ];
}
