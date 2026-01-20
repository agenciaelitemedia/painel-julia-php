<?php

namespace App\Http\Controllers;

use CodePhix\Asaas\Asaas;
use Illuminate\Http\Request;

class FinanceiroController extends Controller
{
    protected $asaas;

    public function __construct()
    {
        $this->asaas = new Asaas(env('ASAAS_TOKEN'), env('ASAAS_AMBIENTE', 'producao'));
    }

    public function cobrancas(Request $request)
    {
        try {
            $startDate = $request->start_date ?? now()->startOfMonth()->format('Y-m-d');
            $endDate = $request->end_date ?? now()->endOfMonth()->format('Y-m-d');
            $customerName = $request->customer_name ?? '';
            $status = $request->status ?? [];

            $filters = [
                'dueDate[ge]' => $startDate,
                'dueDate[le]' => $endDate,
            ];

            if (!empty($status)) {
                $filters['status'] = $status;
            }

            $cobrancas = $this->asaas->Cobranca()->getAll($filters);

            foreach ($cobrancas->data as $key => $cobranca) {
                if (isset($cobranca->customer)) {
                    $customerData = $this->asaas->Cliente()->getById($cobranca->customer);

                    if (!empty($customerName) && !str_contains(strtolower($customerData->name), strtolower($customerName))) {
                        unset($cobrancas->data[$key]);
                        continue;
                    }

                    $cobrancas->data[$key]->customerData = $customerData;
                }
            }

            $totalCobrancas = collect($cobrancas->data)->sum('value');
            $totalRecebido = collect($cobrancas->data)->where('status', 'RECEIVED')->sum('value');
            $totalPendente = collect($cobrancas->data)->where('status', 'PENDING')->sum('value');

            return view('financeiro.cobrancas.index', compact(
                'cobrancas',
                'totalCobrancas',
                'totalRecebido',
                'totalPendente'
            ));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao carregar cobranças: ' . $e->getMessage());
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
            $request->validate([
                'customer' => 'required',
                'billingType' => 'required',
                'value' => 'required|numeric',
                'dueDate' => 'required|date',
                'description' => 'nullable|string'
            ]);

            $dados = [
                'customer' => $request->customer,
                'billingType' => $request->billingType,
                'value' => $request->value,
                'dueDate' => $request->dueDate,
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
            if (isset($cobranca->customer)) {
                $cobranca->customerData = $this->asaas->Cliente()->getById($cobranca->customer);
            }
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
            return redirect()->back()
                           ->with('error', 'Erro ao excluir cobrança: ' . $e->getMessage());
        }
    }

    public function clientes(Request $request)
    {
        try {
            $filters = [];
            if ($request->name) {
                $filters['name'] = $request->name;
            }
            if ($request->email) {
                $filters['email'] = $request->email;
            }
            if ($request->cpfCnpj) {
                $filters['cpfCnpj'] = $request->cpfCnpj;
            }

            $clientes = $this->asaas->Cliente()->getAll($filters);
            return view('financeiro.clientes.index', compact('clientes'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao listar clientes: ' . $e->getMessage());
        }
    }

    public function criarCliente()
    {
        return view('financeiro.clientes.criar');
    }

    public function storeCliente(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string',
                'email' => 'required|email',
                'cpfCnpj' => 'required|string',
                'phone' => 'nullable|string',
                'mobilePhone' => 'nullable|string',
                'address' => 'nullable|string',
                'addressNumber' => 'nullable|string',
                'complement' => 'nullable|string',
                'province' => 'nullable|string',
                'postalCode' => 'nullable|string'
            ]);

            $cliente = $this->asaas->Cliente()->create($request->all());

            return redirect()->route('financeiro.clientes')
                           ->with('success', 'Cliente cadastrado com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()
                           ->with('error', 'Erro ao cadastrar cliente: ' . $e->getMessage())
                           ->withInput();
        }
    }
}
