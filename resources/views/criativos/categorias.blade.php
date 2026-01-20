@extends('layouts.app')
@section('title', 'Follow-up IA')

@section('content')
<x-page-title title="SETTINGS" subtitle="Follow-up IA" />

<div class="container-fluid">
    <form action="{{ route('categorias.criativos.store') }}" method="POST">
        @csrf
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Nova categoria</h3>
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
                    <div class="col-12 col-lg-2">
                        <label for="cod_client" class="form-label">Nome</label>
                        <input type="text" name="nome" id="nome" type="text" class="form-control">

                        @error('nome')
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
<div class="container-fluid">
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Categorias</h3>
        </div>
        <div class="card-body" id="send_new">
            <div class="card-body">
                <div class="table-responsive-sm white-space-nowrap">
                    <table class="table align-middle table-striped" id="dataContracts">
                        <thead class="table">
                            <tr>
                                <th class="text-center">Nome</th>
                                <th class="text-center" style="width: 90px;">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($categorias as $categoria)
                            <tr id="categoria-{{$categoria->id}}">
                                <td id="nome-categoria-{{$categoria->id}}">
                                    <!-- Exibe o nome da categoria -->
                                    <span class="categoria-nome">{{ $categoria->nome }}</span>

                                    <!-- Input para edição, inicialmente escondido -->
                                    <input type="text" class="form-control categoria-input" value="{{ $categoria->nome }}" style="display:none;">
                                </td>
                                <td>
                                    <div>
                                        <!-- Botão de Editar -->
                                        <button class="btn btn-link btn-editar" data-id="{{ $categoria->id }}" style="width:30px">
                                            <i class="material-icons-outlined">edit</i>
                                        </button>

                                        <!-- Botão de Salvar, inicialmente escondido -->
                                        <button id="btn-salvar-{{$categoria->id}}" class="btn btn-link btn-salvar" data-id="{{ $categoria->id }}" style="width:30px; display:none;">
                                            <i class="material-icons-outlined">check</i>
                                        </button>

                                        <!-- Botão de Excluir -->
                                        <button class="btn btn-link delete-btn" title="Excluir" style="width:30px" data-id="{{ $categoria->id }}">
                                            <i class="material-icons-outlined">delete</i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            @endforeach
                        </tbody>

                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection



@push('script')
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>



<script>
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
            let url = "{{ route('categorias.delete', ':id') }}".replace(':id', categoriaId);

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
                                Swal.fire("Deletado!", "Categoria deletada com sucesso!", "success")
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