<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class ViewLeadCampanhaAnalytics extends Model
{
    protected $table = 'vw_leads_campains_analitics';
    protected $connection = 'pgsql';
    public $timestamps = false;

    protected $dates = [
        'campaing_created_at'
    ];

    public function scopeDefaultFilters($query)
    {
        return $query->whereDate('campaing_created_at', Carbon::today());
    }

    public function scopeFilterByDateRange($query, $startDate = null, $endDate = null)
    {
        if ($startDate && $endDate) {
            return $query->whereBetween('campaing_created_at', [$startDate, $endDate]);
        }

        return $query->defaultFilters();
    }

    public function scopeFilterByAgent($query, $codAgent = null)
    {
        if (!$codAgent) {
            return $query;
        }

        return is_array($codAgent)
            ? $query->whereIn('cod_agent', $codAgent)
            : $query->where('cod_agent', $codAgent);
    }

    public function scopeFilterByContract($query, $status = null)
    {
        return $status ? $query->whereIn('status_document', $status) : $query;
    }

    public function scopeFilterByAgentType(Builder $query, $agentType = null)
    {
        return $agentType ? $query->where('agent_type', $agentType) : $query;
    }
}
