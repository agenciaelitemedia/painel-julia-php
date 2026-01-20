<?php

namespace App\Http\Controllers;

use App\Models\Arquivo;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ArquivoController extends Controller
{
    public function edit(Request $request)
    {
        $criativo = Arquivo::find($request->criativo_id);

        return view('arquivos.edit', compact('criativo'));
    }

    public function create()
    {
        $arquivos = Arquivo::all();

        return view('arquivos.create', compact('arquivos'));
    }

    public function index()
    {
        $arquivos = Arquivo::all();

        return view('arquivos.index', compact('arquivos'));
    }

    public function list()
    {
        $arquivos = Arquivo::all();
        $users = User::whereHas('arquivos')->get();

        return view('arquivos.list', compact('arquivos', 'users'));
    }

    public function update(Request $request)
    {

        Log::info("UPDATEs");
        Log::info($request);

        // Validação dos campos
        $validator = Validator::make($request->all(), [
            'categoria' => 'required',
            'titulo' => 'required',
            'conteudo' => 'required',
        ], [
            'required' => 'Campo obrigatório.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Por favor, corrija os erros no formulário.',
            ]);
        }

        $criativo = Arquivo::find($request->criativo_id);

        if ($request->file('file')) {
            $file = $request->file('file');

            $path = $request->file('file')->store('uploads', 'public');
            $imageUrl = asset('storage/' . $path);

            $extensao = strtolower(pathinfo($imageUrl, PATHINFO_EXTENSION));

            $criativo->url = $path;
            $criativo->extensao = $extensao;
        }

        $criativo->categoria_id = $request->categoria;
        $criativo->titulo = $request->titulo;
        $criativo->conteudo = $request->conteudo;
        $criativo->save();

        return response()->json([
            'message' => 'Arquivo atualizado',
            'success' => true,
        ]);
    }

    public function upload(Request $request)
    {

        // Validação dos campos
        $validator = Validator::make($request->all(), [
            'file' => 'required',
            'titulo' => 'required',
        ], [
            'required' => 'Campo obrigatório.',
        ]);

        if ($validator->fails()) {

            return response()->json([
                'success' => false,
                'message' => 'Por favor, corrija os erros no formulário.',
            ]);
        }

        $request->validate([
            'file' => 'required|file',
        ]);

        $file = $request->file('file');

        Log::info("PRÉ UPLOAD");
        Log::info($file);
        Log::info($request->categoria,);
        Log::info($request);

        if ($request->file('file')) {
            $path = $request->file('file')->store('uploads', 'public');
            $imageUrl = asset('storage/' . $path);

            Log::info("PÓS UPLOAD");
            Log::info($imageUrl);

            $imageUrl = asset('storage/' . $path);
            $extensao = strtolower(pathinfo($imageUrl, PATHINFO_EXTENSION));

            Log::info($extensao);

            Arquivo::create([
                'nome' =>  $request->titulo,
                'conteudo' =>  $request->conteudo,
                'url' =>  $path,
                'user_id' => Auth::user()->id,
                'extensao' => $extensao,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Arquivo enviado com sucesso!',
                'image' => $imageUrl,
            ]);
        }

        return response()->json([
            'message' => 'Falha no upload',
            'success' => false,
        ]);
    }

    public function delete(Request $request)
    {
        try {

            // Verifica se a categoria existe
            $criativo = Arquivo::find($request->id);

            if (!$criativo) {
                return response()->json(['error' => 'Arquivo não encontrado.'], 422);
            }

            // Deleta a categoria
            $criativo->delete();

            return response()->json([
                'message' => 'Arquivo deletado com sucesso!',
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

    public function search(Request $request)
    {
        try {
            $query = Arquivo::select();

            if (Auth::user()->role != 'admin') {
                $query = $query->whereUserId(Auth::user()->id);
            } else{
                $query = $query->whereUserId($request->user_id);
            }

            Log::info("BUSCANDO ARQUIVOS");
            Log::info($request->user_id);

            if ($request->categoria_id) {
                Log::info("FILTRANDO CATEGORIA");
                Log::info($request->categoria_id);
                $query = $query->where('categoria_id', '=', $request->categoria_id);
            }

            $arquivos = $query->get();

            return response()->json([
                'arquivos' => $arquivos,
                'success' => true,
            ]);
        } catch (\Exception $e) {
            Log::info($e);

            return response()->json([
                'message' => 'Falha ao buscar arquivos',
                'success' => false,
            ]);
        }
    }
}
