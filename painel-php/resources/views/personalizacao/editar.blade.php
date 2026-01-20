@extends('layouts.app')
@section('title', 'Personalização')

@section('content')
<x-page-title title="PERSONALIZAÇÃO" subtitle="Dados do escritório" />

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

<div class="container-fluid">
    <!-- Botão para exibir/ocultar o formulário -->
    <button class="btn btn-primary mb-3" type="button" id="toggleCard">
        Adicionar novo produto
    </button>

    <!-- Card com o formulário -->
    <div class="card d-none" id="produtoCard">
        <form action="{{ route('produto-cliente.store') }}" method="POST" enctype="multipart/form-data">
            @csrf

            <div class="card-header">
                <h3 class="card-title">Novo produto</h3>
            </div>

            <div class="card-body" id="send_new">
                <!-- PRODUTO -->
                <div class="row g-3">
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
                                @if(old('produto_id', $personalizacao->produto_id ?? '') == $produto->id) selected @endif>
                                {{ $produto->nome }} - {{ $produto->categoria }}
                            </option>
                            @endforeach
                        </select>
                    </div>

                    <!-- Campo Categoria -->
                    <div class="col-12">
                        <label for="categoria" class="form-label">Categoria</label>
                        <!-- Campo visível (readonly, mas não impede envio) -->
                        <select class="form-select" id="categoria_display" disabled>
                            <option value="">Selecione</option>
                            <option value="bancario">Bancário</option>
                            <option value="consumidor">Consumidor</option>
                            <option value="familia">Família</option>
                            <option value="imobiliario">Imobiliário</option>
                            <option value="previdenciario">Previdenciário</option>
                            <option value="trabalhista">Trabalhista</option>
                        </select>
                    </div>

                    <!-- Campo oculto que será realmente enviado -->
                    <input type="hidden" name="categoria" id="categoria" />

                    <div class="col-12">
                        <label for="perguntas" class="form-label">Perguntas de qualificação</label>
                        <textarea name="perguntas" id="perguntas" class="form-control" rows="15"></textarea>
                    </div>

                    <div class="col-12">
                        <label for="frase_ativacao" class="form-label">Frases de ativação</label>
                        <textarea name="frase_ativacao" id="frase_ativacao" class="form-control" rows="3"></textarea>
                    </div>

                    <div class="col-12">
                        <label for="explicacao_honorarios" class="form-label">Explicação dos honorários</label>
                        <textarea name="explicacao_honorarios" id="explicacao_honorarios" class="form-control" rows="3"></textarea>
                    </div>

                    <!--
                    <div class="col-12">
                        <label for="video_honorarios" class="form-label">Vídeo dos honorários</label>
                        <input name="video_honorarios" id="video_honorarios" type="file" class="form-control">
                    </div>
-->

                    <div class="col-12">
                    <label for="contrato" class="form-label">Vídeo de explicação do contrato (como assinar)</label>
                        <input name="contrato" id="contrato" type="file" class="form-control">
                    </div>

                    <div class="col-12 d-flex justify-content-between">
                        <button type="submit" class="btn btn-success">Salvar</button>
                        <button type="button" class="btn btn-secondary" id="cancelarProduto">Cancelar</button>
                    </div>
                </div>
            </div>
        </form>
    </div>

    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Meus produtos</h3>
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
                            @foreach($meus_produtos as $categoria)
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

<div class="container-fluid">
    <form id="uploadForm" method="POST" enctype="multipart/form-data"
        action="{{ $personalizacao ? route('personalizacao.update', $personalizacao->id) : route('personalizacao.store') }}">
        @csrf
        @if($personalizacao)
        @method('PUT')
        @endif

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Personalização</h3>
            </div>
            <div class="card-body" id="send_new">

                @php
                $personalizacao = $personalizacao ?? null;
                @endphp

                <input type="hidden" id="form_action_url" value="{{ isset($personalizacao) ? route('personalizacao.update', $personalizacao->id) : route('personalizacao.store') }}">

                <div class="row g-3">
                    <div class="col-12 col-lg-12">
                        <label for="nome_agente" class="form-label">Nome da Júlia</label>
                        <input type="text" name="nome_agente" id="nome_agente" class="form-control" value="{{ old('nome_agente', $personalizacao->nome_agente ?? '') }}">
                    </div>
                </div>
            </div>

        </div>

        <!-- DADOS DO ESCRITÓRIO-->
        <div class="card">
            <div class="card-header">
                <h4 class="card-title">Dados do escritório</h4>
            </div>
            <div class="card-body" id="send_new">
                <div class="row g-3">
                    <div class="col-12 col-lg-6">
                        <label for="endereco" class="form-label">Endereço</label>
                        <input type="text" name="endereco" id="endereco" class="form-control" value="{{ old('endereco', $personalizacao->endereco ?? '') }}">
                    </div>

                    <div class="col-12 col-lg-6">
                        <label for="cnpj" class="form-label">CNPJ</label>
                        <input type="text" name="cnpj" id="cnpj" class="form-control" value="{{ old('cnpj', $personalizacao->cnpj ?? '') }}">
                    </div>

                    <div class="col-12 col-lg-12">
                        <label for="advogados_oab" class="form-label">Advogados</label>
                        <textarea name="advogados_oab" id="advogados_oab" class="form-control" rows="3">{{ old('advogados_oab', $personalizacao->advogados_oab ?? '') }}</textarea>
                    </div>

                    <div class="col-12 col-lg-3">
                        <label for="telefone" class="form-label">Telefone</label>
                        <input type="text" name="telefone" id="telefone" class="form-control" value="{{ old('telefone', $personalizacao->telefone ?? '') }}">
                    </div>

                    <div class="col-12 col-lg-3">
                        <label for="email" class="form-label">E-mail</label>
                        <input type="text" name="email" id="email" class="form-control" value="{{ old('email', $personalizacao->email ?? '') }}">
                    </div>

                    <div class="col-12 col-lg-3">
                        <label for="site" class="form-label">Site</label>
                        <input type="text" name="site" id="site" class="form-control" value="{{ old('site', $personalizacao->site ?? '') }}">
                    </div>

                    <div class="col-12 col-lg-3">
                        <label for="redes_sociais" class="form-label">Redes sociais</label>
                        <input type="text" name="redes_sociais" id="redes_sociais" class="form-control" value="{{ old('redes_sociais', $personalizacao->redes_sociais ?? '') }}">
                    </div>
                </div>
            </div>
        </div>

        <!-- JORNADA DE COMPRA-->
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Jornada de compra</h3>
            </div>
            <div class="card-body" id="send_new">
                <div class="row g-3">
                    <div class="col-12 col-lg-12">
                        <label for="boasvindas_mensagem" class="form-label">Mensagem de boas-vindas</label>
                        <textarea name="boasvindas_mensagem" id="boasvindas_mensagem" class="form-control" rows="3">{{ old('boasvindas_mensagem', $personalizacao->boasvindas_mensagem ?? '') }}</textarea>
                    </div>

                    <div class="col-12 col-lg-12">
                        <label for="boasvindas_video" class="form-label">Vídeo de boas-vindas</label>
                        <input id="boasvindas_video" name="boasvindas_video" type="file" class="form-control">
                    </div>

                    <!--
                    <div class="col-12 col-lg-12">
                        <label for="resumo_mensagem" class="form-label">Mensagem de resumo</label>
                        <textarea name="resumo_mensagem" id="resumo_mensagem" class="form-control" rows="3">{{ old('resumo_mensagem', $personalizacao->resumo_mensagem ?? '') }}</textarea>
                    </div>

                    <div class="col-12 col-lg-12">
                        <label for="resumo_video" class="form-label">Vídeo de resumo</label>
                        <input id="resumo_video" name="resumo_video" type="file" class="form-control">
                    </div>
-->

                </div>
            </div>
        </div>

        <!-- NOTIFICAÇÕES-->
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Notificações</h3>
            </div>
            <div class="card-body" id="send_new">
                <div class="row g-3">

                    <div class="col-12 col-lg-4">
                        <label for="contrato_gerado_notificacao" class="form-label">Telefone para notificação do contrato gerado</label>
                        <input type="text" name="contrato_gerado_notificacao" id="contrato_gerado_notificacao" class="form-control" value="{{ old('contrato_gerado_notificacao', $personalizacao->contrato_gerado_notificacao ?? '') }}">
                    </div>

                    <div class="col-12 col-lg-4">
                        <label for="contrato_gerado_mensagem" class="form-label">Mensagem do contrato gerado</label>
                        <input type="text" name="contrato_gerado_mensagem" id="contrato_gerado_mensagem" class="form-control" value="{{ old('contrato_gerado_mensagem', $personalizacao->contrato_gerado_mensagem ?? '') }}">
                    </div>

                    <div class="col-12 col-lg-4">
                        <label for="contrato_gerado_video" class="form-label">Vídeo do contrato gerado</label>
                        <input name="contrato_gerado_video" id="contrato_gerado_video" type="file" class="form-control">
                    </div>

                    <div class="col-12 col-lg-4">
                        <label for="contrato_assinado_notificacao" class="form-label">Telefone para notificação do contrato assinado</label>
                        <input type="text" name="contrato_assinado_notificacao" id="contrato_assinado_notificacao" class="form-control" value="{{ old('contrato_assinado_notificacao', $personalizacao->contrato_assinado_notificacao ?? '') }}">
                    </div>

                    <div class="col-12 col-lg-4">
                        <label for="contrato_assinado_mensagem" class="form-label">Mensagem do contrato assinado</label>
                        <input type="text" name="contrato_assinado_mensagem" id="contrato_assinado_mensagem" class="form-control" value="{{ old('contrato_assinado_mensagem', $personalizacao->contrato_assinado_mensagem ?? '') }}">
                    </div>

                    <div class="col-12 col-lg-4">
                        <label for="contrato_assinado_video" class="form-label">Vídeo do contrato assinado</label>
                        <input name="contrato_assinado_video" id="contrato_assinado_video" type="file" class="form-control">
                    </div>
                </div>
            </div>
        </div>


        <!-- PRODUTO
        <div class="row g-3">
            <div class="col-12 col-lg-12">
                <label for="inputSelectCountry" class="form-label">Produto</label>
                <select name="produto_id" id="produto_id" class="form-select" aria-label="Default select example">
                    <option value=""></option>
                    @foreach($produtos as $produto)
                    <option value="{{ $produto->id }}"
                        data-honorarios="{{ $produto->explicacao_honorarios }}"
                        @if(old('produto_id', $personalizacao->produto_id ?? '') == $produto->id) selected @endif>
                        {{ $produto->nome }} {{$produto->explicacao_honorarios}}
                    </option>
                    @endforeach
                </select>
            </div>

            <div class="col-12 col-lg-12">
                <label for="explicacao_honorarios" class="form-label">Explicação dos honorários</label>
                <textarea name="explicacao_honorarios" id="explicacao_honorarios" class="form-control" rows="3">{{ old('explicacao_honorarios', $personalizacao->explicacao_honorarios ?? '') }}</textarea>
            </div>

            <div class="col-12 col-lg-12">
                <label for="video_honorarios" class="form-label">Vídeo dos honorários</label>
                <input name="video_honorarios" id="video_honorarios" type="file" class="form-control">
            </div>

            <div class="col-12 col-lg-12">
                <label for="contrato" class="form-label">Contrato</label>
                <input name="contrato" id="contrato" type="file" class="form-control">
            </div>
        </div>
        -->


        <div class="card">
            @if(!$personalizacao)
            <div class="card-footer">
                <div class="col-12">
                    <button type="submit" class="btn btn-success" id="saveButton">
                        <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                        <span class="button-text">Salvar</span>
                    </button>
                </div>
            </div>
            @endif
            @if($personalizacao)
            <div class="card-footer">
                <div class="col-12">
                    <button type="submit" class="btn btn-primary" id="updateButton">
                        <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                        <span class="button-text">Atualizar</span>
                    </button>
                </div>
            </div>
            @endif
        </div>

    </form>
</div>
@endsection



@push('script')
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<!-- Script para toggle do card -->
<script>
    const toggleCardButton = document.getElementById('toggleCard');
    const produtoCard = document.getElementById('produtoCard');
    const cancelarButton = document.getElementById('cancelarProduto');

    toggleCardButton.addEventListener('click', function() {
        produtoCard.classList.toggle('d-none');
    });

    cancelarButton.addEventListener('click', function() {
        produtoCard.classList.add('d-none');
    });

    document.getElementById('produto_id').addEventListener('change', function() {
        const selected = this.options[this.selectedIndex];
        document.getElementById('perguntas').value = selected.getAttribute('data-perguntas') || '';
        document.getElementById('frase_ativacao').value = selected.getAttribute('data-frases') || '';
        document.getElementById('explicacao_honorarios').value = selected.getAttribute('data-honorarios') || '';
    });
</script>

<script>
    document.getElementById('produto_id').addEventListener('change', function() {
        const selected = this.options[this.selectedIndex];

        document.getElementById('perguntas').value = selected.getAttribute('data-perguntas') || '';
        document.getElementById('frase_ativacao').value = selected.getAttribute('data-frases') || '';
        document.getElementById('explicacao_honorarios').value = selected.getAttribute('data-honorarios') || '';

        const categoria = selected.getAttribute('data-categoria') || '';
        document.getElementById('categoria').value = categoria;

        const displaySelect = document.getElementById('categoria_display');
        for (let option of displaySelect.options) {
            option.selected = option.value === categoria;
        }

        for (let option of categoriaSelect.options) {
            if (option.value === categoria) {
                option.selected = true;
                break;
            }
        }
    });
</script>


<script>
    $(document).ready(function() {
        $('#uploadForm').on('submit', function(e) {
            e.preventDefault();

            let formData = new FormData(this);
            const url = $('#form_action_url').val();
            const token = $('input[name="_token"]').val();

            @if(isset($personalizacao))
            formData.append('_method', 'PUT'); // override via método spoofing do Laravel
            @endif

            alert(url);

            $.ajax({
                url: url,
                type: 'POST', // sempre POST, Laravel vai entender o _method
                headers: {
                    'X-CSRF-TOKEN': token
                },
                data: formData,
                processData: false,
                contentType: false,
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        Swal.fire('Sucesso', response.message, 'success').then(() => {
                            location.reload();
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
        $('#produto_id').on('change', function(e) {

            let selectedOption = $(this).find('option:selected');

            console.log(selectedOption);

            let explicacao_honorarios = selectedOption.data('honorarios');
            let perguntas = selectedOption.data('perguntas');
            let frase_ativacao = selectedOption.data('frases');

            console.log("Selecionando " + explicacao_honorarios);

            $('#explicacao_honorarios').val(explicacao_honorarios);
            $('#frase_ativacao ').val(frase_ativacao);
            $('#perguntas').val(perguntas);
        });
    });


    /*
     $(document).ready(function() {
         $('#uploadForm').on('submit', function(e) {
             e.preventDefault();

             $("#progressContainer").show();
             $("#progressBar").css("width", "0%").text("0%");

             let formData = new FormData(this);

             $.ajax({
                 url: "{{ route('personalizacao.store') }}",
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
     */

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