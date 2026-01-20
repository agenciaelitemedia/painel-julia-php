<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Traits\HandlesSettings;
use App\Models\ViewClient;
use App\Models\viewCicloMessage;
use App\Models\viewCicloMessageMonths;
use App\Models\Agent;
use App\Models\viewCicloMessageTypes;
use App\Traits\HandlesEvolution;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\ViewLeadsContratos;

class NotificationController extends Controller
{
    use HandlesSettings, HandlesEvolution;

    public function __construct()
    {
        $this->middleware('auth');
    }
    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function sendProcess()
    {
        return view('julia.notification.send-process');
    }

    public function leadsChart()
    {
        $codAgent = '20240003';
        $data = ViewLeadsContratos::getLeadsByCodAgent($codAgent);

        $chartData = $data->groupBy(function($item) {
            return Carbon::parse($item->data_lead)->format('Y-m');
        })->map(function($group) {
            return [
                'total_leads' => $group->sum('total_leads'),
                'total_gerados' => $group->sum('total_gerados'),
                'total_assinados' => $group->sum('total_assinados'),
                'taxa_leads_gerados' => $group->avg('taxa_leads_gerados'),
                'taxa_leads_assinados' => $group->avg('taxa_leads_assinados'),
                'taxa_gerados_assinados' => $group->avg('taxa_gerados_assinados')
            ];
        });

        return view('julia.notification.leads-chart', [
            'chartData' => $chartData,
            'escritorio' => $data->first()->escritorio ?? 'Escritório'
        ]);
    }
}
