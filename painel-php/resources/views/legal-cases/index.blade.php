@extends('layouts.app')
@section('title', 'Casos Legais')

@section('content')
    <x-page-title title="Casos Legais" subtitle="Lista de Casos" />

    <div class="card">
        <div class="card-body">
            @if(session('success'))
                <div class="alert alert-success border-0 bg-success alert-dismissible fade show">
                    <div class="d-flex align-items-center">
                        <div class="font-35 text-white"><i class='bx bxs-check-circle'></i></div>
                        <div class="ms-3">
                            <h6 class="mb-0 text-white">Sucesso!</h6>
                            <div class="text-white">{{ session('success') }}</div>
                        </div>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            @endif

            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <form method="GET" action="{{ route('legal-cases.index') }}" class="row g-3">
                        <div class="col-auto">
                            <select name="type" class="form-select">
                                <option value="">Todos os Tipos</option>
                                @foreach($types as $type)
                                    <option value="{{ $type }}" {{ request('type') == $type ? 'selected' : '' }}>
                                        {{ $type }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        <div class="col-auto">
                            <input type="text" name="name" class="form-control" placeholder="Buscar por nome..." value="{{ request('name') }}">
                        </div>
                        <div class="col-auto">
                            <button type="submit" class="btn btn-primary">Filtrar</button>
                        </div>
                    </form>
                </div>
                <div>
                    <a href="{{ route('legal-cases.create') }}" class="btn btn-primary">Novo Caso</a>
                </div>
            </div>

            <div class="table-responsive">
                <table class="table table-striped" id="dataTable">
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Nome</th>
                            <th>Criado em</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($cases as $case)
                            <tr>
                                <td>{{ $case->type }}</td>
                                <td>{{ $case->name }}</td>
                                <td>{{ $case->created_at->format('d/m/Y H:i') }}</td>
                                <td>
                                    <div class="d-flex gap-2">
                                        <a href="{{ route('legal-cases.edit', $case) }}" class="btn btn-sm btn-warning">
                                            <i class="bx bx-edit"></i>
                                        </a>
                                        <form action="{{ route('legal-cases.destroy', $case) }}" method="POST" class="d-inline">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('Tem certeza que deseja excluir este caso?')">
                                                <i class="bx bx-trash"></i>
                                            </button>
                                        </form>
                                    </div>
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
            $('#dataTable').DataTable({
                pageLength: 25,
                searching: false,
                ordering: true,
                language: {
                    url: "{{ URL::asset('build/plugins/datatable/js/Portuguese-Brasil.json') }}"
                }
            });
        });
    </script>
@endpush
