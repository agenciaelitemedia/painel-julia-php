<?php

namespace App\Http\Controllers;

use App\Models\ViewLeadCampanha;
use App\Models\ViewLeadCampanhaAnalytics;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LeadCampanhaController extends Controller
{
    public function index(Request $request)
    {

        if (Auth::user()->role == 'admin') {

            $query = ViewLeadCampanha::query();

            if (!$request->has(['start_date', 'end_date'])) {
                $query->defaultFilters();
            }

            $query->filterByDateRange($request->start_date, $request->end_date)
                    ->filterByAgent($request->cod_agent)
                    ->filterByAgentType($request->agent_type)
                    ->filterByContract($request->status_document);


        } else {

            $query = ViewLeadCampanha::query();

            if (!$request->has(['start_date', 'end_date'])) {
                $query->defaultFilters();
            }

            $query->filterByDateRange($request->start_date, $request->end_date)
                    ->filterByAgent(Auth::user()->cod_agent)
                    ->filterByContract($request->status_document);
        }


        $leads = $query->get();

        $escritorios = $leads->sortBy('escritorio')
                            ->pluck('escritorio', 'cod_agent')
                            ->unique();

        // Estatísticas
        $totalLeads = $leads->count();
        $leadsWithCampaign = $leads->whereNotNull('type_campaing')->count();
        $contractsFromCampaign = $leads->whereNotNull('cod_document')->count();
        $signedFromCampaign = $leads->where('status_document', 'SIGNED')->count();

        return view('leads.campaign', compact(
            'leads',
            'escritorios',
            'totalLeads',
            'leadsWithCampaign',
            'contractsFromCampaign',
            'signedFromCampaign'
        ));
    }

    public function sourceStats(Request $request)
    {

        if (Auth::user()->role == 'admin') {

            $query = ViewLeadCampanhaAnalytics::query();

            if (!$request->has(['start_date', 'end_date'])) {
                $query->defaultFilters();
            }

            $query->filterByDateRange($request->start_date, $request->end_date)
                  ->filterByAgent($request->cod_agent)
                  ->filterByAgentType($request->agent_type)
                  ->filterByContract($request->status_document);


        } else {

            $query = ViewLeadCampanhaAnalytics::query();

            if (!$request->has(['start_date', 'end_date'])) {
                $query->defaultFilters();
            }

            $query->filterByDateRange($request->start_date, $request->end_date)
                    ->filterByAgent(Auth::user()->cod_agent)
                    ->filterByContract($request->status_document);
        }



        $leads = $query->get();

        $escritorios = $leads->sortBy('escritorio')
                            ->pluck('escritorio', 'cod_agent')
                            ->unique();

        // Statistics
        $totalLeads = $leads->sum('total');
        $createdContracts = $leads->whereIn('status_document', ['CREATED', 'SIGNED', 'DELETED'])->sum('total');
        $signedContracts = $leads->where('status_document', 'SIGNED')->sum('total');

        // Statistics by escritorio
        $statsByEscritorio = $leads->groupBy('escritorio')->map(function($group) {
            return [
                'escritorio' => $group->pluck('escritorio')->unique()->first(),
                'sourceurl' => $group->pluck('sourceurl')->unique()->first(),
                'title' => $group->pluck('title')->unique()->first(),
                'total' => $group->sum('total')
            ];
        })->toArray();


        // Statistics by escritorio
        $statsByCriados = $leads->whereIn('status_document', ['CREATED', 'SIGNED', 'DELETED'])->groupBy('escritorio')->map(function($group) {
            return [
                'escritorio' => $group->pluck('escritorio')->unique()->first(),
                'sourceurl' => $group->pluck('sourceurl')->unique()->first(),
                'title' => $group->pluck('title')->unique()->first(),
                'total_criados' => $group->sum('total')
            ];
        })->toArray();

        // Statistics by escritorio
        $statsByAssinados = $leads->whereIn('status_document', ['SIGNED'])->groupBy('escritorio')->map(function($group) {
            return [
                'escritorio' => $group->pluck('escritorio')->unique()->first(),
                'sourceurl' => $group->pluck('sourceurl')->unique()->first(),
                'title' => $group->pluck('title')->unique()->first(),
                'total_assinados' => $group->sum('total')
            ];
        })->toArray();

    $mergedStats = collect($statsByEscritorio)->map(function($item) use ($statsByCriados, $statsByAssinados) {
        $escritorio = $item['escritorio'];

        $criados = collect($statsByCriados)->firstWhere('escritorio', $escritorio);
        $assinados = collect($statsByAssinados)->firstWhere('escritorio', $escritorio);

        return [
                'escritorio' => $escritorio,
                'sourceurl' => $item['sourceurl'],
                'title' => $item['title'],
                'total' => $item['total'],
                'total_criados' => $criados['total_criados'] ?? 0,
                'total_assinados' => $assinados['total_assinados'] ?? 0
            ];
        })->toArray();

        return view('leads.campaign_analytics', compact(
            'leads',
            'escritorios',
            'totalLeads',
            'createdContracts',
            'signedContracts',
            'mergedStats'
        ));
    }
}
