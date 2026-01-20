@extends('layouts.app')
@section('title', 'JulIA')

@push('css')
<style>
    .dropdown-menu .form-check {
        padding: 0.25rem 1.5rem;
    }
</style>
@endpush

@section('content')
<x-page-title title="ESTRATÉGICO" subtitle="Contratos da JulIA" />



<div class="product-count d-flex align-items-center gap-3 gap-lg-12 mb-4 fw-medium flex-wrap font-text1">
    <div class="col-md-12 d-flex align-items-center gap-3">
        <div
            class="col-md-3 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;"
                class="wh-48 bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center">
                <i class="material-icons-outlined">balance</i>
            </a>
            <div class="">
                <h5 class="mb-0">{{ $contracts->count() }}</h5>
                <small>Contratos</small>
            </div>
        </div>
        <div
            class="col-md-3 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;"
                class="wh-48 bg-info text-dark rounded-circle d-flex align-items-center justify-content-center">
                <i class="material-icons-outlined">receipt_long</i>
            </a>
            <div class="">
                <h5 class="mb-0">{{ $contracts->where('status_document', 'CREATED')->count() }}</h5>
                <p class="mb-0">Em curso</p>
            </div>
        </div>
        <div
            class="col-md-3 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;"
                class="wh-48 bg-success text-dark rounded-circle d-flex align-items-center justify-content-center">
                <i class="material-icons-outlined">receipt_long</i>
            </a>
            <div class="">
                <h5 class="mb-0">{{ $contracts->where('status_document', 'SIGNED')->count() }}</h5>
                <p class="mb-0">Assinados</p>
            </div>
        </div>

        <div
            class="col-md-3 d-flex flex-row gap-2 align-items-center justify-content-center border p-3 rounded-3 flex-fill">
            <a href="javascript:;"
                class="wh-48 bg-danger text-dark rounded-circle d-flex align-items-center justify-content-center">
                <i class="material-icons-outlined">receipt_long</i>
            </a>
            <div class="">
                <h5 class="mb-0">{{ $contracts->where('status_document', 'DELETED')->count() }}</h5>
                <p class="mb-0">Excluídos</p>
            </div>
        </div>
    </div>
</div>

<div class="card mb-4">
    <div class="card-body">
        <div class="row g-3">
            <div class="col-md-8">
                <form method="GET" action="{{ route('leads.my-contracts') }}" class="row g-3">
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
                                    @foreach($contracts->sortBy('name')->pluck('name', 'cod_agent')->unique() as $cod_agent => $escritorio)
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
                        <div class="d-flex align-items-center gap-2">
                            <button type="submit" class="btn btn-primary px-4">
                                <i class="bi bi-search me-2"></i>Filtrar
                            </button>
                            <a href="{{ route('leads.my-contracts') }}" class="btn btn-secondary px-4">
                                <i class="bi bi-x-circle me-2"></i>Limpar
                            </a>
                        </div>
                    </div>
                </form>
            </div>
            <div class="col-md-4">
                <div class="d-flex justify-content-end gap-2">
                    <a href="{{ route('leads.contracts.export-excel') }}?start_date={{ request('start_date') ?? now()->format('Y-m-d') }}&end_date={{ request('end_date') ?? now()->format('Y-m-d') }}" class="btn btn-success px-4">
                        <i class="bi bi-file-excel me-2"></i>Excel
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="card mt-4">
    <div class="card-body">
        <div class="table-responsive-sm white-space-nowrap">
            <table class="table align-middle table-striped" id="dataContracts">
                <thead class="table">
                    <tr>
                        <th width="200">Data do Contrato</th>
                        <th>Escritório</th>
                        <th>Nome Contratante</th>
                        <th width="200" class="text-center">Telefone</th>
                        <th class="text-center">Situação</th>
                        <th class="text-center">Tempo</th>
                        <th class="text-center">Resumo</th>
                        <th width="100" class="text-center">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($contracts as $contract)
                    <tr data-id="{{ $contract }}">
                        <td width="200">{{ \Carbon\Carbon::parse($contract->created_at)->format('d/m/Y H:i') }} </td>
                        <td>{{ mask_data($contract->name, 'name') }}</td>
                        <td>{{ mask_data($contract->signer_name, 'name') }}</td>
                        <td class="text-center">
                            {{ mask_data(formata_telefone($contract->whatsapp_number), 'phone') }}
                            <button class="btn btn-link" onclick="copyToClipboard('{{ $contract->whatsapp_number }}')" title="Copiar número">
                                <i class="bi bi-clipboard"></i>
                            </button>
                        </td>
                        <td class="text-center">
                            @if($contract->status_document == 'CREATED')
                            GERADO
                            @elseif($contract->status_document == 'DELETED')
                            EXCLUÍDO
                            @elseif($contract->status_document == 'SIGNED')
                            ASSINADO
                            @else
                            {{ $contract->status_document }}
                            @endif
                        </td>
                        <td class="text-center">{{ diferenca_tempo(  $contract->created_at, $contract->signed_at ) }}</td>
                        <td data-bs-toggle="modal"
                            data-bs-target="#resume_case" style="cursor:pointer" class="text-center"> <i class="bi bi-search me-2"></i></td>
                        <td width="100" class="text-center">
                            <a href="https://wa.me/{{ mask_data($contract->whatsapp_number, 'phone') }}" target="_blank" class="btn btn-link" title="Chamar no WhatsApp">
                                <i class="lni lni-whatsapp"></i>
                            </a>
                            <a href="https://app.zapsign.com.br/verificar/{{ mask_data($contract->cod_document, 'text') }}" target="_blank" class="btn btn-link" title="Ver Contrato">
                                <i class="material-icons-outlined">balance</i>
                            </a>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>


<!--start resume_case modal -->
<div class="modal" id="resume_case">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <div class="modal-body">
                <div class="position-relative">
                    <a href="javascript:;" class="sharelink ms-auto"
                        data-bs-dismiss="modal">
                        <span class="material-icons-outlined">close</span>
                    </a>
                </div>
                <div class="text-center">
                    <h4>Resumo do caso </h4>
                </div>
                <div class="text-justify">
                    <p id="resumecaseContent"></p>
                </div>
                <div class="text-center">
                    <button data-bs-dismiss="modal" type="button" class="btn btn-danger px-4 close">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
<!--end resume_case modal-->

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
    function copyToClipboard(text) {
        // Tenta copiar o texto para a área de transferência
        var textArea = document.createElement("textarea");

        textArea.style.position = 'fixed';
        textArea.style.top = 0;
        textArea.style.left = 0;
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = 0;
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        textArea.value = text;

        document.body.appendChild(textArea);
        textArea.select();

        try {
            var successful = document.execCommand('copy');
            var msg = successful ? 'success' : 'unsuccessful';
            showAlert(msg, 'Número copiado com sucesso!');
            console.log('Copying text command was ' + msg);
        } catch (err) {
            console.log('Oops, unable to copy');
            window.prompt("Copie para área de transferência: Ctrl+C e tecle Enter", text);
        }

        document.body.removeChild(textArea);

    }

    function showAlert(type, message) {
        const alertHtml = `
            <div class="alert alert-${type} border-0 bg-${type} alert-dismissible fade show" style="position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
                <div class="d-flex align-items-center">
                    <div class="font-35 text-white">
                        <span class="material-icons-outlined fs-2">${type === 'success' ? 'check_circle' : 'report_gmailerrorred'}</span>
                    </div>
                    <div class="ms-3">
                        <h6 class="mb-0 text-white">${type === 'success' ? 'Sucesso' : 'Erro'}</h6>
                        <div class="text-white">${message}</div>
                    </div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        // Inserir o alert no body do documento
        document.body.insertAdjacentHTML('beforeend', alertHtml);

        // Remover o alerta após 5 segundos
        setTimeout(() => {
            const alerts = document.querySelectorAll('.alert');
            alerts[alerts.length - 1].remove();
        }, 3000);
    }

    $(document).ready(function() {
        $('#dataContracts').DataTable({
            pageLength: 31,
            searching: false,
            ordering: true,
            order: [
                [0, 'desc']
            ], // Order by first column (Data do Contrato) descending
            info: true,
            paging: true,
            lengthChange: false,
            language: {
                url: "{{ URL::asset('build/plugins/datatable/js/Portuguese-Brasil.json') }}"
            }
        });
    });
</script>

<script>
    $(document).ready(function() {
        $('#dataContracts tbody tr').click(function() {
            var contrato_selecionado = $(this).data('id');

            $('#resumecaseContent').text(contrato_selecionado.resume_case);
            $('#clientName').text(contrato_selecionado.signer_name);
        });
    });
</script>

@endpush