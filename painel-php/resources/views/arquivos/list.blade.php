@extends('layouts.app')
@section('title', 'Follow-up IA')

@push('css')
<style>
    .tooltip-inner {
        background-color: #0c5466 !important;
        /*!important is not necessary if you place custom.css at the end of your css calls. For the purpose of this demo, it seems to be required in SO snippet*/
        color: #fff;
    }

    .tooltip.top .tooltip-arrow {
        border-top-color: #00acd6;
    }

    .tooltip.right .tooltip-arrow {
        border-right-color: #00acd6;
    }

    .tooltip.bottom .tooltip-arrow {
        border-bottom-color: #00acd6;
    }

    .tooltip.left .tooltip-arrow {
        border-left-color: #00acd6;
    }

    .is-invalid {
        border-color: #dc3545;
        padding-right: calc(1.5em + 0.75rem);
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right calc(0.375em + 0.1875rem) center;
        background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
    }
</style>

@endpush
@section('content')
<x-page-title title="ARQUIVOS" subtitle="Lista de arquivos" />

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
</div>
<br />

<div class="container-fluid">
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Arquivos enviados</h3>
        </div>
        <div class="card-body">
            <div class="row mb-12" id="arquivos-container">

            </div>
        </div>
    </div>
</div>
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
                    fetchArquivosPara(selecionados[0]);
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

        function fetchArquivosPara(userId) {
            fetch("{{ route('arquivos.search') }}", {
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
                    const container = document.getElementById('arquivos-container');
                    container.innerHTML = '';

                    console.log(data);

                    if (!data.arquivos || data.arquivos.length === 0) {
                        container.innerHTML = '<p class="text-center">Nenhum arquivo encontrado.</p>';
                        return;
                    }

                    data.arquivos.forEach(criativo => {
                        let mediaContent = '';
                        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(criativo.extensao)) {
                            mediaContent = `<img class="my-img" onclick="downloadImage('${criativo.url}')" src="${criativo.url}" alt="" />`;
                        } else if (['mp4', 'avi', 'mov', 'wmv', 'mkv', 'flv', 'webm'].includes(criativo.extensao)) {
                            mediaContent = `
                    <video controls width="200" height="400" style="width:100%;">
                        <source src="${criativo.url}" type="video/${criativo.extensao}">
                        Seu navegador não suporta a reprodução deste vídeo.
                    </video>`;
                        } else {
                            mediaContent = `
                    <h1 class="text-center" style="cursor: pointer" onclick="downloadImage('${criativo.url}')">
                        <i class="material-icons-outlined">description</i>
                    </h1>`;
                        }

                        container.innerHTML += `
                <div class="col-sm-12 col-md-2 text-justify my-col" style="border-radius: 10px; cursor: pointer">
                    <div class="text-justify">
                        ${mediaContent}
                        <h6 class="text-center" style="font-size:17px; padding-left:10px; padding-right:10px; font-weight: bold; color: white; margin-top: 5px">${criativo.nome}</h6>
                    </div>
                    <div class="row mb-12 text-center">
                        <div class="col-sm-12 col-md-12">
                            <button id="delete-btn" style="width:100%" class="btn success-btn my-delete" data-id="${criativo.id}" title="Deletar">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
                    });
                })
                .catch(error => {
                    console.error('Erro ao buscar arquivos:', error);
                    document.getElementById('arquivos-container').innerHTML = '<p class="text-danger">Erro ao carregar arquivos.</p>';
                });
        }

        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                updateButtonLabel();

                const selecionados = Array.from(checkboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);

                if (selecionados.length === 1) {
                    fetchArquivosPara(selecionados[0]);
                } else {
                    produtosTableBody.innerHTML = '<tr><td colspan="2">Selecione apenas um escritório para ver os produtos.</td></tr>';
                }
            });
        });

        updateButtonLabel();
    });
</script>

<script>
    $(document).ready(function() {
        $('#delete-btn').click(function(e) {

            e.preventDefault();

            let criativoId = $(this).data('id'); // Pega o ID da categoria

            console.log("Enviando id " + criativoId);

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
                        url: "/arquivos/delete",
                        type: "POST",
                        data: {
                            _token: "{{ csrf_token() }}",
                            id: criativoId
                        },
                        success: function(response) {
                            console.log(response);
                            if (response.success) {
                                Swal.fire("Deletado!", "Arquivo deletado com sucesso!", "success")
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

    $(document).ready(function() {
        // Quando o valor do select for alterado
        $('#filter-select').change(function() {
            var categoriaId = $(this).val(); // Pega o ID da categoria selecionada

            if (categoriaId) {
                // Faz uma requisição AJAX para o endpoint de filtragem
                $.ajax({
                    url: '/arquivos/search', // Rota para o filtro de arquivos
                    type: 'POST',
                    data: {
                        categoria_id: categoriaId, // Envia o ID da categoria
                        _token: "{{ csrf_token() }}", // Token CSRF
                    },
                    success: function(response) {
                        // Limpa o container de arquivos
                        $('#arquivos-container').empty();

                        // Adiciona os novos arquivos no container
                        $.each(response.arquivos, function(index, criativo) {
                            var criativoHtml = '';

                            // Verifica se é imagem ou vídeo e cria o HTML correspondente
                            if (criativo.extensao && $.inArray(criativo.extensao, ['jpg', 'jpeg', 'png', 'gif', 'webp']) !== -1) {
                                criativoHtml = `
                                <div class="col-sm-12 col-md-3 text-center my-col" style="border-radius: 10px" onclick="downloadImage('${criativo.url}')">
                                    <img class="my-img" onclick="downloadImage('${criativo.url}')" src="${criativo.url}" alt="" />
                                    <br />
                                    <button class="btn btn-link" onclick="downloadImage('${criativo.url}')" title="Copiar número">
                                        <i class="bi bi-clipboard"></i>
                                    </button>
                                </div>
                            `;
                            } else if (criativo.extensao && $.inArray(criativo.extensao, ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'flv', 'webm']) !== -1) {
                                criativoHtml = `
                                <div class="col-sm-12 col-md-3 text-center my-col" style="border-radius: 10px" onclick="downloadImage('${criativo.url}')">
                                    <video controls width="300" height="200" style="width:100%;">
                                        <source src="${criativo.url}" type="video/${criativo.extensao}">
                                        Seu navegador não suporta a reprodução deste vídeo.
                                    </video>
                                    <br />
                                    <button class="btn btn-link" onclick="downloadImage('${criativo.url}')" title="Copiar número">
                                        <i class="bi bi-clipboard"></i>
                                    </button>
                                </div>
                            `;
                            }

                            // Adiciona o HTML do criativo no container
                            $('#arquivos-container').append(criativoHtml);
                        });
                    },
                    error: function(error) {
                        console.log(error);
                        alert('Erro ao buscar os arquivos. Tente novamente.');
                    }
                });
            } else {
                // Caso o valor selecionado seja vazio, faz uma nova requisição para carregar todos os arquivos
                location.reload(); // Faz a página recarregar para mostrar todos os arquivos novamente
            }
        });
    });

    function downloadImage(imageUrl) {
        let fileName = imageUrl.split('/').pop(); // Extrai o nome do arquivo da URL

        fetch(imageUrl)
            .then(response => response.blob())
            .then(blob => {
                let link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = fileName; // Define o nome do arquivo para download
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(error => console.error('Erro ao baixar a imagem:', error));
    }

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

    function copyToClipboard(text) {
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

            Swal.fire({
                title: "Sucesso",
                text: "Url copiada com sucesso",
                toast: true,
                icon: "success",
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
            });

            console.log('Copying text command was ' + msg);
        } catch (err) {
            console.log('Oops, unable to copy');
            window.prompt("Copie para área de transferência: Ctrl+C e tecle Enter", text);
        }

        document.body.removeChild(textArea);

    }
</script>
@endpush

@push('css')
<style>
    .my-delete {}

    .my-edit:hover {
        background-color: blue;
    }

    .my-delete:hover {
        background-color: red;
    }

    .my-col {
        border-radius: 25px;
        background-color: #070b21;
        padding: 10px 10px 10px 10px;
    }

    .my-img {
        object-fit: cover;
        max-width: 100%;
        max-height: 200px;
    }

    .my-col:hover .my-img {
        transition: transform .3s;
        transform: scale(0.9);
        cursor: pointer;
    }
</style>
@endpush