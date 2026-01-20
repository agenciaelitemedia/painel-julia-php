@extends('layouts.app')
@section('title', 'ESTRATÉGICO - Leads x Contratos')

@push('css')
    <style>
        .dropdown-menu .form-check {
            padding: 0.25rem 1.5rem;
        }
    </style>
@endpush

@section('content')

<x-page-title title="ESTRATÉGICO" subtitle="Leads x Contratos" />

<div class="product-count d-flex align-items-center gap-3 gap-lg-12 mb-4 fw-medium flex-wrap font-text1">
    <div class="col-md-12 d-flex align-items-center gap-3">
        <div
            class="col-md-3 d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;"
                        class="wh-48 bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center">
                        <i class="material-icons-outlined">question_answer</i>
                    </a>
            <div class="">
                <h5 class="mb-0">{{ $leads->sum('total_leads') }}</h5>
                <p class="mb-0">Leads</p>
            </div>
        </div>
        <div
            class="col-md-3 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;"
                        class="wh-48 bg-info text-dark rounded-circle d-flex align-items-center justify-content-center">
                        <i class="material-icons-outlined">balance</i>
                    </a>
            <div class="">
                <h5 class="mb-0">{{ $leads->sum('total_gerados') }}</h5>
                <small>Contratos</small>
            </div>
        </div>
        <div
            class="col-md-3 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;"
                        class="wh-48 bg-success text-dark rounded-circle d-flex align-items-center justify-content-center">
                        <i class="material-icons-outlined">receipt_long</i>
                    </a>
            <div class="">
                <h5 class="mb-0">{{ $leads->sum('total_assinados') }}</h5>
                <p class="mb-0">Assinados</p>
            </div>
        </div>

        <div
            class="col-md-3 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;"
                        class="wh-48 bg-grd-warning text-dark rounded-circle d-flex align-items-center justify-content-center">
                        <i class="material-icons-outlined">receipt_long</i>
                    </a>
            <div class="">
                <h5 class="mb-0">{{ $leads->sum('total_gerados') - $leads->sum('total_assinados') }}</h5>
                <p class="mb-0">Em Curso</p>
            </div>
        </div>

        <div
            class="col-md-3 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;"
                        class="wh-48 bg-grd-voilet bg-gradient text-dark rounded-circle d-flex align-items-center justify-content-center">
                        <i class="material-icons-outlined">percent</i>
                    </a>
            <div class="">
                <h5 class="mb-0">{{ number_format(($leads->sum('total_leads') > 0 ? ($leads->sum('total_gerados') / $leads->sum('total_leads')) * 100 : 0), 1) }}%</h5>
                <small>Leads/Contr.</small>
            </div>
        </div>
        <div
            class="col-md-3 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;"
                        class="wh-48 bg-grd-voilet bg-gradient text-dark rounded-circle d-flex align-items-center justify-content-center">
                        <i class="material-icons-outlined">percent</i>
                    </a>
            <div class="">
                <h5 class="mb-0">{{ number_format(($leads->sum('total_leads') > 0 ? ($leads->sum('total_assinados') / $leads->sum('total_leads')) * 100 : 0), 1) }}%</h5>
                <small>Leads/Assin.</small>
            </div>
        </div>
        <div
            class="col-md-3 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;"
                        class="wh-48 bg-grd-voilet bg-gradient text-dark rounded-circle d-flex align-items-center justify-content-center">
                        <i class="material-icons-outlined">percent</i>
                    </a>
            <div class="">
                <h5 class="mb-0">{{ number_format(($leads->sum('total_gerados') > 0 ? ($leads->sum('total_assinados') / $leads->sum('total_gerados')) * 100 : 0), 1) }}%</h5>
                <small>Contr./Assin.</small>
            </div>
        </div>

    </div>
</div>

<div class="card mt-4">
    <div class="card-body">
        <form action="{{ route('leads.contracts') }}" method="GET" class="row g-3">
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
                            <input type="text" class="form-control form-control-sm" id="searchEscritorio"
                                placeholder="Buscar escritório..." autocomplete="off">
                        </div>
                        <div class="dropdown-divider"></div>
                        <div class="escritorios-list" style="max-height: 300px; overflow-y: auto;">
                            @foreach($leads->sortBy('escritorio')->pluck('escritorio', 'cod_agent')->unique() as $cod_agent => $escritorio)
                                <div class="form-check escritorio-item mb-2">
                                    <input class="form-check-input" type="checkbox" name="cod_agent[]"
                                        value="{{ $cod_agent }}" id="agent-{{ $cod_agent }}"
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

<div class="card mt-4">
    <div class="card-body">
        <div class="table-responsive-sm white-space-nowrap">
            <table class="table align-middle table-striped" id="dataContracts">
                <thead class="table">
                    <tr>
                        <th class="text-center">Data Lead</th>
                        <th>Escritório</th>
                        <th class="text-center">Leads</th>
                        <th class="text-center">Contratos</th>
                        <th class="text-center">Assinados</th>
                        <th class="text-center">Em Curso</th>
                        <th class="text-center">Leads/Contr.</th>
                        <th class="text-center">Leads/Assin.</th>
                        <th class="text-center">Contr./Assin.</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($leads as $lead)
                    <tr>
                        <td class="text-center">{{ date('d/m/Y', strtotime($lead->data_lead)) }}</td>
                        <td>{{ mask_data($lead->escritorio, 'name') }}</td>
                        <td class="text-center">{{ $lead->total_leads ?? 0 }}</td>
                        <td class="text-center">{{ $lead->total_gerados ?? 0 }}</td>
                        <td class="text-center">{{ $lead->total_assinados ?? 0 }}</td>
                        <td class="text-center">{{ ($lead->total_gerados - $lead->total_assinados) ?? 0 }}</td>
                        <td class="text-center">{{ $lead->taxa_leads_gerados ?? 0 }}%</td>
                        <td class="text-center">{{ $lead->taxa_leads_assinados ?? 0 }}%</td>
                        <td class="text-center">{{ $lead->taxa_gerados_assinados ?? 0 }}%</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection

@push('script')
    <!--plugins-->
    <script src="{{ URL::asset('build/plugins/perfect-scrollbar/js/perfect-scrollbar.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/metismenu/metisMenu.min.js') }}"></script>
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
    <script src="{{ URL::asset('build/plugins/select2/js/select2-custom.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/datatable/js/jquery.dataTables.min.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/datatable/js/dataTables.bootstrap5.min.js') }}"></script>
    <script>
        $(document).ready(function() {
            $('#dataContracts').DataTable({
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

            // Prevent dropdown from closing when clicking inside
            $('.dropdown-menu').on('click', function(e) {
                e.stopPropagation();
            });

            // Search functionality
            $('#searchEscritorio').on('input', function() {
                const searchTerm = $(this).val().toLowerCase();

                $('.escritorio-item').each(function() {
                    const escritorioText = $(this).find('label').text().toLowerCase();
                    $(this).toggle(escritorioText.includes(searchTerm));
                });
            });

            // Select All functionality
            $('#selectAllEscritorios').on('click', function() {
                $('.escritorio-item:visible input[type="checkbox"]').prop('checked', true);
                updateSelectedCount();
            });

            // Clear functionality
            $('#clearEscritorios').on('click', function() {
                $('.escritorio-item input[type="checkbox"]').prop('checked', false);
                updateSelectedCount();
            });

            // Update counter when individual checkboxes change
            $('.escritorio-item input[type="checkbox"]').on('change', function() {
                updateSelectedCount();
            });

            // Function to update the selected count in button text
            function updateSelectedCount() {
                const selectedCount = $('.escritorio-item input[type="checkbox"]:checked').length;
                $('#dropdownEscritorios').text(`Escritórios (${selectedCount} selecionados)`);
            }

            // Initialize counter
            updateSelectedCount();
        });
    </script>

@endpush
