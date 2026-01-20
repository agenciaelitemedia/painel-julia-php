<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\ContratoProdutoCliente;
use App\Models\PersonalizacaoAgente;
use App\Models\Produto;
use Illuminate\Http\Request;
use App\Models\ProdutoCliente;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProdutoClienteController extends Controller
{

    public function editar(Request $request)
    {

        $produtos = Produto::all();
        $produtoCliente = ProdutoCliente::find($request->produto_id);
        $personalizacao = null;
        $contrato_produto_cliente = ContratoProdutoCliente::where('produto_cliente_id', $produtoCliente->id)->whereUserId($produtoCliente->user_id)->get();

        $phone = null;

        $user = User::find(Auth::user()->id);
        $agent = Agent::where('cod_agent', $user->cod_agent)->first();

        if ($agent) {
            $phone = $agent->client->phone;
        }

        // Restringe acesso para usuários que não são admin
        if (Auth::user()->role != 'admin') {
            if ($produtoCliente && $produtoCliente->user_id == Auth::user()->id) {
                return view('produtos_clientes.editar', compact('phone','produtos', 'produtoCliente', 'personalizacao', 'contrato_produto_cliente'));
            } else {
                abort(404);
            }
        } else {
            return view('produtos_clientes.editar', compact('phone', 'produtos', 'produtoCliente', 'personalizacao', 'contrato_produto_cliente'));
        }
    }

    public function delete(Request $request)
    {
        try {

            // Pega o ID enviado pelo body da requisição
            $categoriaId = $request->id;



            // Verifica se a categoria existe
            $produto_cliente = ProdutoCliente::find($categoriaId);

            if (!$produto_cliente) {
                return response()->json(['error' => 'Produto não encontrado.'], 404);
            }

            // Deleta a categoria
            $produto_cliente->delete();

            return response()->json([
                'message' => 'Produto deletado com sucesso!',
                'success' => TRUE,
            ]);
        } catch (\Exception $e) {
            Log::info($e);

            return response()->json([
                'message' => 'Falha ao deletar produto',
                'success' => false,
            ]);
        }
    }

    public function store(Request $request)
    {
        // Validação
        $validated = $request->validate([
            'categoria' => 'nullable',
            'nome' => 'nullable',
            'produto_id' => 'required|exists:produtos,id',
            'perguntas' => 'nullable|string',
            'frase_ativacao' => 'nullable|string',
            'documentos_solicitados' => 'nullable|string',
            'explicacao_honorarios' => 'nullable|string',
            'video_honorarios' => 'nullable|file|mimetypes:video/mp4,video/x-msvideo,video/quicktime|max:51200', // 50MB máx
            'contrato' => 'nullable|file|mimes:pdf,doc,docx|max:10240', // 10MB máx            
            'contrato_formatado' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
        ]);

        Log::info("Categoria");
        Log::info($request->categoria);

        $produto = Produto::find($validated['produto_id']);

        // Inicializa o model
        $produtoCliente = new ProdutoCliente();
        $produtoCliente->categoria = $request->categoria  ?? null;
        $produtoCliente->nome = $produto->nome;
        $produtoCliente->produto_id = $validated['produto_id'];
        $produtoCliente->perguntas = $validated['perguntas'] ?? null;
        $produtoCliente->frase_ativacao = $validated['frase_ativacao'] ?? null;
        $produtoCliente->explicacao_honorarios = $validated['explicacao_honorarios'] ?? null;
        $produtoCliente->documentos_solicitados = $validated['documentos_solicitados'] ?? null;
        $produtoCliente->user_id = Auth::user()->id;

        // Upload de arquivos
        if ($request->hasFile('video_honorarios')) {
            $produtoCliente->video_honorarios = $request->file('video_honorarios')->store('videos', 'public');
        }

        if ($request->hasFile('contrato')) {
            $produtoCliente->contrato = $request->file('contrato')->store('contratos', 'public');
        }

        $produtoCliente->save();

        if ($request->hasFile('contrato_formatado')) {
            $contrato = $request->file('contrato_formatado')->store('contratos', 'public');

            ContratoProdutoCliente::create([
                'user_id' => Auth::user()->id,
                'produto_cliente_id' => $produtoCliente->id,
                'url' => $contrato,
                'nome' => $request->file('contrato_formatado')->getClientOriginalName(),
            ]);
        }

        return redirect()->back()->with('success', 'Produto salvo com sucesso!');
    }

    public function update(Request $request, ProdutoCliente $produtoCliente)
    {
        Log::info("ATUALIZANDO");

        $produto_antes = clone $produtoCliente;

        // Validação
        $validated = $request->validate([
            'categoria' => 'nullable',
            'produto_id' => 'required|exists:produtos,id',
            'perguntas' => 'nullable|string',
            'frase_ativacao' => 'nullable|string',
            'explicacao_honorarios' => 'nullable|string',
            'documentos_solicitados' => 'nullable|string',
            'video_honorarios' => 'nullable|file|mimetypes:video/mp4,video/x-msvideo,video/quicktime|max:51200', // 50MB máx
            'contrato' => 'nullable|file|mimes:pdf,doc,docx|max:10240', // 10MB máx
        ]);

        // Atualiza o modelo existente com os dados recebidos
        $produtoCliente->update([
            'categoria' => $request->categoria ?? null,
            'produto_id' => $validated['produto_id'],
            'perguntas' => $validated['perguntas'] ?? null,
            'frase_ativacao' => $validated['frase_ativacao'] ?? null,
            'explicacao_honorarios' => $validated['explicacao_honorarios'] ?? null,
            'documentos_solicitados' => $validated['documentos_solicitados'] ?? null,
        ]);

        // Verifica se houve upload de arquivos
        if ($request->hasFile('video_honorarios')) {
            // Remover o arquivo anterior, se necessário
            if ($produtoCliente->video_honorarios) {
                Storage::disk('public')->delete($produtoCliente->video_honorarios);
            }
            // Salva o novo vídeo
            $produtoCliente->video_honorarios = $request->file('video_honorarios')->store('videos', 'public');
        }

        if ($request->hasFile('contrato')) {
            // Remover o arquivo anterior, se necessário
            if ($produtoCliente->contrato) {
                Storage::disk('public')->delete($produtoCliente->contrato);
            }
            // Salva o novo contrato
            $produtoCliente->contrato = $request->file('contrato')->store('contratos', 'public');
        }



        // Detecta alterações
        $alteracoes = [];
        foreach ($validated as $key => $value) {
            if (!array_key_exists($key, $produto_antes->getAttributes())) {
                continue;
            }

            if (trim((string)$produto_antes->$key) !== trim((string)$produtoCliente->$key)) {
                $alteracoes[$key] = [
                    'antes' => $produto_antes->$key,
                    'depois' => $produtoCliente->$key,
                ];
            }
        }

        if (!empty($alteracoes) && Auth::user()->role != 'admin') {

            $user = User::find($produtoCliente->user_id);
            $agent = Agent::where('cod_agent', $user->cod_agent)->first();

            if ($agent && $agent->client &&  $agent->client->phone) {
                $mensagem = "*Solicitação de atualização*\nAcabamos de receber sua solicitação de alteração! Em breve um de nossos técnicos irá analisá-la.";

                $response = Http::withHeaders([
                    'api_token' => 'auth-#65hs01k39akdka121',
                ])->post('http://212.90.120.53:3399/wpp/api/send/texto', [
                    'key' => env('WHATSZ_API_KEY'),
                    'number' => $agent->client->phone,
                    'text' => $mensagem
                ]);

                $mensagem_grupo = "*⚠️ Solicitação de atualização ⚠️*\nO cliente *" . $agent->client->name . "* acaba de solicitar alterações na Júlia!";

                // Mapeamento de nomes de campos para nomes amigáveis
                $nomesAmigaveis = [
                    'categoria' => 'Categoria',
                    'produto_id' => 'Produto',
                    'perguntas' => 'Perguntas de qualificação',
                    'frase_ativacao' => 'Frase de ativação',
                    'explicacao_honorarios' => 'Explicação dos honorários',
                    'documentos_solicitados' => 'Documentos solicitados',
                    'video_honorarios' => 'Vídeo dos honorários',
                    'contrato' => 'Contrato',
                ];

                // Pega apenas os nomes amigáveis dos campos alterados
                $camposAlterados = array_map(function ($campo) use ($nomesAmigaveis) {
                    return $nomesAmigaveis[$campo] ?? $campo;
                }, array_keys($alteracoes));

                // Gera a string com quebras de linha
                $mensagem_grupo = $mensagem_grupo . "\n\nCampos alterados:\n" .
                    implode("\n", $camposAlterados) .
                    "\n\nNo produto *{$produtoCliente->nome}*.";

                $response = Http::withHeaders([
                    'api_token' => 'auth-#65hs01k39akdka121',
                ])->post('http://212.90.120.53:3399/wpp/api/group/send/texto', [
                    'key' => env('WHATSZ_API_KEY'),
                    'number' => env('ID_GRUPO_SUPORTE_JULIA'),
                    'text' => $mensagem_grupo
                ]);
            }


            Log::info($mensagem);
        } else {
            Log::info("Sem alterações pra fazer");
        }


        $produtoCliente->save();


        $produtoCliente->save();

        return redirect()->back()->with('success', 'Produto atualizado com sucesso!');
    }

    public function search(Request $request)
    {
        try {
            $query = ProdutoCliente::whereUserId($request->user_id);
            $personalizacao = PersonalizacaoAgente::whereUserId($request->user_id)->first();

            Log::info($personalizacao);

            $criativos = $query->get();

            return response()->json([
                'personalizacao' => $personalizacao,
                'produtos_cliente' => $criativos,
                'success' => true,
            ]);
        } catch (\Exception $e) {
            Log::info($e);

            return response()->json([
                'message' => 'Falha ao buscar criativos',
                'success' => false,
            ]);
        }
    }
}
