@extends('layouts.app')
@section('title')
CRM
@endsection
@push('css')
<link rel="stylesheet" href="{{ URL::asset('build/css/extra-icons.css') }}">
<style>
    .custom-card {
        position: relative;
        flex-grow: 1;
        min-height: 0;
    }

    /* Customização da barra de rolagem horizontal */
    ::-webkit-scrollbar {
        height: 8px;
    }

    ::-webkit-scrollbar-track {
        background: #4178b8;
        border-radius: 0px;
    }

    ::-webkit-scrollbar-thumb {
        background: #0f1535;
        border-radius: 0px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: #0f1535;
    }
</style>

<style>
    .custom-pagination {
        border-color: #0fb6cc;
        color: black;
        font-size: 12px !important;
    }

    .custom-pagination .pagination {
        font-size: 12px !important;
    }

    .custom-pagination svg {
        max-width: 15px;
    }

    .my-search:hover {
        color: #caad09;
        cursor: pointer;
    }
</style>

@endpush

@section('content')
<x-page-title title="CRM" subtitle="Acompanhe seus leads" />

@php
$backgroundClasses = [
'',
'bg-primary',
'bg-secondary',
'bg-success',
'bg-danger',
'bg-info',
'bg-grd-primary bg-gradient',
'bg-grd-secondary bg-gradient',
'bg-grd-success bg-gradient',

'bg-grd-danger bg-gradient',
'bg-grd-info bg-gradient'
];
@endphp
<div class="card mt-4">
    <div class="card-body">
        <form action="{{ route('crm') }}" method="GET" class="row g-3">
            @if(Auth::user()->role == 'admin')
            <div class="col-auto">
                <div class="dropdown">
                    <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="dropdownEscritorios" data-bs-toggle="dropdown" aria-expanded="false">
                        Escritórios ({{ count((array)request('cod_agent')) }} selecionados)
                    </button>
                    <div class="dropdown-menu p-3" style="width: 400px; max-height: 400px;">
                        <div class="mb-2">
                            <input type="text" class="form-control form-control-sm" id="searchEscritorio"
                                placeholder="Buscar escritório..." autocomplete="off">
                        </div>
                        <div class="dropdown-divider"></div>
                        <div class="escritorios-list" style="max-height: 300px; overflow-y: auto;">
                            @foreach($leads_em_atendimento->sortBy('escritorio')->pluck('escritorio', 'cod_agent')->unique() as $cod_agent => $escritorio)
                            <div class="form-check escritorio-item mb-2">
                                <input class="form-check-input" type="checkbox" name="cod_agent[]"
                                    value="{{ $cod_agent }}" id="agent-{{ $cod_agent }}"
                                    {{ in_array($cod_agent, (array)request('cod_agent')) ? 'checked' : '' }}>
                                <label class="form-check-label" for="agent-{{ $cod_agent }}">
                                    <small>{{ mask_data($escritorio, 'name') }}</small>
                                </label>
                            </div>
                            @endforeach
                        </div>
                    </div>
                </div>
            </div>
            @endif
            <div class="col-auto">
                <div class="input-group" style="width: 350px;">
                    <input type="date" class="form-control datepicker" name="start_date"
                        value="{{ request('start_date') ?? now()->format('Y-m-d') }}"
                        placeholder="Data Inicial"
                        autocomplete="off">
                    <span class="input-group-text">até</span>
                    <input type="date" class="form-control datepicker" name="end_date"
                        value="{{ request('end_date') ?? now()->format('Y-m-d') }}"
                        placeholder="Data Final"
                        autocomplete="off">
                </div>
            </div>
            <div class="col-auto">
                <div class="d-flex align-items-center gap-2 justify-content-lg-end">
                    <button type="submit" class="btn btn-primary px-4">
                        <i class="bi bi-search me-2"></i>Filtrar
                    </button>
                    <a href="{{ route('leads.contracts') }}" class="btn btn-secondary px-4">
                        <i class="bi bi-x-circle me-2"></i>Limpar
                    </a>
                </div>
            </div>
        </form>
    </div>
</div>

<!--
<div class="container-fluid">
    <div class="custom-card" style="display: flex !important;">
        <div class="row d-flex flex-nowrap">
            @if ($etapas)
            @foreach($etapas as $key => $step)
            @php

            $acentos = 'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇçÑñ';
            $semAcentos = 'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn';

            $etapa_sem_acento = strtr($key, $acentos, $semAcentos);

            $index = preg_replace('/[^0-9]/', '', $key);
            $filteredArray = array_filter($leadsPaginados, fn($item) => $item['step'] == $step);
            @endphp

            <div class="px-1" style="width: 340px;">
                <div class="card">
                    <div class="card-header {{ $backgroundClasses[7] }} text-white">[{{ $index + 1 }}º] - {{ $step }} ({{ count($filteredArray) }})</div>
                    <div class="card-body">
                        <div class="kanban-list" id="{{ $key }}">
                            @foreach($filteredArray as $lead)
                            @if ($lead['step'] == $step)
                            <div class="card shadow-none border">
                                <div class="card-body py-0">
                                    <h5 class="card-title"><i class="lni lni-whatsapp"></i> {{$lead['number'] }}</h5>
                                </div>
                            </div>
                            @endif
                            @endforeach
                        </div>
                    </div>
                </div>
            </div>
            @endforeach
            @endif
            <div class="px-1" style="width: 100px;">
            </div>
        </div>
    </div>
</div>
-->

<style>
    /* Fundo do chat, similar ao do WhatsApp */
    .chat-container {
        background-color: #e5ddd5;
        background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
        padding: 20px;
        height: 70vh;
        /* Altura do corpo do chat */
        overflow-y: auto;
        /* Permite rolar as mensagens */
        display: flex;
        flex-direction: column;
        /* Mensagens uma abaixo da outra */
    }

    /* Base para todas as bolhas de mensagem */
    .message-bubble {
        max-width: 70%;
        padding: 10px 15px;
        border-radius: 12px;
        margin-bottom: 10px;
        color: #303030;
        position: relative;
        word-wrap: break-word;
        /* Quebra palavras longas */
    }

    /* Bolha de mensagem ENVIADA (verde, à direita) */
    .message-bubble.sent {
        background-color: #dcf8c6;
        align-self: flex-end;
        /* Alinha à direita */
        border-bottom-right-radius: 2px;
    }

    /* Bolha de mensagem RECEBIDA (branca, à esquerda) */
    .message-bubble.received {
        background-color: #ffffff;
        align-self: flex-start;
        /* Alinha à esquerda */
        border-bottom-left-radius: 2px;
    }

    /* Conteúdo da mensagem (texto, imagem, etc.) */
    .message-content {
        margin-bottom: 5px;
    }

    /* Nome do remetente para mensagens recebidas */
    .sender-name {
        font-size: 0.8rem;
        font-weight: bold;
        color: #007bff;
        /* Ou qualquer cor que preferir */
        margin-bottom: 4px;
    }


    /* Estilo para a hora da mensagem */
    .message-time {
        font-size: 0.75rem;
        color: #aaa;
        text-align: right;
        display: block;
        margin-top: 5px;
    }

    /* Estilos para mídias */
    .message-bubble img,
    .message-bubble video,
    .message-bubble audio {
        max-width: 100%;
        border-radius: 8px;
        margin-top: 5px;
    }

    /* Placeholder para quando estiver carregando */
    .loading-placeholder {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        font-style: italic;
        color: #888;
    }
</style>

<!--
<div class="container mt-5">
    <h1>Visualizador de Conversas</h1>
    <p>Clique no botão abaixo para carregar e visualizar o histórico de uma conversa.</p>

    <button id="view-chat-btn" class="btn btn-success">
        <i class="bi bi-whatsapp"></i> Ver Histórico da Conversa
    </button>
</div>
-->

<div class="modal fade" id="chatModal" tabindex="-1" aria-labelledby="chatModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="chatModalLabel">Histórico da Conversa</h5>
                <button type="button" class="btn-close" style="color:white !important; background-color: red;" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-0">
                <div id="chat-messages-container" class="chat-container">
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const chatContainer = document.getElementById('chat-messages-container');
        const chatModal = new bootstrap.Modal(document.getElementById('chatModal'));

        document.body.addEventListener('click', function(event) {
            const chatButton = event.target.closest('.view-chat-btn');
            if (chatButton) {
                fetchChatHistory(chatButton);
            }
        });

        /**
         * Função auxiliar para buscar a URL de mídia na UAZAPI
         * Esta função será chamada para cada áudio, vídeo ou imagem.
         */
        async function getPlayableMediaUrl(messageId, apiToken) {
            // ATENÇÃO: Substitua pela URL da sua instância UAZAPI
            const downloadApiUrl = 'https://atende-julia.uazapi.com/message/download';

            try {
                const response = await fetch(downloadApiUrl, {
                    method: 'POST',
                    headers: {
                        'token': apiToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: messageId,
                        return_link: true, // Queremos a URL pública
                        generate_mp3: true // Áudios virão como MP3
                    })
                });

                if (!response.ok) {
                    console.error(`Falha ao buscar mídia para msg ID ${messageId}`);
                    return null; // Retorna nulo em caso de falha
                }

                const data = await response.json();
                return data.fileURL; // Retorna a URL descriptografada

            } catch (error) {
                console.error(`Erro na requisição de mídia para msg ID ${messageId}:`, error);
                return null;
            }
        }

        /**
         * Função principal para renderizar as mensagens.
         * Agora ela é assíncrona e usa Promise.all para otimizar as buscas de mídia.
         */
        async function renderMessages(messages, apiToken) {
            chatContainer.innerHTML = '<div class="loading-placeholder">Preparando visualização...</div>';

            // Mapeia cada mensagem para uma "promessa" de que seu HTML será gerado.
            const messagePromises = messages.reverse().map(async (message) => {
                const messageClass = message.fromMe ? 'sent' : 'received';
                const senderName = !message.fromMe ? `<div class="sender-name">${message.senderName || 'Contato'}</div>` : '';
                const timestamp = new Date(message.messageTimestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                let contentHtml = '';
                const isMedia = ['VideoMessage', 'ImageMessage', 'AudioMessage'].includes(message.messageType);

                if (isMedia) {
                    // Se for mídia, primeiro buscamos a URL jogável.
                    const playableUrl = await getPlayableMediaUrl(message.id, apiToken);

                    if (playableUrl) {
                        // Se a URL foi obtida com sucesso, montamos o HTML da mídia.
                        switch (message.messageType) {
                            case 'VideoMessage':
                                contentHtml = `<div class="message-content"><video src="${playableUrl}" controls></video>${message.content.caption ? `<p class="mt-2">${message.content.caption}</p>` : ''}</div>`;
                                break;
                            case 'ImageMessage':
                                contentHtml = `<div class="message-content"><img src="${playableUrl}" alt="Imagem" style="cursor: pointer;" onclick="window.open('${playableUrl}', '_blank');" />${message.content.caption ? `<p class="mt-2">${message.content.caption}</p>` : ''}</div>`;
                                break;
                            case 'AudioMessage':
                                contentHtml = `<div class="message-content"><audio src="${playableUrl}" controls></audio></div>`;
                                break;
                        }
                    } else {
                        // Fallback se não conseguir carregar a mídia
                        contentHtml = `<div class="message-content text-danger fst-italic">[Falha ao carregar mídia]</div>`;
                    }
                } else {
                    // Se for texto, o processo é direto.
                    contentHtml = `<div class="message-content">${message.content.text || message.text || ''}</div>`;
                }

                // Retorna o HTML completo da bolha de mensagem
                return `<div class="message-bubble ${messageClass}">${senderName}${contentHtml}<span class="message-time">${timestamp}</span></div>`;
            });

            // Promise.all espera todas as buscas de mídia e montagens de HTML terminarem.
            const allMessagesHtml = await Promise.all(messagePromises);

            // Insere todo o HTML no contêiner de uma só vez.
            chatContainer.innerHTML = allMessagesHtml.join('');
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        /**
         * Função que inicia o processo ao clicar no botão.
         */
        async function fetchChatHistory(clickedButton) {
            const codAgent = clickedButton.dataset.codAgent;
            const whatsapp = clickedButton.dataset.whatsapp;

            chatModal.show();
            chatContainer.innerHTML = '<div class="loading-placeholder">Buscando token do agente...</div>';

            try {
                // --- PASSO 1: Buscar o token de autenticação na sua API Laravel ---
                const agentResponse = await fetch(`/crm/search_agent?cod_agent=${codAgent}`);
                if (!agentResponse.ok) throw new Error('Falha ao contatar o servidor de agentes.');

                const agentData = await agentResponse.json();
                if (!agentData.user || !agentData.user.evo_apikey) {
                    throw new Error('Agente não encontrado ou sem token de API.');
                }
                const apiToken = agentData.user.evo_apikey;

                // --- PASSO 2: Buscar o histórico na API externa ---
                chatContainer.innerHTML = '<div class="loading-placeholder">Carregando histórico...</div>';
                // ATENÇÃO: Substitua pela URL da sua instância UAZAPI
                const apiUrl = 'https://atende-julia.uazapi.com/message/find';
                const dados = {
                    "chatid": `${whatsapp}@s.whatsapp.net`,
                    "limit": 50
                };

                const historyResponse = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'token': apiToken,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dados)
                });

                if (!historyResponse.ok) throw new Error(`Erro na API de histórico: ${historyResponse.statusText}`);

                const historyData = await historyResponse.json();

                // --- PASSO 3: RENDERIZAR TUDO ---
                if (historyData.messages && historyData.messages.length > 0) {
                    // Passamos o apiToken para a função de renderização, pois ela precisará dele
                    await renderMessages(historyData.messages, apiToken);
                } else {
                    chatContainer.innerHTML = '<div class="loading-placeholder">Nenhuma mensagem encontrada para este lead.</div>';
                }

            } catch (error) {
                console.error('Falha no processo de busca do chat:', error);
                chatContainer.innerHTML = `<div class="alert alert-danger m-3">${error.message}</div>`;
            }
        }
    });
</script>

<div class="container-fluid">
    <div class="custom-card" style="display: flex !important;">
        <div class="row d-flex flex-nowrap">
            <!--
            @if ($etapas)
            @foreach($etapas as $key => $step)
            @php

            $acentos = 'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇçÑñ';
            $semAcentos = 'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn';

            $etapa_sem_acento = strtr($key, $acentos, $semAcentos);

            $index = preg_replace('/[^0-9]/', '', $key);

            $etapaSlug = strtr($step, $acentos, $semAcentos);
            $etapaSlug = str_replace(' ', '_', $etapaSlug);

            if(array_key_exists($etapaSlug, $leadsPaginados)){
            $filteredArray = $leadsPaginados[$etapaSlug];

            $totalLeads = $filteredArray->total();
            } else{
            $totalLeads = 0;
            }

            @endphp

            <div class="px-1" style="width: 400px;">
                <div class="card" id="{{ $etapaSlug }}">
                    <div class="card-header {{ $backgroundClasses[7] }} text-white">[{{1 }}º] - {{ $step }} ({{ $totalLeads}})</div>
                    <div class="card-body">
                        <div class="kanban-list">
                            <div class="card shadow-none border">
                                <div class="card-body py-0">
                                    @foreach ($leadsPaginados as $etapa => $paginator)
                                    @php

                                    $acentos = 'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇçÑñ';
                                    $semAcentos = 'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn';

                                    $etapa_formatada = strtr($etapa, $acentos, $semAcentos);
                                    $etapa_formatada = str_replace('_', ' ', $etapa_formatada);

                                    @endphp

                                    @if ($etapa_formatada == $step)

                                    <table class="table" style="font-size: 13px;" id="dataTable">
                                        <thead>
                                            <tr>
                                                <th>Telefone</th>
                                                <th>Data</th>
                                                <th style="width: 10px;"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @foreach ($paginator as $lead)
                                            <tr data-id="{{ $lead }}">
                                                <td>
                                                    <a style="font-size: 12px;margin: 0px 0px 0px 0px; padding: 0px 0px 0px 0px" target="_blank" href="https://wa.me/{{$lead->number}}" class="btn btn-link" title="Ir para o whatsapp">
                                                        <i class="bi bi-whatsapp"></i>
                                                    </a>
                                                    <a style="font-size: 12px; color: white" target="_blank" href="https://wa.me/{{$lead->number}}" title="Ir para o whatsapp">
                                                        {{ $lead->number }}
                                                    </a>
                                                    @if ($lead->last_step)
                                                    @if ($lead->last_step == "Followup")
                                                    <i style="font-size: 12px; color: white" class="material-icons-outlined">chat</i>
                                                    @endif
                                                    @endif
                                                </td>
                                                <td>{{ $lead->created_at->format('d/m/Y H:i') }}</td>
                                                <td>
                                                    <i data-bs-toggle="modal"
                                                        data-bs-target="#resume_case" class="bi bi-search me-2 my-search"></i>
                                                </td>
                                            </tr>
                                            @endforeach
                                        </tbody>
                                    </table>

                                    <div style="overflow-x: auto; white-space: nowrap; max-width: 100%; padding-bottom: 10px;">
                                        <ul class="pagination d-inline-flex">
                                            @foreach ($paginator->getUrlRange(1, $paginator->lastPage()) as $page => $url)
                                            <li class="page-item {{ $paginator->currentPage() == $page ? 'active' : '' }}">
                                                <a class="page-link" href="{{ $url }}{{ request('start_date') ? '&start_date=' . request('start_date') : '' }}{{ request('end_date') ? '&end_date=' . request('end_date') : '' }}#{{ $etapa }}">{{ $page }}</a>
                                            </li>
                                            @endforeach

                                            @if ($paginator->hasMorePages())
                                            <li class="page-item">
                                                <a class="page-link" href="{{ $paginator->nextPageUrl() }}{{ request('start_date') ? '&start_date=' . request('start_date') : '' }}{{ request('end_date') ? '&end_date=' . request('end_date') : '' }}#{{ $etapa }}">Next</a>
                                            </li>
                                            @else
                                            <li class="page-item disabled"><span class="page-link">Next</span></li>
                                            @endif
                                        </ul>
                                    </div>

                                    @endif
                                    @endforeach
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            @endforeach
            @endif
        -->

            <!-- LEADS EM ATENTIMENTO JÚLIA -->
            <div class="px-1" style="width: 450px;">
                <div class="card" id="emAtendimento">
                    <div class="card-header {{ $backgroundClasses[7] }} text-white">[{{ 1 }}º] - Em atendimento Júlia ({{$leads_em_atendimento->total()}})</div>
                    <div class="card-body">
                        <div class="kanban-list">
                            <div class="card shadow-none border">
                                <div class="card-body py-0">

                                    <table class="table" style="font-size: 13px;" id="dataTable">
                                        <thead>
                                            <tr>
                                                <th>Telefone</th>
                                                <th>Data</th>
                                                <th style="width: 10px;"></th>
                                                <th style="width: 10px;"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @foreach ($leads_em_atendimento as $lead)
                                            <tr data-id="{{ $lead }}">
                                                <td>
                                                    <a style="font-size: 12px; color: white" target="_blank" href="https://wa.me/{{$lead->number}}" title="Ir para o whatsapp">
                                                        <i class="bi bi-whatsapp"></i> {{ $lead->whatsapp_number }}
                                                    </a>
                                                </td>
                                                <td> {{ \Carbon\Carbon::parse($lead->created_at)->format('d/m/Y H:i') }} </td>
                                                <td>
                                                    <i data-bs-toggle="modal"
                                                        data-bs-target="#resume_case" class="bi bi-search me-2 my-search"></i>
                                                </td>
                                                <td>
                                                    <button
                                                        style="width:100%"
                                                        class="btn btn-success btn-sm view-chat-btn"
                                                        data-cod-agent="{{ $lead->cod_agent }}"
                                                        data-whatsapp="{{ $lead->whatsapp_number }}">
                                                        <i class="bi bi-whatsapp"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                            @endforeach
                                        </tbody>
                                    </table>

                                    <div style="overflow-x: auto; white-space: nowrap; max-width: 100%; padding-bottom: 10px;">
                                        <ul class="pagination d-inline-flex">
                                            @foreach ($leads_em_atendimento->getUrlRange(1, $leads_em_atendimento->lastPage()) as $page => $url)
                                            <li class="page-item {{ $leads_em_atendimento->currentPage() == $page ? 'active' : '' }}">
                                                <a class="page-link" href="{{ $url }}{{ request('start_date') ? '&start_date=' . request('start_date') : '' }}{{ request('end_date') ? '&end_date=' . request('end_date') : '' }}#emAtendimento">{{ $page }}</a>
                                            </li>
                                            @endforeach

                                            @if ($leads_em_atendimento->hasMorePages())
                                            <li class="page-item">
                                                <a class="page-link" href="{{ $leads_em_atendimento->nextPageUrl() }}{{ request('start_date') ? '&start_date=' . request('start_date') : '' }}{{ request('end_date') ? '&end_date=' . request('end_date') : '' }}#emAtendimento">Next</a>
                                            </li>
                                            @else
                                            <li class="page-item disabled"><span class="page-link">Next</span></li>
                                            @endif
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- LEADS EM ATENTIMENTO HUMANO-->
            <div class="px-1" style="width: 450px;">
                <div class="card" id="emAtendimentoHumano">
                    <div class="card-header {{ $backgroundClasses[7] }} text-white">[{{ 2 }}º] - Em atendimento humano ({{$leads_em_atendimento_humano->total()}})</div>
                    <div class="card-body">
                        <div class="kanban-list">
                            <div class="card shadow-none border">
                                <div class="card-body py-0">

                                    <table class="table" style="font-size: 13px;" id="dataTable">
                                        <thead>
                                            <tr>
                                                <th>Telefone</th>
                                                <th>Data</th>
                                                <th style="width: 10px;"></th>
                                                <th style="width: 10px;"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @foreach ($leads_em_atendimento_humano as $lead)
                                            <tr data-id="{{ $lead }}">
                                                <td>
                                                    <a style="font-size: 12px;margin: 0px 0px 0px 0px; padding: 0px 0px 0px 0px" target="_blank" href="https://wa.me/{{$lead->number}}" class="btn btn-link" title="Ir para o whatsapp">
                                                        <i class="bi bi-whatsapp"></i>
                                                    </a>
                                                    <a style="font-size: 12px; color: white" target="_blank" href="https://wa.me/{{$lead->number}}" title="Ir para o whatsapp">
                                                        {{ $lead->whatsapp_number }}
                                                    </a>
                                                </td>
                                                <td> {{ \Carbon\Carbon::parse($lead->created_at)->format('d/m/Y H:i') }} </td>
                                                <td>
                                                    <i data-bs-toggle="modal"
                                                        data-bs-target="#resume_case" class="bi bi-search me-2 my-search"></i>
                                                </td>
                                                <td>
                                                    <button
                                                        style="width:100%"
                                                        class="btn btn-success btn-sm view-chat-btn"
                                                        data-cod-agent="{{ $lead->cod_agent }}"
                                                        data-whatsapp="{{ $lead->whatsapp_number }}">
                                                        <i class="bi bi-whatsapp"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                            @endforeach
                                        </tbody>
                                    </table>

                                    <div style="overflow-x: auto; white-space: nowrap; max-width: 100%; padding-bottom: 10px;">
                                        <ul class="pagination d-inline-flex">
                                            @foreach ($leads_em_atendimento_humano->getUrlRange(1, $leads_em_atendimento_humano->lastPage()) as $page => $url)
                                            <li class="page-item {{ $leads_em_atendimento_humano->currentPage() == $page ? 'active' : '' }}">
                                                <a class="page-link" href="{{ $url }}{{ request('start_date') ? '&start_date=' . request('start_date') : '' }}{{ request('end_date') ? '&end_date=' . request('end_date') : '' }}#emAtendimentoHumano">{{ $page }}</a>
                                            </li>
                                            @endforeach

                                            @if ($leads_em_atendimento_humano->hasMorePages())
                                            <li class="page-item">
                                                <a class="page-link" href="{{ $leads_em_atendimento_humano->nextPageUrl() }}{{ request('start_date') ? '&start_date=' . request('start_date') : '' }}{{ request('end_date') ? '&end_date=' . request('end_date') : '' }}#emAtendimentoHumano">Next</a>
                                            </li>
                                            @else
                                            <li class="page-item disabled"><span class="page-link">Next</span></li>
                                            @endif
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CONTRATO GERADO -->
            <div class="px-1" style="width: 450px;">
                <div class="card" id="contratoGerado">
                    <div class="card-header {{ $backgroundClasses[7] }} text-white">[{{3 }}º] - Contrato em curso ({{$contratosGerados->total()}})</div>
                    <div class="card-body">
                        <div class="kanban-list">
                            <div class="card shadow-none border">
                                <div class="card-body py-0">

                                    <table class="table" style="font-size: 13px;" id="dataTable">
                                        <thead>
                                            <tr>
                                                <th>Telefone</th>
                                                <th>Data</th>
                                                <th style="width: 10px;"></th>
                                                <th style="width: 10px;"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @foreach ($contratosGerados as $lead)
                                            <tr data-id="{{ $lead }}">
                                                <td>
                                                    <a style="font-size: 12px;margin: 0px 0px 0px 0px; padding: 0px 0px 0px 0px" target="_blank" href="https://wa.me/{{$lead->number}}" class="btn btn-link" title="Ir para o whatsapp">
                                                        <i class="bi bi-whatsapp"></i>
                                                    </a>
                                                    <a style="font-size: 12px; color: white" target="_blank" href="https://wa.me/{{$lead->number}}" title="Ir para o whatsapp">
                                                        {{ $lead->whatsapp_number }}
                                                    </a>
                                                    @if ($lead->last_step)
                                                    @if ($lead->last_step == "Followup")
                                                    <i style="font-size: 12px; color: white" class="material-icons-outlined">chat</i>
                                                    @endif
                                                    @endif
                                                </td>
                                                <td>{{ $lead->created_at->format('d/m/Y H:i') }}</td>
                                                <td>
                                                    <i data-bs-toggle="modal"
                                                        data-bs-target="#resume_case" class="bi bi-search me-2 my-search"></i>
                                                </td>
                                                <td>
                                                    <button
                                                        style="width:100%"
                                                        class="btn btn-success btn-sm view-chat-btn"
                                                        data-cod-agent="{{ $lead->cod_agent }}"
                                                        data-whatsapp="{{ $lead->whatsapp_number }}">
                                                        <i class="bi bi-whatsapp"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                            @endforeach
                                        </tbody>
                                    </table>

                                    <div style="overflow-x: auto; white-space: nowrap; max-width: 100%; padding-bottom: 10px;">
                                        <ul class="pagination d-inline-flex">
                                            @foreach ($contratosGerados->getUrlRange(1, $contratosGerados->lastPage()) as $page => $url)
                                            <li class="page-item {{ $contratosGerados->currentPage() == $page ? 'active' : '' }}">
                                                <a class="page-link" href="{{ $url }}{{ request('start_date') ? '&start_date=' . request('start_date') : '' }}{{ request('end_date') ? '&end_date=' . request('end_date') : '' }}#contratoGerado">{{ $page }}</a>
                                            </li>
                                            @endforeach

                                            @if ($contratosGerados->hasMorePages())
                                            <li class="page-item">
                                                <a class="page-link" href="{{ $contratosGerados->nextPageUrl() }}{{ request('start_date') ? '&start_date=' . request('start_date') : '' }}{{ request('end_date') ? '&end_date=' . request('end_date') : '' }}#contratoGerado">Next</a>
                                            </li>
                                            @else
                                            <li class="page-item disabled"><span class="page-link">Next</span></li>
                                            @endif
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CONTRATO ASSINADO -->
            <div class="px-1" style="width: 450px;">
                <div class="card" id="contratoAssinado">
                    <div class="card-header {{ $backgroundClasses[7] }} text-white">[{{ 4 }}º] - Contrato assinado ({{$contratosAssinados->total()}})</div>
                    <div class="card-body">
                        <div class="kanban-list">
                            <div class="card shadow-none border">
                                <div class="card-body py-0">

                                    <table class="table" style="font-size: 13px;" id="dataTable">
                                        <thead>
                                            <tr>
                                                <th>Telefone</th>
                                                <th>Data</th>
                                                <th style="width: 10px;"></th>
                                                <th style="width: 10px;"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @foreach ($contratosAssinados as $lead)
                                            <tr data-id="{{ $lead }}">
                                                <td>
                                                    <a style="font-size: 12px;margin: 0px 0px 0px 0px; padding: 0px 0px 0px 0px" target="_blank" href="https://wa.me/{{$lead->number}}" class="btn btn-link" title="Ir para o whatsapp">
                                                        <i class="bi bi-whatsapp"></i>
                                                    </a>
                                                    <a style="font-size: 12px; color: white" target="_blank" href="https://wa.me/{{$lead->number}}" title="Ir para o whatsapp">
                                                        {{ $lead->whatsapp_number }}
                                                    </a>
                                                    @if ($lead->last_step)
                                                    @if ($lead->last_step == "Followup")
                                                    <i style="font-size: 12px; color: white" class="material-icons-outlined">chat</i>
                                                    @endif
                                                    @endif
                                                </td>
                                                <td>{{ $lead->created_at->format('d/m/Y H:i') }}</td>
                                                <td>
                                                    <i data-bs-toggle="modal"
                                                        data-bs-target="#resume_case" class="bi bi-search me-2 my-search"></i>
                                                </td>
                                                <td>
                                                    <button
                                                        style="width:100%"
                                                        class="btn btn-success btn-sm view-chat-btn"
                                                        data-cod-agent="{{ $lead->cod_agent }}"
                                                        data-whatsapp="{{ $lead->whatsapp_number }}">
                                                        <i class="bi bi-whatsapp"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                            @endforeach
                                        </tbody>
                                    </table>

                                    <div style="overflow-x: auto; white-space: nowrap; max-width: 100%; padding-bottom: 10px;">
                                        <ul class="pagination d-inline-flex">
                                            @foreach ($contratosAssinados->getUrlRange(1, $contratosAssinados->lastPage()) as $page => $url)
                                            <li class="page-item {{ $contratosAssinados->currentPage() == $page ? 'active' : '' }}">
                                                <a class="page-link" href="{{ $url }}{{ request('start_date') ? '&start_date=' . request('start_date') : '' }}{{ request('end_date') ? '&end_date=' . request('end_date') : '' }}#contratoAssinado">{{ $page }}</a>
                                            </li>
                                            @endforeach

                                            @if ($contratosAssinados->hasMorePages())
                                            <li class="page-item">
                                                <a class="page-link" href="{{ $contratosAssinados->nextPageUrl() }}{{ request('start_date') ? '&start_date=' . request('start_date') : '' }}{{ request('end_date') ? '&end_date=' . request('end_date') : '' }}#contratoAssinado">Next</a>
                                            </li>
                                            @else
                                            <li class="page-item disabled"><span class="page-link">Next</span></li>
                                            @endif
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>


<!--start resume_case modal -->
<div class="modal" id="resume_case">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <div class="modal-body">
                <div class="position-relative">
                    <a href="javascript:;" class="sharelink ms-auto"
                        data-bs-dismiss="modal">
                        <span class="material-icons-outlined">close</span>
                    </a>
                </div>
                <div class="text-center">
                    <h4>Detalhes do lead</h4>
                </div>

                <div>
                    <h6>Campanha:</h4>
                        <p id="campaignName"></p>
                </div>

                <div>
                    <h6>Nome:</h4>
                        <p id="clientName"></p>
                </div>

                <div>
                    <h6>Whatsapp:</h4>
                        <a id="whatsapp" href="#"></a>
                </div>

                <div>
                    <h6>Contrato:</h4>
                        <p id="statusDocument"></p>
                </div>

                <div>
                    <h6>Resumo do caso:</h6>
                </div>
                <div class="text-justify">
                    <p id="resumecaseContent"></p>
                </div>

                <div class="text-center">
                    <button data-bs-dismiss="modal" type="button" class="btn btn-danger px-4 close">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
<!--end resume_case modal-->

@endsection



@push('script')
<!--
<script>
    // Reload page every 60 seconds (1 minute)
    setInterval(function() {
        location.reload();
    }, 60000);
</script>
-->

<script>
    $(document).ready(function() {
        $('#dataTable tbody tr').click(function() {
            var lead_selecionado = $(this).data('id');

            let resume_case = "Não disponível";
            let signer_name = "Não disponível";
            let nome_campanha = "Não disponível";

            if (lead_selecionado.resume_case) {
                resume_case = lead_selecionado.resume_case;
            }

            if (lead_selecionado.signer_name) {
                signer_name = lead_selecionado.signer_name;
            }

            if (lead_selecionado.nome_campanha) {
                nome_campanha = lead_selecionado.nome_campanha;
            }

            $('#resumecaseContent').text(resume_case);
            $('#clientName').text(signer_name);
            $('#campaignName').text(nome_campanha);

            let status_contrato = "";

            if (lead_selecionado.status_document == 'CREATED') {
                status_contrato = "GERADO";
            } else if (lead_selecionado.status_document == 'DELETED') {
                status_contrato = "EXCLUÍDO";
            } else if (lead_selecionado.status_document == 'SIGNED') {
                status_contrato = "ASSINADO";
            } else {
                status_contrato = lead_selecionado.status_document;
            }

            $('#statusDocument').text(status_contrato);

        });


        // Update counter when individual checkboxes change
        $('.escritorio-item input[type="checkbox"]').on('change', function() {
            updateSelectedCount();
        });

        // Function to update the selected count in button text
        function updateSelectedCount() {
            const selectedCount = $('.escritorio-item input[type="checkbox"]:checked').length;
            $('#dropdownEscritorios').text(`Escritórios (${selectedCount} selecionados)`);
        }


        // Initialize counter
        updateSelectedCount();

    });
</script>
@endpush