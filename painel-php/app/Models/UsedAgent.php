<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UsedAgent extends Model
{
    protected $connection = 'pgsql';
    protected $table = 'used_agents';

    public $timestamps = false;

    protected $fillable = [
        'client_id',
        'agent_id',
        'cod_agent',
        'plan',
        'due_date',
        'limit',
        'used',
        'last_used'
    ];

    protected $casts = [
        'client_id' => 'integer',
        'agent_id' => 'integer',
        'cod_agent' => 'integer',
        'due_date' => 'integer',
        'limit' => 'integer'
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function agent()
    {
        return $this->belongsTo(Agent::class);
    }
}
