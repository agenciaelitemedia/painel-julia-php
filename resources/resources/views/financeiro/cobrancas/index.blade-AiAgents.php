@extends('layouts.app')
@section('title', 'FINANCEIRO - Cobranças')

@push('css')
<style>
    .tooltip-inner {
        background-color: #0c5466 !important;
        color: #fff;
    }
</style>
@endpush

@section('content')
<x-page-title title="FINANCEIRO" subtitle="Cobranças" />

<div class="product-count d-flex align-items-center gap-3 gap-lg-12 mb-4 fw-medium flex-wrap font-text1">
    <div class="col-md-12 d-flex align-items-center gap-3">
        <div class="col-md-4 d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;" class="wh-48 bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center">
                <i class="material-icons-outlined">payments</i>
            </a>
            <div class="">
                <h5 class="mb-0">R$ {{ number_format($totalCobrancas, 2, ',', '.') }}</h5>
                <p class="mb-0">Total Cobranças</p>
            </div>
        </div>
        <div class="col-md-4 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;" class="wh-48 bg-success text-dark rounded-circle d-flex align-items-center justify-content-center">
                <i class="material-icons-outlined">check_circle</i>
            </a>
            <div class="">
                <h5 class="mb-0">R$ {{ number_format($totalRecebido, 2, ',', '.') }}</h5>
                <p class="mb-0">Total Recebido</p>
            </div>
        </div>
        <div class="col-md-4 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;" class="wh-48 bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center">
                <i class="material-icons-outlined">pending</i>
            </a>
            <div class="">
                <h5 class="mb-0">R$ {{ number_format($totalPendente, 2, ',', '.') }}</h5>
                <p class="mb-0">Total Pendente</p>
            </div>
        </div>
    </div>
</div>

<div class="card mb-4">
    <div class="card-body">
        <form method="GET" action="{{ route('financeiro.cobrancas') }}" class="row g-3">
            <div class="col-md-4">
                <div class="input-group">
                    <input type="date" class="form-control" name="start_date" value="{{ request('start_date') ?? now()->format('Y-m-d') }}" placeholder="Data Inicial">
                    <span class="input-group-text">até</span>
                    <input type="date" class="form-control" name="end_date" value="{{ request('end_date') ?? now()->format('Y-m-d') }}" placeholder="Data Final">
                </div>
            </div>
            <div class="col-md-3">
                <input type="text" class="form-control" name="customer_name" value="{{ request('customer_name') }}" placeholder="Nome do Cliente">
            </div>
            <div class="col-md-3">
                <select class="form-select" name="status">
                    <option value="">Todos os Status</option>
                    <option value="PENDING" {{ request('status') == 'PENDING' ? 'selected' : '' }}>Pendente</option>
                    <option value="RECEIVED" {{ request('status') == 'RECEIVED' ? 'selected' : '' }}>Recebido</option>
                    <option value="OVERDUE" {{ request('status') == 'OVERDUE' ? 'selected' : '' }}>Vencido</option>
                </select>
            </div>
            <div class="col-md-2">
                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-primary">
                        <i class="bi bi-search me-2"></i>Filtrar
                    </button>
                    <a href="{{ route('financeiro.cobrancas') }}" class="btn btn-secondary">
                        <i class="bi bi-x-circle me-2"></i>Limpar
                    </a>
                </div>
            </div>
        </form>
    </div>
</div>

<div class="card">
    <div class="card-body">
        <div class="d-flex justify-content-end mb-3">
            <a href="{{ route('financeiro.cobrancas.criar') }}" class="btn btn-primary">
                <i class="material-icons-outlined me-2">add</i>Nova Cobrança
            </a>
        </div>

        <div class="table-responsive-sm">
            <table class="table align-middle table-striped" id="dataCobrancas">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Cliente</th>
                        <th>Valor</th>
                        <th>Vencimento</th>
                        <th>Status</th>
                        <th class="text-center">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($cobrancas->data as $cobranca)
                    <tr>
                        <td>{{ \Carbon\Carbon::parse($cobranca->dateCreated)->format('d/m/Y H:i') }}</td>
                        <td>{{ $cobranca->customerData->name }}</td>
                        <td>R$ {{ number_format($cobranca->value, 2, ',', '.') }}</td>
                        <td>{{ \Carbon\Carbon::parse($cobranca->dueDate)->format('d/m/Y') }}</td>
                        <td>
                            @if($cobranca->status == 'RECEIVED')
                                <span class="badge bg-success">RECEBIDO</span>
                            @elseif($cobranca->status == 'PENDING')
                                <span class="badge bg-warning">PENDENTE</span>
                            @elseif($cobranca->status == 'OVERDUE')
                                <span class="badge bg-danger">VENCIDO</span>
                            @else
                                <span class="badge bg-secondary">{{ $cobranca->status }}</span>
                            @endif
                        </td>
                        <td class="text-center">
                            <a href="{{ route('financeiro.cobrancas.show', $cobranca->id) }}"
                               class="btn btn-sm btn-info"
                               data-bs-toggle="tooltip"
                               title="Visualizar">
                                <i class="material-icons-outlined">visibility</i>
                            </a>

                            <form action="{{ route('financeiro.cobrancas.delete', $cobranca->id) }}"
                                  method="POST"
                                  style="display: inline;">
                                @csrf
                                @method('DELETE')
                                <button type="submit"
                                        class="btn btn-sm btn-danger"
                                        data-bs-toggle="tooltip"
                                        title="Excluir"
                                        onclick="return confirm('Tem certeza que deseja excluir esta cobrança?')">
                                    <i class="material-icons-outlined">delete</i>
                                </button>
                            </form>
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
<script>
    $(document).ready(function() {
        $('[data-bs-toggle="tooltip"]').tooltip();

        $('#dataCobrancas').DataTable({
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
    });
</script>
@endpush
