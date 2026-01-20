<?php

namespace App\Http\Controllers;

use App\Models\ContratoProdutoCliente;
use App\Models\PersonalizacaoAgente;
use App\Models\Produto;
use Illuminate\Http\Request;
use App\Models\ProdutoCliente;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ContratoProdutoClienteController extends Controller
{

    public function destroy($id)
    {
        $contrato = ContratoProdutoCliente::findOrFail($id);

        if ($contrato->caminho_arquivo) {
            Storage::disk('public')->delete($contrato->caminho_arquivo);
        }

        $contrato->delete();

        return response()->json(['message' => 'Contrato excluído com sucesso.']);
    }

    public function store(Request $request)
    {
        $request->validate([
            'produto_cliente_id' => 'required|exists:produtos_clientes,id',
            'contrato_arquivo' => 'required|file|mimes:doc,docx|max:5120',
        ]);

        $path = $request->file('contrato_arquivo')->store('contratos', 'public');

        $produto_cliente_id = ProdutoCliente::find($request->produto_cliente_id);

        Log::info("PROD");
        Log::info($produto_cliente_id);

        ContratoProdutoCliente::create([
            'user_id' => $produto_cliente_id->user_id,
            'produto_cliente_id' => $request->produto_cliente_id,
            'url' => $path,
            'nome' => $request->file('contrato_arquivo')->getClientOriginalName(),
        ]);

        return redirect()->back()->with('success', 'Contrato enviado com sucesso!');
    }
}
