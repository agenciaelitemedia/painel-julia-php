<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ViewStepCrm extends Model
{
    protected $table = 'vw_last_step_crm';
    protected $connection = 'pgsql';

    protected $fillable = [
        'cod_agent',
        'number',
        'step',
    ];
}
