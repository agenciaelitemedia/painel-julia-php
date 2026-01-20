<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class LeadContracts extends Model
{
    protected $table = 'vw_leads_contratos';
    protected $connection = 'pgsql';
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

    public function scopeDefaultFilters(Builder $query)
    {
        return $query->whereMonth('data_lead', Carbon::now()->month)
                    ->whereYear('data_lead', Carbon::now()->year)
                    ->whereDay('data_lead', Carbon::now()->day);
    }

    public function scopeFilterByDateRange(Builder $query, $startDate = null, $endDate = null)
    {
        if ($startDate) {
            $query->where('data_lead', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('data_lead', '<=', $endDate);
        }
        return $query;
    }

    public function scopeFilterByAgent(Builder $query, $codAgent = null)
    {
        if (!$codAgent) {
            return $query;
        }

        return is_array($codAgent)
            ? $query->whereIn('cod_agent', $codAgent)
            : $query->where('cod_agent', $codAgent);
    }

    public function scopeFilterByEscritorio(Builder $query, $escritorio = null)
    {
        return $escritorio ? $query->where('escritorio', $escritorio) : $query;
    }

    public function scopeFilterByAgentType(Builder $query, $agentType = null)
    {
        return $agentType ? $query->where('agent_type', $agentType) : $query;
    }
}
