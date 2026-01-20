<?php

namespace App\Http\Controllers;

use CodePhix\Asaas\Asaas;
use Illuminate\Http\Request;

class FinanceiroController extends Controller
{
    protected $asaas;

    public function __construct()
    {
        // Inicializa o cliente Asaas
        $this->asaas = new Asaas(env('ASAAS_TOKEN'), env('ASAAS_AMBIENTE', 'producao'));
    }

    public function index()
    {
        // Dashboard com resumo financeiro
        try {
            $cobrancas = $this->asaas->Cobranca()->getAll([
                'limit' => 5 // Últimas 5 cobranças
            ]);

            return view('financeiro.index', compact('cobrancas'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao carregar dashboard: ' . $e->getMessage());
        }
    }

    public function cobrancas()
    {
        try {
            $cobrancas = $this->asaas->Cobranca()->getAll();
            return view('financeiro.cobrancas.index', compact('cobrancas'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao listar cobranças: ' . $e->getMessage());
        }
    }

    public function criarCobranca()
    {
        try {
            $clientes = $this->asaas->Cliente()->getAll();
            return view('financeiro.cobrancas.criar', compact('clientes'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao carregar formulário: ' . $e->getMessage());
        }
    }

    public function storeCobranca(Request $request)
    {
        try {
            $dados = [
                'customer' => $request->customer_id,
                'billingType' => $request->billing_type,
                'value' => $request->value,
                'dueDate' => $request->due_date,
                'description' => $request->description
            ];

            $cobranca = $this->asaas->Cobranca()->create($dados);

            return redirect()->route('financeiro.cobrancas')
                           ->with('success', 'Cobrança criada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()
                           ->with('error', 'Erro ao criar cobrança: ' . $e->getMessage())
                           ->withInput();
        }
    }

    public function showCobranca($id)
    {
        try {
            $cobranca = $this->asaas->Cobranca()->getById($id);
            return view('financeiro.cobrancas.show', compact('cobranca'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao exibir cobrança: ' . $e->getMessage());
        }
    }

    public function deleteCobranca($id)
    {
        try {
            $this->asaas->Cobranca()->delete($id);
            return redirect()->route('financeiro.cobrancas')
                           ->with('success', 'Cobrança excluída com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao excluir cobrança: ' . $e->getMessage());
        }
    }
} 
