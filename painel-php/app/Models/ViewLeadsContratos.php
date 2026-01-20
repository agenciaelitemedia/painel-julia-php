<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class ViewLeadsContratos extends Model
{
    protected $connection = 'pgsql';
    protected $table = 'vw_leads_contratos';

    public $timestamps = false;

    protected $fillable = [
        'escritorio',
        'cod_agent',
        'agent_type',
        'data_lead',
        'total_leads',
        'total_gerados',
        'total_assinados',
        'taxa_leads_gerados',
        'taxa_leads_assinados',
        'taxa_gerados_assinados'
    ];

    public static function getLeadsByCodAgent($codAgent)
    {
        return self::where('cod_agent', $codAgent)
           // ->whereRaw('data_lead >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)')
            ->orderBy('data_lead', 'asc')
            ->get();
    }

    public function scopeFilterByAgentType(Builder $query, $agentType = null)
    {
        return $agentType ? $query->where('agent_type', $agentType) : $query;
    }
}
