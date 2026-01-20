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
<x-page-title title="CRIATIVOS" subtitle="Editar {{$criativo->id}}" />



<div class="container-fluid">
    <a href="/criativos/create" type="submit" class="btn btn-primary" style="margin-top:-10px; margin-bottom: 30px; background-color: #070b21; border-color: #070b21;">
        <i class="bi bi-arrow-left-circle"></i>
        <span class="button-text">Voltar </span>
    </a>

    <form id="updateForm" enctype="multipart/form-data">
        @csrf
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Editar criativo</h3>
            </div>
            <div class="card-body" id="send_new">
                <input type="hidden" id="criativo_id" name="criativo_id" value="{{ $criativo->id }}">

                <div class="row mb-12">
                    <div class="col-4">
                        <label for="inputSelectCountry" class="form-label">Título</label>
                        <input value="{{ old('titulo', $criativo->titulo) }}" name="titulo" style="width:100%" type="text" class="form-control">
                    </div>

                    <div class="col-4">
                        <label for="fileInput" class="form-label">
                            Arquivo
                        </label>
                        <div class="input-group">
                            <input style="width:100%" id="imageInput" type="file" name="file" id="fileInput" class="form-controll block w-full mb-4 p-1 border rounded">
                        </div>
                    </div>

                    <div class="col-4">
                        <label for="inputSelectCountry" class="form-label">Categoria</label>
                        <select class="form-control" id="categoria" name="categoria" required>
                            @foreach($categorias as $categoria)
                            <option value="{{ $categoria->id }}" {{ $criativo->categoria_id == $categoria->id ? 'selected' : '' }}>
                                {{ $categoria->nome }}
                            </option>
                            @endforeach
                        </select>
                    </div>

                    <div class="col-12">
                        <label for="inputSelectCountry" class="form-label">Conteúdo</label>
                        <textarea name="conteudo" style="width:100%" type="text" class="form-control" rows="4" cols="50">{{ old('conteudo', $criativo->conteudo) }}</textarea>
                    </div>
                </div>

                <div class="row mb-12">
                    <div class="col-12">
                        <!-- Barra de progresso -->
                        <div id="progressContainer" style="display:none; width: 100%; background: #ccc; border-radius: 5px; margin-top: 10px;">
                            <div id="progressBar" style="width: 0%; height: 20px; background: #4caf50; text-align: center; color: white; border-radius: 5px;">
                                0%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <div class="col-12">
                    <button type="submit" class="btn btn-primary" id="saveButton">
                        <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                        <span class="button-text">Salvar</span>
                    </button>
                </div>
            </div>
        </div>
    </form>

    @if($criativo->extensao && in_array($criativo->extensao, ['jpg', 'jpeg', 'png', 'gif', 'webp']))
    <img class="my-img" onclick="downloadImage('{{ $criativo->url }}')" src="{{ $criativo->url }}" alt="" />

    @elseif($criativo->extensao && in_array($criativo->extensao, ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'flv', 'webm']))
    <video controls width="200" height="400" style="width:100%;">
        <source src="{{ $criativo->url }}" type="video/{{ $criativo->extensao }}">
        Seu navegador não suporta a reprodução deste vídeo.
    </video>
    @endif
</div>
@endsection

@push('script')
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<script>
    $(document).ready(function() {
        $('#updateForm').on('submit', function(e) {
            e.preventDefault();

            let formData = new FormData(this);
            let criativoId = $('#criativo_id').val();

            $.ajax({
                url: "{{ route('criativos.update', '') }}/" + criativoId,
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
                error: function(e) {
                    showAlert('danger', "Falha ao atualizar dados.");
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