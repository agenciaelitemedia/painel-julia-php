<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class ViewLeadCampanha extends Model
{
    protected $table = 'vw_leads_campanha';
    protected $connection = 'pgsql';
    public $timestamps = false;

    protected $fillable = [
        'name',
        'cod_agent',
        'agent_type',
        'session_id',
        'agent_id',
        'whatsapp_number',
        'active',
        'type_campaing',
        'campaign_data',
        'cod_document',
        'status_document',
        'sourceurl',
        'title',
        'mediatype',
        'thumbnailurl',
        'created_at'
    ];

    public function contrato()
    {
        return $this->hasMany(ViewSingDocument::class, 'whatsapp_number', 'whatsapp_number')
            ->where('cod_agent', $this->cod_agent);
    }

    public function scopeDefaultFilters(Builder $query)
    {
        return $query->whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->whereDay('created_at', Carbon::now()->day);
    }

    public function scopeFilterByDateRange(Builder $query, $startDate = null, $endDate = null)
    {
        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
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

    public function scopeFilterByCampaign(Builder $query, $hasCampaign = null)
    {
        if ($hasCampaign === 'yes') {
            return $query->whereNotNull('type_campaing');
        } elseif ($hasCampaign === 'no') {
            return $query->whereNull('type_campaing');
        }
        return $query;
    }

    public function scopeFilterByContract(Builder $query, $contractStatus = [])
    {
        if (!empty($contractStatus)) {
            return $query->whereIn('status_document', $contractStatus);
        }
        return $query;
    }

    public function scopeFilterByAgentType(Builder $query, $agentType = null)
    {
        return $agentType ? $query->where('agent_type', $agentType) : $query;
    }
}
