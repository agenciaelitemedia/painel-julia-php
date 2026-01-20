@extends('layouts.app')
@section('title', 'Follow-up IA')

@section('content')
<x-page-title title="SETTINGS" subtitle="Follow-up IA" />

<div class="container-fluid">
    <form id="produtoForm" method="POST">
        @csrf
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Editar produto {{$produto->id}}</h3>
            </div>
            <div class="card-body" id="send_new">

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
                <div class="row g-3">
                    <div class="col-12 col-lg-6">
                        <label for="nome" class="form-label">Nome</label>
                        <input
                            type="text"
                            name="nome"
                            id="nome"
                            class="form-control"
                            value="{{ old('nome', $produto->nome ?? '') }}">
                        @error('nome')
                        <p style="color: red;">{{ $message }}</p>
                        @enderror
                    </div>

                    <div class="col-12 col-lg-6">
                        <label for="categoria" class="form-label">Categoria</label>
                        <select
                            name="categoria"
                            id="categoria"
                            class="form-select"
                            aria-label="Default select example">
                            <option value="">Selecione...</option>
                            <option value="previdenciario" {{ old('categoria', $produto->categoria ?? '') == 'previdenciario' ? 'selected' : '' }}>
                                Previdenciário
                            </option>
                        </select>
                        @error('categoria')
                        <p style="color: red;">{{ $message }}</p>
                        @enderror
                    </div>

                    <div class="col-12 col-lg-12">
                        <label for="explicacao_honorarios" class="form-label">Explicação dos honorários</label>
                        <textarea name="explicacao_honorarios" id="explicacao_honorarios" class="form-control" rows="3">
                        {{ old('explicacao_honorarios', $produto->explicacao_honorarios ?? '') }}
                        </textarea>
                    </div>

                    <div class="col-12 col-lg-12">
                        <label for="pergunta_qualificacao" class="form-label">Perguntas de qualificação</label>
                        <textarea
                            name="pergunta_qualificacao"
                            id="pergunta_qualificacao"
                            class="form-control"
                            rows="10"
                            cols="10">{{ old('perguntas', $produto->perguntas ?? '') }}</textarea>

                        @error('perguntas')
                        <p style="color: red;">{{ $message }}</p>
                        @enderror
                    </div>

                    <div class="col-12 col-lg-12">
                        <label for="frase_ativacao" class="form-label">Frases de ativação</label>
                        <textarea
                            name="frase_ativacao"
                            id="frase_ativacao"
                            class="form-control"
                            placeholder="Exemplo: tenho um filho autista"
                            rows="4"
                            cols="10">{{ old('frase_ativacao', $produto->frase_ativacao ?? '') }}</textarea>

                        @error('frase_ativacao')
                        <p style="color: red;">{{ $message }}</p>
                        @enderror
                    </div>
                </div>

            </div>
            <div class="card-footer">
                <div class="col-12">
                    <button type="submit" class="btn btn-success" id="saveButton">
                        <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                        <span class="button-text">Salvar</span>
                    </button>
                </div>
            </div>
        </div>
    </form>
</div>

<input type="hidden" id="form_action_url" value="{{ isset($produto) ? route('produtos.update', $produto->id) : route('produtos.store') }}">


@endsection



@push('script')
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>



<script>
    $(document).ready(function() {
        $('#produtoForm').on('submit', function(e) {
            e.preventDefault();

            const form = this;
            const formData = new FormData(form);
            const url = $('#form_action_url').val();
            const token = $('input[name="_token"]').val();

            @if(isset($produto))
            formData.append('_method', 'PUT');
            @endif

            $.ajax({
                url: url,
                type: 'POST', // Sempre POST com override via _method
                headers: {
                    'X-CSRF-TOKEN': token
                },
                data: formData,
                processData: false,
                contentType: false,
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        Swal.fire('Sucesso!', response.message, 'success').then(() => {
                            window.location.href = response.redirect ?? window.location.href;
                        });
                    } else {
                        Swal.fire('Erro', response.message, 'error');
                    }
                },
                error: function(xhr) {
                    let mensagem = 'Erro ao processar o formulário.';
                    if (xhr.responseJSON?.message) {
                        mensagem = xhr.responseJSON.message;
                    }
                    Swal.fire('Erro', mensagem, 'error');
                }
            });
        });
    });


    $(document).ready(function() {
        // Ao clicar no botão editar, exibe o input e o botão de salvar
        $('.btn-editar').click(function() {
            // Fecha qualquer edição anterior
            $('.categoria-input').hide(); // Esconde todos os inputs de edição
            $('.btn-salvar').hide(); // Esconde todos os botões de salvar
            $('.categoria-nome').show(); // Exibe novamente todos os nomes da categoria
            $('.btn-editar').show(); // Exibe todos os botões de editar

            var categoriaId = $(this).data('id'); // ID da categoria
            var tdElement = $('#nome-categoria-' + categoriaId); // Elemento <td> da categoria
            var nomeCategoria = tdElement.find('.categoria-nome').text(); // Pega o nome da categoria

            // Substitui o nome da categoria pelo input
            tdElement.find('.categoria-input').val(nomeCategoria).show();
            tdElement.find('.categoria-nome').hide(); // Esconde o nome da categoria

            // Exibe o botão de salvar                                   
            $('#btn-salvar-' + categoriaId).show();

            $(this).hide(); // Esconde o botão editar
        });

        // Ao clicar no botão salvar, envia as alterações via AJAX
        $('.btn-salvar').click(function() {
            var categoriaId = $(this).data('id');
            var novoNome = $('#nome-categoria-' + categoriaId).find('.categoria-input').val(); // Novo nome da categoria

            // Verifica se o novo nome não está vazio
            if (novoNome.trim() === '') {
                alert('O nome não pode estar vazio!');
                return;
            }

            $.ajax({
                url: "{{ route('categorias.criativos.edit') }}", // Rota para editar
                type: 'POST',
                data: {
                    _token: "{{ csrf_token() }}", // Token CSRF
                    id: categoriaId, // ID da categoria
                    nome: novoNome // Novo nome da categoria
                },
                success: function(response) {
                    // Atualiza o nome na tabela e esconde o input e o botão de salvar
                    $('#nome-categoria-' + categoriaId).find('.categoria-nome').text(novoNome).show();
                    $('#nome-categoria-' + categoriaId).find('.categoria-input').hide();
                    $('#nome-categoria-' + categoriaId).find('.btn-salvar').hide();
                    $('#nome-categoria-' + categoriaId).find('.btn-editar').show();

                    Swal.fire("Deletado!", "Categoria atualizada com sucesso!", "success")
                        .then(() => location.reload());
                },
                error: function(error) {
                    console.log(error);
                    Swal.fire("Erro!", "Ocorreu um erro ao excluir.", "error");
                }
            });
        });
    });

    $(document).ready(function() {
        $('.delete-btn').click(function(e) {
            e.preventDefault();

            let categoriaId = $(this).data('id'); // Pega o ID da categoria
            let url = "{{ route('produtos.delete', ':id') }}".replace(':id', categoriaId);

            console.log("Enviando id " + categoriaId);

            Swal.fire({
                title: "Tem certeza?",
                text: "Você não poderá reverter esta ação!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Sim, excluir!",
                cancelButtonText: "Cancelar"
            }).then((result) => {
                if (result.isConfirmed) {
                    $.ajax({
                        url: url,
                        type: "POST",
                        data: {
                            _token: "{{ csrf_token() }}",
                            id: categoriaId
                        },
                        success: function(response) {
                            console.log(response);
                            if (response.success) {
                                Swal.fire("Deletado!", "Produto deletado com sucesso!", "success")
                                    .then(() => location.reload());
                            } else {
                                Swal.fire("Ops...", response.message, "error");
                            }
                        },
                        error: function(error) {
                            console.log(error);
                            Swal.fire("Erro!", "Ocorreu um erro ao excluir.", "error");
                        }
                    });
                }
            });
        });
    });
</script>


@endpush