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
<x-page-title title="CRIATIVOS" subtitle="Lista de criativos" />

<div class="container-fluid">
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Criativos validados</h3>
        </div>
        <div class="card-body">
            <div class="row mb-12">
                <div class="col-sm-12" style="border-radius: 10px">
                    <label for="inputSelectCountry" class="form-label">Categoria</label>
                    <select name="categoria" id="filter-select" class="form-select" id="inputSelectCountry" aria-label="Default select example">
                        <option value=""></option>
                        @foreach($categorias as $categoria)
                        <option value="{{ $categoria->id }}">{{ $categoria->nome }}</option>
                        @endforeach
                    </select>
                </div>
            </div>
            <div class="row mb-12" id="criativos-container">
                @foreach($criativos as $criativo)
                <div class="col-sm-12 col-md-2 my-col" style="border-radius: 10px" onclick="downloadImage('{{ $criativo->url }}')">

                    <div class="text-justify ">
                        @if($criativo->extensao && in_array($criativo->extensao, ['jpg', 'jpeg', 'png', 'gif', 'webp']))
                        <img class="my-img" onclick="downloadImage('{{ $criativo->url }}')" src="{{ $criativo->url }}" alt="" />

                        @elseif($criativo->extensao && in_array($criativo->extensao, ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'flv', 'webm']))
                        <video controls width="200" height="400" style="width:100%;">
                            <source src="{{ $criativo->url }}" type="video/{{ $criativo->extensao }}">
                            Seu navegador não suporta a reprodução deste vídeo.
                        </video>
                        @endif
                    </div>

                    <h6 style="font-size:17px; padding-left:10px; padding-right:10px; font-weight: bold; color: white; margin-top: 5px">{{$criativo->titulo}}</h6>
                    <h6 style="font-size:12px; padding-left:10px; padding-right:10px">{{$criativo->conteudo}}</h6>

                    <div class="row mb-12 text-center "> <br />
                        <button class="btn btn-link" onclick="downloadImage('{{ $criativo->url }}')" title="Copiar número">
                            <i class="bi bi-clipboard"></i>
                        </button>
                    </div>
                </div>
                @endforeach
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
                xhr: function() {
                    var xhr = new window.XMLHttpRequest();
                    xhr.upload.addEventListener("progress", function(e) {
                        if (e.lengthComputable) {
                            var percent = Math.round((e.loaded / e.total) * 100);
                            $("#progressBar").css("width", percent + "%").text(percent + "%");
                        }
                    }, false);
                    return xhr;
                },
                url: "{{ route('criativos.upload') }}",
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
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

    $(document).ready(function() {
        // Quando o valor do select for alterado
        $('#filter-select').change(function() {
            var categoriaId = $(this).val(); // Pega o ID da categoria selecionada

            if (categoriaId) {
                // Faz uma requisição AJAX para o endpoint de filtragem
                $.ajax({
                    url: '/criativos/search', // Rota para o filtro de criativos
                    type: 'POST',
                    data: {
                        categoria_id: categoriaId, // Envia o ID da categoria
                        _token: "{{ csrf_token() }}", // Token CSRF
                    },
                    success: function(response) {
                        // Limpa o container de criativos
                        $('#criativos-container').empty();

                        // Adiciona os novos criativos no container
                        $.each(response.criativos, function(index, criativo) {
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
                            $('#criativos-container').append(criativoHtml);
                        });
                    },
                    error: function(error) {
                        console.log(error);
                        alert('Erro ao buscar os criativos. Tente novamente.');
                    }
                });
            } else {
                // Caso o valor selecionado seja vazio, faz uma nova requisição para carregar todos os criativos
                location.reload(); // Faz a página recarregar para mostrar todos os criativos novamente
            }
        });
    });
</script>
@endpush

@push('css')
<style>
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