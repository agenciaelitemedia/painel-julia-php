@extends('layouts.app')
@section('title', 'ESTRATÉGICO - Leads Campanha')

@push('css')
<link rel="stylesheet" href="{{ URL::asset('build/css/extra-icons.css') }}">
<style>
    .dropdown-menu .form-check {
        padding: 0.25rem 1.5rem;
    }

    .tooltip-inner {
        background-color: #0c5466 !important;
        color: #fff;
    }

    .tooltip.top .tooltip-arrow {
        border-top-color: #00acd6;
    }

    .tooltip.right .tooltip-arrow {
        border-right-color: #00acd6;
    }

    .tooltip.bottom .tooltip-arrow {
        border-bottom-color: #00acd6;
    }

    .tooltip.left .tooltip-arrow {
        border-left-color: #00acd6;
    }
</style>
@endpush

@section('content')
<x-page-title title="ESTRATÉGICO" subtitle="Leads Campanha" />

<div class="product-count d-flex align-items-center gap-3 gap-lg-12 mb-4 fw-medium flex-wrap font-text1">
    <div class="col-md-12 d-flex align-items-center gap-3">
        <div class="col-md-3 d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;" class="wh-48 bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center">
                <i class="material-icons-outlined">question_answer</i>
            </a>
            <div class="">
                <h5 class="mb-0">{{ $totalLeads }}</h5>
                <p class="mb-0">Total Leads</p>
            </div>
        </div>
        <div class="col-md-3 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;" class="wh-48 bg-info text-dark rounded-circle d-flex align-items-center justify-content-center">
                <i class="material-icons-outlined">campaign</i>
            </a>
            <div class="">
                <h5 class="mb-0">{{ $leadsWithCampaign }}</h5>
                <p class="mb-0">Leads/Campanhas</p>
            </div>
        </div>
        <div class="col-md-3 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;" class="wh-48 bg-success text-dark rounded-circle d-flex align-items-center justify-content-center">
                <i class="material-icons-outlined">description</i>
            </a>
            <div class="">
                <h5 class="mb-0">{{ $contractsFromCampaign }}</h5>
                <p class="mb-0">Contratos/Campanhas</p>
            </div>
        </div>
        <div class="col-md-3 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;" class="wh-48 bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center">
                <i class="material-icons-outlined">done_all</i>
            </a>
            <div class="">
                <h5 class="mb-0">{{ $signedFromCampaign }}</h5>
                <p class="mb-0">Assinados/Campanhas</p>
            </div>
        </div>
    </div>
</div>

<div class="card mb-4">
    <div class="card-body">
        <form method="GET" action="{{ route('leads.campaign') }}" class="row g-3">
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
                <div class="dropdown">
                    <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="dropdownContratos" data-bs-toggle="dropdown" aria-expanded="false">
                        Status Contrato ({{ count((array)request('status_document')) }} selecionados)
                    </button>
                    <div class="dropdown-menu p-3">
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" name="status_document[]" value="CREATED" id="status-created"
                                {{ in_array('CREATED', (array)request('status_document')) ? 'checked' : '' }}>
                            <label class="form-check-label" for="status-created">Criados</label>
                        </div>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" name="status_document[]" value="SIGNED" id="status-signed"
                                {{ in_array('SIGNED', (array)request('status_document')) ? 'checked' : '' }}>
                            <label class="form-check-label" for="status-signed">Assinados</label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-auto">
                <div class="input-group" style="width: 350px;">
                    <input type="date" class="form-control datepicker" name="start_date" value="{{ request('start_date') ?? now()->format('Y-m-d') }}" placeholder="Data Inicial" autocomplete="off">
                    <span class="input-group-text">até</span>
                    <input type="date" class="form-control datepicker" name="end_date" value="{{ request('end_date') ?? now()->format('Y-m-d') }}" placeholder="Data Final" autocomplete="off">
                </div>
            </div>
            <div class="col-auto">
                <div class="d-flex align-items-center gap-2">
                    <button type="submit" class="btn btn-primary px-4">
                        <i class="bi bi-search me-2"></i>Filtrar
                    </button>
                    <a href="{{ route('leads.campaign') }}" class="btn btn-secondary px-4">
                        <i class="bi bi-x-circle me-2"></i>Limpar
                    </a>
                </div>
            </div>
        </form>
    </div>
</div>

<div class="card">
    <div class="card-body">
        <div class="table-responsive-sm white-space-nowrap">
            <table class="table align-middle table-striped" id="dataCampaign">
                <thead class="table">
                    <tr>
                        <th>Data</th>
                        <th>Escritório</th>
                        <th>Telefone</th>
                        <th>Status</th>
                        <th class="text-center">Campanha?</th>
                        <th>Tipo Campanha</th>
                        <th>Titulo Campanha</th>
                        <th class="text-center">Anúncio</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($leads as $lead)
                    <tr>
                        <td>{{ \Carbon\Carbon::parse($lead->created_at)->format('d/m/Y H:i') }}</td>
                        <td>{{ $lead->escritorio }}</td>
                        <!--
                        <td class="text-center">
                            @if($lead->cod_document)
                            <i class="material-icons-outlined text-success">check_circle</i>
                            @else
                            <i class="material-icons-outlined text-danger">cancel</i>
                            @endif
                        </td>
                        -->
                        <td>{{ mask_data($lead->whatsapp_number, 'whatsapp_number') }}</td>
                        <td class="text-center">
                            @if($lead->status_document == 'CREATED')
                            GERADO
                            @elseif($lead->status_document == 'DELETED')
                            GERADO
                            @elseif($lead->status_document == 'SIGNED')
                            ASSINADO
                            @else
                            {{ $lead->status_document }}
                            @endif
                        </td>

                        <td class="text-center">
                            @if($lead->type_campaing && $lead->entrypointconversionapp == 'facebook')
                            <div style="font-size: 18px"><i class="lni lni-facebook-original"></i></div>
                            @elseif($lead->type_campaing && $lead->entrypointconversionapp == 'instagram')
                            <div style="font-size: 18px"><i class="lni lni-instagram-original"></i></div>
                            @else
                            <i class="material-icons-outlined text-danger">cancel</i>
                            @endif
                        </td>
                        <td class="text-center">
                            {{ $lead->mediatype }}
                        </td>
                        <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><small tabindex="0" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="{{ $lead->title }}">{{ $lead->title }}</small></td>
                        <td class="text-center">
                            @if($lead->sourceurl)
                            <a href="{{ $lead->sourceurl }}" target="_blank" class="btn btn-link" title="Ver Campanha">
                                <i class="material-icons-outlined">campaign</i>
                            </a>
                            @endif
                        </td>
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

        $('[data-bs-toggle="tooltip"]').tooltip({
            html: true
        });


        $('#dataCampaign').DataTable({
            pageLength: 31,
            searching: false,
            ordering: true,
            order: [
                [0, 'desc']
            ],
            info: true,
            paging: true,
            lengthChange: false,
            language: {
                url: "{{ URL::asset('build/plugins/datatable/js/Portuguese-Brasil.json') }}"
            },
            columnDefs: [
                // Exemplo: habilitar ordenação em todas as colunas
                {
                    orderable: true,
                    targets: '_all'
                }
            ]
        });

        // Prevent dropdowns from closing when clicking inside
        $('.dropdown-menu').on('click', function(e) {
            e.stopPropagation();
        });

        // Search functionality for escritorios
        $('#searchEscritorio').on('input', function() {
            const searchTerm = $(this).val().toLowerCase();
            $('.escritorio-item').each(function() {
                const escritorioText = $(this).find('label').text().toLowerCase();
                $(this).toggle(escritorioText.includes(searchTerm));
            });
        });

        // Update counters when checkboxes change
        function updateCounters() {
            const escritoriosCount = $('input[name="cod_agent[]"]:checked').length;
            const statusCount = $('input[name="status_document[]"]:checked').length;

            $('#dropdownEscritorios').text(`Escritórios (${escritoriosCount} selecionados)`);
            $('#dropdownContratos').text(`Status Contrato (${statusCount} selecionados)`);
        }

        $('input[type="checkbox"]').on('change', updateCounters);
        updateCounters();
    });
</script>
@endpush