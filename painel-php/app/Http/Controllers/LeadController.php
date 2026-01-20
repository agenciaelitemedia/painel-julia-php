<?php

namespace App\Http\Controllers;

use App\Models\LeadContracts;
use App\Models\SingDocument;
use App\Models\ViewSingDocument;
use App\Models\Agent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Traits\ExportablePdf;
use App\Traits\ExportableExcel;
use App\Exports\ContractsExport;

class LeadController extends Controller
{
    use ExportablePdf, ExportableExcel;

    public function __construct()
    {
        $this->middleware('auth');
    }

    public function contracts(Request $request)
    {
        if (Auth::user()->role == 'admin') {
            $leads = LeadContracts::query()
                ->when(!$request->filled(['start_date', 'end_date']), function ($query) {
                return $query->defaultFilters();
            })
            ->filterByDateRange($request->start_date, $request->end_date)
            ->filterByAgent($request->cod_agent)
            ->filterByEscritorio($request->escritorio)
            ->filterByAgentType($request->agent_type)
            //->whereNotIn('cod_agent', ['20245001'])
                ->orderBy('data_lead', 'DESC')
                ->get();
        } else {
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

        return view('leads.contracts', compact('leads'));
    }

    public function myContracts(Request $request)
    {
/*
        $agent = Agent::where('cod_agent', Auth::user()->cod_agent)->first();
        $contracts = ViewSingDocument::query()
            ->when(!$request->filled(['start_date', 'end_date']), function ($query) {
                return $query->defaultFilters();
            })
            ->filterByDateRange($request->start_date, $request->end_date)
            ->where('agent_id', 95)
            //->where('agent_id', $agent->agent_id)
            ->orderBy('created_at', 'DESC')
            ->get();
*/

            if (Auth::user()->role == 'admin') {
                $contracts = ViewSingDocument::query()
                    ->when(!$request->filled(['start_date', 'end_date']), function ($query) {
                    return $query->defaultFilters();
                })
                ->filterByDateRange($request->start_date, $request->end_date)
                ->filterByAgent($request->cod_agent)
                ->filterByAgentType($request->agent_type)
                //->whereNotIn('cod_agent', ['20245001'])
                    ->orderBy('created_at', 'DESC')
                    ->get();
            } else {
                $contracts = ViewSingDocument::query()
                    ->when(!$request->filled(['start_date', 'end_date']), function ($query) {
                    return $query->defaultFilters();
                })
                ->filterByDateRange($request->start_date, $request->end_date)
                ->filterByAgent(Auth::user()->cod_agent)
                //->whereNotIn('cod_agent', ['20245001'])
                    ->orderBy('created_at', 'DESC')
                    ->get();
            }


        return view('leads.my-contracts', compact('contracts'));
    }

    public function exportPdf(Request $request)
    {
        $contracts = $this->getFilteredContracts($request);
        return $this->exportToPdf('exports.contracts-pdf', ['contracts' => $contracts], 'contratos');
    }

    public function exportExcel(Request $request)
    {
        $contracts = $this->getFilteredContracts($request);
        return $this->exportToExcel(new ContractsExport($contracts), 'contratos');
    }

    private function getFilteredContracts(Request $request)
    {

        if (Auth::user()->role == 'admin') {
            $contracts = ViewSingDocument::query()
                ->when(!$request->filled(['start_date', 'end_date']), function ($query) {
                return $query->defaultFilters();
            })
            ->filterByDateRange($request->start_date, $request->end_date)
            ->filterByAgent($request->cod_agent)
            ->filterByAgentType($request->agent_type)
            //->whereNotIn('cod_agent', ['20245001'])
                ->orderBy('created_at', 'DESC')
                ->get();
        } else {
            $contracts = ViewSingDocument::query()
                ->when(!$request->filled(['start_date', 'end_date']), function ($query) {
                return $query->defaultFilters();
            })
            ->filterByDateRange($request->start_date, $request->end_date)
            ->filterByAgent(Auth::user()->cod_agent)
            //->whereNotIn('cod_agent', ['20245001'])
                ->orderBy('created_at', 'DESC')
                ->get();
        }

        return $contracts;
    }
}
