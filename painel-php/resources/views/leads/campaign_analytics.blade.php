@extends('layouts.app')
@section('title', 'ESTRATÉGICO - Análises de Campanhas')

@push('css')
    <style>
        .dropdown-menu .form-check {
            padding: 0.25rem 1.5rem;
        }
    </style>
@endpush

@section('content')
<x-page-title title="ESTRATÉGICO" subtitle="Análises de Campanhas" />

<div class="product-count d-flex align-items-center gap-3 gap-lg-12 mb-4 fw-medium flex-wrap font-text1">
    <div class="col-md-12 d-flex align-items-center gap-3">
        <div class="col-md-4 d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;" class="wh-48 bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center">
                <i class="material-icons-outlined">question_answer</i>
            </a>
            <div class="">
                <h5 class="mb-0">{{ $totalLeads }}</h5>
                <p class="mb-0">Total Leads</p>
            </div>
        </div>
        <div class="col-md-4 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;" class="wh-48 bg-info text-dark rounded-circle d-flex align-items-center justify-content-center">
                <i class="material-icons-outlined">description</i>
            </a>
            <div class="">
                <h5 class="mb-0">{{ $createdContracts }}</h5>
                <p class="mb-0">Contr. Criados</p>
            </div>
        </div>
        <div class="col-md-4 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;" class="wh-48 bg-success text-dark rounded-circle d-flex align-items-center justify-content-center">
                <i class="material-icons-outlined">done_all</i>
            </a>
            <div class="">
                <h5 class="mb-0">{{ $signedContracts }}</h5>
                <p class="mb-0">Contr. Assinados</p>
            </div>
        </div>
        <div class="col-md-4 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;" class="wh-48 bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center">
                <i class="material-icons-outlined">description</i>
            </a>
            <div class="">
                <h5 class="mb-0">{{ $createdContracts - $signedContracts }}</h5>
                <p class="mb-0">Contr. Em Curso</p>
            </div>
        </div>

        <div
            class="col-md-3 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;"
                        class="wh-48 bg-grd-voilet bg-gradient text-dark rounded-circle d-flex align-items-center justify-content-center">
                        <i class="material-icons-outlined">percent</i>
                    </a>
            <div class="">
                <h5 class="mb-0">{{ number_format(($totalLeads > 0 ? ($createdContracts / $totalLeads) * 100 : 0), 1) }}%</h5>
                <small>Leads/Contr.</small>
            </div>
        </div>
        <!--
        <div
            class="col-md-3 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;"
                        class="wh-48 bg-grd-voilet bg-gradient text-dark rounded-circle d-flex align-items-center justify-content-center">
                        <i class="material-icons-outlined">percent</i>
                    </a>
            <div class="">
                <h5 class="mb-0">{{ number_format(($totalLeads > 0 ? ($signedContracts / $totalLeads) * 100 : 0), 1) }}%</h5>
                <small>Leads/Assin.</small>
            </div>
        </div>
    -->
        <div
            class="col-md-3 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;"
                        class="wh-48 bg-grd-voilet bg-gradient text-dark rounded-circle d-flex align-items-center justify-content-center">
                        <i class="material-icons-outlined">percent</i>
                    </a>
            <div class="">
                <h5 class="mb-0">{{ number_format(($createdContracts > 0 ? ($signedContracts / $createdContracts) * 100 : 0), 1) }}%</h5>
                <small>Contr./Assin.</small>
            </div>
        </div>
    </div>
</div>

<!-- Filter Form -->
<div class="card mb-4">
    <div class="card-body">
        <form method="GET" action="{{ route('leads.source-stats') }}" class="row g-3">
            <div class="col-auto">
                @if(auth()->user()->role == 'admin')
                    <select name="agent_type" class="form-select">
                        <option value="" {{ request('agent_type') == '' ? 'selected' : '' }}>TODOS</option>
                        <option value="CLOSER" {{ request('agent_type') == 'CLOSER' ? 'selected' : '' }}>CLOSER</option>
                        <option value="SDR" {{ request('agent_type') == 'SDR' ? 'selected' : '' }}>SDR</option>
                    </select>
                @endif
            </div>
            <div class="col-auto">
                <div class="dropdown">
                    <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="dropdownEscritorios" data-bs-toggle="dropdown" aria-expanded="false">
                        Escritórios ({{ count((array)request('cod_agent')) }} selecionados)
                    </button>
                    <div class="dropdown-menu p-3" style="width: 400px; max-height: 400px;">
                        <div class="mb-2">
                            <input type="text" class="form-control form-control-sm" id="searchEscritorio" placeholder="Buscar escritório..." autocomplete="off">
                        </div>
                        <div class="dropdown-divider"></div>
                        <div class="escritorios-list" style="max-height: 300px; overflow-y: auto;">
                            @foreach($escritorios as $cod_agent => $escritorio)
                                <div class="form-check escritorio-item mb-2">
                                    <input class="form-check-input" type="checkbox" name="cod_agent[]" value="{{ $cod_agent }}" id="agent-{{ $cod_agent }}"
                                        {{ in_array($cod_agent, (array)request('cod_agent')) ? 'checked' : '' }}>
                                    <label class="form-check-label" for="agent-{{ $cod_agent }}">
                                        <small>{{ mask_data($escritorio, 'name') }}</small>
                                    </label>
                                </div>
                            @endforeach
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-auto">
                <div class="input-group" style="width: 350px;">
                    <input type="date" class="form-control datepicker" name="start_date"
                        value="{{ request('start_date') ?? now()->format('Y-m-d') }}"
                        placeholder="Data Inicial" autocomplete="off">
                    <span class="input-group-text">até</span>
                    <input type="date" class="form-control datepicker" name="end_date"
                        value="{{ request('end_date') ?? now()->format('Y-m-d') }}"
                        placeholder="Data Final" autocomplete="off">
                </div>
            </div>

            <div class="col-auto">
                <div class="d-flex align-items-center gap-2">
                    <button type="submit" class="btn btn-primary px-4">
                        <i class="bi bi-search me-2"></i>Filtrar
                    </button>
                    <a href="{{ route('leads.source-stats') }}" class="btn btn-secondary px-4">
                        <i class="bi bi-x-circle me-2"></i>Limpar
                    </a>
                </div>
            </div>
        </form>
    </div>
</div>

<!-- Data Table -->
<div class="card">
    <div class="card-body">
        <div class="table-responsive-sm white-space-nowrap">
            <table class="table align-middle table-striped" id="dataCampaign">
                <thead class="table">
                    <tr>
                        <th>Escritório</th>
                        <th class="text-center">Link</th>
                        <th>Título Campanha</th>
                        <th class="text-center">Total Leads</th>
                        <th class="text-center">Contr. Criados</th>
                        <th class="text-center">Contr. Assinados</th>
                        <th class="text-center">Contr. Em Curso</th>
                        <th class="text-center">Leads/Contr.</th>
                        <th class="text-center">Leads/Assin.</th>
                        <th class="text-center">Contr./Assin.</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($mergedStats as $stat)
                    <tr>
                        <td>{{ $stat['escritorio'] }}</td>
                        <td class="text-center">
                            @if($stat['sourceurl'])
                                <a href="{{ $stat['sourceurl'] }}" target="_blank" class="btn btn-link" title="Ver Campanha">
                                    <i class="material-icons-outlined">campaign</i>
                                </a>
                            @endif
                        </td>
                        <td>{{ $stat['title'] }}</td>
                        <td class="text-center">
                            <div class="d-flex justify-content-center">
                                <div class="wh-48 d-flex align-items-center justify-content-center">
                                    <span class="fs-6 fw-bold">{{ $stat['total'] }}</span>
                                </div>
                            </div>
                        </td>
                        <td class="text-center">
                            <div class="d-flex justify-content-center">
                                <div class="wh-48 d-flex align-items-center justify-content-center">
                                    <span class="fs-6 fw-bold">{{ $stat['total_criados'] }}</span>
                                </div>
                            </div>
                        </td>
                        <td class="text-center">
                            <div class="d-flex justify-content-center">
                                <div class="wh-48 d-flex align-items-center justify-content-center">
                                    <span class="fs-6 fw-bold">{{ $stat['total_assinados'] }}</span>
                                </div>
                            </div>
                        </td>
                        <td class="text-center">
                            <div class="d-flex justify-content-center">
                                <div class="wh-48  d-flex align-items-center justify-content-center">
                                    <span class="fs-6 fw-bold">{{ $stat['total_criados'] - $stat['total_assinados'] }}</span>
                                </div>
                            </div>
                        </td>
                        <td class="text-center">{{ number_format(($stat['total'] > 0 ? ($stat['total_criados'] / $stat['total']) * 100 : 0), 1) }}%</td>
                        <td class="text-center">{{ number_format(($stat['total'] > 0 ? ($stat['total_assinados'] / $stat['total']) * 100 : 0), 1) }}%</td>
                        <td class="text-center">{{ number_format(($stat['total_criados'] > 0 ? ($stat['total_assinados'] / $stat['total_criados']) * 100 : 0), 1) }}%</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection

@push('script')
<script src="{{ URL::asset('build/plugins/perfect-scrollbar/js/perfect-scrollbar.js') }}"></script>
<script src="{{ URL::asset('build/plugins/metismenu/metisMenu.min.js') }}"></script>
<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<script src="{{ URL::asset('build/plugins/select2/js/select2-custom.js') }}"></script>
<script src="{{ URL::asset('build/plugins/datatable/js/jquery.dataTables.min.js') }}"></script>
<script src="{{ URL::asset('build/plugins/datatable/js/dataTables.bootstrap5.min.js') }}"></script>
<script>
    $(document).ready(function() {
        $('#dataCampaign').DataTable({
            pageLength: 31,
            searching: false,
            ordering: true,
            order: [[0, 'desc']],
            info: true,
            paging: true,
            lengthChange: false,
            language: {
                url: "{{ URL::asset('build/plugins/datatable/js/Portuguese-Brasil.json') }}"
            }

        });

        // Busca de escritórios
        $('#searchEscritorio').on('keyup', function() {
            var value = $(this).val().toLowerCase();
            $('.escritorio-item').filter(function() {
                $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
            });
        });

        // Mantém os dropdowns abertos ao clicar dentro deles
        $('.dropdown-menu').on('click', function(e) {
            e.stopPropagation();
        });
    });
</script>
@endpush
