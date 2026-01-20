<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\CategoriaCriativo;
use App\Models\Criativo;
use App\Models\Followup;
use App\Models\FollowupConfig;
use App\Models\HistoricoPersonalizacaoAgente;
use App\Models\PersonalizacaoAgente;
use App\Models\Produto;
use App\Models\ProdutoCliente;
use App\Models\StepCrm;
use App\Models\User;
use App\Models\ViewClient;
use App\Models\ViewStepCrm;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PersonalizacaoController extends Controller
{

    public function index(Request $request)
    {

        $personalizacao = PersonalizacaoAgente::whereUserId(Auth::user()->id)->first();
        $produtos = Produto::all();

        $meus_produtos = ProdutoCliente::whereUserId(Auth::user()->id)->get();

        if (!$meus_produtos) {
            $meus_produtos = null;
        }

        $phone = null;

        $user = User::find(Auth::user()->id);
        $agent = Agent::where('cod_agent', $user->cod_agent)->first();

        if ($agent) {
            $phone = $agent->client->phone;
        }

        return view('personalizacao.index', compact('personalizacao', 'produtos', 'meus_produtos', 'phone'));
    }

    public function list(Request $request)
    {
        $users = User::has('personalizacao')->orderBy('name')->get();

        if (Auth::user()->role == 'admin') {
            return view('personalizacao.list', compact('users'));
        } else {
            abort(404);
        }
    }

    public function cadastrar(Request $request)
    {
        return view('produtos.cadastrar');
    }

    public function store(Request $request)
    {

        Log::info("STORE PERSONALIZAÇÃO");
        //Log::info($request);

        $validator = Validator::make($request->all(), [
            'nome_agente' => 'nullable|string|max:255',
            'endereco' => 'nullable|string',
            'cnpj' => 'nullable|string|max:255',
            'advogados_oab' => 'nullable|string',
            'telefone' => 'nullable|string|max:255',
            'site' => 'nullable|string|max:255',
            'redes_sociais' => 'nullable|string|max:255',
            'boasvindas_mensagem' => 'nullable|string',
            'resumo_mensagem' => 'nullable|string',
            'contrato_gerado_notificacao' => 'nullable|string',
            'contrato_gerado_mensagem' => 'nullable|string',
            'contrato_assinado_notificacao' => 'nullable|string',
            'contrato_assinado_mensagem' => 'nullable|string',
            'explicacao_honorarios' => 'nullable|string',

            // Arquivos (vídeos e contrato) continuam opcionais
            'boasvindas_video' => 'nullable|file|mimes:mp4,avi,mov,webm|max:152400',
            'resumo_video' => 'nullable|file|mimes:mp4,avi,mov,webm|max:152400',
            'contrato_gerado_video' => 'nullable|file|mimes:mp4,avi,mov,webm|max:152400',
            'contrato_assinado_video' => 'nullable|file|mimes:mp4,avi,mov,webm|max:152400',
            'video_honorarios' => 'nullable|file|mimes:mp4,avi,mov,webm|max:152400',
            'contrato' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'produto_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            Log::info('Falha na validação do formulário de personalização:', [
                'erros' => $validator->errors()->toArray()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Por favor, corrija os erros no formulário.',
            ]);
        }

        $validated = $validator->validated();

        // Adiciona o user_id do usuário logado
        $validated['user_id'] = Auth::user()->id;

        // Processa uploads se existirem
        $uploads = [
            'boasvindas_video',
            'resumo_video',
            'contrato_gerado_video',
            'contrato_assinado_video',
            'video_honorarios',
            'contrato',
        ];

        foreach ($uploads as $field) {
            if ($request->hasFile($field)) {
                $validated[$field] = $request->file($field)->store('public/uploads');
            }
        }

        // Criação do registro
        PersonalizacaoAgente::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Personalização criada com sucesso!',
        ], 201);
    }

    public function update(Request $request, $id)
    {
        Log::info("Update Personalização");

        Log::info($request);

        $personalizacao = PersonalizacaoAgente::findOrFail($id);

        $user = User::find($personalizacao->user_id);
        $agent = Agent::where('cod_agent', $user->cod_agent)->first();

        Log::info($user);
        Log::info($agent);
        Log::info("Telefone =  " . $agent->client->phone);

        $validator = Validator::make($request->all(), [
            'nome_agente' => 'nullable|string|max:255',
            'endereco' => 'nullable|string',
            'cnpj' => 'nullable|string|max:255',
            'advogados_oab' => 'nullable|string',
            'telefone' => 'nullable|string|max:255',
            'site' => 'nullable|string|max:255',
            'redes_sociais' => 'nullable|string|max:255',
            'boasvindas_mensagem' => 'nullable|string',
            'resumo_mensagem' => 'nullable|string',
            'contrato_gerado_notificacao' => 'nullable|string',
            'contrato_gerado_mensagem' => 'nullable|string',
            'contrato_assinado_notificacao' => 'nullable|string',
            'contrato_assinado_mensagem' => 'nullable|string',
            'explicacao_honorarios' => 'nullable|string',
            'email' => 'nullable|string',

            // Arquivos (vídeos e contrato) continuam opcionais
            'boasvindas_video' => 'nullable|file|mimes:mp4,avi,mov,webm|max:152400',
            'resumo_video' => 'nullable|file|mimes:mp4,avi,mov,webm|max:152400',
            'contrato_gerado_video' => 'nullable|file|mimes:mp4,avi,mov,webm|max:152400',
            'contrato_assinado_video' => 'nullable|file|mimes:mp4,avi,mov,webm|max:152400',
            'video_honorarios' => 'nullable|file|mimes:mp4,avi,mov,webm|max:152400',
            'contrato' => 'nullable|file|mimes:mp4,avi,mov,webm|max:152400',
            'produto_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            Log::info('Falha na validação do formulário de personalização:', [
                'erros' => $validator->errors()->toArray()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Por favor, corrija os erros no formulário.',
                'errors' => $validator->errors()
            ]);
        }

        $validated = $validator->validated();

        $uploads = [
            'boasvindas_video',
            'resumo_video',
            'contrato_gerado_video',
            'contrato_assinado_video',
            'video_honorarios',
            'contrato',
        ];

        foreach ($uploads as $field) {
            if ($request->hasFile($field)) {
                $validated[$field] = $request->file($field)->store('uploads', 'public');
            }
        }

        // Detecta alterações
        $alteracoes = [];
        foreach ($validated as $key => $value) {
            if (!array_key_exists($key, $personalizacao->getAttributes())) {
                continue;
            }

            if ($personalizacao->$key != $value) {
                $alteracoes[$key] = [
                    'antes' => $personalizacao->$key,
                    'depois' => $value,
                ];
            }
        }

        // Salva histórico se houver mudanças
        if (!empty($alteracoes)) {

            if ($agent && $agent->client &&  $agent->client->phone) {
                $mensagem = "*Solicitação de atualização*\nAcabamos de receber sua solicitação de alteração! Em breve um de nossos técnicos irá analisá-la.";

                $response = Http::withHeaders([
                    'api_token' => 'auth-#65hs01k39akdka121',
                ])->post('http://212.90.120.53:3399/wpp/api/send/texto', [
                    'key' => env('WHATSZ_API_KEY'),
                    'number' => $agent->client->phone,
                    'text' => $mensagem
                ]);
            }

            $nomesAmigaveis = [
                'nome_agente' => 'Nome da Júlia',
                'endereco' => 'Endereço',
                'cnpj' => 'CNPJ',
                'advogados_oab' => 'Advogados/OAB',
                'telefone' => 'Telefone',
                'email' => 'E-mail',
                'site' => 'Site',
                'redes_sociais' => 'Redes sociais',
                'boasvindas_mensagem' => 'Mensagem de boas-vindas',
                'resumo_mensagem' => 'Mensagem de resumo',
                'contrato_gerado_notificacao' => 'Telefone para notificação do contrato gerado',
                'contrato_gerado_mensagem' => 'Mensagem do contrato gerado',
                'contrato_assinado_notificacao' => 'Telefone para notificação do contrato assinado',
                'contrato_assinado_mensagem' => 'Mensagem do contrato assinado',
                'explicacao_honorarios' => 'Explicação dos honorários',
                'produto_id' => 'Produto',

                // Arquivos
                'boasvindas_video' => 'Vídeo de boas-vindas',
                'resumo_video' => 'Vídeo de resumo',
                'contrato_gerado_video' => 'Vídeo do contrato gerado',
                'contrato_assinado_video' => 'Vídeo do contrato assinado',
                'video_honorarios' => 'Vídeo dos honorários',
                'contrato' => 'Contrato',
            ];

            // Pega apenas os nomes amigáveis dos campos alterados
            $camposAlterados = array_map(function ($campo) use ($nomesAmigaveis) {
                return $nomesAmigaveis[$campo] ?? $campo;
            }, array_keys($alteracoes));

            $mensagem_grupo = "*⚠️ Solicitação de atualização ⚠️*\nO cliente *" . $agent->client->name . "* acaba de solicitar alterações na Júlia!";

            $mensagem_grupo = $mensagem_grupo . "\n\nCampos alterados:\n" . implode("\n", $camposAlterados);

            $response = Http::withHeaders([
                'api_token' => 'auth-#65hs01k39akdka121',
            ])->post('http://212.90.120.53:3399/wpp/api/group/send/texto', [
                'key' => env('WHATSZ_API_KEY'),
                'number' => env('ID_GRUPO_SUPORTE_JULIA'),
                'text' => $mensagem_grupo
            ]);

            HistoricoPersonalizacaoAgente::create([
                'personalizacao_id' => $personalizacao->id,
                'alteracoes' => json_encode($alteracoes),
            ]);
        }

        Log::info('Valores validados:', $validated);

        // Atualiza a personalização
        $personalizacao->update($validated);

        /*
        return response()->json([
            'success' => true,
            'message' => 'Personalização atualizada com sucesso!'
        ]);
        */
        return redirect()->back()->with('success', 'Personalização atualizada com sucesso!');
    }
}
