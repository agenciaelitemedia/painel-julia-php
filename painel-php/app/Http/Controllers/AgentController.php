<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Agent;
use Illuminate\Support\Facades\Validator;
use App\Models\Client;
use Illuminate\Support\Str;
use App\Models\OverrideSetting;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Http\Controllers\EvolutionController;
use App\Models\UsedAgent;
use Illuminate\Support\Facades\DB;

class AgentController extends Controller
{
    /**
     * Display a listing of agents
     */
    public function index()
    {
        $agents = Agent::with([
            'client' => function ($query) {
                $query->select('id', 'name', 'business_name', 'federal_id', 'email', 'phone');
            },
            'usedAgent' => function ($query) {
                $query->select('id', 'agent_id', 'client_id', 'plan', 'due_date', 'limit', 'used', 'last_used');
            }
        ])
            ->select('agents.*')
            ->orderBy('cod_agent', 'desc')
            ->paginate(100);

        // Debug para verificar os dados
        //dd($agents->first()->toArray());

        return view('agents.index', compact('agents'));
    }

    /**
     * Show the form for creating a new agent
     */
    public function create()
    {
        return view('agents.create');
    }

    /**
     * Store a newly created agent
     */
    public function store(Request $request)
    {
        // Validação dos campos
        $validator = Validator::make($request->all(), [
            // Validação para Client
            'name' => 'required|string|max:100',
            'business_name' => 'required|string|max:100',
            'federal_id' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'phone' => 'required|string|max:20',

            // Validaço para Agent
            'openia_apikey' => 'required|string|starts_with:sk-',
            //'audio_apikey' => 'required|string|starts_with:Bearer',
            'openia_model' => 'required|string|max:50',
            //'voice_id' => 'required|string|max:50',
            'settings' => 'required|json',
            'status' => 'boolean',

            // Validações para override_settings
            'override_databasename' => 'required|string|max:50',
            'override_collectionname' => 'nullable|string|max:50',
            'override_qdrantcollection' => 'required|string|max:50',
            'override_systemmessage' => 'nullable|string',
            'prompt' => 'nullable|string',
            'header_prompt' => 'nullable|string',
            'custom_prompt' => 'nullable|string',
            'override_modelname_chatopenai_0' => 'nullable|string|max:50',
            'plan' => 'nullable|string',
            'due_date' => 'nullable|integer|min:1|max:31',
            'limit' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {

            return redirect()
                ->back()
                ->withErrors($validator)
                ->withInput()
                ->with('error', 'Por favor, corrija os erros no formulário.');
        }

        try {
            DB::beginTransaction();

            // 1. Criar novo cliente
            $client = Client::create([
                'name' => $request->name,
                'business_name' => $request->business_name,
                'federal_id' => $request->cpf_cnpj,
                'email' => $request->email,
                'phone' => $request->phone,
            ]);

            // 2. Criar novo agente
            $agent = new Agent();
            $agent->client_id = $client->id;
            $agent->uuid = Str::uuid()->toString();
            $agent->cod_agent = $request->cod_client; //Agent::getNextCodAgent();
            $agent->openia_apikey = $request->openia_apikey ?? $agent->getAttributes()['openia_apikey'];
            $agent->audio_apikey = $request->audio_apikey ?? $agent->getAttributes()['audio_apikey'];
            $agent->openia_model = $request->openia_model ?? $agent->getAttributes()['openia_model'];
            $agent->voice_id = $request->voice_id ?? $agent->getAttributes()['voice_id'];
            $agent->settings = json_decode($request->settings);
            $agent->status = $request->status ?? true;
            $agent->save();

            // 3. Criar registro na tabela override_settings usando o modelo
            OverrideSetting::create([
                'agent_id' => $agent->id,
                'override_databasename' => $request->override_databasename,
                'override_collectionname' => $request->override_collectionname,
                'override_qdrantcollection' => $request->override_qdrantcollection,
                'override_systemmessage' => $request->override_systemmessage,
                'override_modelname_chatopenai_0' => $request->override_modelname_chatopenai_0,
                'prompt' => $request->prompt,
                'custom_prompt' => $request->custom_prompt,
                'header_prompt' => $request->header_prompt,
            ]);

            // 4. Criar registro na tabela used_agents
            UsedAgent::create([
                'client_id' => $client->id,
                'agent_id' => $agent->id,
                'cod_agent' => $agent->cod_agent,
                'plan' => $request->plan,
                'due_date' => $request->due_date,
                'limit' => $request->limit
            ]);

            // 5. Criar usuário
            $firstName = $request->name;
            $formattedName = Str::ascii($firstName);
            $formattedName = trim(preg_replace('/[^A-Za-z0-9]/', '_', $formattedName));

            $evoInstance = sprintf('[%d]-[ADV]-%s', $agent->cod_agent, $formattedName);

            User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make('Julia@0028'),
                'evo_apikey' => $agent->uuid,
                'evo_url' => 'evo001.atendejulia.com.br',
                'evo_instance' => $evoInstance,
                'cod_agent' => $agent->cod_agent
            ]);

            // 6. Criar instância no Evolution
            $evolutionController = new EvolutionController();
            $evolutionResponse = $evolutionController->createInstance($evoInstance, $agent->uuid);

            // Verifica se a criação da instância foi bem sucedida
            if (!$evolutionResponse->isSuccessful()) {
                throw new \Exception('Erro ao criar instância no Evolution: ' . $evolutionResponse->getData()->message);
            }

            DB::commit();

            return redirect()
                ->route('agents.index')
                ->with('success', 'Cliente, Agente, Configurações e Instância Evolution criados com sucesso!');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erro ao criar registros: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            dd($e->getMessage());
            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Erro ao criar registros: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified agent
     */
    public function show(Agent $agent)
    {
        return view('agents.show', compact('agent'));
    }

    /**
     * Show the form for editing the specified agent
     */
    public function edit($id)
    {
        $agent = Agent::with([
            'client' => function ($query) {
                $query->select('id', 'name', 'business_name', 'federal_id', 'email', 'phone');
            },
            'overrideSetting' => function ($query) {
                $query->select(
                    'id',
                    'agent_id',
                    'override_databasename',
                    'override_collectionname',
                    'override_qdrantcollection',
                    'override_systemmessage',
                    'override_modelname_chatopenai_0',
                    'prompt',
                    'custom_prompt',
                    'header_prompt'
                );
            },
            'usedAgent' => function ($query) {
                $query->select('id', 'agent_id', 'client_id', 'plan', 'due_date', 'limit');
            }
        ])
            ->findOrFail($id);

        // Verifica se todos os relacionamentos existem
        // if (!$agent->client || !$agent->overrideSetting || !$agent->usedAgent) {
        //     return redirect()
        //         ->route('agents.index')
        //         ->with('error', 'Agente com dados incompletos. Por favor, verifique os relacionamentos.');
        // }

        return view('agents.edit', compact('agent'));
    }

    /**
     * Update the specified agent
     */
    public function update(Request $request, $id)
    {
        // Encontra o agente com todos os relacionamentos
        $agent = Agent::with(['client', 'overrideSetting', 'usedAgent'])
            ->findOrFail($id);

        // Verifica se todos os relacionamentos existem
        if (!$agent->client || !$agent->overrideSetting || !$agent->usedAgent) {
            return redirect()
                ->back()
                ->with('error', 'Agente com dados incompletos. Por favor, verifique os relacionamentos.');
        }

        // Validação dos campos
        $validator = Validator::make($request->all(), [
            // Validação para Client
            'name' => 'required|string|max:100',
            'business_name' => 'required|string|max:100',
            'federal_id' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'phone' => 'nullable|string|max:20',

            // Validação para Agent
            'openia_apikey' => 'required|string|starts_with:sk-',
            //'audio_apikey' => 'required|string|starts_with:Bearer',
            'audio_apikey' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    if (!preg_match('/^(Bearer|sk_)/', $value)) {
                        $fail($attribute . ' deve começar com "Bearer" ou "sk_".');
                    }
                },
            ],

            'openia_model' => 'required|string|max:50',
            'voice_id' => 'required|string|max:50',
            'settings' => 'required|json',
            'status' => 'boolean',
            'is_closer' => 'boolean',

            // Validações para override_settings
            'override_databasename' => 'required|string|max:50',
            'override_collectionname' => 'nullable|string|max:50',
            'override_qdrantcollection' => 'required|string|max:50',
            'override_systemmessage' => 'nullable|string',
            'prompt' => 'nullable|string',
            'header_prompt' => 'nullable|string',
            'custom_prompt' => 'nullable|string',
            'override_modelname_chatopenai_0' => 'nullable|string|max:50',
            'plan' => 'nullable|string',
            'due_date' => 'nullable|integer|min:1|max:31',
            'limit' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return redirect()
                ->back()
                ->withErrors($validator)
                ->withInput()
                ->with('error', 'Por favor, corrija os erros no formulário.');
        }

        try {
            DB::beginTransaction();

            // 1. Atualizar cliente
            $agent->client->update([
                'name' => $request->name,
                'business_name' => $request->business_name,
                'federal_id' => $request->cpf_cnpj,
                'email' => $request->email,
                'phone' => $request->phone,
                'status' => $request->status ? true : false,
            ]);

            // 2. Atualizar agente
            $agent->update([
                'openia_apikey' => $request->openia_apikey,
                'audio_apikey' => $request->audio_apikey,
                'openia_model' => $request->openia_model,
                'voice_id' => $request->voice_id,
                'settings' => json_decode($request->settings),
                'status' => $request->status ? true : false,
                'is_closer' => $request->is_closer ? true : false,
            ]);

            // 3. Atualizar override_settings
            $agent->overrideSetting->update([
                'override_databasename' => $request->override_databasename,
                'override_collectionname' => $request->override_collectionname,
                'override_qdrantcollection' => $request->override_qdrantcollection,
                'override_systemmessage' => $request->override_systemmessage,
                'override_modelname_chatopenai_0' => $request->override_modelname_chatopenai_0,
                'prompt' => $request->prompt,
                'custom_prompt' => $request->custom_prompt,
                'header_prompt' => $request->header_prompt,
            ]);

            // 4. Atualizar used_agent
            $agent->usedAgent->update([
                'plan' => $request->plan,
                'due_date' => $request->due_date,
                'limit' => $request->limit
            ]);

            DB::commit();

            return redirect()
                ->route('agents.index')
                ->with('success', 'Agente atualizado com sucesso!');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erro ao atualizar registros: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());

            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Erro ao atualizar registros: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified agent
     */
    public function destroy(Agent $agent)
    {
        try {
            $agent->delete();
            return redirect()
                ->route('agents.index')
                ->with('success', 'Agente excluído com sucesso!');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Erro ao excluir agente: ' . $e->getMessage());
        }
    }
}
