@extends('layouts.app')
@section('title')
    Agentes
@endsection

@section('content')
    <x-page-title title="Agentes" subtitle="Lista de Agentes" />



                        @if(session('success'))
                            <div class="alert alert-success border-0 bg-success alert-dismissible fade show">
                                <div class="d-flex align-items-center">
                                    <div class="font-35 text-white">
                                        <span class="material-icons-outlined fs-2">check_circle</span>
                                    </div>
                                    <div class="ms-3">
                                        <h6 class="mb-0 text-white">Sucesso</h6>
                                        <div class="text-white">{{ session('success') }}</div>
                                    </div>
                                </div>
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>
                        @endif

                        @if(session('error'))
                            <div class="alert alert-danger border-0 bg-danger alert-dismissible fade show">
                                <div class="d-flex align-items-center">
                                    <div class="font-35 text-white">
                                        <span class="material-icons-outlined fs-2">report_gmailerrorred</span>
                                    </div>
                                    <div class="ms-3">
                                        <h6 class="mb-0 text-white">Erro</h6>
                                        <div class="text-white">{{ session('error') }}</div>
                                    </div>
                                </div>
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>
                        @endif

    <div class="row">
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">Agentes</h5>
            <a href="{{ route('agents.create') }}" class="btn btn-grd-primary">
                <i class="bx bx-plus me-1"></i> Novo Agente
            </a>
        </div>

        <div class="card-body">
            <div class="table-responsive-sm white-space-nowrap">
                <table class="table align-middle table-striped" id="dataAgents">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Cod. Agente</th>
                            <th>Nome/Escritório</th>
                            <th>Plano</th>
                            <th>Limite/Uso</th>
                            <th>Last</th>
                            <th>Venci.</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($agents as $agent)
                            <tr>
                                <td>
                                    <div class="form-check form-switch form-check-success">
                                        <input type="checkbox" class="form-check-input toggle-status"
                                               {{ $agent->status ? 'checked' : '' }}
                                               data-agent-id="{{ $agent->id }}"
                                               disabled>
                                    </div>
                                </td>
                                <td>{{ $agent->cod_agent }}</td>
                                <td>
                                    <div class="d-flex flex-column">
                                        <span class="fw-bold">{{ $agent->client->name }}</span>
                                        <small  class="text-white">{{ $agent->client->business_name }}</small>
                                    </div>
                                </td>
                                <td>{{ $agent->usedAgent->plan ?? '-' }}</td>
                                <td>
                                    <div class="d-flex flex-column">
                                        <div class="progress" style="height: 6px; width: 100px;">
                                            @php
                                                $limit = $agent->usedAgent->limit ?? 0;
                                                $usage = $agent->usedAgent->used ?? 0;
                                                $percentage = $limit > 0 ? min(($usage / $limit) * 100, 100) : 0;
                                                $colorClass = $percentage >= 90 ? 'bg-danger' :
                                                            ($percentage >= 70 ? 'bg-warning' : 'bg-success');
                                            @endphp
                                            <div class="progress-bar {{ $colorClass }}"
                                                 role="progressbar"
                                                 style="width: {{ $percentage }}%"
                                                 aria-valuenow="{{ $percentage }}"
                                                 aria-valuemin="0"
                                                 aria-valuemax="100">
                                            </div>
                                        </div>
                                        <small class="text-white">{{ $usage }}/{{ $limit }}</small>
                                    </div>
                                </td>
                                <td>
                                        <span data-bs-toggle="tooltip"
                                              title="">
                                            {{ $agent->usedAgent->last_used ?? 0}}
                                        </span>
                                </td>
                                <td>
                                    @if($agent->usedAgent->due_date ?? false)
                                        <span class="badge bg-label-{{ now()->day > $agent->usedAgent->due_date ? 'danger' : 'success' }}">
                                            Dia {{ $agent->usedAgent->due_date }}
                                        </span>
                                    @else
                                        <span class="text-muted">-</span>
                                    @endif
                                </td>
                                <td>
                                    <div class="dropdown">
                                        <button type="button" class="btn btn-ghost-secondary btn-icon btn-sm dropdown-toggle hide-arrow"
                                                data-bs-toggle="dropdown">
                                            <i class="bx bx-dots-vertical-rounded"></i>
                                        </button>
                                        <div class="dropdown-menu dropdown-menu-end">
                                            <a class="dropdown-item" href="{{ route('agents.edit', $agent->id) }}">
                                                <i class="bx bx-edit-alt me-1"></i> Editar
                                            </a>
                                           <!-- <div class="dropdown-divider"></div>
                                            <form action="" method="POST"
                                                  onsubmit="return confirm('Tem certeza que deseja excluir este agente?');">
                                                @csrf
                                                @method('DELETE')
                                                <button type="submit" class="dropdown-item text-danger">
                                                    <i class="bx bx-trash me-1"></i> Excluir
                                                </button>
                                            </form> -->
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="8" class="text-center">Nenhum agente encontrado</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <div class="d-flex justify-content-end mt-3">
                {{ $agents->links() }}
            </div>
        </div>
    </div>
@endsection

@push('script')
<script src="{{ URL::asset('build/plugins/datatable/js/jquery.dataTables.min.js') }}"></script>
<script>
    $(document).ready(function() {

        $('#dataAgents').DataTable({
            pageLength: 100,
            searching: true,
            ordering: true,
            order: [[0, 'desc']],
            info: true,
            paging: true,
            lengthChange: false,
            language: {
                url: "{{ URL::asset('build/plugins/datatable/js/Portuguese-Brasil.json') }}"
            }
        });

        // Inicializa tooltips
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl)
        });
    });
</script>
@endpush
