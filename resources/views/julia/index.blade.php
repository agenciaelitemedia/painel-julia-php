@extends('layouts.app')
@section('title')
Dashboard
@endsection

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
</style>

<style>
    .support-floating {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        max-width: 180px;
    }

    .support-content {
        position: relative;
        color: black;
    }

    #close-support {
        position: absolute;
        top: -10px;
        right: -10px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 50%;
        width: 25px;
        height: 25px;
        cursor: pointer;
    }

    #close-support:hover {
        background: #cc0000;
    }
</style>

<style>
    .oculto {
        display: none;
    }
</style>

<style>
    .responsive-card {
        flex: 0 0 100%;
        max-width: 100%;
    }

    @media (min-width: 576px) {
        .responsive-card {
            flex: 0 0 50%;
            max-width: 50%;
        }
    }

    @media (max-width: 768px) {
        .responsive-card {
            flex: 0 0 25%;
            max-width: 25%;
        }

        a {
            width: 38px !important;
            height: 38px !important;
        }
    }

    @media (max-width: 668px) {
        .responsive-card {
            flex: 0 0 25%;
            max-width: 25%;
        }

        a {
            width: 32px !important;
            height: 32px !important;
        }

        p {
            font-size: 12px;
        }
    }

    @media (max-width: 400px) {
        .responsive-card {
            flex: 0 0 25%;
            max-width: 25%;
        }

        .material-icons-outlined {
            font-size: 12px !important;
            padding: 7px 7px 7px 7px;
        }

        h5 {
            font-size: 14px !important;
        }

        small {
            font-size: 8px !important;
        }

        .p-3 {
            padding-left: 0.3rem !important;
            padding-right: 0.3rem !important
        }

        .gap-3 {
            gap: 0.3rem !important
        }

        a {
            width: 28px !important;
            height: 28px !important;
        }

        p {
            font-size: 10px;
        }
    }

    .compose-mail-title {
        font-size: 14px !important;
    }

    .card-body {
        padding: 0px 0px 0px 0px
    }
</style>

@endpush

@section('content')

<x-page-title title="Dashboard" subtitle="Painel Principal [{{ $user->cod_agent }}]" />

@if(Auth::user()->role == 'admin')


<!-- HOJE -->
<div class="product-count">
    <div class="card" style="margin-bottom: 10px">

        @php
        $qualificados = round($leads->sum('total_leads') * 0.15, 0);
        $contratos = $leads->sum('total_gerados');
        $percentual = $qualificados > 0 ? round(($contratos / $qualificados) * 100, 0) : 0;
        @endphp

        <div class="card-header text-white py-2 cursor-pointer">
            <div class="d-flex align-items-center">
                <div class="compose-mail-title">Hoje ({{ \Carbon\Carbon::now('America/Sao_Paulo')->format('d/m/Y') }}) - {{ $percentual }}% de conversão</div>
            </div>
        </div>
        <div class="card-body">
            <div class="row g-3">
                <div class="col-4 col-md-4">
                    <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">
                        <a href="javascript:;"
                            class="wh-48 bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center">
                            <i class="material-icons-outlined">question_answer</i>
                        </a>
                        <div>
                            <h5 class="mb-0">{{ $leads->sum('total_leads') }}</h5>
                            <p class="mb-0">Leads</p>
                        </div>
                    </div>
                </div>
                <div class="col-4 col-md-4">
                    <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">
                        <a href="javascript:;"
                            class="wh-48 bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center">
                            <i class="material-icons-outlined">question_answer</i>
                        </a>
                        <div>
                            <h5 class="mb-0">{{ round($leads->sum('total_leads') * 0.15, 0) }}</h5>
                            <p class="mb-0">Qualificados</p>
                        </div>
                    </div>
                </div>
                <div class="col-4 col-md-4">
                    <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                        <a href="javascript:;"
                            class="wh-48 bg-info text-dark rounded-circle d-flex align-items-center justify-content-center">
                            <i class="material-icons-outlined">balance</i>
                        </a>
                        <div>
                            <h5 class="mb-0">
                                {{ $contratos }}
                                <small style="font-size: 12px">({{ $percentual }}%)</small>
                            </h5>
                            <p class="mb-0">Contratos</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ONTEM -->
<div class="product-count">

    @php
    $qualificados_ontem = round($leads_ontem->sum('total_leads') * 0.2, 0);
    $contratos_ontem = $leads_ontem->sum('total_gerados');
    $percentual_ontem = $qualificados_ontem > 0 ? round(($contratos_ontem / $qualificados_ontem) * 100, 0) : 0;
    @endphp

    <div class="card" style="margin-bottom: 10px">
        <div class="card-header text-white py-2 cursor-pointer">
            <div class="d-flex align-items-center">
                <div class="compose-mail-title">Ontem ({{ \Carbon\Carbon::now('America/Sao_Paulo')->subDay(1)->format('d/m/Y') }}) - {{ $percentual_ontem }}% de conversão</div>
            </div>
        </div>
        <div class="card-body">
            <div class="row g-3">
                <div class="col-4 col-md-4">
                    <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                        <a href="javascript:;"
                            class="wh-48 bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center">
                            <i class="material-icons-outlined">question_answer</i>
                        </a>
                        <div>
                            <h5 class="mb-0">{{ $leads_ontem->sum('total_leads') }}</h5>
                            <p class="mb-0">Leads</p>
                        </div>
                    </div>
                </div>
                <div class="col-4 col-md-4">
                    <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                        <a href="javascript:;"
                            class="wh-48 bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center">
                            <i class="material-icons-outlined">question_answer</i>
                        </a>
                        <div>
                            <h5 class="mb-0">{{ round($leads_ontem->sum('total_leads') * 0.2, 0) }}</h5>
                            <p class="mb-0">Qualificados</p>
                        </div>
                    </div>
                </div>
                <div class="col-4 col-md-4">
                    <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                        <a href="javascript:;"
                            class="wh-48 bg-info text-dark rounded-circle d-flex align-items-center justify-content-center">
                            <i class="material-icons-outlined">balance</i>
                        </a>
                        <div>
                            <h5 class="mb-0">{{ $leads_ontem->sum('total_gerados') }}
                                <small style="font-size: 12px">({{ $percentual_ontem }}%)</small>
                            </h5>
                            <p class="mb-0">Contratos</p>

                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>

<!-- 7 DIAS -->
<div class="product-count">

    @php
    $qualificados_7_dias = round($leads_7_dias->sum('total_leads') * 0.22, 0);
    $contratos_7_dias = $leads_7_dias->sum('total_gerados');
    $percentual_7_dias = $qualificados_7_dias > 0 ? round(($contratos_7_dias / $qualificados_7_dias) * 100, 0) : 0;
    @endphp

    <div class="card" style="margin-bottom: 10px">
        <div class="card-header text-white py-2 cursor-pointer">
            <div class="d-flex align-items-center">
                <div class="compose-mail-title">Últimos 7 dias - {{ $percentual_7_dias }}% de conversão</div>
            </div>
        </div>
        <div class="card-body">
            <div class="row g-3">
                <div class="col-4 col-md-4">
                    <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                        <a href="javascript:;"
                            class="wh-48 bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center">
                            <i class="material-icons-outlined">question_answer</i>
                        </a>
                        <div>
                            <h5 class="mb-0">{{ $leads_7_dias->sum('total_leads') }}</h5>
                            <p class="mb-0">Leads</p>
                        </div>
                    </div>
                </div>
                <div class="col-4 col-md-4">
                    <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                        <a href="javascript:;"
                            class="wh-48 bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center">
                            <i class="material-icons-outlined">question_answer</i>
                        </a>
                        <div>
                            <h5 class="mb-0">{{ round($leads_7_dias->sum('total_leads') * 0.22, 0) }}</h5>
                            <p class="mb-0">Qualificados</p>
                        </div>
                    </div>
                </div>
                <div class="col-4 col-md-4">
                    <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                        <a href="javascript:;"
                            class="wh-48 bg-info text-dark rounded-circle d-flex align-items-center justify-content-center">
                            <i class="material-icons-outlined">balance</i>
                        </a>
                        <div>
                            <h5 class="mb-0">{{ $leads_7_dias->sum('total_gerados') }}
                                <small style="font-size: 12px">({{ $percentual_7_dias }}%)</small>
                            </h5>
                            <p class="mb-0">Contratos</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>

<!-- Este mês -->
<div class="product-count">

    @php
    $qualificados_este_mes = round($leads_mes_atual->sum('total_leads') * 0.24, 0);
    $contratos_este_mes = $leads_mes_atual->sum('total_gerados');
    $percentual_este_mes = $qualificados_este_mes > 0 ? round(($contratos_este_mes / $qualificados_este_mes) * 100, 0) : 0;
    @endphp

    <div class="card" style="margin-bottom: 10px">
        <div class="card-header text-white py-2 cursor-pointer">
            <div class="d-flex align-items-center">
                <div class="compose-mail-title">Este mês - {{ $percentual_este_mes }}% de conversão</div>
            </div>
        </div>
        <div class="card-body">
            <div class="row g-3">
                <div class="col-4 col-md-4">
                    <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                        <a href="javascript:;"
                            class="wh-48 bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center">
                            <i class="material-icons-outlined">question_answer</i>
                        </a>
                        <div>
                            <h5 class="mb-0">{{ $leads_mes_atual->sum('total_leads') }}</h5>
                            <p class="mb-0">Leads</p>
                        </div>
                    </div>
                </div>
                <div class="col-4 col-md-4">
                    <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                        <a href="javascript:;"
                            class="wh-48 bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center">
                            <i class="material-icons-outlined">question_answer</i>
                        </a>
                        <div>
                            <h5 class="mb-0">{{ round($leads_mes_atual->sum('total_leads') * 0.24, 0) }}</h5>
                            <p class="mb-0">Qualificados</p>
                        </div>
                    </div>
                </div>
                <div class="col-4 col-md-4">
                    <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                        <a href="javascript:;"
                            class="wh-48 bg-info text-dark rounded-circle d-flex align-items-center justify-content-center">
                            <i class="material-icons-outlined">balance</i>
                        </a>
                        <div>
                            <h5 class="mb-0">{{ $leads_mes_atual->sum('total_gerados') }}
                                <small style="font-size: 12px">({{ $percentual_este_mes }}%)</small>
                            </h5>
                            <p class="mb-0">Contratos</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>

<!-- Mês anterior -->
<div class="product-count">
    <div class="card" style="margin-bottom: 10px">

        @php
        $qualificados_mes_anterior = round($leads_mes_passado->sum('total_leads') * 0.26, 0);
        $contratos_mes_anterior = $leads_mes_passado->sum('total_gerados');
        $percentual_mes_anterior = $qualificados_mes_anterior > 0 ? round(($contratos_mes_anterior / $qualificados_mes_anterior) * 100, 0) : 0;
        @endphp

        <div class="card-header text-white py-2 cursor-pointer">
            <div class="d-flex align-items-center">
                <div class="compose-mail-title">Mês anterior- {{ $percentual_mes_anterior }}% de conversão</div>
            </div>
        </div>
        <div class="card-body">
            <div class="row g-3">
                <div class="col-4 col-md-4">
                    <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                        <a href="javascript:;"
                            class="wh-48 bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center">
                            <i class="material-icons-outlined">question_answer</i>
                        </a>
                        <div>
                            <h5 class="mb-0">{{ $leads_mes_passado->sum('total_leads') }}</h5>
                            <p class="mb-0">Leads</p>
                        </div>
                    </div>
                </div>
                <div class="col-4 col-md-4">
                    <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                        <a href="javascript:;"
                            class="wh-48 bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center">
                            <i class="material-icons-outlined">question_answer</i>
                        </a>
                        <div>
                            <h5 class="mb-0">{{ round($leads_mes_passado->sum('total_leads') * 0.26, 0) }}</h5>
                            <p class="mb-0">Qualificados</p>
                        </div>
                    </div>
                </div>
                <div class="col-4 col-md-4">
                    <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                        <a href="javascript:;"
                            class="wh-48 bg-info text-dark rounded-circle d-flex align-items-center justify-content-center">
                            <i class="material-icons-outlined">balance</i>
                        </a>
                        <div>
                            <h5 class="mb-0">{{ $leads_mes_passado->sum('total_gerados') }}
                                <small style="font-size: 12px">({{ $percentual_mes_anterior }}%)</small>
                            </h5>
                            <p class="mb-0">Contratos</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>
@else
<div class="product-count">
    <div class="row g-3 p-3">
        <div class="col-6 col-md-3">
            <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                <a href="javascript:;"
                    class="wh-48 bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center">
                    <i class="material-icons-outlined">question_answer</i>
                </a>
                <div>
                    <h5 class="mb-0">{{ $leads->sum('total_leads') }}</h5>
                    <p class="mb-0">Leads</p>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                <a href="javascript:;"
                    class="wh-48 bg-info text-dark rounded-circle d-flex align-items-center justify-content-center">
                    <i class="material-icons-outlined">balance</i>
                </a>
                <div>
                    <h5 class="mb-0">{{ $leads->sum('total_gerados') }}</h5>
                    <p class="mb-0">Contratos</p>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                <a href="javascript:;"
                    class="wh-48 bg-success text-dark rounded-circle d-flex align-items-center justify-content-center">
                    <i class="material-icons-outlined">receipt_long</i>
                </a>
                <div>
                    <h5 class="mb-0">{{ $leads->sum('total_assinados') }}</h5>
                    <p class="mb-0">Assinados</p>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="d-flex flex-row gap-3 align-items-center justify-content-center border p-3 rounded-3">

                <a href="javascript:;"
                    class="wh-48 bg-grd-warning text-dark rounded-circle d-flex align-items-center justify-content-center">
                    <i class="material-icons-outlined">receipt_long</i>
                </a>
                <div>
                    <h5 class="mb-0">{{ $leads->sum('total_gerados') - $leads->sum('total_assinados') }}</h5>
                    <p class="mb-0">Em Curso</p>
                </div>
            </div>
        </div>
    </div>
</div>

@endif


@if(Auth::user()->role != 'admin')
<div class="row">
    <div class="col-xxl-8 d-flex align-items-stretch">
        <div class="card w-100 overflow-hidden rounded-4">
            <div class="card-body position-relative p-4">
                <div class="row">
                    <div class="col-12 col-sm-7">

                        @if(Auth::user()->hub == 'evo')

                        <div class="d-flex align-items-center gap-3 mb-5">
                            <img src="{{ $statusWhatsApp['profilePictureUrl'] || '' }}" class="rounded-circle bg-grd-info p-1"
                                width="100" height="100" alt="user">
                            <div class="">
                                @php
                                $statusConnect = ( $statusWhatsApp['profileStatus'] === 'open') ? '<p class="dash-lable mb-0 bg-success bg-opacity-10 text-success rounded-2">CONECTADO</p>'
                                : '<p class="dash-lable mb-0 bg-danger bg-opacity-10 text-danger rounded-2">DESCONECTADO</p>';

                                $profileName = ( $statusWhatsApp['profileStatus'] === 'open') ? '<h4 class="fw-semibold fs-4 mb-0">'.$statusWhatsApp['profileName'].'</h4>'
                                : '<a href="'.route('aiagents.qrcode').'" class="btn btn-success">Conectar WhatsApp</a>';
                                @endphp
                                {!! $statusConnect !!}
                                {!! $profileName !!}

                            </div>
                        </div>
                        @endif
                        <div class="col-md-12">
                            <div class="form-check form-switch form-check-success">
                                <label for="USING_AUDIO" class="form-label"> </label>
                                <div class="position-relative input-icon">
                                    <input class="form-check-input" type="checkbox" role="switch" id="data_mask" name="data_mask" {{ auth()->user()->data_mask ? 'checked' : '' }}>
                                    <label class="form-check-label" for="data_mask">
                                        Proteger Dados Sensíveis <i
                                            class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Ativa/Desativa a proteção de dados sensíveis. Quando ativo, os dados sensíveis serão mascarados.">contact_support</i>
                                    </label>
                                </div>
                                <div id="alert-container"></div>
                            </div>
                        </div>
                    </div>

                    <div class="col-12 col-sm-5">
                        <div class="welcome-back-img pt-4">
                            <img src="{{ URL::asset('build/images/gallery/4.png') }}" height="250" alt="">
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
                        @if ($client)
                        <h5 class="mb-0">{{ $client->used }} / {{ $client->limit }}</h5>
                        <p class="mb-0">Leads Atendidos</p>
                        @endif
                    </div>
                </div>
                <div class="chart-container2">
                    <div id="usedLeads"></div>
                </div>
                <div class="text-center">
                    @if ($client)
                    <!-- <p class="mb-0 font-12">{{ $client->last_used }} por JulIA no mês anterior </p> -->
                    @endif
                </div>
            </div>
        </div>
    </div>

    <div class="col-xl-6 col-xxl-2 d-flex align-items-stretch">
        <div class="card w-100 rounded-4">
            <div class="card-body">
                <div class="d-flex align-items-start justify-content-between mb-3">
                    <div class="">
                        <h5 class="mb-0">{{ $viewTotalCiclo?->total ? $viewTotalCiclo->total : 0 }}</h5>
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
                    <!--<p class="mb-0 font-12"><span class="text-success me-1">{{ $varTotalCicloMeses }}</span> envidos no último mês.</p>-->
                </div>
            </div>
        </div>
    </div>

    @if ($agent)
    @if (!$agent->status)
    <div class="col-xl-6 col-xxl-2 d-flex align-items-stretch">
        <div class="card w-100 rounded-4">
            <button type="button" class="btn btn-success" onclick="mostrarDiv()">Comece aqui sua configuração</button>
        </div>
    </div>
    @endif
    @endif

    <div class="oculto col-xl-12 col-xxl-12 d-flex align-items-stretch ">
        <div id="minhaDiv" class="oculto card w-100 rounded-4 text-center">
            <h3 style="margin: 15px 10px">Preencha o formulário</h3>
            <iframe class="clickup-embed clickup-dynamic-height" src="https://forms.clickup.com/9011225536/f/8chrry0-1651/SONCRGD58RJFR95G5B" onwheel="" width="100%" height="100%" style="background: transparent; border: 1px solid #ccc;"></iframe>
            <script async src="https://app-cdn.clickup.com/assets/js/forms-embed/v1.js"></script>
        </div>
    </div>
    <!--
        <div class="col-xl-6 col-xxl-2 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between mb-1">
                        <div class="">
                            <h5 class="mb-0">42.5K</h5>
                            <p class="mb-0">Active Users</p>
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
                        <div id="chart1"></div>
                    </div>
                    <div class="text-center">
                        <p class="mb-0 font-12">24K users increased from last month</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-6 col-xxl-2 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between mb-3">
                        <div class="">
                            <h5 class="mb-0">97.4K</h5>
                            <p class="mb-0">Total Users</p>
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
                        <div id="chart2"></div>
                    </div>
                    <div class="text-center">
                        <p class="mb-0 font-12"><span class="text-success me-1">12.5%</span> from last month</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-6 col-xxl-2 d-flex align-items-stretch">
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
    -->
</div>


<!-- -->
<div class="row">
    <div class="col-xxl-12 d-flex align-items-stretch">
        <div class="card w-100 overflow-hidden rounded-4">
            <div class="card-body position-relative p-4">
                <div class="row">
                    <div class="col-12 col-sm-5">
                        <div class="align-items-center pt-4">
                            <img src="{{ URL::asset('build/images/bg_julia.png') }}" alt="">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endif

<!--
<div id="support-floating" class="support-floating" style="display: none;">
    <div class="support-content">
        <p>Precisa de ajuda? Estamos aqui para você!</p>
        <button id="close-support">×</button>
    </div>
</div>
-->

@endsection
@push('script')

<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Tempo em milissegundos antes de mostrar (ex: 5000 = 5 segundos)
        const delay = 3000;

        setTimeout(function() {
            const supportElement = document.getElementById('support-floating');
            if (supportElement) {
                supportElement.style.display = 'block';
            }
        }, delay);

        // Fechar a mensagem quando o botão é clicado
        const closeButton = document.getElementById('close-support');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                const supportElement = document.getElementById('support-floating');
                if (supportElement) {
                    supportElement.style.display = 'none';
                }
            });
        }
    });
</script>

<script type="module">
    (function(d) {
        window.omniChatQueueId = 34;
        window.omniChatDomain = 'julia.atenderbem.com';
        var s = d.createElement('script');
        s.async = true;
        s.src = 'https://statics.atenderbem.com/js/wbchat.min.js';
        (d.head || d.body).appendChild(s);
    })(document);
</script>

<script>
    function mostrarDiv() {
        var div = document.getElementById("minhaDiv");
        div.style.display = "block";
    }
</script>

<!--plugins-->
<script src="{{ URL::asset('build/plugins/perfect-scrollbar/js/perfect-scrollbar.js') }}"></script>
<script src="{{ URL::asset('build/plugins/metismenu/metisMenu.min.js') }}"></script>
<script src="{{ URL::asset('build/plugins/apexchart/apexcharts.min.js') }}"></script>
<script src="{{ URL::asset('build/plugins/simplebar/js/simplebar.min.js') }}"></script>
<script src="{{ URL::asset('build/plugins/peity/jquery.peity.min.js') }}"></script>
<script>
    $(".data-attributes span").peity("donut")
</script>
<script src="{{ URL::asset('build/js/main.js') }}"></script>
<script src="{{ URL::asset('build/js/dashboard1.js') }}"></script>
<script>
    new PerfectScrollbar(".user-list")
</script>

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

        $('#btnAtivaCampanhas').click(function() {
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
            if ($(this).is(':checked')) {
                $('#MASTERCHAT_TRANSFER_QUEUEID').removeClass('d-none');
            } else {
                $('#MASTERCHAT_TRANSFER_QUEUEID').addClass('d-none');
            }
        });

        $('#ONLY_CAMPAIGN').change(function() {
            if ($(this).is(':checked')) {
                $('#ONLY_CAMPAIGN_CONFIG').removeClass('d-none');
            } else {
                $('#ONLY_CAMPAIGN_CONFIG').addClass('d-none');
            }
        });

        $('#NOTIFY_RESUME').change(function() {
            if ($(this).is(':checked')) {
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
        series: [{
            {
                number_format(($client - > used * 100) / $client - > limit, 1)
            }
        }],
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
            data: [150, 450, 380, 320]
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
                    formatter: function(e) {
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
</script>

<script>
    $(document).ready(function() {
        $('#data_mask').change(function() {
            var $checkbox = $(this);
            var originalState = $checkbox.prop('checked');

            // Add spinner to label
            var $label = $checkbox.next('label');
            var originalLabel = $label.html();
            $label.html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Salvando...');

            // Disable checkbox while saving
            $checkbox.prop('disabled', true);

            $.ajax({
                url: '{{ route("julia.update-data-mask") }}',
                type: 'POST',
                data: {
                    data_mask: this.checked,
                    _token: '{{ csrf_token() }}'
                },
                success: function(response) {
                    $('#alert-container').html(`
                        <div class="alert alert-success border-0 bg-success alert-dismissible fade show mt-3">
                            <div class="text-white">${response.message}</div>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    `);
                },
                error: function() {
                    // Revert checkbox state on error
                    $checkbox.prop('checked', originalState);
                    $('#alert-container').html(`
                        <div class="alert alert-danger border-0 bg-danger alert-dismissible fade show mt-3">
                            <div class="text-white">Erro ao salvar os dados</div>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    `);
                },
                complete: function() {
                    // Restore original label and enable checkbox
                    $label.html(originalLabel);
                    $checkbox.prop('disabled', false);
                }
            });
        });
    });
</script>

<script>
    $(function() {
        $('[data-bs-toggle="tooltip"]').tooltip();
    })
</script>
@endpush