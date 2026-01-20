@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-6">
            <h2>Cobranças</h2>
        </div>
        <div class="col-md-6 text-right">
            <a href="{{ route('financeiro.cobrancas.criar') }}" class="btn btn-primary">
                Nova Cobrança
            </a>
        </div>
    </div>

    @if(session('success'))
        <div class="alert alert-success">
            {{ session('success') }}
        </div>
    @endif

    @if(session('error'))
        <div class="alert alert-danger">
            {{ session('error') }}
        </div>
    @endif

    <div class="card">
        <div class="card-body">
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Valor</th>
                        <th>Vencimento</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($cobrancas as $cobranca)
                    <tr>
                        <td>{{ $cobranca->id }}</td>
                        <td>{{ $cobranca->customer }}</td>
                        <td>R$ {{ number_format($cobranca->value, 2, ',', '.') }}</td>
                        <td>{{ \Carbon\Carbon::parse($cobranca->dueDate)->format('d/m/Y') }}</td>
                        <td>
                            <span class="badge badge-{{ $cobranca->status == 'RECEIVED' ? 'success' : 'warning' }}">
                                {{ $cobranca->status }}
                            </span>
                        </td>
                        <td>
                            <a href="{{ route('financeiro.cobrancas.show', $cobranca->id) }}"
                               class="btn btn-sm btn-info">Ver</a>

                            <form action="{{ route('financeiro.cobrancas.delete', $cobranca->id) }}"
                                  method="POST"
                                  style="display: inline;">
                                @csrf
                                @method('DELETE')
                                <button type="submit"
                                        class="btn btn-sm btn-danger"
                                        onclick="return confirm('Tem certeza?')">
                                    Excluir
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
