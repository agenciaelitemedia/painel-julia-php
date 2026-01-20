@extends('layouts.app-julia-masterchat')
@section('title')
    Dashboard
@endsection
@section('content')

    <x-page-title-julia title="Painel" subtitle="[{{ $agent->cod_agent }}] - Jul.IA" />

    <div class="row">
        <div class="col-xxl-8 d-flex align-items-stretch">
            <div class="card w-100 overflow-hidden rounded-4">
                <div class="card-body position-relative p-4">
                    <div class="row ">
                        <div class="col-12 col-sm-8">
                            <div class="d-flex align-items-center gap-3 ">
                                <div class="col-6 d-flex align-items-center justify-content-left gap-3">
                                    <div class="">
                                        <img src="{{ $statusWhatsApp['profilePictureUrl'] }}" height="150" alt="..." class="rounded-circle">
                                    </div>
                                    <div class="">
                                        <small>{{ $statusWhatsApp['profileName'] }}</small>
                                        <br>
                                        <small>{{ $statusWhatsApp['profileNumber'] }}</small>
                                        <br>
                                    <!--    <div class="btn-group mt-1">
                                            <button type="button" class="btn btn-outline-dark d-flex" title="Atualizar Conexão"><i class="material-icons-outlined">autorenew</i>
                                            </button>
                                            <button type="button" class="btn btn-outline-dark d-flex" title="Status da Conexão"><i class="material-icons-outlined">install_mobile</i>
                                            </button>
                                            <button type="button" class="btn btn-outline-dark d-flex" title='Desconectar'><i class="material-icons-outlined">filter_list_off</i>
                                            </button>
                                        </div>-->

                                    </div>
                                </div>
                                <div class="">
                                    <p class="mb-0 fw-semibold">Bem vindo(a), sou a sua Assistente Jurídica</p>
                                    <h4 class="fw-semibold fs-4 mb-0"><strong>JulIA</strong></h4>
<!--
                                    <div class="d-flex align-items-center gap-5 mt-5">
                                        <div class="">
                                            <h4 class="mb-1 fw-semibold d-flex align-content-center">{{ $client->used }}<i
                                                    class="ti ti-arrow-up-right fs-5 lh-base text-success"></i>
                                            </h4>
                                            <p class="mb-3">Meus Atendimentos</p>
                                            <div class="progress mb-0" style="height:5px;">
                                                <div class="progress-bar bg-grd-success" role="progressbar" style="width: {{ ( $client->used  * 100) /  $client->last_used  }}%"
                                                    aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                        </div>
                                        <div class="vr"></div>
                                        <div class="">
                                            <h4 class="mb-1 fw-semibold d-flex align-content-center">{{ $client->limit }}<i
                                                    class="ti ti-arrow-up-right fs-5 lh-base text-success"></i>
                                            </h4>
                                            <p class="mb-3">Limite Atendimentos</p>
                                            <div class="progress mb-0" style="height:5px;">
                                                <div class="progress-bar bg-grd-danger" role="progressbar" style="width: {{ ($client->used * 100) / $client->limit }}%"
                                                    aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                        </div>
                                    </div>
-->
                                </div>
                            </div>

                        </div>
                        <div class="col-12 col-sm-5">
                            <div class="welcome-back-img pt-4">
                                <img src="{{ URL::asset('build/images/gallery/welcome-back-3.png') }}" height="180" alt="">
                            </div>
                        </div>
                    </div><!--end row-->
                </div>
            </div>
        </div>
        <div class="col-xl-6 col-xxl-2 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between mb-1">
                        <div class="">
                            <h5 class="mb-0">{{ $client->used }} / {{ $client->limit }}</h5>
                            <p class="mb-0">Leads Atendidos</p>
                        </div>
                    </div>
                    <div class="chart-container2">
                        <div id="usedLeads"></div>
                    </div>
                    <div class="text-center">
                        <p class="mb-0 font-12">{{ $client->last_used }} por JulIA no mês anterior </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-xl-6 col-xxl-2 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between mb-3">
                        <div class="">
                            <h5 class="mb-0">{{ $viewTotalCiclo->total }}</h5>
                            <p class="mb-0">Mensagens Enviadas</p>
                        </div>
                    </div>
                    <div class="chart-container2">
                        <div id="messagesTotal"></div>
                    </div>
                    <div class="text-center">
                        @php
                            $varTotalCicloMeses = $viewTotalCicloMeses[2]['total'] ?? 0;
                        @endphp
                        <p class="mb-0 font-12"><span class="text-success me-1">{{ $varTotalCicloMeses }}</span> envidos no último mês.</p>
                    </div>
                </div>
            </div>
        </div>


        <div class="col-xl-6 col-xxl-4 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div class="text-center">
                        <h4 class="mb-1">PERSONALIZE SUA JULIA</h4>
                    </div>
                    <p>Use para configurar as frases de chamadas das suas campanhas</p>
                    <div class="col-md-12">

                        @if(session('success'))
                            <div class="alert alert-success border-0 bg-grd-success alert-dismissible fade show">
                                <div class="d-flex align-items-center">
                                    <div class="font-35 text-white"><span class="material-icons-outlined fs-2">check_circle</span>
                                    </div>
                                    <div class="ms-3">
                                        <h6 class="mb-0 text-white">Notificação</h6>
                                        <div class="text-white">{{ session('success') }}</div>
                                    </div>
                                </div>
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>
                        @endif

                        @if(session('error'))
                            <div class="alert alert-danger border-0 bg-grd-danger alert-dismissible fade show">
                                <div class="d-flex align-items-center">
                                    <div class="font-35 text-white"><span class="material-icons-outlined fs-2">report_gmailerrorred</span>
                                    </div>
                                    <div class="ms-3">
                                        <h6 class="mb-0 text-white">Notificação</h6>
                                        <div class="text-white">{{ session('error') }}!</div>
                                    </div>
                                </div>
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>
                        @endif

                        @if(!isset($settings['MASTERCHAT']))
                            @php($settings['MASTERCHAT'] = false )
                        @endif

                        @if(!isset($settings['MASTERCHAT_TRANSFER_QUEUEID']))
                            @php($settings['MASTERCHAT_TRANSFER_QUEUEID'] = 0 )
                        @endif

                        @if(!isset($settings['USING_AUDIO']))
                            @php($settings['USING_AUDIO'] = false )
                        @endif

                        @if(!isset($settings['CHAT_RESUME']))
                            @php($settings['CHAT_RESUME'] = false )
                        @endif

                        @if(!isset($settings['ONLY_ME_RESUME']))
                            @php($settings['ONLY_ME_RESUME'] = false )
                        @endif

                        @if(!isset($settings['NOTIFY_RESUME']))
                            @php($settings['NOTIFY_RESUME'] = false )
                        @endif

                        @if(!isset($settings['FOLLOWUP_CALL']))
                            @php($settings['FOLLOWUP_CALL'] = false )
                        @endif

                        @if(!isset($settings['ONLY_CAMPAIGN']))
                            @php($settings['ONLY_CAMPAIGN'] = 'N/A' )
                        @endif

                        <form action="{{ route('julia.agent.updateSettings', ['uuid' => $agent->uuid, 'agentId' => $agent->id] ) }}" method="POST" id="frmUpdateSettings">
                            @csrf
                            @method('PUT')

                                <div class="form-group pb-3">
                                    <div class="form-check form-switch form-check-success">
                                        <input class="form-check-input" type="checkbox" role="switch" id="MASTERCHAT" name="MASTERCHAT" {{ $settings['MASTERCHAT'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="MASTERCHAT">
                                            <strong>INTEGRAR COM MASTERCHAT</strong> - Habilitar integração com o Masterchat.
                                        </label>
                                        <div class="col-md-2">
                                            <input type="number" class="form-control mt-1 {{ $settings['MASTERCHAT'] ? '' : 'd-none' }}" id="MASTERCHAT_TRANSFER_QUEUEID" name="MASTERCHAT_TRANSFER_QUEUEID" value="{{ $settings['MASTERCHAT_TRANSFER_QUEUEID'] }}">
                                        </div>
                                        @error('MASTERCHAT_TRANSFER_QUEUEID')
                                            <div class="alert alert-danger">{{ $message }}</div>
                                        @enderror
                                    </div>
                                </div>

                                <div class="form-group pb-3">
                                    <div class="form-check form-switch form-check-success">
                                        <input class="form-check-input" type="checkbox" role="switch" id="USING_AUDIO" name="USING_AUDIO" {{ $settings['USING_AUDIO'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="USING_AUDIO">
                                            <strong>RESPONDER EM ÁUDIO</strong> - Se receber áudio a resposta será em áudio.
                                        </label>
                                    </div>
                                </div>

                                <div class="form-group pb-3">
                                    <div class="form-check form-switch form-check-success">
                                        <input class="form-check-input" type="checkbox" role="switch" id="CHAT_RESUME" name="CHAT_RESUME" {{ $settings['CHAT_RESUME'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="CHAT_RESUME">
                                            <strong>RESUMO NO CHAT</strong> - Envia resumo automático na conversa com o lead.
                                        </label>
                                    </div>
                                </div>

                                <div class="form-group pb-3">
                                    <div class="form-check form-switch form-check-success">
                                        <input class="form-check-input" type="checkbox" role="switch" id="ONLY_ME_RESUME" name="ONLY_ME_RESUME" {{ $settings['ONLY_ME_RESUME'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="ONLY_ME_RESUME">
                                            <strong>RESUMO PRIVADO</strong> - Envia resumo automático para si mesmo.
                                        </label>
                                    </div>
                                </div>

                                <div class="form-group pb-3">
                                    <div class="form-check form-switch form-check-success">
                                        <input class="form-check-input" type="checkbox" role="switch" id="NOTIFY_RESUME"  name="NOTIFY_RESUME" {{ $settings['NOTIFY_RESUME'] ? 'checked' : '' }}>
                                        <label class=  "form-check-label" for="NOTIFY_RESUME">
                                            <strong>RESUMO NOTIFICAÇÃO</strong> - Envia resumo para um WhatsApp de Gerência.
                                        </label>
                                        <div class="col-md-5">
                                            <input type="number" class="form-control mt-1 {{ $settings['NOTIFY_RESUME'] ? '' : 'd-none' }} col-md-6" size="20" value="{{ $settings['NOTIFY_RESUME'] }}" id="NOTIFY_RESUME_NUMERO" placeholder="55+DDD+numero" name="NOTIFY_RESUME_NUMERO" value="{{ $settings['NOTIFY_RESUME'] }}">
                                        </div>
                                        @error('NOTIFY_RESUME')
                                            <div class="alert alert-danger">{{ $message }}</div>
                                        @enderror
                                    </div>
                                </div>

                                <div class="form-group pb-3">
                                    <div class="form-check form-switch form-check-success">
                                        <input class="form-check-input" type="checkbox" role="switch" id="FOLLOWUP_CALL" name="FOLLOWUP_CALL" {{ $settings['FOLLOWUP_CALL'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="FOLLOWUP_CALL">
                                            <strong>RECUPERAÇÃO DE LEADs</strong> - Habilita ligação para o lead sem resposta a mais de 5min.
                                        </label>
                                    </div>
                                </div>

                                <div class="form-group pb-3">
                                    <div class="form-check form-switch form-check-success">
                                        <input class="form-check-input" type="checkbox" role="switch" id="ONLY_CAMPAIGN" name="ONLY_CAMPAIGN" {{ $settings['ONLY_CAMPAIGN'] ? 'checked' : '' }}>
                                        <input type="hidden" name="START_CAMPAIGN" id="START_CAMPAIGN" value="{{ $settings['START_CAMPAIGN'] }}">
                                        <label class="form-check-label" for="ONLY_CAMPAIGN">
                                            <strong>ATENDER CAMPANHAS</strong> - Atende apenas os leads de campanhas, necessário configurar as frases de campanhas
                                        </label>
                                        <div class="col-md-8">
                                            <span class="btn btn-secondary px-4 raised d-flex gap-2 {{ $settings['ONLY_CAMPAIGN'] ? '' : 'd-none' }}" id="ONLY_CAMPAIGN_CONFIG" data-bs-toggle="modal"
                                            data-bs-target="#frmCampanhas"><i class="material-icons-outlined">open_in_new</i> Configurar Campanha</span>
                                        </div>
                                    </div>
                                </div>

                            <hr class="pt-3">

                            <button type="submit" class="btn btn-primary px-4 raised d-flex gap-2"><i class="material-icons-outlined">save</i>  Salvar Configurações</button>
                        </form>

                    </div>
                </div>
            </div>
        </div>

        <div class="col-xl-6 col-xxl-4 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div class="d-flex flex-column gap-3">
                        <div class="d-flex align-items-start justify-content-between">
                            <div class="">
                                <h5 class="mb-0">Tipos de Mensagens</h5>
                            </div>
                        </div>
                        <div class="position-relative">
                            <div class="piechart-legend">
                                <h2 class="mb-1">{{ $chartTotalCicloTypes['total'] }}</h2>
                                <h6 class="mb-0">Total Msgs</h6>
                            </div>
                            <div id="msgTypeSend"></div>
                        </div>
                        <div class="d-flex flex-column gap-3">
                            <div class="d-flex align-items-center justify-content-between">
                                <p class="mb-0 d-flex align-items-center gap-2 w-25"><span
                                        class="material-icons-outlined fs-6 text-primary">desktop_windows</span>Texto</p>
                                <div class="">
                                    <p class="mb-0">{{ $chartTotalCicloTypes['textoPerc'] }}%</p>
                                </div>
                            </div>
                            <div class="d-flex align-items-center justify-content-between">
                                <p class="mb-0 d-flex align-items-center gap-2 w-25"><span
                                        class="material-icons-outlined fs-6 text-danger">tablet_mac</span>Áudio</p>
                                <div class="">
                                    <p class="mb-0">{{ $chartTotalCicloTypes['audioPerc'] }}%</p>
                                </div>
                            </div>
                            <div class="d-flex align-items-center justify-content-between">
                                <p class="mb-0 d-flex align-items-center gap-2 w-25"><span
                                        class="material-icons-outlined fs-6 text-success">phone_android</span>Vídeo</p>
                                <div class="">
                                    <p class="mb-0">{{ $chartTotalCicloTypes['videoPerc'] }}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>






<!--
        <div class="col-xl-6 col-xxl-4 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div class="text-center">
                        <h6 class="mb-0">Monthly Revenue</h6>
                    </div>
                    <div class="mt-4" id="chart5"></div>
                    <p>Avrage monthly sale for every author</p>
                    <div class="d-flex align-items-center gap-3 mt-4">
                        <div class="">
                            <h1 class="mb-0 text-primary">68.9%</h1>
                        </div>
                        <div class="d-flex align-items-center align-self-end">
                            <p class="mb-0 text-success">34.5%</p>
                            <span class="material-icons-outlined text-success">expand_less</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-xxl-4">
            <div class="row">
                <div class="col-md-6 d-flex align-items-stretch">
                    <div class="card w-100 rounded-4">
                        <div class="card-body">
                            <div class="d-flex align-items-start justify-content-between mb-1">
                                <div class="">
                                    <h5 class="mb-0">82.7K</h5>
                                    <p class="mb-0">Total Clicks</p>
                                </div>
                                <div class="dropdown">
                                    <a href="javascript:;" class="dropdown-toggle-nocaret options dropdown-toggle"
                                        data-bs-toggle="dropdown">
                                        <span class="material-icons-outlined fs-5">more_vert</span>
                                    </a>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item" href="javascript:;">Action</a></li>
                                        <li><a class="dropdown-item" href="javascript:;">Another action</a></li>
                                        <li><a class="dropdown-item" href="javascript:;">Something else here</a></li>
                                    </ul>
                                </div>
                            </div>
                            <div class="chart-container2">
                                <div id="chart3"></div>
                            </div>
                            <div class="text-center">
                                <p class="mb-0 font-12"><span class="text-success me-1">12.5%</span> from last month</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-sm-6 d-flex align-items-stretch">
                    <div class="card w-100 rounded-4">
                        <div class="card-body">
                            <div class="d-flex align-items-start justify-content-between mb-1">
                                <div class="">
                                    <h5 class="mb-0">68.4K</h5>
                                    <p class="mb-0">Total Views</p>
                                </div>
                                <div class="dropdown">
                                    <a href="javascript:;" class="dropdown-toggle-nocaret options dropdown-toggle"
                                        data-bs-toggle="dropdown">
                                        <span class="material-icons-outlined fs-5">more_vert</span>
                                    </a>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item" href="javascript:;">Action</a></li>
                                        <li><a class="dropdown-item" href="javascript:;">Another action</a></li>
                                        <li><a class="dropdown-item" href="javascript:;">Something else here</a></li>
                                    </ul>
                                </div>
                            </div>
                            <div class="chart-container2">
                                <div id="chart4"></div>
                            </div>
                            <div class="text-center">
                                <p class="mb-0 font-12">35K users increased from last month</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card rounded-4">
                <div class="card-body">
                    <div class="d-flex align-items-center gap-3 mb-2">
                        <div class="">
                            <h3 class="mb-0">85,247</h3>
                        </div>
                        <div class="flex-grow-0">
                            <p
                                class="dash-lable d-flex align-items-center gap-1 rounded mb-0 bg-success text-success bg-opacity-10">
                                <span class="material-icons-outlined fs-6">arrow_downward</span>23.7%
                            </p>
                        </div>
                    </div>
                    <p class="mb-0">Total Accounts</p>
                    <div id="chart7"></div>
                </div>
            </div>
        </div>
        <div class="col-xl-6 col-xxl-4 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between mb-3">
                        <div class="">
                            <h6 class="mb-0 fw-bold">Campaign Stats</h6>
                        </div>
                        <div class="dropdown">
                            <a href="javascript:;" class="dropdown-toggle-nocaret options dropdown-toggle"
                                data-bs-toggle="dropdown">
                                <span class="material-icons-outlined fs-5">more_vert</span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="javascript:;">Action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Another action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Something else here</a></li>
                            </ul>
                        </div>
                    </div>

                    <ul class="list-group list-group-flush">
                        <li class="list-group-item px-0 bg-transparent">
                            <div class="d-flex align-items-center gap-3">
                                <div
                                    class="wh-42 d-flex align-items-center justify-content-center rounded-3 bg-grd-primary">
                                    <span class="material-icons-outlined text-white">calendar_today</span>
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="mb-0">Campaigns</h6>
                                </div>
                                <div class="d-flex align-items-center gap-3">
                                    <p class="mb-0">54</p>
                                    <p class="mb-0 fw-bold text-success">28%</p>
                                </div>
                            </div>
                        </li>
                        <li class="list-group-item px-0 bg-transparent">
                            <div class="d-flex align-items-center gap-3">
                                <div
                                    class="wh-42 d-flex align-items-center justify-content-center rounded-3 bg-grd-success">
                                    <span class="material-icons-outlined text-white">email</span>
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="mb-0">Emailed</h6>
                                </div>
                                <div class="d-flex align-items-center gap-3">
                                    <p class="mb-0">245</p>
                                    <p class="mb-0 fw-bold text-danger">15%</p>
                                </div>
                            </div>
                        </li>
                        <li class="list-group-item px-0 bg-transparent">
                            <div class="d-flex align-items-center gap-3">
                                <div
                                    class="wh-42 d-flex align-items-center justify-content-center rounded-3 bg-grd-branding">
                                    <span class="material-icons-outlined text-white">open_in_new</span>
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="mb-0">Opened</h6>
                                </div>
                                <div class="d-flex align-items-center gap-3">
                                    <p class="mb-0">54</p>
                                    <p class="mb-0 fw-bold text-success">30.5%</p>
                                </div>
                            </div>
                        </li>
                        <li class="list-group-item px-0 bg-transparent">
                            <div class="d-flex align-items-center gap-3">
                                <div
                                    class="wh-42 d-flex align-items-center justify-content-center rounded-3 bg-grd-warning">
                                    <span class="material-icons-outlined text-white">ads_click</span>
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="mb-0">Clicked</h6>
                                </div>
                                <div class="d-flex align-items-center gap-3">
                                    <p class="mb-0">859</p>
                                    <p class="mb-0 fw-bold text-danger">34.6%</p>
                                </div>
                            </div>
                        </li>
                        <li class="list-group-item px-0 bg-transparent">
                            <div class="d-flex align-items-center gap-3">
                                <div class="wh-42 d-flex align-items-center justify-content-center rounded-3 bg-grd-info">
                                    <span class="material-icons-outlined text-white">subscriptions</span>
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="mb-0">Subscribed</h6>
                                </div>
                                <div class="d-flex align-items-center gap-3">
                                    <p class="mb-0">24,758</p>
                                    <p class="mb-0 fw-bold text-success">53%</p>
                                </div>
                            </div>
                        </li>
                        <li class="list-group-item px-0 bg-transparent">
                            <div class="d-flex align-items-center gap-3">
                                <div
                                    class="wh-42 d-flex align-items-center justify-content-center rounded-3 bg-grd-danger">
                                    <span class="material-icons-outlined text-white">inbox</span>
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="mb-0">Spam Message</h6>
                                </div>
                                <div class="d-flex align-items-center gap-3">
                                    <p class="mb-0">548</p>
                                    <p class="mb-0 fw-bold text-danger">47%</p>
                                </div>
                            </div>
                        </li>
                        <li class="list-group-item px-0 bg-transparent">
                            <div class="d-flex align-items-center gap-3">
                                <div
                                    class="wh-42 d-flex align-items-center justify-content-center rounded-3 bg-grd-deep-blue">
                                    <span class="material-icons-outlined text-white">visibility</span>
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="mb-0">Views Mails</h6>
                                </div>
                                <div class="d-flex align-items-center gap-3">
                                    <p class="mb-0">9845</p>
                                    <p class="mb-0 fw-bold text-success">68%</p>
                                </div>
                            </div>
                        </li>
                    </ul>

                </div>
            </div>
        </div>
        <div class="col-xl-6 col-xxl-4 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div id="chart8"></div>
                    <div class="d-flex align-items-center gap-3 mt-4">
                        <div class="">
                            <h1 class="mb-0">36.7%</h1>
                        </div>
                        <div class="d-flex align-items-center align-self-end gap-2">
                            <span class="material-icons-outlined text-success">trending_up</span>
                            <p class="mb-0 text-success">34.5%</p>
                        </div>
                    </div>
                    <p class="mb-4">Visitors Growth</p>
                    <div class="d-flex flex-column gap-3">
                        <div class="">
                            <p class="mb-1">Cliks <span class="float-end">2589</span></p>
                            <div class="progress" style="height: 5px;">
                                <div class="progress-bar bg-grd-primary" style="width: 65%"></div>
                            </div>
                        </div>
                        <div class="">
                            <p class="mb-1">Likes <span class="float-end">6748</span></p>
                            <div class="progress" style="height: 5px;">
                                <div class="progress-bar bg-grd-warning" style="width: 55%"></div>
                            </div>
                        </div>
                        <div class="">
                            <p class="mb-1">Upvotes <span class="float-end">9842</span></p>
                            <div class="progress" style="height: 5px;">
                                <div class="progress-bar bg-grd-info" style="width: 45%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-6 col-xxl-4 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between mb-3">
                        <div class="">
                            <h5 class="mb-0 fw-bold">Social Leads</h5>
                        </div>
                        <div class="dropdown">
                            <a href="javascript:;" class="dropdown-toggle-nocaret options dropdown-toggle"
                                data-bs-toggle="dropdown">
                                <span class="material-icons-outlined fs-5">more_vert</span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="javascript:;">Action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Another action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Something else here</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="d-flex flex-column justify-content-between gap-4">
                        <div class="d-flex align-items-center gap-4">
                            <div class="d-flex align-items-center gap-3 flex-grow-1">
                                <img src="{{ URL::asset('build/images/apps/17.png') }}" width="32" alt="">
                                <p class="mb-0">Facebook</p>
                            </div>
                            <div class="">
                                <p class="mb-0 fs-6">55%</p>
                            </div>
                            <div class="">
                                <p class="mb-0 data-attributes">
                                    <span
                                        data-peity='{ "fill": ["#0d6efd", "rgb(255 255 255 / 10%)"], "innerRadius": 14, "radius": 18 }'>5/7</span>
                                </p>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-4">
                            <div class="d-flex align-items-center gap-3 flex-grow-1">
                                <img src="{{ URL::asset('build/images/apps/18.png') }}" width="32" alt="">
                                <p class="mb-0">LinkedIn</p>
                            </div>
                            <div class="">
                                <p class="mb-0 fs-6">67%</p>
                            </div>
                            <div class="">
                                <p class="mb-0 data-attributes">
                                    <span
                                        data-peity='{ "fill": ["#fc185a", "rgb(255 255 255 / 10%)"], "innerRadius": 14, "radius": 18 }'>5/7</span>
                                </p>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-4">
                            <div class="d-flex align-items-center gap-3 flex-grow-1">
                                <img src="{{ URL::asset('build/images/apps/19.png') }}" width="32" alt="">
                                <p class="mb-0">Instagram</p>
                            </div>
                            <div class="">
                                <p class="mb-0 fs-6">78%</p>
                            </div>
                            <div class="">
                                <p class="mb-0 data-attributes">
                                    <span
                                        data-peity='{ "fill": ["#02c27a", "rgb(255 255 255 / 10%)"], "innerRadius": 14, "radius": 18 }'>5/7</span>
                                </p>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-4">
                            <div class="d-flex align-items-center gap-3 flex-grow-1">
                                <img src="{{ URL::asset('build/images/apps/20.png') }}" width="32" alt="">
                                <p class="mb-0">Snapchat</p>
                            </div>
                            <div class="">
                                <p class="mb-0 fs-6">46%</p>
                            </div>
                            <div class="">
                                <p class="mb-0 data-attributes">
                                    <span
                                        data-peity='{ "fill": ["#fd7e14", "rgb(255 255 255 / 10%)"], "innerRadius": 14, "radius": 18 }'>5/7</span>
                                </p>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-4">
                            <div class="d-flex align-items-center gap-3 flex-grow-1">
                                <img src="{{ URL::asset('build/images/apps/05.png') }}" width="32" alt="">
                                <p class="mb-0">Google</p>
                            </div>
                            <div class="">
                                <p class="mb-0 fs-6">38%</p>
                            </div>
                            <div class="">
                                <p class="mb-0 data-attributes">
                                    <span
                                        data-peity='{ "fill": ["#0dcaf0", "rgb(255 255 255 / 10%)"], "innerRadius": 14, "radius": 18 }'>5/7</span>
                                </p>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-4">
                            <div class="d-flex align-items-center gap-3 flex-grow-1">
                                <img src="{{ URL::asset('build/images/apps/08.png') }}" width="32" alt="">
                                <p class="mb-0">Altaba</p>
                            </div>
                            <div class="">
                                <p class="mb-0 fs-6">15%</p>
                            </div>
                            <div class="">
                                <p class="mb-0 data-attributes">
                                    <span
                                        data-peity='{ "fill": ["#6f42c1", "rgb(255 255 255 / 10%)"], "innerRadius": 14, "radius": 18 }'>5/7</span>
                                </p>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-4">
                            <div class="d-flex align-items-center gap-3 flex-grow-1">
                                <img src="{{ URL::asset('build/images/apps/07.png') }}" width="32" alt="">
                                <p class="mb-0">Spotify</p>
                            </div>
                            <div class="">
                                <p class="mb-0 fs-6">12%</p>
                            </div>
                            <div class="">
                                <p class="mb-0 data-attributes">
                                    <span
                                        data-peity='{ "fill": ["#ff00b3", "rgb(255 255 255 / 10%)"], "innerRadius": 14, "radius": 18 }'>5/7</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-6 col-xxl-4 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-header border-0 p-3 border-bottom">
                    <div class="d-flex align-items-start justify-content-between">
                        <div class="">
                            <h5 class="mb-0">New Users</h5>
                        </div>
                        <div class="dropdown">
                            <a href="javascript:;" class="dropdown-toggle-nocaret options dropdown-toggle"
                                data-bs-toggle="dropdown">
                                <span class="material-icons-outlined fs-5">more_vert</span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="javascript:;">Action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Another action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Something else here</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="user-list p-3">
                        <div class="d-flex flex-column gap-3">
                            <div class="d-flex align-items-center gap-3">
                                <img src="https://placehold.co/110x110/png" width="45" height="45"
                                    class="rounded-circle" alt="">
                                <div class="flex-grow-1">
                                    <h6 class="mb-0">Elon Jonado</h6>
                                    <p class="mb-0">elon_deo</p>
                                </div>
                                <div class="form-check form-check-inline me-0">
                                    <input class="form-check-input ms-0" type="checkbox">
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-3">
                                <img src="https://placehold.co/110x110/png" width="45" height="45"
                                    class="rounded-circle" alt="">
                                <div class="flex-grow-1">
                                    <h6 class="mb-0">Alexzender Clito</h6>
                                    <p class="mb-0">zli_alexzender</p>
                                </div>
                                <div class="form-check form-check-inline me-0">
                                    <input class="form-check-input ms-0" type="checkbox">
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-3">
                                <img src="https://placehold.co/110x110/png" width="45" height="45"
                                    class="rounded-circle" alt="">
                                <div class="flex-grow-1">
                                    <h6 class="mb-0">Michle Tinko</h6>
                                    <p class="mb-0">tinko_michle</p>
                                </div>
                                <div class="form-check form-check-inline me-0">
                                    <input class="form-check-input ms-0" type="checkbox">
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-3">
                                <img src="https://placehold.co/110x110/png" width="45" height="45"
                                    class="rounded-circle" alt="">
                                <div class="flex-grow-1">
                                    <h6 class="mb-0">KailWemba</h6>
                                    <p class="mb-0">wemba_kl</p>
                                </div>
                                <div class="form-check form-check-inline me-0">
                                    <input class="form-check-input ms-0" type="checkbox">
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-3">
                                <img src="https://placehold.co/110x110/png" width="45" height="45"
                                    class="rounded-circle" alt="">
                                <div class="flex-grow-1">
                                    <h6 class="mb-0">Henhco Tino</h6>
                                    <p class="mb-0">Henhco_tino</p>
                                </div>
                                <div class="form-check form-check-inline me-0">
                                    <input class="form-check-input ms-0" type="checkbox">
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-3">
                                <img src="https://placehold.co/110x110/png" width="45" height="45"
                                    class="rounded-circle" alt="">
                                <div class="flex-grow-1">
                                    <h6 class="mb-0">Gonjiko Fernando</h6>
                                    <p class="mb-0">gonjiko_fernando</p>
                                </div>
                                <div class="form-check form-check-inline me-0">
                                    <input class="form-check-input ms-0" type="checkbox">
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-3">
                                <img src="https://placehold.co/110x110/png" width="45" height="45"
                                    class="rounded-circle" alt="">
                                <div class="flex-grow-1">
                                    <h6 class="mb-0">Specer Kilo</h6>
                                    <p class="mb-0">specer_kilo</p>
                                </div>
                                <div class="form-check form-check-inline me-0">
                                    <input class="form-check-input ms-0" type="checkbox">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent p-3">
                    <div class="d-flex align-items-center justify-content-between gap-3">
                        <a href="javascript:;" class="sharelink"><i class="material-icons-outlined">share</i></a>
                        <a href="javascript:;" class="sharelink"><i class="material-icons-outlined">textsms</i></a>
                        <a href="javascript:;" class="sharelink"><i class="material-icons-outlined">email</i></a>
                        <a href="javascript:;" class="sharelink"><i class="material-icons-outlined">attach_file</i></a>
                        <a href="javascript:;" class="sharelink"><i class="material-icons-outlined">event</i></a>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-lg-12 col-xxl-8 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between mb-3">
                        <div class="">
                            <h5 class="mb-0">Recent Orders</h5>
                        </div>
                        <div class="dropdown">
                            <a href="javascript:;" class="dropdown-toggle-nocaret options dropdown-toggle"
                                data-bs-toggle="dropdown">
                                <span class="material-icons-outlined fs-5">more_vert</span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="javascript:;">Action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Another action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Something else here</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="order-search position-relative my-3">
                        <input class="form-control rounded-5 px-5" type="text" placeholder="Search">
                        <span
                            class="material-icons-outlined position-absolute ms-3 translate-middle-y start-0 top-50">search</span>
                    </div>
                    <div class="table-responsive">
                        <table class="table align-middle">
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Amount</th>
                                    <th>Vendor</th>
                                    <th>Status</th>
                                    <th>Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center gap-3">
                                            <div class="">
                                                <img src="https://placehold.co/110x110/png" class="rounded-circle"
                                                    width="50" height="50" alt="">
                                            </div>
                                            <p class="mb-0">Sports Shoes</p>
                                        </div>
                                    </td>
                                    <td>$149</td>
                                    <td>Julia Sunota</td>
                                    <td>
                                        <p class="dash-lable mb-0 bg-success bg-opacity-10 text-success rounded-2">
                                            Completed</p>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center gap-1">
                                            <p class="mb-0">5.0</p>
                                            <i class="material-icons-outlined text-warning fs-6">star</i>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center gap-3">
                                            <div class="">
                                                <img src="https://placehold.co/110x110/png" class="rounded-circle"
                                                    width="50" height="50" alt="">
                                            </div>
                                            <p class="mb-0">Goldan Watch</p>
                                        </div>
                                    </td>
                                    <td>$168</td>
                                    <td>Julia Sunota</td>
                                    <td>
                                        <p class="dash-lable mb-0 bg-success bg-opacity-10 text-success rounded-2">
                                            Completed</p>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center gap-1">
                                            <p class="mb-0">5.0</p>
                                            <i class="material-icons-outlined text-warning fs-6">star</i>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center gap-3">
                                            <div class="">
                                                <img src="https://placehold.co/110x110/png" class="rounded-circle"
                                                    width="50" height="50" alt="">
                                            </div>
                                            <p class="mb-0">Men Polo Tshirt</p>
                                        </div>
                                    </td>
                                    <td>$124</td>
                                    <td>Julia Sunota</td>
                                    <td>
                                        <p class="dash-lable mb-0 bg-warning bg-opacity-10 text-warning rounded-2">Pending
                                        </p>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center gap-1">
                                            <p class="mb-0">4.0</p>
                                            <i class="material-icons-outlined text-warning fs-6">star</i>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center gap-3">
                                            <div class="">
                                                <img src="https://placehold.co/110x110/png" class="rounded-circle"
                                                    width="50" height="50" alt="">
                                            </div>
                                            <p class="mb-0">Blue Jeans Casual</p>
                                        </div>
                                    </td>
                                    <td>$289</td>
                                    <td>Julia Sunota</td>
                                    <td>
                                        <p class="dash-lable mb-0 bg-success bg-opacity-10 text-success rounded-2">
                                            Completed</p>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center gap-1">
                                            <p class="mb-0">3.0</p>
                                            <i class="material-icons-outlined text-warning fs-6">star</i>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center gap-3">
                                            <div class="">
                                                <img src="https://placehold.co/110x110/png" class="rounded-circle"
                                                    width="50" height="50" alt="">
                                            </div>
                                            <p class="mb-0">Fancy Shirts</p>
                                        </div>
                                    </td>
                                    <td>$389</td>
                                    <td>Julia Sunota</td>
                                    <td>
                                        <p class="dash-lable mb-0 bg-danger bg-opacity-10 text-danger rounded-2">Canceled
                                        </p>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center gap-1">
                                            <p class="mb-0">2.0</p>
                                            <i class="material-icons-outlined text-warning fs-6">star</i>
                                        </div>
                                    </td>
                                </tr>

                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        -->
        </div>
    </div>


    <!-- Modal -->
    <div class="modal fade" id="frmCampanhas">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header border-bottom-0 py-2">
                    <h5 class="modal-title">Habilita suas Campanhas</h5>
                    <a href="javascript:;" class="primaery-menu-close" data-bs-dismiss="modal">
                        <i class="material-icons-outlined">close</i>
                    </a>
                </div>
                <div class="modal-body">
                    <div class="form-body">
                            <p>Suas campanhas são configuradas com mensagens que chegam no seu WhatsApp. Use-as para ativar a Jul.IA</p>
                            <p>Use || para separar as frases.</p>
                            <small>Ex.: Minha frase 01||Minha Frase 02</small>
                            <div class="col-md-12">
                                <textarea class="form-control" id="ATIVA_CAMPANHAS" name="ATIVA_CAMPANHAS" placeholder="Coloque aqui as frases de suas campanhas separadas por ||" rows="10">{{ $settings['START_CAMPAIGN'] }}</textarea>
                            </div>
                            <div class="col-md-12 mt-3">
                                <div class="d-md-flex d-grid align-items-center gap-3">
                                    <button type="button"
                                        class="btn btn-primary px-4" id="btnAtivaCampanhas">Salvar</button>
                                </div>
                            </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

@endsection
@push('script')
    <!--plugins-->
    <script src="{{ URL::asset('build/plugins/perfect-scrollbar/js/perfect-scrollbar.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/metismenu/metisMenu.min.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/apexchart/apexcharts.min.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/simplebar/js/simplebar.min.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/peity/jquery.peity.min.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/form-repeater/repeater.js') }}"></script>
    <script>
        /* Create Repeater */
        $("#repeater").createRepeater({
            showFirstItemToDefault: true,
        });
    </script>
    <script>
        $(".data-attributes span").peity("donut")
    </script>

    <script>
        $(document).ready(function() {

            $('#btnAtivaCampanhas').click(function(){
                var ativaCampanhasContent = $('#ATIVA_CAMPANHAS').val();
                $('#START_CAMPAIGN').val(ativaCampanhasContent);

                var $btn = $(this);
                $btn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...');
                $btn.prop('disabled', true);

                $('#frmUpdateSettings').submit();
            });

            $('#frmCampanhas').modal({
                    backdrop: 'static',
                    keyboard: false
            });

            $('#MASTERCHAT').change(function() {
                if($(this).is(':checked')) {
                    $('#MASTERCHAT_TRANSFER_QUEUEID').removeClass('d-none');
                } else {
                    $('#MASTERCHAT_TRANSFER_QUEUEID').addClass('d-none');
                }
            });

            $('#ONLY_CAMPAIGN').change(function() {
                if($(this).is(':checked')) {
                    $('#ONLY_CAMPAIGN_CONFIG').removeClass('d-none');
                } else {
                    $('#ONLY_CAMPAIGN_CONFIG').addClass('d-none');
                }
            });

            $('#NOTIFY_RESUME').change(function() {
                if($(this).is(':checked')) {
                    $('#NOTIFY_RESUME_NUMERO').removeClass('d-none');
                } else {
                    $('#NOTIFY_RESUME_NUMERO').addClass('d-none');
                }
            });
        });
    </script>

    <script src="{{ URL::asset('build/js/main.js') }}"></script>
    <script src="{{ URL::asset('build/js/dashboard1.js') }}"></script>
    <script>
        new PerfectScrollbar(".user-list")
    </script>


    <script>
        var options = {
            series: [{{ number_format(($client->used * 100) / $client->limit, 1) }}],
            chart: {
                height: 180,
                type: 'radialBar',
                toolbar: {
                    show: false
                }
            },
            plotOptions: {
                radialBar: {
                    startAngle: -115,
                    endAngle: 115,
                    hollow: {
                        margin: 0,
                        size: '80%',
                        background: 'transparent',
                        image: undefined,
                        imageOffsetX: 0,
                        imageOffsetY: 0,
                        position: 'front',
                        dropShadow: {
                            enabled: false,
                            top: 3,
                            left: 0,
                            blur: 4,
                            opacity: 0.24
                        }
                    },
                    track: {
                        background: 'rgba(0, 0, 0, 0.1)',
                        strokeWidth: '67%',
                        margin: 0, // margin is in pixels
                        dropShadow: {
                            enabled: false,
                            top: -3,
                            left: 0,
                            blur: 4,
                            opacity: 0.35
                        }
                    },

                    dataLabels: {
                        show: true,
                        name: {
                            offsetY: -10,
                            show: false,
                            color: '#888',
                            fontSize: '17px'
                        },
                        value: {
                            offsetY: 10,
                            color: '#111',
                            fontSize: '24px',
                            show: true,
                        }
                    }
                }
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shade: 'dark',
                    type: 'horizontal',
                    shadeIntensity: 0.5,
                    gradientToColors: ['#ffd200'],
                    inverseColors: true,
                    opacityFrom: 1,
                    opacityTo: 1,
                    stops: [0, 100]
                }
            },
            colors: ["#ee0979"],
            stroke: {
                lineCap: 'round'
            },
            labels: ['Total Orders'],
        };

        var chart = new ApexCharts(document.querySelector("#usedLeads"), options);
        chart.render();


        // chart 2

        var options = {
            series: [{
                name: "Net Sales",
                data: [{{ implode(', ', $totalMessageMesal) }}]
            }],
            chart: {
                //width:150,
                height: 105,
                type: 'area',
                sparkline: {
                    enabled: !0
                },
                zoom: {
                    enabled: false
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                width: 3,
                curve: 'smooth'
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shade: 'dark',
                    gradientToColors: ['#0866ff'],
                    shadeIntensity: 1,
                    type: 'vertical',
                    opacityFrom: 0.5,
                    opacityTo: 0.0,
                    //stops: [0, 100, 100, 100]
                },
            },

            colors: ["#02c27a"],
            tooltip: {
                theme: "dark",
                fixed: {
                    enabled: !1
                },
                x: {
                    show: !1
                },
                y: {
                    title: {
                        formatter: function (e) {
                            return ""
                        }
                    }
                },
                marker: {
                    show: !1
                }
            },
            xaxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
            }
        };

        var chart = new ApexCharts(document.querySelector("#messagesTotal"), options);
        chart.render();


    // chart 6
    var options = {
        series: [{{ $chartTotalCicloTypes['totalChart'] }}],
        chart: {
            height: 290,
            type: 'donut',
        },
        legend: {
            position: 'bottom',
            show: !1
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                gradientToColors: ['#ee0979', '#17ad37', '#ec6ead'],
                shadeIntensity: 1,
                type: 'vertical',
                opacityFrom: 1,
                opacityTo: 1,
                //stops: [0, 100, 100, 100]
            },
        },
        colors: ["#ff6a00", "#98ec2d", "#3494e6"],
        dataLabels: {
            enabled: !1
        },
        plotOptions: {
            pie: {
                donut: {
                    size: "85%"
                }
            }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    height: 270
                },
                legend: {
                    position: 'bottom',
                    show: !1
                }
            }
        }]
    };

    var chart = new ApexCharts(document.querySelector("#msgTypeSend"), options);
    chart.render();

    </script>

@endpush
