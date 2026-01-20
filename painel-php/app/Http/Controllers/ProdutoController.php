<?php

namespace App\Http\Controllers;

use App\Models\CategoriaCriativo;
use App\Models\Criativo;
use App\Models\Followup;
use App\Models\FollowupConfig;
use App\Models\Produto;
use App\Models\StepCrm;
use App\Models\ViewClient;
use App\Models\ViewStepCrm;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ProdutoController extends Controller
{

    public function index(Request $request)
    {

        $produtos = Produto::all();

        return view('produtos.index', compact('produtos'));
    }

    public function editar(Request $request)
    {

        $produto = Produto::find($request->id);

        return view('produtos.editar', compact('produto'));
    }


    public function update(Request $request, $id)
    {
        $produto = Produto::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nome' => 'required|string|max:255',
            'categoria' => 'required|string|max:255',
            'pergunta_qualificacao' => 'required|string',
            'frase_ativacao' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Verifique os erros do formulário.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $produto->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Produto atualizado com sucesso!',
        ]);
    }


    public function cadastrar(Request $request)
    {
        return view('produtos.cadastrar');
    }


    public function delete(Request $request)
    {
        try {

            // Verifica se a categoria existe
            $criativo = Produto::find($request->id);

            if (!$criativo) {
                return response()->json(['error' => 'Produto não encontrado.'], 422);
            }

            // Deleta a categoria
            $criativo->delete();

            return response()->json([
                'message' => 'Produto deletado com sucesso!',
                'success' => TRUE,
            ]);
        } catch (\Exception $e) {
            Log::info($e);

            return response()->json([
                'message' => 'Falha ao deletar criativo',
                'success' => false,
            ]);
        }
    }

    public function store(Request $request)
    {
        // Validação dos campos
        $validator = Validator::make($request->all(), [
            'nome' => 'required',
            'categoria' => 'required',
            'frase_ativacao' => 'required',
            'explicacao_honorarios' => 'required',
            'perguntas' => 'required',
        ], [
            'required' => 'Campo obrigatório.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Por favor, corrija os erros no formulário.',
            ]);
        }

        $validated = $validator->validated();

        $uploads = [
            'video_honorarios',
            'contrato',
        ];

        foreach ($uploads as $field) {
            if ($request->hasFile($field)) {
                $validated[$field] = $request->file($field)->store('public/uploads');
            }
        }

        Produto::create($validated);

        /*
        Produto::create([
            'nome' =>  $request->nome,
            'categoria' =>  $request->categoria,
            'pergunta_qualificacao' => $request->pergunta_qualificacao,
            'frase_ativacao' => $request->frase_ativacao,
            'explicacao_honorarios' => $request->explicacao_honorarios,
            'video_honorarios' => $request->video_honorarios,
            'contrato' => $request->video_honorarios,
        ]);
*/

        return response()->json([
            'success' => true,
            'message' => 'Produto cadastrado com sucesso!',
        ]);
    }

    public function search(Request $request)
    {
        try {
            $query = Criativo::select();

            Log::info("BUSCANDO CRIATIVOS");

            if ($request->categoria_id) {
                Log::info("FILTRANDO CATEGORIA");
                Log::info($request->categoria_id);
                $query = $query->where('categoria_id', '=', $request->categoria_id);
            }

            $criativos = $query->get();

            return response()->json([
                'criativos' => $criativos,
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
