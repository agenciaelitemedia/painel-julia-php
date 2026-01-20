<?php

namespace App\Http\Controllers;

use App\Models\CategoriaCriativo;
use App\Models\Criativo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CategoriaCriativoController extends Controller
{
    public function index()
    {
        $categorias = CategoriaCriativo::all();

        return view('criativos.categorias', compact('categorias'));
    }

    public function store(Request $request)
    {
        // Validação dos campos
        $validator = Validator::make($request->all(), [
            'nome' => 'required|string|max:100',
        ], [
            'required' => 'Campo obrigatório.',
            'min' => 'O campo :attribute deve ter no mínimo :min caracteres.',
        ]);

        if ($validator->fails()) {
            return redirect()
                ->back()
                ->withErrors($validator)
                ->withInput()
                ->with('error', 'Por favor, corrija os erros no formulário.');
        }

        $nomeCategoria = strtolower($request->nome);
        $categoriaExistente = CategoriaCriativo::whereRaw('LOWER(nome) = ?', [$nomeCategoria])->first();

        if ($categoriaExistente) {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Já existe uma categoria com esse nome.');
        }

        try {
            CategoriaCriativo::create([
                'nome' => $request->nome,
            ]);

            return redirect()
                ->route('categorias.criativos.index')
                ->with('success', 'Categoria cadastrada com sucesso!');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Erro ao criar categoria: ' . $e->getMessage());
        }
    }

    public function delete(Request $request)
    {
        try {

            // Pega o ID enviado pelo body da requisição
            $categoriaId = $request->id;

            $criativos = Criativo::where('categoria_id', '=', $request->id)->exists();

            Log::info($request->id);

            if ($criativos) {
                Log::info($criativos);

                return response()->json([
                    'message' => 'Existem criativos associados a esta categoria!',
                    'success' => false,
                ]);
            }

            // Verifica se a categoria existe
            $categoria = CategoriaCriativo::find($categoriaId);

            if (!$categoria) {
                return response()->json(['error' => 'Categoria não encontrada.'], 404);
            }

            // Deleta a categoria
            $categoria->delete();

            return response()->json([
                'message' => 'Categoria deletada com sucesso!',
                'success' => TRUE,
            ]);
        } catch (\Exception $e) {
            Log::info($e);

            return response()->json([
                'message' => 'Falha ao deletar categoria',
                'success' => false,
            ]);
        }
    }

    public function edit(Request $request)
    {
        try {
            $categoria = CategoriaCriativo::find($request->id);
            $categoria->nome = $request->nome;
            $categoria->save();

            return response()->json([
                'message' => 'Categoria atualizada com sucesso!',
                'success' => TRUE,
            ]);
        } catch (\Exception $e) {
            Log::info($e);

            return response()->json([
                'message' => 'Falha ao atualizar categoria',
                'success' => false,
            ]);
        }
    }

}
