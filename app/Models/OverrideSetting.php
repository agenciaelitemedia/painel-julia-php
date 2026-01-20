<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OverrideSetting extends Model
{
    use HasFactory;

    protected $connection = 'pgsql';
    protected $table = 'override_settings';

    /**
     * Os atributos que são atribuíveis em massa.
     *
     * @var array<string>
     */
    protected $fillable = [
        'agent_id',
        'override_databasename',
        'override_collectionname',
        'override_qdrantcollection',
        'override_systemmessage',
        'prompt',
        'header_prompt',
        'custom_prompt',
        'override_modelname_chatopenai_0',
    ];

    /**
     * Os atributos que possuem valores padrão.
     *
     * @var array
     */
    protected $attributes = [
        'override_databasename' => 'mem_aiagents_0000',
        'override_qdrantcollection' => 'IA-SAAS-GLOBAL-v5',
        'override_modelname_chatopenai_0' => 'gpt-4o-mini',
        'override_systemmessageprompt_chatprompttemplate_0' => '---N/A---',
    ];

    /**
     * As regras de validação do modelo.
     *
     * @var array
     */
    public static $rules = [
        'agent_id' => 'required|exists:agents,id',
        'override_databasename' => 'required|string|max:50',
        'override_collectionname' => 'nullable|string|max:50',
        'override_qdrantcollection' => 'required|string|max:50',
        'override_systemmessage' => 'required|string',
        'prompt' => 'nullable|string',
        'header_prompt' => 'nullable|string',
        'custom_prompt' => 'nullable|string',
        'override_modelname_chatopenai_0' => 'nullable|string|max:50',
    ];

    /**
     * Relacionamento com o agente.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function agent()
    {
        return $this->belongsTo(Agent::class);
    }

    /**
     * Scope para buscar configurações por agente
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $agentId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByAgent($query, $agentId)
    {
        return $query->where('agent_id', $agentId);
    }

    /**
     * Scope para buscar por tipo de banco de dados
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $dbName
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByDatabase($query, $dbName)
    {
        return $query->where('override_databasename', $dbName);
    }

    /**
     * Atualiza as configurações de um agente
     *
     * @param array $settings
     * @return bool
     */
    public function updateSettings(array $settings)
    {
        return $this->update(array_intersect_key(
            $settings,
            array_flip($this->fillable)
        ));
    }

    /**
     * Obtém as configurações completas do agente
     *
     * @return array
     */
    public function getFullSettings()
    {
        return [
            'database' => $this->override_databasename,
            'collection' => $this->override_collectionname,
            'qdrant' => $this->override_qdrantcollection,
            'system_message' => $this->override_systemmessage,
            'prompts' => [
                'main' => $this->prompt,
                'header' => $this->header_prompt,
                'custom' => $this->custom_prompt,
            ],
            'model' => $this->override_modelname_chatopenai_0,
        ];
    }

    /**
     * Verifica se as configurações são válidas
     *
     * @return bool
     */
    public function isValid()
    {
        return !empty($this->override_databasename) &&
               !empty($this->override_qdrantcollection) &&
               !empty($this->override_systemmessage);
    }

    /**
     * Boot do modelo
     */
    protected static function boot()
    {
        parent::boot();

        // Antes de salvar, garante que os valores padrão estejam definidos
        static::saving(function ($model) {
            $model->override_databasename = $model->override_databasename ?? 'mem_aiagents_0000';
            $model->override_qdrantcollection = $model->override_qdrantcollection ?? 'IA-SAAS-GLOBAL-v5';
            $model->override_modelname_chatopenai_0 = $model->override_modelname_chatopenai_0 ?? 'gpt-4o-mini';
            $model->override_systemmessageprompt_chatprompttemplate_0 = '---N/A---';
        });
    }
}
