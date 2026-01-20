<?php

namespace App\Http\Controllers;

use App\Models\CategoriaCriativo;
use App\Models\Criativo;
use App\Models\Followup;
use App\Models\FollowupConfig;
use App\Models\LeadContracts;
use App\Models\StepCrm;
use App\Models\User;
use App\Models\ViewClient;
use App\Models\ViewLeadCampanha;
use App\Models\ViewSingDocument;
use App\Models\ViewStepCrm;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CrmController extends Controller
{

    public function index(Request $request)
    {

        $codAgent = Auth::user()->cod_agent;
        $user = Auth::user();
        $client = ViewClient::selectClientByCodAgent($codAgent);

        $followupConfig = FollowupConfig::selectByCodAgent($codAgent);

        $etapas = [];

        /* 
                $etapas = [
            "Em atendimento",
            "Analise de caso",
            "Questoes do caso juridico",
            "Cliente Qualificado",
            "Cliente Desqualificado",
            "Proposta de Serviço",
            "Solicitação de Dados",
            "Dados Informados",
        ];
        */


        //NOVO CÓDIGO
        //$query = ViewStepCrm::select();
        //$query = ViewStepCrm::leftJoin('vw_leads_campanha', 'vw_leads_campanha.whatsapp_number', 'vw_last_step_crm.number');

        //CÓDIGO FUNCIONANDO ANTES DO GPT
        /*
        $query = ViewStepCrm::leftJoin('vw_leads_campanha', 'vw_leads_campanha.whatsapp_number', 'vw_last_step_crm.number')
            ->leftJoin('vw_meus_contratos', 'vw_meus_contratos.whatsapp_number', 'vw_last_step_crm.number');

        if (!$request->has(['start_date', 'end_date'])) {
            $query = $query->whereDate('vw_last_step_crm.created_at', Carbon::today());
        } else {
            $query = $query->whereBetween('vw_last_step_crm.created_at', [$request->start_date, $request->end_date . ' 23:59:59']);
        }

        if (Auth::user()->role != 'admin') {
            $query = $query->where('vw_last_step_crm.cod_agent', Auth::user()->cod_agent);
        }

        $leads = $query->selectRaw('vw_last_step_crm.*,vw_leads_campanha.title as nome_campanha, vw_meus_contratos.status_document, vw_meus_contratos.resume_case, vw_meus_contratos.signer_name')->get();

        $leadsAgrupados = $leads->groupBy('step');

        */
        //FIM CÓDIGO


        $query = ViewStepCrm::leftJoin(
            DB::raw("(SELECT whatsapp_number, MAX(created_at) as max_date FROM vw_leads_campanha GROUP BY whatsapp_number) as latest_leads"),
            function ($join) {
                $join->on('vw_last_step_crm.number', '=', 'latest_leads.whatsapp_number');
            }
        )
            ->leftJoin('vw_leads_campanha', function ($join) {
                $join->on('vw_leads_campanha.whatsapp_number', '=', 'latest_leads.whatsapp_number')
                    ->on('vw_leads_campanha.created_at', '=', 'latest_leads.max_date');
            })
            ->leftJoin('vw_meus_contratos', 'vw_meus_contratos.whatsapp_number', 'vw_last_step_crm.number');

        // Filtro por data
        if (!$request->has(['start_date', 'end_date'])) {
            $query = $query->whereDate('vw_last_step_crm.created_at', Carbon::today());
        } else {
            $query = $query->whereBetween('vw_last_step_crm.created_at', [$request->start_date, $request->end_date . ' 23:59:59']);
        }

        // Restringe acesso para usuários que não são admin
        if (Auth::user()->role != 'admin') {
            $query = $query->where('vw_last_step_crm.cod_agent', Auth::user()->cod_agent);
        }

        // Ordenação pelo ID do vw_last_step_crm
        $query = $query->orderBy('vw_last_step_crm.created_at', 'desc');

        // Seleciona os campos
        $leads = $query->selectRaw('vw_last_step_crm.*, vw_leads_campanha.title as nome_campanha, vw_meus_contratos.status_document, vw_meus_contratos.resume_case, vw_meus_contratos.signer_name')->get();

        // Agrupamento por 'step'
        $leadsAgrupados = $leads->groupBy('step');

        // Criar um array para armazenar os leads paginados por etapa
        $leadsPaginados = [];

        // Definir a quantidade de leads por página
        $perPage = 20;

        // Paginar cada etapa manualmente
        foreach ($leadsAgrupados as $etapa => $leads) {
            // Substituir espaços em branco por "_"
            $etapaSlug = str_replace(' ', '_', $etapa); // Substitui os espaços por "_"

            $pageName = "page_$etapaSlug"; // Nome único para a página, com etapa sem espaços

            $currentPage = request()->input($pageName, 1);

            $currentItems = $leads->slice(($currentPage - 1) * $perPage, $perPage)->values();

            $paginator = new LengthAwarePaginator(
                $currentItems,
                $leads->count(),
                $perPage,
                $currentPage,
                ['path' => request()->url(), 'pageName' => $pageName]
            );

            $leadsPaginados[$etapaSlug] = $paginator; // Usando o slug com "_" como chave
        }

        $contratosGerados = null;

        //BUSCANDO CONTRATOS
        if (Auth::user()->role == 'admin') {
            $contratosGerados = ViewSingDocument::query()
                ->when(!$request->filled(['start_date', 'end_date']), function ($query) {
                    return $query->defaultFilters();
                })
                ->filterByDateRange($request->start_date, $request->end_date)
                ->filterByAgent($request->cod_agent)
                ->filterByAgentType($request->agent_type)
                ->where('status_document', 'CREATED')
                ->orderBy('created_at', 'DESC')
                ->get();

            $currentPage = request()->input("contratoGerado", 1);
            $currentItems = $contratosGerados->slice(($currentPage - 1) * $perPage, $perPage)->values();

            $paginator = new LengthAwarePaginator(
                $currentItems,
                $contratosGerados->count(),
                $perPage,
                $currentPage,
                ['path' => request()->url(), 'pageName' => "contratoGerado"]
            );

            $contratosGerados = $paginator;

            //CONTRATOS ASSINADOS
            $contratosAssinados = ViewSingDocument::query()
                ->when(!$request->filled(['start_date', 'end_date']), function ($query) {
                    return $query->defaultFilters();
                })
                ->filterByDateRange($request->start_date, $request->end_date)
                ->filterByAgent($request->cod_agent)
                ->filterByAgentType($request->agent_type)
                ->where('status_document', 'SIGNED')
                ->orderBy('created_at', 'DESC')
                ->get();

            $currentPage = request()->input("contratoAssinado", 1);
            $currentItems = $contratosAssinados->slice(($currentPage - 1) * $perPage, $perPage)->values();

            $paginatorAssinados = new LengthAwarePaginator(
                $currentItems,
                $contratosAssinados->count(),
                $perPage,
                $currentPage,
                ['path' => request()->url(), 'pageName' => "contratoAssinado"]
            );

            $contratosAssinados = $paginatorAssinados;
        } else {
            $contratosGerados = ViewSingDocument::query()
                ->when(!$request->filled(['start_date', 'end_date']), function ($query) {
                    return $query->defaultFilters();
                })
                ->filterByDateRange($request->start_date, $request->end_date)
                ->filterByAgent(Auth::user()->cod_agent)
                ->where('status_document', 'CREATED')
                ->orderBy('created_at', 'DESC')
                ->get();

            $currentPage = request()->input("contratoGerado", 1);
            $currentItems = $contratosGerados->slice(($currentPage - 1) * $perPage, $perPage)->values();

            $paginator = new LengthAwarePaginator(
                $currentItems,
                $contratosGerados->count(),
                $perPage,
                $currentPage,
                ['path' => request()->url(), 'pageName' => "contratoGerado"]
            );

            $contratosGerados = $paginator;

            //CONTRATOS ASSINADOS
            $contratosAssinados = ViewSingDocument::query()
                ->when(!$request->filled(['start_date', 'end_date']), function ($query) {
                    return $query->defaultFilters();
                })
                ->filterByDateRange($request->start_date, $request->end_date)
                ->filterByAgent(Auth::user()->cod_agent)
                ->where('status_document', 'SIGNED')
                ->orderBy('created_at', 'DESC')
                ->get();

            $currentPage = request()->input("contratoAssinado", 1);
            $currentItems = $contratosAssinados->slice(($currentPage - 1) * $perPage, $perPage)->values();

            $paginatorAssinados = new LengthAwarePaginator(
                $currentItems,
                $contratosAssinados->count(),
                $perPage,
                $currentPage,
                ['path' => request()->url(), 'pageName' => "contratoAssinado"]
            );

            $contratosAssinados = $paginatorAssinados;
        }

        //FIM


        //BUSCANDO LEADS EM ATENDIMENTO

        $leads_em_atendimento = "";

        if (Auth::user()->role == 'admin') {
            $leads_em_atendimento = ViewLeadCampanha::query();

            if (!$request->has(['start_date', 'end_date'])) {
                $leads_em_atendimento->defaultFilters();
            }

            $leads_em_atendimento->filterByDateRange($request->start_date, $request->end_date)
                ->filterByAgent($request->cod_agent)
                ->filterByAgentType($request->agent_type)
                ->filterByContract($request->status_document)
                ->doesntHave('contrato');
        } else {
            $leads_em_atendimento = ViewLeadCampanha::query();

            if (!$request->has(['start_date', 'end_date'])) {
                $leads_em_atendimento->defaultFilters();
            }

            $leads_em_atendimento->filterByDateRange($request->start_date, $request->end_date)
                ->filterByAgent(Auth::user()->cod_agent)
                ->filterByContract($request->status_document)
                ->doesntHave('contrato');
        }

        $leads_em_atendimento = $leads_em_atendimento->where('active', '=', true)->get();

        $currentPage = request()->input("emAtendimento", 1);
        $currentItems = $leads_em_atendimento->slice(($currentPage - 1) * $perPage, $perPage)->values();

        $paginatorLeads = new LengthAwarePaginator(
            $currentItems,
            $leads_em_atendimento->count(),
            $perPage,
            $currentPage,
            ['path' => request()->url(), 'pageName' => "emAtendimento"]
        );

        $leads_em_atendimento = $paginatorLeads;

        //LEADS EM ATENDIMENTO HUMANO
        $leads_em_atendimento_humano = "";

        if (Auth::user()->role == 'admin') {
            $leads_em_atendimento_humano = ViewLeadCampanha::query();

            if (!$request->has(['start_date', 'end_date'])) {
                $leads_em_atendimento_humano->defaultFilters();
            }

            $leads_em_atendimento_humano->filterByDateRange($request->start_date, $request->end_date)
                ->filterByAgent($request->cod_agent)
                ->filterByAgentType($request->agent_type)
                ->filterByContract($request->status_document)
                ->doesntHave('contrato');
        } else {
            $leads_em_atendimento_humano = ViewLeadCampanha::query();

            if (!$request->has(['start_date', 'end_date'])) {
                $leads_em_atendimento_humano->defaultFilters();
            }

            $leads_em_atendimento_humano->filterByDateRange($request->start_date, $request->end_date)
                ->filterByAgent(Auth::user()->cod_agent)
                ->filterByContract($request->status_document)
                ->doesntHave('contrato');
        }

        $leads_em_atendimento_humano = $leads_em_atendimento_humano->where('active', '=', false)->get();

        $currentPage = request()->input("emAtendimentoHumano", 1);
        $currentItems = $leads_em_atendimento_humano->slice(($currentPage - 1) * $perPage, $perPage)->values();

        $paginatorLeadsHumano = new LengthAwarePaginator(
            $currentItems,
            $leads_em_atendimento_humano->count(),
            $perPage,
            $currentPage,
            ['path' => request()->url(), 'pageName' => "emAtendimentoHumano"]
        );

        $leads_em_atendimento_humano = $paginatorLeadsHumano;

        $followup = Followup::selectByCodAgent($codAgent)->toArray();

        return view('julia.crm', compact('leads_em_atendimento_humano', 'leads_em_atendimento', 'client', 'user', 'etapas', 'followup', 'leadsPaginados', 'contratosGerados', 'contratosAssinados'));
    }

    public function searchAgent(Request $request)
    {
        try {
            $user = User::where('cod_agent', $request->cod_agent)->first();

            return response()->json([
                'user' => $user,
            ]);
        } catch (\Exception $e) {
            Log::info($e);

            return response()->json([
                'message' => 'Falha ao buscar usuário',
                'success' => false,
            ]);
        }
    }
}
