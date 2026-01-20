@extends('layouts.app')
@section('title', 'ESTRATÉGICO - Análise de Campanhas por Origem')

@section('content')
<x-page-title title="ESTRATÉGICO" subtitle="Análise de Campanhas por Origem" />

<div class="card">
    <div class="card-body">
        <div class="table-responsive">
            <table class="table align-middle">
                <thead>
                    <tr>
                        <th>Escritório</th>
                        <th>Thumbnail</th>
                        <th>Título da Campanha</th>
                        <th>URL da Campanha</th>
                        <th>Status do Documento</th>
                        <th>Data de Criação</th>
                        <th class="text-center">Total de Leads</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($sourceStats as $stat)
                        <tr>
                            <td>{{ mask_data($stat['escritorio'], 'name') }}</td>
                            <td>{{ $stat['name'] }}</td>
                            <td>{{ $stat['title'] ?? 'Não informado' }}</td>
                            <td>
                                @if($stat['source_url'])
                                    <a href="{{ $stat['source_url'] }}"
                                       target="_blank"
                                       class="btn btn-link">
                                        <i class="material-icons-outlined">campaign</i>
                                        Ver Campanha
                                    </a>
                                @else
                                    <span class="text-muted">Não informado</span>
                                @endif
                            </td>
                            <td>{{ $stat['status_document'] }}</td>
                            <td>{{ $stat['created_at']->format('d/m/Y H:i') }}</td>
                            <td class="text-center">
                                <span class="badge bg-primary">{{ $stat['total'] }}</span>
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
        $('table').DataTable({
            pageLength: 25,
            ordering: true,
            order: [[4, 'desc']], // Sort by total leads column
            language: {
                url: "{{ URL::asset('build/plugins/datatable/js/Portuguese-Brasil.json') }}"
            }
        });
    });
</script>
@endpush
