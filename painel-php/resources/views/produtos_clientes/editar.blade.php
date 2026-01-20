@extends('layouts.app')
@section('title', 'Follow-up IA')

@section('content')
<x-page-title title="SETTINGS" subtitle="Follow-up IA" />

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

@php
if (!empty($phone)) {
$expectedWord = $phone;
$expectedWordMasked = substr($phone, 0, 6) . str_repeat('*', strlen($phone) - 6);
} else {
$expectedWord = 'Confirmar';
$expectedWordMasked = 'Confirmar';
}
@endphp

<div class="container-fluid">

    <!-- Card com o formulário de edição -->
    <div class="card" id="produtoCardEdicao">
        <form id="formProdutoCliente" method="POST" enctype="multipart/form-data" action="{{ route('produto-cliente.update', $produtoCliente->id) }}">
            @csrf
            @method('PUT')

            <div class="card-header">
                <h3 class="card-title">
                    <a style="margin-right: 15px;" href="javascript:history.back()" class="btn btn-secondary">Voltar</a>
                    Editar produto
                </h3>
            </div>

            <div class="card-body">
                <div class="row g-3">
                    <!-- Produto -->
                    <div class="col-12">
                        <label for="produto_id" class="form-label">Produto</label>
                        <select name="produto_id" id="produto_id" class="form-select">
                            <option value=""></option>
                            @foreach($produtos as $produto)
                            <option value="{{ $produto->id }}"
                                data-categoria="{{ $produto->categoria }}"
                                data-honorarios="{{ $produto->explicacao_honorarios }}"
                                data-frases="{{ $produto->frase_ativacao }}"
                                data-perguntas="{{ $produto->perguntas }}"
                                @if(old('produto_id', $produtoCliente->produto_id) == $produto->id) selected @endif>
                                {{ $produto->nome }} - {{ $produto->categoria }}
                            </option>
                            @endforeach
                        </select>
                    </div>

                    <!-- Categoria -->
                    <div class="col-12">
                        <label for="categoria" class="form-label">Categoria</label>
                        <select class="form-select" id="categoria_display" disabled>
                            <option value="">Selecione</option>
                            <option value="bancario" {{ $produtoCliente->categoria == 'bancario' ? 'selected' : '' }}>Bancário</option>
                            <option value="consumidor" {{ $produtoCliente->categoria == 'consumidor' ? 'selected' : '' }}>Consumidor</option>
                            <option value="familia" {{ $produtoCliente->categoria == 'familia' ? 'selected' : '' }}>Família</option>
                            <option value="imobiliario" {{ $produtoCliente->categoria == 'imobiliario' ? 'selected' : '' }}>Imobiliário</option>
                            <option value="previdenciario" {{ $produtoCliente->categoria == 'previdenciario' ? 'selected' : '' }}>Previdenciário</option>
                            <option value="trabalhista" {{ $produtoCliente->categoria == 'trabalhista' ? 'selected' : '' }}>Trabalhista</option>
                        </select>
                        <input type="hidden" name="categoria" id="categoria" value="{{ old('categoria', $produtoCliente->categoria) }}" />
                    </div>

                    <!-- Perguntas -->
                    <div class="col-12">
                        <label for="perguntas" class="form-label">Perguntas de qualificação</label>
                        <textarea name="perguntas" id="perguntas" class="form-control" rows="15">{{ old('perguntas', $produtoCliente->perguntas) }}</textarea>
                    </div>

                    <!-- Frase de ativação -->
                    <div class="col-12">
                        <label for="frase_ativacao" class="form-label">Frases de ativação</label>
                        <textarea name="frase_ativacao" id="frase_ativacao" class="form-control" rows="8">{{ old('frase_ativacao', $produtoCliente->frase_ativacao) }}</textarea>
                    </div>

                    <!-- Explicação dos honorários -->
                    <div class="col-12">
                        <label for="explicacao_honorarios" class="form-label">Explicação dos honorários</label>
                        <textarea name="explicacao_honorarios" id="explicacao_honorarios" class="form-control" rows="8">{{ old('explicacao_honorarios', $produtoCliente->explicacao_honorarios) }}</textarea>
                    </div>

                    <!-- Vídeo dos honorários 
                    <div class="col-12">
                        <label for="video_honorarios" class="form-label">Vídeo dos honorários</label>
                        <input name="video_honorarios" id="video_honorarios" type="file" class="form-control">
                        @if ($produtoCliente->video_honorarios)
                        <a href="{{ $produtoCliente->video_honorarios }}" target="_blank">{{ $produtoCliente->video_honorarios }}</a>
                        @endif
                    </div>
                    -->

                    <!-- Contrato explicativo -->
                    <div class="col-12">
                        <label for="contrato" class="form-label">Vídeo de explicação do contrato (como assinar)</label>
                        <input name="contrato" id="contrato" type="file" class="form-control">
                        @if ($produtoCliente->contrato)
                        <a href="{{ $produtoCliente->contrato }}" target="_blank">{{ $produtoCliente->contrato }}</a>
                        @endif
                    </div>

                    <!-- Documentos solicitados -->
                    <div class="col-12">
                        <label for="documentos_solicitados" class="form-label">Documentos que a Júlia deve solicitar ao cliente</label>
                        <textarea name="documentos_solicitados" id="documentos_solicitados" class="form-control" rows="8">{{ old('documentos_solicitados', $produtoCliente->documentos_solicitados) }}</textarea>
                    </div>

                    <!-- Botões -->
                    <div class="col-12 d-flex justify-content-between mt-4">
                        <button type="button" id="openConfirmModal" class="btn btn-success">Salvar alterações</button>
                        <a style="margin-right: 15px;" href="javascript:history.back()" class="btn btn-secondary">Voltar</a>
                    </div>
                </div>
            </div>
        </form>



        <!-- Modal -->
        <div class="modal fade" id="confirmModal" tabindex="-1" aria-labelledby="confirmModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Confirmação necessária</h4>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                    </div>
                    <div class="modal-header" style="text-align: justify; ">
                        <h6 style="font-size: 15px; font-weight: 100 !important">
                            <strong>⚠️ ATENÇÃO:</strong> você está abrindo uma solicitação de alteração na Júlia. A sua Júlia <strong>NÃO REFLETIRA IMEDIATAMENTE</strong> as alterações, somente após passar pela análise de um dos nossos técnicos.
                        </h6>
                    </div>
                    <div class="modal-body">
                        @if($expectedWord != 'Confirmar')
                        <p>Digite o telefone <strong id="expectedText">{{ $expectedWordMasked }}</strong> para continuar com a atualização:</p>
                        @else
                        <p>Digite a palavra <strong id="expectedText">{{ $expectedWordMasked }}</strong> para continuar com a atualização:</p>
                        @endif
                        <input type="text" id="confirmInput" class="form-control" placeholder="Digite aqui">
                        <div id="confirmError" class="text-danger mt-2 d-none">
                            O valor digitado está incorreto. Tente novamente.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="confirmSubmit">Confirmar e Atualizar</button>
                    </div>
                </div>
            </div>
        </div>

    </div>

    <!-- CONTRATOS RELACIONADOS -->
    @if(isset($contrato_produto_cliente) && count($contrato_produto_cliente) > 0)
    <div class="card mt-4">
        <div class="card-header">
            <h4>Contratos cadastrados</h4>
        </div>
        <div class="card-body">
            <ul class="list-group">
                @foreach($contrato_produto_cliente as $contrato)
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>{{ $contrato->nome ?? 'Contrato' }}</span>
                    <div class="btn-group">
                        <!-- Botão Baixar com JavaScript -->
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="baixarArquivo('{{ asset('storage/' . $contrato->url) }}', '{{ $contrato->nome ?? 'contrato.docx' }}')">
                            Baixar
                        </button>

                        <!-- Botão Deletar -->
                        <button style="margin-left: 5px" type="button" class="btn btn-sm btn-outline-danger" onclick="excluirContrato({{ $contrato->id }}, this)">
                            Excluir
                        </button>
                    </div>
                </li>
                @endforeach
            </ul>
        </div>
    </div>
    @endif


    <!-- NOVO CONTRATO -->
    <div class="card mt-3 mb-5">
        <div class="card-header">
            <h4>Enviar contrato</h4>
        </div>
        <div class="card-body">
            <form action="{{ route('contrato-produto.store') }}" method="POST" enctype="multipart/form-data">
                @csrf
                <input type="hidden" name="produto_cliente_id" value="{{ $produtoCliente->id }}">

                <div class="mb-3">
                    <label for="contrato_arquivo" class="form-label">Enviar novo contrato</label>
                    <input type="file" name="contrato_arquivo" id="contrato_arquivo" class="form-control" accept=".doc,.docx" required>
                </div>

                <button type="submit" class="btn btn-primary">Enviar contrato</button>
            </form>
        </div>
    </div>


    <div id="loader" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(255,255,255,0.7); z-index: 9999; justify-content: center; align-items: center;">
        <div class="spinner-border text-primary" role="status" style="width: 4rem; height: 4rem;">
            <span class="visually-hidden">Carregando...</span>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const openConfirmModal = document.getElementById('openConfirmModal');
            const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
            const confirmInput = document.getElementById('confirmInput');
            const confirmError = document.getElementById('confirmError');
            const confirmSubmit = document.getElementById('confirmSubmit');
            const form = document.getElementById('formProdutoCliente');

            const expectedWord = @json($expectedWord); // valor real, ex: '85999887766'

            console.log(expectedWord);

            openConfirmModal.addEventListener('click', () => {
                confirmInput.value = '';
                confirmError.classList.add('d-none');
                confirmModal.show();
            });

            confirmSubmit.addEventListener('click', () => {
                if (confirmInput.value.trim() === expectedWord) {
                    confirmModal.hide();
                    form.submit();
                } else {
                    confirmError.classList.remove('d-none');
                }
            });
        });
    </script>

    <script>
        $(document).ready(function() {
            $('#formProdutoCliente').on('submit', function(e) {
                e.preventDefault();

                const form = $(this)[0];
                const formData = new FormData(form);
                formData.append('_method', 'PUT');

                $('#loader').show();

                $.ajax({
                    url: $(form).attr('action'),
                    method: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    headers: {
                        'X-CSRF-TOKEN': $('input[name="_token"]').val()
                    },
                    success: function(response) {
                        $('#loader').hide();

                        Swal.fire({
                            icon: 'success',
                            title: 'Sucesso',
                            text: response.message || 'Produto atualizado com sucesso.',
                        }).then(() => {
                            window.location.href = document.referrer || '/'; // volta para a tela anterior
                        });
                    },
                    error: function(xhr) {
                        $('#loader').hide();

                        let mensagem = 'Erro ao salvar as alterações.';
                        if (xhr.responseJSON?.message) {
                            mensagem = xhr.responseJSON.message;
                        }

                        Swal.fire({
                            icon: 'error',
                            title: 'Erro',
                            text: mensagem,
                        });
                    }
                });
            });
        });
    </script>

    <!-- Script para popular campos -->
    <script>
        document.getElementById('produto_id').addEventListener('change', function() {
            const selected = this.options[this.selectedIndex];
            const categoria = selected.getAttribute('data-categoria') || '';
            const perguntas = selected.getAttribute('data-perguntas') || '';
            const frases = selected.getAttribute('data-frases') || '';
            const honorarios = selected.getAttribute('data-honorarios') || '';

            document.getElementById('perguntas').value = perguntas;
            document.getElementById('frase_ativacao').value = frases;
            document.getElementById('explicacao_honorarios').value = honorarios;
            document.getElementById('categoria').value = categoria;

            const categoriaDisplay = document.getElementById('categoria_display');
            for (let opt of categoriaDisplay.options) {
                opt.selected = opt.value === categoria;
            }
        });
    </script>

    <script>
        function baixarArquivo(url, nomeArquivo) {

            console.log(url);
            console.log(nomeArquivo);

            const link = document.createElement('a');
            link.href = url;
            link.download = nomeArquivo;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        function excluirContrato(contratoId, button) {
            if (!confirm("Tem certeza que deseja excluir este contrato?")) return;

            fetch(`/contrato-produto/${contratoId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': '{{ csrf_token() }}',
                    'Accept': 'application/json'
                }
            }).then(response => {
                if (response.ok) {
                    const item = button.closest('li');
                    item.remove();
                } else {
                    alert("Erro ao excluir o contrato.");
                }
            });
        }
    </script>

</div>

@endsection