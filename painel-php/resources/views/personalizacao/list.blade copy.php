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
                        <input class="form-check-input" type="checkbox" name="user_id[]"
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
                    </div>

                    <div class="col-12 col-lg-12">
                        <label for="resumo_mensagem" class="form-label">Mensagem de resumo</label>
                        <textarea name="resumo_mensagem" id="resumo_mensagem" class="form-control" rows="3">{{ old('resumo_mensagem', $personalizacao->resumo_mensagem ?? '') }}</textarea>
                    </div>

                    <div class="col-12 col-lg-12">
                        <label for="resumo_video" class="form-label">Vídeo de resumo</label>
                        <input id="resumo_video" name="resumo_video" type="file" class="form-control">
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
    </div>


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


@endsection

@push('script')
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<script>
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

        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                updateButtonLabel();

                const selecionados = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);

                if (selecionados.length === 1) {
                    fetchProdutosPara(selecionados[0]);
                } else {
                    produtosTableBody.innerHTML = '<tr><td colspan="3">Selecione apenas um escritório para ver os produtos.</td></tr>';
                    togglePersonalizacao(false);
                }
            });
        });

        function togglePersonalizacao(show) {
            const div = document.getElementById('personalizacao');
            div.style.display = show ? 'block' : 'none';
        }

        function fetchProdutosPara(userId) {
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


                        if (data.personalizacao.boasvindas_video) {
                            document.getElementById('boasvindas_video').outerHTML = `
        <input type="text" name="boasvindas_video" id="boasvindas_video" class="form-control" value="${data.personalizacao.boasvindas_video}" />
    `;
                        } else {
                            document.getElementById('boasvindas_video').outerHTML = `
        <input name="boasvindas_video" id="boasvindas_video" class="form-control">${data.personalizacao.boasvindas_video ?? ''}</textarea>
    `;
                        }

                        if (data.personalizacao.resumo_video) {
                            document.getElementById('resumo_video').outerHTML = `
        <input type="text" name="resumo_video" id="resumo_video" class="form-control" value="${data.personalizacao.resumo_video}" />
    `;
                        } else {
                            document.getElementById('resumo_video').outerHTML = `
        <input name="resumo_video" id="resumo_video" class="form-control">${data.personalizacao.resumo_video ?? ''}</textarea>
    `;
                        }

                        if (data.personalizacao.contrato_gerado_video) {
                            document.getElementById('contrato_gerado_video').outerHTML = `
        <input type="text" name="contrato_gerado_video" id="contrato_gerado_video" class="form-control" value="${data.personalizacao.contrato_gerado_video}" />
    `;
                        } else {
                            document.getElementById('contrato_gerado_video').outerHTML = `
        <input name="contrato_gerado_video" id="contrato_gerado_video" class="form-control">${data.personalizacao.contrato_gerado_video ?? ''}</textarea>
    `;
                        }

                        if (data.personalizacao.contrato_assinado_video) {
                            document.getElementById('contrato_assinado_video').outerHTML = `
        <input type="text" name="contrato_assinado_video" id="contrato_assinado_video" class="form-control" value="${data.personalizacao.contrato_assinado_video}" />
    `;
                        } else {
                            document.getElementById('contrato_assinado_video').outerHTML = `
        <input name="contrato_assinado_video" id="contrato_assinado_video" class="form-control">${data.personalizacao.contrato_assinado_video ?? ''}</textarea>
    `;
                        }



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