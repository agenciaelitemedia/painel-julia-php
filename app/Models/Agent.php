<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Agent extends Model
{
    use HasFactory;

    protected $connection = 'pgsql';
    protected $table = 'agents';

    protected $fillable = [
        'client_id',
        'uuid',
        'cod_agent',
        'openia_apikey',
        'audio_apikey',
        'openia_model',
        'voice_id',
        'settings',
        'status',
        'step',
        'is_closer'
    ];

    protected $casts = [
        'settings' => 'json',
        'status' => 'boolean',
        'is_closer' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'uuid' => 'string'
    ];

    protected $attributes = [
        'openia_apikey' => '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',
        'audio_apikey' => 'Bearer 7feaf170-9692-11ef-90ff-d3445512321b',
        'openia_model' => 'gpt-4o-mini',
        'voice_id' => 'ai3-pt-BR-MatildeV2',
        'status' => true,
        'is_closer' => false,
    ];

    /**
     * Relacionamento com o cliente
     */
    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id', 'id');
    }

    /**
     * Relacionamento com as configurações de override
     */
    public function overrideSetting()
    {
        return $this->hasOne(OverrideSetting::class, 'agent_id', 'id');
    }

    /**
     * Relacionamento com as configurações de uso
     */
    public function usedAgent()
    {
        return $this->hasOne(UsedAgent::class, 'agent_id', 'id');
    }

    /**
     * Busca um agente pelo código do agente
     *
     * @param int $codAgent
     * @return Agent|null
     */
    public static function selectClientByCodClient($codAgent)
    {
        return self::where('cod_agent', $codAgent)
            ->select('*')
            ->first();
    }

    /**
     * Busca um agente pelo UUID
     *
     * @param string $uuid
     * @return Agent|null
     */
    public static function findByUuid($uuid)
    {
        return self::where('uuid', $uuid)->first();
    }

    /**
     * Busca agentes ativos
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getActiveAgents()
    {
        return self::where('status', true)
            ->orderBy('cod_agent')
            ->get();
    }

    /**
     * Busca agentes por cliente
     *
     * @param int $clientId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getAgentsByClient($clientId)
    {
        return self::where('client_id', $clientId)
            ->orderBy('cod_agent')
            ->get();
    }

    /**
     * Verifica se o agente está ativo
     *
     * @return bool
     */
    public function isActive()
    {
        return $this->status === true;
    }

    /**
     * Atualiza o status do agente
     *
     * @param bool $status
     * @return bool
     */
    public function updateStatus($status)
    {
        return $this->update(['status' => $status]);
    }

    /**
     * Atualiza as configurações do agente
     *
     * @param array $settings
     * @return bool
     */
    public function updateSettings($settings)
    {
        return $this->update(['settings' => $settings]);
    }

    /**
     * Atualiza o passo atual do agente
     *
     * @param string $step
     * @return bool
     */
    public function updateStep($step)
    {
        return $this->update(['step' => $step]);
    }

    /**
     * Scope para agentes ativos
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    /**
     * Scope para agentes por modelo OpenAI
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $model
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByOpenAIModel($query, $model)
    {
        return $query->where('openia_model', $model);
    }

    /**
     * Scope para agentes por modelo de voz
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $voiceId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByVoiceModel($query, $voiceId)
    {
        return $query->where('voice_id', $voiceId);
    }

    /**
     * Obtém o próximo código de agente disponível
     *
     * @return int
     */
    public static function getNextCodAgent()
    {
        $lastAgent = self::orderBy('cod_agent', 'desc')->first();
        return $lastAgent ? $lastAgent->cod_agent + 1 : 1;
    }

    /**
     * Accessor para obter configurações específicas
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public function getSetting($key, $default = null)
    {
        return data_get($this->settings, $key, $default);
    }

    /**
     * Mutator para definir configurações específicas
     *
     * @param string $key
     * @param mixed $value
     * @return void
     */
    public function setSetting($key, $value)
    {
        $settings = $this->settings ?? [];
        data_set($settings, $key, $value);
        $this->settings = $settings;
        $this->save();
    }

    /**
     * Obtém o uso atual do agente
     */
    public function getUsageAttribute()
    {
        // Implemente a lógica para calcular o uso atual
        return 0; // Placeholder
    }
}
