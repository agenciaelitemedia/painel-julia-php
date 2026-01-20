<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Traits\HandlesSettings;
use App\Models\ViewClient;
use App\Models\viewCicloMessage;
use App\Models\viewCicloMessageMonths;
use App\Models\Agent;
use App\Models\FollowupConfig;
use App\Models\Followup;
use App\Models\LeadContracts;
use App\Models\viewCicloMessageTypes;
use App\Traits\HandlesEvolution;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class JuliaController extends Controller
{
    use HandlesSettings, HandlesEvolution;

    public function __construct()
    {
        $this->middleware('auth:web');
    }
    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function onboard(Request $request)
    {
        if (Auth::user()->role == 'admin') {
          
            $leads = LeadContracts::query()
                ->when(!$request->filled(['start_date', 'end_date']), function ($query) {
                    return $query->defaultFilters();
                })
                ->filterByDateRange($request->start_date, $request->end_date)
                ->filterByAgent($request->cod_agent)
                ->filterByEscritorio($request->escritorio)
                ->filterByAgentType('CLOSER')
                //->whereNotIn('cod_agent', ['20245001'])
                ->orderBy('data_lead', 'DESC')
                ->get();

            //ONTEM
            $leads_ontem = LeadContracts::filterByDateRange(Carbon::yesterday()->startOfDay(), Carbon::yesterday()->endOfDay())->where('agent_type', 'CLOSER')->get();

            //MÊS PASSADO
            $inicioMesPassado = Carbon::now()->subMonthNoOverflow()->startOfMonth();
            $fimMesPassado = Carbon::now()->subMonthNoOverflow()->endOfMonth();

            $leads_mes_passado = LeadContracts::filterByDateRange($inicioMesPassado, $fimMesPassado)->where('agent_type', 'CLOSER')->get();

            //MÊS ATUAL
            $leads_mes_atual = LeadContracts::filterByDateRange(Carbon::now()->startOfMonth(),  Carbon::now())->where('agent_type', 'CLOSER')->get();

            //7 DIAS
            $seteDiasAtras = Carbon::now()->subDays(7);
            $leads_7_dias = LeadContracts::filterByDateRange($seteDiasAtras, Carbon::now())->where('agent_type', 'CLOSER')->get();

            $quinzeDiasAtras = Carbon::now()->subDays(15);
          
        } else {
            $leads_ontem =  null;
            $leads_7_dias =  null;
            $leads_mes_passado =  null;
            $leads_mes_atual =  null;
            
            $leads = LeadContracts::query()
                ->when(!$request->filled(['start_date', 'end_date']), function ($query) {
                    return $query->defaultFilters();
                })
                ->filterByDateRange($request->start_date, $request->end_date)
                ->filterByAgent(Auth::user()->cod_agent)
                ->filterByEscritorio($request->escritorio)
                ->orderBy('data_lead', 'DESC')
                ->get();
               
        }

        $codAgent = Auth::user()->cod_agent;
        $user = Auth::user();
        $client = ViewClient::selectClientByCodAgent($codAgent);

        if ($client) {
            $agent = Agent::selectClientByCodClient($client->cod_agent);

            $settings = $agent->settings;
            $dataProfile = $this->verificarStatus(Auth::user()->evo_instance, Auth::user()->evo_apikey, Auth::user()->evo_url);

            $statusWhatsApp = $dataProfile;

            $viewTotalCiclo = viewCicloMessage::selectTotalByCodAgentFirst($client->cod_agent);
            $viewTotalCicloMeses = viewCicloMessageMonths::selectTotalByCodAgentFirst($client->cod_agent);
            $totalMessageMesal = viewCicloMessageMonths::selectTotalByCodAgentAll($client->cod_agent)->toArray();
        } else {
            $viewTotalCiclo =  null;
            $viewTotalCicloMeses =  null;
            $totalMessageMesal =  null;
            $agent = Agent::selectClientByCodClient($codAgent);
            $statusWhatsApp = [
                'profileStatus' => 'close',
                'profileName' => '---',
                'profilePictureUrl' => 'http://via.placeholder.com/120x120',
                'profileNumber' => '---'
            ];
        }

        return view('julia.index', compact('client', 'statusWhatsApp', 'viewTotalCiclo', 'viewTotalCicloMeses', 'totalMessageMesal', 'user', 'agent', 'leads', 'leads_ontem', 'leads_7_dias', 'leads_mes_passado', 'leads_mes_atual'));
    }


    public function qrcode()
    {
        $codAgent = Auth::user()->cod_agent;
        $client = ViewClient::selectClientByCodAgent($codAgent);

        if ($client) {
            $agent = Agent::selectClientByCodClient($client->cod_agent);

            $settings = $agent->settings;
            $dataCode = $this->gerarQRCode(Auth::user()->evo_instance, Auth::user()->evo_apikey, Auth::user()->evo_url);

            $qrcodeWhatsApp = $dataCode;
        } else {
            $agent = null;
            $statusWhatsApp = [];
        }

        return view('julia.qrcode', compact('client', 'qrcodeWhatsApp'));
    }



    // Função para atualizar as configurações
    public function updateSettings(Request $request, $uuid, $agentId)
    {

        // Usar a trait para salvar as configurações
        $result = $this->saveSettings($request, $agentId);

        // Verificar se a atualização foi bem-sucedida
        if ($result) {
            return redirect()->route('julia.onboard', $uuid)->with('success', 'Configurações atualizadas com sucesso!');
        } else {
            return redirect()->route('julia.onboard', $uuid)->with('error', 'Falha ao atualizar as configurações.');
        }
    }

    // Função para atualizar as configurações
    public function updateSettingsCampaigns(Request $request, $uuid, $agentId)
    {

        // Usar a trait para salvar as configurações
        $result = $this->saveSettingsCampaigns($request, $agentId);

        // Verificar se a atualização foi bem-sucedida
        if ($result) {
            return redirect()->route('julia.onboard', $uuid)->with('success', 'Configurações atualizadas com sucesso!');
        } else {
            return redirect()->route('julia.onboard', $uuid)->with('error', 'Falha ao atualizar as configurações.');
        }
    }



    public function followup()
    {



        $codAgent = Auth::user()->cod_agent;
        $user = Auth::user();
        $client = ViewClient::selectClientByCodAgent($codAgent);

        $followupConfig = FollowupConfig::selectByCodAgent($codAgent);

        $titleCadence = $followupConfig->title_cadence;

        $followup = Followup::selectByCodAgent($codAgent)->toArray();

        return view('julia.followup', compact('client', 'user', 'titleCadence', 'followup'));
    }

    public function updateDataMask(Request $request)
    {
        try {
            auth()->user()->update([
                'data_mask' => $request->data_mask === 'true'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Configuração salva com sucesso!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao salvar configuração.'
            ], 500);
        }
    }
}
