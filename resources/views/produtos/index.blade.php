@extends('layouts.app')
@section('title', 'Follow-up IA')

@section('content')
<x-page-title title="SETTINGS" subtitle="Follow-up IA" />

<div class="container-fluid">
    <form id="uploadForm" method="POST">
        @csrf
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Novo produto</h3>
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
                        <label for="cod_client" class="form-label">Nome</label>
                        <input type="text" name="nome" id="nome" type="text" class="form-control">

                        @error('nome')
                        <p style="color: red;">{{ $message }}</p>
                        @enderror
                    </div>

                    <div class="col-12 col-lg-6">
                        <label for="cod_client" class="form-label">Categoria</label>

                        <select name="categoria" id="categoria" class="form-select" id="inputSelectCountry" aria-label="Default select example">
                            <option selected=""></option>
                            <option value="bancario">Bancário</option>
                            <option value="consumidor">Consumidor</option>
                            <option value="familia">Família</option>
                            <option value="imobiliario">Imobiliário</option>
                            <option value="previdenciario">Previdenciário</option>
                            <option value="trabalhista">Trabalhista</option>
                        </select>

                        @error('categoria')
                        <p style="color: red;">{{ $message }}</p>
                        @enderror
                    </div>

                    <div class="col-12 col-lg-12">
                        <label for="explicacao_honorarios" class="form-label">Explicação dos honorários</label>
                        <textarea name="explicacao_honorarios" id="explicacao_honorarios" class="form-control" rows="3"></textarea>
                    </div>

                    <div class="col-12 col-lg-12">
                        <label for="cod_client" class="form-label">Frases de ativação</label>
                        <textarea name="frase_ativacao" id="frase_ativacao" class="form-control" placeholder="Exemplo: tenho um filho autista" rows="4" cols="10"></textarea>

                        @error('frase_ativacao')
                        <p style="color: red;">{{ $message }}</p>
                        @enderror
                    </div>

                    <div class="col-12 col-lg-12">
                        <label for="perguntas" class="form-label">Perguntas de qualificação</label>
                        <textarea name="perguntas" id="perguntas" class="form-control" rows="3"></textarea>
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
            <h3 class="card-title">Produtos cadastrados</h3>
        </div>
        <div class="card-body" id="send_new">
            <div class="card-body">
                <div class="table-responsive-sm white-space-nowrap">
                    <table class="table align-middle table-striped" id="dataContracts">
                        <thead class="table">
                            <tr>
                                <th class="text-center">Nome</th>
                                <th class="text-center">Categoria</th>
                                <th class="text-center" style="width: 90px;">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($produtos as $categoria)
                            <tr id="categoria-{{$categoria->id}}">
                                <td class="text-center">
                                    <!-- Exibe o nome da categoria -->
                                    <span class="categoria-nome">{{ $categoria->nome }}</span>

                                    <!-- Input para edição, inicialmente escondido -->
                                    <input type="text" class="form-control categoria-input" value="{{ $categoria->nome }}" style="display:none;">
                                </td>
                                <td class="text-center">
                                    <!-- Exibe o nome da categoria -->
                                    <span class="categoria-nome">{{ $categoria->categoria }}</span>

                                    <!-- Input para edição, inicialmente escondido -->
                                    <input type="text" class="form-control categoria-input" value="{{ $categoria->categoria }}" style="display:none;">
                                </td>
                                <td>
                                    <div>
                                        <!-- Botão de Editar -->
                                        <a href="/produtos/{{$categoria->id}}" class="btn btn-link btn-editar" data-id="{{ $categoria->id }}" style="width:30px">
                                            <i class="material-icons-outlined">edit</i>
                                        </a>

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
        $('#uploadForm').on('submit', function(e) {
            e.preventDefault();

            $("#progressContainer").show();
            $("#progressBar").css("width", "0%").text("0%");

            let formData = new FormData(this);

            $.ajax({
                url: "{{ route('produtos.store') }}",
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {

                    $("#progressContainer").hide();

                    if (response.success) {
                        showAlert('success', response.message);
                        $('#imageInput').val('');
                        location.reload();
                    } else {
                        showAlert('danger', response.message);
                    }
                },
                error: function() {
                    $('#alert-container').html(
                        '<div class="alert alert-danger">Erro ao enviar a imagem.</div>'
                    );
                }
            });
        });
    });

    function showAlert(type, message) {
        const alertHtml = `
                <div class="alert alert-${type} border-0 bg-${type} alert-dismissible fade show">
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

        $('#send_new').prepend(alertHtml);
    }

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