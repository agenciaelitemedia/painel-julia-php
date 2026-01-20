<?php

namespace App\Traits;

use Illuminate\Http\Request;
use App\Models\Agent;
use Illuminate\Support\Facades\Auth;

trait HandlesSettings
{
    /**
     * Ler os dados do atributo settings e enviar para a view.
     *
     * @param  int  $agentId
     * @return array
     */
    public function getSettings($agentId)
    {
        $agent = Agent::findOrFail($agentId);
        $settings = json_decode($agent->settings, true);
        return ['settings' => $settings, 'agentId' => $agentId];
    }

    /**
     * Receber e salvar os dados no atributo settings.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $agentId
     * @return bool
     */
    public function saveSettingsPersonalize(Request $request)
    {
        // Default values for all fields
        $defaultValues = [
            'AGENT_NAME' => 'JulIA',
            'AGENT_WELCOME' => '',
            'AGENT_ADDRESS' => '',
            'AGENT_SOCIALMEDIA' => '',
            'AGENT_TRANFER' => '',
            'USING_AUDIO' => true,

            'FOLLOWUP_5MIN_CHECK' => true,
            'FOLLOWUP_15MIN_CHECK' => true,
            'FOLLOWUP_30MIN_CHECK' => true,
            'FOLLOWUP_5MIN_TIME' => 5,
            'FOLLOWUP_15MIN_TIME' => 15,
            'FOLLOWUP_30MIN_TIME' => 30,
            'FOLLOWUP_5MIN' => 'Percebi que você não respondeu nossa última mensagem. Estou à disposição para ajudar com o que for necessário. Podemos continuar nossa conversa?',
            'FOLLOWUP_15MIN' => 'Oi! Quero muito ajudar com seu caso. Podemos continuar nossa conversa para entender melhor a situação e oferecer o acompanhamento ideal de nossos advogado?',
            'FOLLOWUP_30MIN' => 'Olá, devido à ausência de resposta, estou encerrando nossa conversa. Se precisar de ajuda novamente, por favor, entre em contato. Será um prazer atendê-lo(a)!',

            'FOLLOWUP_5MIN_CALL' => true,
            'FOLLOWUP_15MIN_CALL' => false,
            'FOLLOWUP_30MIN_CALL' => false,

            'NOTIFY_DOC_CREATED_CHECK' => false,
            'NOTIFY_DOC_SIGNED_CHECK' => false,
            'NOTIFY_DOC_DELETED_CHECK' => false,
            'NOTIFY_DOC_CREATED' => '',
            'NOTIFY_DOC_SIGNED' => '',
            'NOTIFY_DOC_DELETED' => '',

            'CHAT_RESUME' => true,
            'ONLY_ME_RESUME' => true,
            'NOTIFY_RESUME' => '',
            'NOTIFY_GROUP' => '',

            'FLOWISE_AGENT' => 'https://flw01.aiagents.com.br/api/v1/prediction/b10d9f92-744d-4bb7-aaaa-7b6045e29741',

            'ONLY_CAMPAIGN' => false,
            'SESSION_START' => '#start',
            'START_CAMPAIGN' => 'vi seu anúncio na internet e preciso de um especialista em Direito Trabalhista||Tenho interesse e queria saber mais informações||Tenho interesse e queria mais informações',

            'SESSION_LIFETIME' => 365,
            'SESSION_CHECK_RESUMO' => '#vou resumir',
            'SESSION_CHECK_SPECIALIZED' => 'transferir para o atendimento especializado'
        ];

        // Merge default values with request
        foreach ($defaultValues as $key => $value) {
            $requestValue = $request->input($key);
            if ($request->has($key) && $requestValue !== '' && $requestValue !== null) {
                $defaultValues[$key] = $requestValue;
            }
        }
        $request->merge($defaultValues);

        // Define boolean fields
        $booleanFields = [
            'USING_AUDIO',
            'CHAT_RESUME',
            'ONLY_ME_RESUME',
            'FOLLOWUP_5MIN_CHECK',
            'FOLLOWUP_15MIN_CHECK',
            'FOLLOWUP_30MIN_CHECK',
            'FOLLOWUP_5MIN_CALL',
            'FOLLOWUP_15MIN_CALL',
            'FOLLOWUP_30MIN_CALL',
            'NOTIFY_DOC_CREATED_CHECK',
            'NOTIFY_DOC_SIGNED_CHECK',
            'NOTIFY_DOC_DELETED_CHECK',
            'ONLY_CAMPAIGN'
        ];

        // Convert 'on' to true and other values to false for boolean fields
        $booleanValues = [];
        foreach ($booleanFields as $field) {
            $booleanValues[$field] = $request->input($field) === 'on';
        }
        $request->merge($booleanValues);

        // Validation rules
        $validationRules = [
            'AGENT_NAME' => 'required|string',
            'AGENT_WELCOME' => 'nullable|string',
            'AGENT_ADDRESS' => 'nullable|string',
            'AGENT_SOCIALMEDIA' => 'nullable|string',
            'AGENT_TRANFER' => 'nullable|string',
            'USING_AUDIO' => 'required|boolean',

            'FOLLOWUP_5MIN_CHECK' => 'required|boolean',
            'FOLLOWUP_15MIN_CHECK' => 'required|boolean',
            'FOLLOWUP_30MIN_CHECK' => 'required|boolean',
            'FOLLOWUP_5MIN_TIME' => 'required|integer',
            'FOLLOWUP_15MIN_TIME' => 'required|integer',
            'FOLLOWUP_30MIN_TIME' => 'required|integer',
            'FOLLOWUP_5MIN' => 'required|string',
            'FOLLOWUP_15MIN' => 'required|string',
            'FOLLOWUP_30MIN' => 'required|string',
            'FOLLOWUP_5MIN_CALL' => 'required|boolean',
            'FOLLOWUP_15MIN_CALL' => 'required|boolean',
            'FOLLOWUP_30MIN_CALL' => 'required|boolean',

            'NOTIFY_DOC_CREATED_CHECK' => 'required|boolean',
            'NOTIFY_DOC_SIGNED_CHECK' => 'required|boolean',
            'NOTIFY_DOC_DELETED_CHECK' => 'required|boolean',
            'NOTIFY_DOC_CREATED' => 'nullable|string',
            'NOTIFY_DOC_SIGNED' => 'nullable|string',
            'NOTIFY_DOC_DELETED' => 'nullable|string',

            'CHAT_RESUME' => 'required|boolean',
            'ONLY_ME_RESUME' => 'required|boolean',
            'NOTIFY_RESUME' => 'nullable|string',

            'FLOWISE_AGENT' => 'required|url',

            'ONLY_CAMPAIGN' => 'required|boolean',
            'SESSION_START' => 'required|string',
            'START_CAMPAIGN' => 'nullable|string',

            'SESSION_LIFETIME' => 'required|integer',
            'SESSION_CHECK_RESUMO' => 'required|string',
            'SESSION_CHECK_SPECIALIZED' => 'required|string'
        ];

        // Validate data
        $validatedData = $request->validate($validationRules);

        // Handle NOTIFY_DOC_CREATED
        if ($request->input('NOTIFY_DOC_CREATED_CHECK') === 'on') {
            $request->merge(['NOTIFY_DOC_CREATED' => $request->input('NOTIFY_DOC_CREATED')]);
            $request->validate([
                'NOTIFY_DOC_CREATED' => 'required|string',
            ], [
                'NOTIFY_DOC_CREATED.required' => 'O campo NÚMERO DO WHATSAPP é obrigatório.',
            ]);
        }

        // Handle NOTIFY_DOC_SIGNED
        if ($request->input('NOTIFY_DOC_SIGNED_CHECK') === 'on') {
            $request->merge(['NOTIFY_DOC_SIGNED' => $request->input('NOTIFY_DOC_SIGNED')]);
            $request->validate([
                'NOTIFY_DOC_SIGNED' => 'required|numeric|min:12',
            ], [
                'NOTIFY_DOC_SIGNED.required' => 'O campo NÚMERO DO WHATSAPP é obrigatório.',
                'NOTIFY_DOC_SIGNED.numeric' => 'O campo NÚMERO DO WHATSAPP deve conter apenas números.',
                'NOTIFY_DOC_SIGNED.min' => 'O campo NÚMERO DO WHATSAPP deve ter no mínimo 12 caracteres.',
            ]);
        }

        // Handle NOTIFY_DOC_DELETED
        if ($request->input('NOTIFY_DOC_DELETED_CHECK') === 'on') {
            $request->merge(['NOTIFY_DOC_DELETED' => $request->input('NOTIFY_DOC_DELETED')]);
            $request->validate([
                'NOTIFY_DOC_DELETED' => 'required|numeric|min:12',
            ], [
                'NOTIFY_DOC_DELETED.required' => 'O campo NÚMERO DO WHATSAPP é obrigatório.',
                'NOTIFY_DOC_DELETED.numeric' => 'O campo NÚMERO DO WHATSAPP deve conter apenas números.',
                'NOTIFY_DOC_DELETED.min' => 'O campo NÚMERO DO WHATSAPP deve ter no mínimo 12 caracteres.',
            ]);
        }

        // Handle NOTIFY_RESUME
        if ($request->input('NOTIFY_RESUME') === 'on') {
            $request->merge(['NOTIFY_RESUME' => $request->input('NOTIFY_RESUME_NUMERO')]);
            $request->validate([
                'NOTIFY_RESUME' => 'required|numeric|min:12',
            ], [
                'NOTIFY_RESUME.required' => 'O campo NÚMERO DO WHATSAPP é obrigatório.',
                'NOTIFY_RESUME.numeric' => 'O campo NÚMERO DO WHATSAPP deve conter apenas números.',
                'NOTIFY_RESUME.min' => 'O campo NÚMERO DO WHATSAPP deve ter no mínimo 12 caracteres.',
            ]);
        }

        // Handle NOTIFY_GROUP
        if ($request->input('NOTIFY_GROUP') === 'on') {
            $request->merge(['NOTIFY_GROUP' => $request->input('NOTIFY_GROUP_NUMERO')]);
            $request->validate([
                'NOTIFY_GROUP' => 'required',
            ], [
                'NOTIFY_GROUP.required' => 'O campo GRUPO DO WHATSAPP é obrigatório.',
            ]);
        }

        // Add NOTIFY_RESUME to validated data
        $validatedData['NOTIFY_GROUP'] = $request->input('NOTIFY_GROUP');
        $validatedData['NOTIFY_RESUME'] = $request->input('NOTIFY_RESUME');

        // Save settings
        $agent = Agent::selectClientByCodClient(Auth::user()->cod_agent);
        $agent->settings = json_encode($validatedData);
        $agent->save();

        return true;
    }
}
