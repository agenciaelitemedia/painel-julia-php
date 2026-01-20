@extends('layouts.app')
@section('title')
CRM
@endsection
@push('css')
<link rel="stylesheet" href="{{ URL::asset('build/css/extra-icons.css') }}">
<style>
    .custom-card {
        position: relative;
        flex-grow: 1;
        min-height: 0;
    }

    /* Customização da barra de rolagem horizontal */
    ::-webkit-scrollbar {
        height: 8px;
    }

    ::-webkit-scrollbar-track {
        background: #4178b8;
        border-radius: 0px;
    }

    ::-webkit-scrollbar-thumb {
        background: #0f1535;
        border-radius: 0px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: #0f1535;
    }
</style>

<style>
    .custom-pagination {
        border-color: #0fb6cc;
        color: black;
        font-size: 12px !important;
    }

    .custom-pagination .pagination {
        font-size: 12px !important;
    }

    .custom-pagination svg {
        max-width: 15px;
    }
</style>

@endpush

@section('content')
<x-page-title title="CRM" subtitle="Acompanhe seus leads" />

@php
$backgroundClasses = [
'',
'bg-primary',
'bg-secondary',
'bg-success',
'bg-danger',
'bg-info',
'bg-grd-primary bg-gradient',
'bg-grd-secondary bg-gradient',
'bg-grd-success bg-gradient',

'bg-grd-danger bg-gradient',
'bg-grd-info bg-gradient'
];
@endphp
<div class="card mt-4">
    <div class="card-body">
        <form action="{{ route('crm') }}" method="GET" class="row g-3">
            <div class="col-auto">
                <div class="input-group" style="width: 350px;">
                    <input type="date" class="form-control datepicker" name="start_date"
                        value="{{ request('start_date') ?? now()->format('Y-m-d') }}"
                        placeholder="Data Inicial"
                        autocomplete="off">
                    <span class="input-group-text">até</span>
                    <input type="date" class="form-control datepicker" name="end_date"
                        value="{{ request('end_date') ?? now()->format('Y-m-d') }}"
                        placeholder="Data Final"
                        autocomplete="off">
                </div>
            </div>
            <div class="col-auto">
                <div class="d-flex align-items-center gap-2 justify-content-lg-end">
                    <button type="submit" class="btn btn-primary px-4">
                        <i class="bi bi-search me-2"></i>Filtrar
                    </button>
                    <a href="{{ route('leads.contracts') }}" class="btn btn-secondary px-4">
                        <i class="bi bi-x-circle me-2"></i>Limpar
                    </a>
                </div>
            </div>
        </form>
    </div>
</div>

<!--
<div class="container-fluid">
    <div class="custom-card" style="display: flex !important;">
        <div class="row d-flex flex-nowrap">
            @if ($etapas)
            @foreach($etapas as $key => $step)
            @php

            $acentos = 'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇçÑñ';
            $semAcentos = 'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn';

            $etapa_sem_acento = strtr($key, $acentos, $semAcentos);

            $index = preg_replace('/[^0-9]/', '', $key);
            $filteredArray = array_filter($leadsPaginados, fn($item) => $item['step'] == $step);
            @endphp

            <div class="px-1" style="width: 340px;">
                <div class="card">
                    <div class="card-header {{ $backgroundClasses[7] }} text-white">[{{ $index + 1 }}º] - {{ $step }} ({{ count($filteredArray) }})</div>
                    <div class="card-body">
                        <div class="kanban-list" id="{{ $key }}">
                            @foreach($filteredArray as $lead)
                            @if ($lead['step'] == $step)
                            <div class="card shadow-none border">
                                <div class="card-body py-0">
                                    <h5 class="card-title"><i class="lni lni-whatsapp"></i> {{$lead['number'] }}</h5>
                                </div>
                            </div>
                            @endif
                            @endforeach
                        </div>
                    </div>
                </div>
            </div>
            @endforeach
            @endif
            <div class="px-1" style="width: 100px;">
            </div>
        </div>
    </div>
</div>
-->

<div class="container-fluid">
    <div class="custom-card" style="display: flex !important;">
        <div class="row d-flex flex-nowrap">
            @if ($etapas)
            @foreach($etapas as $key => $step)
            @php

            $acentos = 'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇçÑñ';
            $semAcentos = 'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn';

            $etapa_sem_acento = strtr($key, $acentos, $semAcentos);

            $index = preg_replace('/[^0-9]/', '', $key);

            $etapaSlug = strtr($step, $acentos, $semAcentos);
            $etapaSlug = str_replace(' ', '_', $etapaSlug);

            if(array_key_exists($etapaSlug, $leadsPaginados)){
            $filteredArray = $leadsPaginados[$etapaSlug];

            $totalLeads = $filteredArray->total();
            } else{
            $totalLeads = 0;
            }

            @endphp

            <div class="px-1" style="width: 340px;">
                <div class="card" id="{{ $etapaSlug }}">
                    <div class="card-header {{ $backgroundClasses[7] }} text-white">[{{ $index + 1 }}º] - {{ $step }} ({{ $totalLeads}})</div>
                    <div class="card-body">
                        <div class="kanban-list">
                            <div class="card shadow-none border">
                                <div class="card-body py-0">
                                    @foreach ($leadsPaginados as $etapa => $paginator)
                                    @php

                                    $acentos = 'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇçÑñ';
                                    $semAcentos = 'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn';

                                    $etapa_formatada = strtr($etapa, $acentos, $semAcentos);
                                    $etapa_formatada = str_replace('_', ' ', $etapa_formatada);

                                    @endphp

                                    @if ($etapa_formatada == $step)
                                    @foreach ($paginator as $lead)
                                    <h5 class="card-title"><i class="lni lni-whatsapp"></i> {{ $lead->number }}</h5>
                                    @endforeach

                                    <ul class="pagination">
                                        @foreach ($paginator->getUrlRange(1, $paginator->lastPage()) as $page => $url)
                                        <li class="page-item {{ $paginator->currentPage() == $page ? 'active' : '' }}">
                                            <a class="page-link" href="{{ $url }}&start_date={{ request('start_date') }}&end_date={{ request('end_date') }}#{{ $etapa }}">{{ $page }}</a>
                                        </li>
                                        @endforeach

                                        @if ($paginator->hasMorePages())
                                        <li class="page-item">
                                            <a class="page-link" href="{{ $paginator->nextPageUrl() }}&start_date={{ request('start_date') }}&end_date={{ request('end_date') }}#{{ $etapa }}">Next</a>
                                        </li>
                                        @else
                                        <li class="page-item disabled"><span class="page-link">Next</span></li>
                                        @endif
                                    </ul>

                                    <!-- FUNCIONANDO SEM REFERENCIAR PAGINA
                                    <ul class="pagination">
                                        {{-- Exibe os números das páginas --}}
                                        @foreach ($paginator->getUrlRange(1, $paginator->lastPage()) as $page => $url)
                                        <li class="page-item {{ $paginator->currentPage() == $page ? 'active' : '' }}">
                                            <a class="page-link" href="{{ $url }}&start_date={{ request('start_date') }}&end_date={{ request('end_date') }}">{{ $page }}</a>
                                        </li>
                                        @endforeach

                                        {{-- Exibe o botão "Next" --}}
                                        @if ($paginator->hasMorePages())
                                        <li class="page-item">
                                            <a class="page-link" href="{{ $paginator->nextPageUrl() }}&start_date={{ request('start_date') }}&end_date={{ request('end_date') }}">Next</a>
                                        </li>
                                        @else
                                        <li class="page-item disabled"><span class="page-link">Next</span></li>
                                        @endif
                                    </ul>
                                    -->

                                    @endif
                                    @endforeach
                                </div>
                            </div>

                            <!--
                            @foreach ($leadsPaginados as $etapa => $paginator)
                            @if ($etapa == $step)
                            <div class="card shadow-none border">
                                <div class="card-body py-0">

                                    @foreach ($paginator as $lead)
                                    <tr>
                                        <td>{{ $lead->id }}</td>
                                        <td>{{ $lead->number }}</td>
                                        <td>{{ $lead->created_at->format('d/m/Y H:i') }}</td>
                                    </tr>
                                    @endforeach
                                    
                                </div>
                            </div>


                            @endif
                            @endforeach
-->


                        </div>
                    </div>
                </div>
            </div>
            @endforeach
            @endif
            <div class="px-1" style="width: 100px;">
            </div>
        </div>
    </div>
</div>

<!--
@foreach ($leadsPaginados as $etapa => $paginator)
<div class="card mb-3">
    <div class="card-header">
        <h5>Etapa: {{ $etapa }} ({{ $paginator->total() }})</h5>
    </div>
    <div class="card-body">
        <table class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Data de Criação</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($paginator as $lead)
                <tr>
                    <td>{{ $lead->id }}</td>
                    <td>{{ $lead->number }}</td>
                    <td>{{ $lead->created_at->format('d/m/Y H:i') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <ul class="pagination">
        {{-- Remover o botão "Previous" --}}
        {{--
        @if ($paginator->onFirstPage())
            <li class="page-item disabled"><span class="page-link">Previous</span></li>
        @else
            <li class="page-item"><a class="page-link" href="{{ $paginator->previousPageUrl() }}">Previous</a></li>
        @endif
        --}}

        {{-- Exibe os números das páginas --}}
        @foreach ($paginator->getUrlRange(1, $paginator->lastPage()) as $page => $url)
        <li class="page-item {{ $paginator->currentPage() == $page ? 'active' : '' }}">
            <a class="page-link" href="{{ $url }}">{{ $page }}</a>
        </li>
        @endforeach

        {{-- Exibe o botão "Next" --}}
        @if ($paginator->hasMorePages())
        <li class="page-item"><a class="page-link" href="{{ $paginator->nextPageUrl() }}">Next</a></li>
        @else
        <li class="page-item disabled"><span class="page-link">Next</span></li>
        @endif
    </ul>

</div>
@endforeach
        -->

@endsection

@push('script')
<script>
    // Reload page every 60 seconds (1 minute)
    setInterval(function() {
        location.reload();
    }, 60000);
</script>
@endpush