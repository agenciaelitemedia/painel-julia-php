<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class SingDocument extends Model
{
    protected $table = 'sing_document';
    protected $connection = 'pgsql';

    protected $fillable = [
        'id',
        'agent_id',
        'whatsapp_number',
        'cod_document',
        'status_document',
        'evo_url',
        'evo_instance',
        'evo_apikey',
        'created_at',
        'message_number',
        'signed_at',
        'resume_case',
        'signer_name',
        'signer_cpf',
        'signer_uf',
        'signer_cidade',
        'signer_bairro',
        'signer_endereco',
        'signer_cep',
        'cod_agent'
    ];

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
}
