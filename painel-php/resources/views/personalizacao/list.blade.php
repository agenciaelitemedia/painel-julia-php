@extends('layouts.app')
@section('title', 'Follow-up IA')

@section('content')
<x-page-title title="Personalizações" subtitle="Produtos personalizados" />

<meta name="csrf-token" content="{{ csrf_token() }}">

<div class="container-fluid">
    @csrf
    <div class="col-auto">
        <div class="dropdown">
            <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="dropdownEscritorios"
                data-bs-toggle="dropdown" aria-expanded="false">
                Selecionar escritórios
            </button>
            <div class="dropdown-menu p-3" style="width: 400px; max-height: 400px;">
                <div class="mb-2">
                    <input type="text" class="form-control form-control-sm" id="searchEscritorio"
                        placeholder="Buscar escritório..." autocomplete="off">
                </div>
                <div class="dropdown-divider"></div>
                <div class="escritorios-list" style="max-height: 300px; overflow-y: auto;">
                    @foreach($users->sortBy('name') as $user)
                    <div class="form-check escritorio-item mb-2">
                        <input class="form-check-input user-checkbox" type="checkbox" name="user_id"
                            value="{{ $user->id }}" id="agent-{{ $user->id }}"
                            data-name="{{ mask_data($user->name, 'name') }}">
                        <label class="form-check-label" for="agent-{{ $user->id }}">
                            <small>{{ mask_data($user->name, 'name') }}</small>
                        </label>
                    </div>
                    @endforeach

                </div>
            </div>
        </div>
    </div>
    <br />

    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Produtos</h3>
        </div>
        <div class="card-body" id="send_new">
            <div class="card-body">
                <div class="table-responsive-sm white-space-nowrap">
                    <table class="table align-middle table-striped" id="produtosTable">
                        <thead class="table">
                            <tr>
                                <th class="text-center">Nome</th>
                                <th class="text-center">Categoria</th>
                                <th class="text-center" style="width: 90px;">Ações</th>
                            </tr>
                        </thead>
                        <tbody>


                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <form id="formPersonalizacao" method="POST" enctype="multipart/form-data">
        @csrf
        <input type="hidden" name="_method" value="PUT">
        <input type="hidden" name="personalizacao_id" id="personalizacao_id">
        <input type="hidden" id="form_action_url" value="{{ route('personalizacao.update', 0) }}">

        @if(isset($personalizacao))
        @method('PUT')
        @endif

        <div id="personalizacao" style="display: none;">
            @csrf

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
                            <div id="link_boasvindas_video" class="mt-2"></div>
                        </div>

                        <div class="col-12 col-lg-12">
                            <label for="resumo_mensagem" class="form-label">Mensagem de resumo</label>
                            <textarea name="resumo_mensagem" id="resumo_mensagem" class="form-control" rows="3">{{ old('resumo_mensagem', $personalizacao->resumo_mensagem ?? '') }}</textarea>
                        </div>

                        <div class="col-12 col-lg-12">
                            <label for="resumo_video" class="form-label">Vídeo de resumo</label>
                            <input id="resumo_video" name="resumo_video" type="file" class="form-control">
                            <div id="link_resumo_video" class="mt-2"></div>
                        </div>

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
                            <div id="link_contrato_gerado_video" class="mt-2"></div>
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
                            <div id="link_contrato_assinado_video" class="mt-2"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="text-end mt-4">
                <button type="submit" class="btn btn-success">Salvar alterações</button>
            </div>

        </div>

    </form>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const checkboxes = document.querySelectorAll('.escritorio-item input[type="checkbox"]');
            const dropdownBtn = document.getElementById('dropdownEscritorios');

            function updateButtonLabel() {
                const selected = [];
                checkboxes.forEach(cb => {
                    if (cb.checked) {
                        selected.push(cb.getAttribute('data-name'));
                    }
                });

                if (selected.length > 0) {
                    dropdownBtn.innerHTML = 'Escritórios selecionados: ' + selected.join(', ');
                } else {
                    dropdownBtn.innerHTML = 'Selecionar escritórios';
                }
            }

            checkboxes.forEach(cb => {
                cb.addEventListener('change', updateButtonLabel);
            });

            // Atualiza já ao carregar a página (se algum vier marcado via HTML)
            updateButtonLabel();
        });
    </script>

</div>

<input type="hidden" id="form_action_url" value="{{ isset($produto) ? route('produtos.update', $produto->id) : route('produtos.store') }}">

<div id="loader" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(255,255,255,0.7); z-index: 9999; justify-content: center; align-items: center;">
    <div class="spinner-border text-primary" role="status" style="width: 4rem; height: 4rem;">
        <span class="visually-hidden">Carregando...</span>
    </div>
</div>
@endsection

@push('script')
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<script>
    // Busca de escritórios
    $('#searchEscritorio').on('keyup', function() {
        var value = $(this).val().toLowerCase();
        $('.escritorio-item').filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });
</script>

<script>
    document.querySelectorAll('.user-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            if (this.checked) {
                document.querySelectorAll('.user-checkbox').forEach(other => {
                    if (other !== this) other.checked = false;
                });
            }
        });
    });

    $(document).ready(function() {
        $('#formPersonalizacao').on('submit', function(e) {
            e.preventDefault();

            document.getElementById('loader').style.display = 'flex';


            let formData = new FormData(this);
            const url = $('#form_action_url').val(); // URL dinâmica com ID
            const token = $('input[name="_token"]').val();

            formData.append('_method', 'PUT');

            $.ajax({
                url: url,
                type: 'POST', // Laravel trata como PUT via _method
                headers: {
                    'X-CSRF-TOKEN': token
                },
                data: formData,
                processData: false,
                contentType: false,
                dataType: 'json',
                success: function(response) {
                    document.getElementById('loader').style.display = 'none ';

                    if (response.success) {
                        Swal.fire('Sucesso', response.message, 'success').then(() => {

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

    document.addEventListener('DOMContentLoaded', function() {
        const checkboxes = document.querySelectorAll('.escritorio-item input[type="checkbox"]');
        const dropdownBtn = document.getElementById('dropdownEscritorios');
        const produtosTableBody = document.querySelector('#produtosTable tbody');

        function updateButtonLabel() {
            const selected = [];
            checkboxes.forEach(cb => {
                if (cb.checked) {
                    selected.push(cb.getAttribute('data-name'));
                }
            });

            dropdownBtn.innerHTML = selected.length > 0 ?
                'Escritórios selecionados: ' + selected.join(', ') :
                'Selecionar escritórios';
        }

        // Função para atualizar a URL com o parâmetro 'id'
        const updateURL = (userId) => {
            const params = new URLSearchParams(window.location.search);
            params.set('id', userId); // Adiciona o parâmetro 'id' à URL
            window.history.replaceState(null, '', '?' + params.toString()); // Atualiza a URL sem recarregar a página
        };

        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                updateButtonLabel();

                const selecionados = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);

                if (selecionados.length === 1) {
                    fetchProdutosPara(selecionados[0]);

                    updateURL(selecionados[0]); // Atualiza a URL com o id selecionado
                } else {
                    produtosTableBody.innerHTML = '<tr><td colspan="3">Selecione apenas um escritório para ver os produtos.</td></tr>';
                    togglePersonalizacao(false);
                }
            });
        });

        // Quando a página carregar, verifica o parâmetro 'id' na URL
        const urlParams = new URLSearchParams(window.location.search);
        const userIdFromURL = urlParams.get('id');

        // Se existir um id na URL, marque o checkbox correspondente
        if (userIdFromURL) {
            const checkboxToSelect = document.querySelector(`.escritorio-item input[type="checkbox"][value="${userIdFromURL}"]`);
            if (checkboxToSelect) {
                checkboxToSelect.checked = true;
                updateButtonLabel();
                fetchProdutosPara(userIdFromURL); // Fetch produtos para o usuário selecionado
            }
        }

        function togglePersonalizacao(show) {
            const div = document.getElementById('personalizacao');
            div.style.display = show ? 'block' : 'none';
        }

        function fetchProdutosPara(userId) {
            document.getElementById('loader').style.display = 'flex';

            fetch("{{ route('produto-cliente.search') }}", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}',
                    },
                    body: JSON.stringify({
                        user_id: userId
                    })
                })
                .then(response => response.json())
                .then(data => {
                    document.getElementById('loader').style.display = 'none';

                    produtosTableBody.innerHTML = '';
                    if (data.length === 0) {
                        produtosTableBody.innerHTML = '<tr><td colspan="2">Nenhum produto encontrado.</td></tr>';
                        return;
                    }

                    console.log(data);

                    data.produtos_cliente.forEach(prod => {
                        produtosTableBody.innerHTML += `
        <tr>
            <td class="text-center">${prod.nome}</td>
            <td class="text-center">${prod.categoria}</td>
            <td>
                <div>
                    <a href="/produto-cliente/${prod.id}" class="btn btn-link btn-editar" data-id="${prod.id}" style="width:30px">
                        <i class="material-icons-outlined">edit</i>
                    </a>
                    <button id="btn-salvar-${prod.id}" class="btn btn-link btn-salvar" data-id="${prod.id}" style="width:30px; display:none;">
                        <i class="material-icons-outlined">check</i>
                    </button>
                    <button class="btn btn-link delete-btn" title="Excluir" style="width:30px" data-id="${prod.id}">
                        <i class="material-icons-outlined">delete</i>
                    </button>
                </div>
            </td>
        </tr>`;
                    });

                    const personalizacao = document.getElementById("personalizacao");
                    personalizacao.style.display = 'block';


                    // Preencher a personalização
                    if (data.personalizacao) {
                        if (data.personalizacao) {
                            document.getElementById('personalizacao_id').value = data.personalizacao.id;
                            document.getElementById('form_action_url').value = `/personalizacao/${data.personalizacao.id}`;
                            document.getElementById('formPersonalizacao').action = `/personalizacao/${data.personalizacao.id}`;
                        }

                        if (data.personalizacao?.explicacao_honorarios) {
                            const videoUrl = data.personalizacao.explicacao_honorarios;
                            const texto = videoUrl.length > 50 ? videoUrl.substring(0, 47) + '...' : videoUrl;
                            document.getElementById('link_explicacao_honorarios').innerHTML = `
        <a href="${videoUrl}" target="_blank">${texto}</a>
    `;
                        }

                        if (data.personalizacao?.resumo_video) {
                            const videoUrl = data.personalizacao.resumo_video;
                            const texto = videoUrl.length > 50 ? videoUrl.substring(0, 47) + '...' : videoUrl;
                            document.getElementById('link_resumo_video').innerHTML = `
        <a href="${videoUrl}" target="_blank">${texto}</a>
    `;
                        }

                        if (data.personalizacao?.boasvindas_video) {
                            const videoUrl = data.personalizacao.boasvindas_video;
                            const texto = videoUrl.length > 50 ? videoUrl.substring(0, 47) + '...' : videoUrl;
                            document.getElementById('link_boasvindas_video').innerHTML = `
        <a href="${videoUrl}" target="_blank">${texto}</a>
    `;
                        }

                        if (data.personalizacao?.contrato_gerado_video) {
                            const videoUrl = data.personalizacao.contrato_gerado_video;
                            const texto = videoUrl.length > 50 ? videoUrl.substring(0, 47) + '...' : videoUrl;
                            document.getElementById('link_contrato_gerado_video').innerHTML = `
        <a href="${videoUrl}" target="_blank">${texto}</a>
    `;
                        }

                        if (data.personalizacao?.contrato_assinado_video) {
                            const videoUrl = data.personalizacao.contrato_assinado_video;
                            const texto = videoUrl.length > 50 ? videoUrl.substring(0, 47) + '...' : videoUrl;
                            document.getElementById('link_contrato_assinado_video').innerHTML = `
        <a href="${videoUrl}" target="_blank">${texto}</a>
    `;
                        }

                        document.getElementById('nome_agente').value = data.personalizacao.nome_agente ?? '';
                        document.getElementById('endereco').value = data.personalizacao.endereco ?? '';
                        document.getElementById('cnpj').value = data.personalizacao.cnpj ?? '';
                        document.getElementById('advogados_oab').value = data.personalizacao.advogados_oab ?? '';
                        document.getElementById('telefone').value = data.personalizacao.telefone ?? '';
                        document.getElementById('email').value = data.personalizacao.email ?? '';
                        document.getElementById('site').value = data.personalizacao.site ?? '';
                        document.getElementById('redes_sociais').value = data.personalizacao.redes_sociais ?? '';

                        document.getElementById('boasvindas_mensagem').value = data.personalizacao.boasvindas_mensagem ?? '';
                        document.getElementById('resumo_mensagem').value = data.personalizacao.resumo_mensagem ?? '';

                        // Substituir os campos de vídeo por elementos <video> quando existir a URL do vídeo

                        /*
                        if (data.personalizacao.boasvindas_video) {
                            document.getElementById('boasvindas_video').outerHTML = ` <
                                            br / > < video width = "320"
                                        height = "240"
                                        controls >
                                            <
                                            source src = "${data.personalizacao.boasvindas_video}"
                                        type = "video/mp4" >
                                            Seu navegador não suporta o elemento de vídeo. <
                                            /video>
                                        `;
                        }

                        if (data.personalizacao.resumo_video) {
                            document.getElementById('resumo_video').outerHTML = ` <
                                        br / > < video width = "320"
                                        height = "240"
                                        controls >
                                            <
                                            source src = "${data.personalizacao.resumo_video}"
                                        type = "video/mp4" >
                                            Seu navegador não suporta o elemento de vídeo. <
                                            /video>
                                        `;
                        }

                        if (data.personalizacao.contrato_gerado_video) {
                            document.getElementById('contrato_gerado_video').outerHTML = ` <
                                        br / > < video width = "320"
                                        height = "240"
                                        controls >
                                            <
                                            source src = "${data.personalizacao.contrato_gerado_video}"
                                        type = "video/mp4" >
                                            Seu navegador não suporta o elemento de vídeo. <
                                            /video>
                                        `;
                        }

                        if (data.personalizacao.contrato_assinado_video) {
                            document.getElementById('contrato_assinado_video').outerHTML = ` <
                                        br / > < video width = "320"
                                        height = "240"
                                        controls >
                                            <
                                            source src = "${data.personalizacao.contrato_assinado_video}"
                                        type = "video/mp4" >
                                            Seu navegador não suporta o elemento de vídeo. <
                                            /video>
                                        `;
                        }
                */
                    }
                })
                .catch(error => {
                    console.error('Erro ao buscar produtos:', error);
                    produtosTableBody.innerHTML = '<tr><td colspan="2">Erro ao buscar produtos.</td></tr>';
                });
        }

        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                updateButtonLabel();

                const selecionados = Array.from(checkboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);

                if (selecionados.length === 1) {
                    fetchProdutosPara(selecionados[0]);
                } else {
                    produtosTableBody.innerHTML = '<tr><td colspan="2">Selecione apenas um escritório para ver os produtos.</td></tr>';
                }
            });
        });

        updateButtonLabel();
    });
</script>
@endpush