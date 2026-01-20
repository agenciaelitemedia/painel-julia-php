@extends('layouts.app')
@section('title')
Editar Agente
@endsection
@push('css')
<link href="{{ URL::asset('build/plugins/bs-stepper/css/bs-stepper.css') }}" rel="stylesheet">
@endpush

@section('content')
<x-page-title title="Agentes" subtitle="Editar" />


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



<div id="stepper2" class="bs-stepper">
    <div class="card">
        <div class="card-header">
            <div class="d-lg-flex flex-lg-row align-items-lg-center justify-content-lg-between" role="tablist">
                <div class="step" data-target="#step1">
                    <div class="step-trigger" role="tab" id="step1trigger">
                        <div class="bs-stepper-circle"><i class='material-icons-outlined'>account_circle</i></div>
                        <div class="">
                            <h5 class="mb-0 steper-title">Informações Básicas</h5>
                            <p class="mb-0 steper-sub-title">Dados do Cliente</p>
                        </div>
                    </div>
                </div>
                <div class="bs-stepper-line"></div>
                <div class="step" data-target="#step2">
                    <div class="step-trigger" role="tab" id="step2trigger">
                        <div class="bs-stepper-circle"><i class='material-icons-outlined'>settings</i></div>
                        <div class="">
                            <h5 class="mb-0 steper-title">Configurações IA</h5>
                            <p class="mb-0 steper-sub-title">Configurações OpenAI</p>
                        </div>
                    </div>
                </div>
                <div class="bs-stepper-line"></div>
                <div class="step" data-target="#step3">
                    <div class="step-trigger" role="tab" id="step3trigger">
                        <div class="bs-stepper-circle"><i class='material-icons-outlined'>memory</i></div>
                        <div class="">
                            <h5 class="mb-0 steper-title">Memória</h5>
                            <p class="mb-0 steper-sub-title">Configurações de Memória</p>
                        </div>
                    </div>
                </div>
                <div class="bs-stepper-line"></div>
                <div class="step" data-target="#step4">
                    <div class="step-trigger" role="tab" id="step4trigger">
                        <div class="bs-stepper-circle"><i class='material-icons-outlined'>notes</i></div>
                        <div class="">
                            <h5 class="mb-0 steper-title">Prompt</h5>
                            <p class="mb-0 steper-sub-title">Configurações de Prompt</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card-body">
            <form id="agentForm" action="{{ route('agents.update', $agent->id) }}" method="POST">
                @csrf
                @method('PUT')
                <div class="bs-stepper-content">
                    <!-- Step 1 -->
                    <div id="step1" class="content" role="tabpanel">
                        <h5 class="mb-1">Informações Básicas do Cliente</h5>
                        <p class="mb-4">Preencha as informações básicas do cliente</p>

                        <div class="row g-3">
                            <div class="col-12 col-lg-2">
                                <label for="cod_client" class="form-label">Código do Cliente</label>
                                <input type="text" class="form-control" id="cod_client" name="cod_client" value="{{ $agent->cod_agent }}" readonly>
                            </div>

                            <div class="col-12 col-lg-4">
                                <label for="name" class="form-label">Nome</label>
                                <input type="text" class="form-control @error('name') is-invalid @enderror"
                                    id="name" name="name" value="{{ old('name', $agent->client->name) }}">
                                @error('name')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-12 col-lg-6">
                                <label for="business_name" class="form-label">Escritório</label>
                                <input type="text" class="form-control @error('business_name') is-invalid @enderror"
                                    id="business_name" name="business_name" value="{{ old('business_name', $agent->client->business_name) }}">
                                @error('business_name')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-12 col-lg-2">
                                <label for="cpf_cnpj" class="form-label">CPF/CNPJ</label>
                                <input type="text" class="form-control @error('cpf_cnpj') is-invalid @enderror"
                                    id="cpf_cnpj" name="cpf_cnpj" value="{{ old('cpf_cnpj', $agent->client->federal_id) }}">
                                @error('cpf_cnpj')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-12 col-lg-4">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" class="form-control @error('email') is-invalid @enderror"
                                    id="email" name="email" value="{{ old('email', $agent->client->email) }}">
                                @error('email')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-12 col-lg-2">
                                <label for="plan" class="form-label">Plano Cliente</label>
                                <select class="form-control @error('plan') is-invalid @enderror" id="plan" name="plan">
                                    @php $plans = ['SDR Start', 'SDR Pro', 'SDR Ultra', 'CLOSER Start', 'CLOSER Pro', 'CLOSER Ultra']; @endphp
                                    <option value="">Selecione...</option>
                                    @foreach($plans as $planOption)
                                    <option value="{{ $planOption }}" {{ old('plan', $agent->usedAgent->plan) == $planOption ? 'selected' : '' }}>
                                        {{ $planOption }}
                                    </option>
                                    @endforeach
                                </select>
                                @error('plan')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-12 col-lg-2">
                                <label for="due_date" class="form-label">Dia Vencimento</label>
                                <input type="number" class="form-control @error('due_date') is-invalid @enderror"
                                    id="due_date" name="due_date" min="1" max="31"
                                    value="{{ old('due_date', $agent->usedAgent->due_date) }}">
                                @error('due_date')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-12 col-lg-2">
                                <label for="limit" class="form-label">Limite Leads</label>
                                <input type="number" class="form-control @error('limit') is-invalid @enderror"
                                    id="limit" name="limit" min="0"
                                    value="{{ old('limit', $agent->usedAgent->limit) }}">
                                @error('limit')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-12 col-lg-2">
                                <label class="form-label d-block">É Closer?</label>
                                <div class="form-check form-switch form-check-success">
                                    <input class="form-check-input" type="checkbox" id="is_closer" name="is_closer"
                                        value="1" {{ old('is_closer', $agent->is_closer) ? 'checked' : '' }}>
                                    <label class="form-check-label" for="status">
                                        <span class="text-success active-text">Ativo</span>
                                        <span class="text-danger inactive-text d-none">Inativo</span>
                                    </label>
                                </div>
                            </div>

                            <div class="col-12 col-lg-4">
                                <label class="form-label d-block">Status</label>
                                <div class="form-check form-switch form-check-success">
                                    <input class="form-check-input" type="checkbox" id="status" name="status"
                                        value="1" {{ old('status', $agent->status) ? 'checked' : '' }}>
                                    <label class="form-check-label" for="status">
                                        <span class="text-success active-text">Ativo</span>
                                        <span class="text-danger inactive-text d-none">Inativo</span>
                                    </label>
                                </div>
                            </div>

                            <div class="col-12 col-lg-6">
                                <label for="phone" class="form-label">Whatsapp</label>
                                <input type="phone" class="form-control @error('phone') is-invalid @enderror"
                                    id="phone" name="phone" value="{{ old('phone', $agent->client->phone) }}">
                                @error('phone')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-12">
                                <button type="button" class="btn btn-grd-primary px-4 btn-next">
                                    Próximo<i class='bx bx-right-arrow-alt ms-2'></i>
                                </button>
                                <button type="submit" class="btn btn-grd-success px-4">Salvar</button>
                            </div>
                        </div>
                    </div>

                    <!-- Step 2 -->
                    <div id="step2" class="content" role="tabpanel">
                        <h5 class="mb-1">Configurações da IA</h5>
                        <p class="mb-4">Configure os parâmetros da Inteligência Artificial</p>

                        <div class="row g-3">
                            <div class="col-12 col-lg-8">
                                <label for="openia_apikey" class="form-label">APIKEY OpenIA</label>
                                <div class="input-group">
                                    <input type="password" class="form-control @error('openia_apikey') is-invalid @enderror"
                                        id="openia_apikey" name="openia_apikey"
                                        value="{{ old('openia_apikey', $agent->openia_apikey) }}">
                                    <button class="btn btn-outline-secondary toggle-password" type="button" data-target="#openia_apikey">
                                        <i class='bx bx-hide'></i>
                                    </button>
                                </div>
                                @error('openia_apikey')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-12 col-lg-4">
                                <label for="openia_model" class="form-label">Modelo OpenIA</label>
                                <select class="form-control @error('openia_model') is-invalid @enderror"
                                    id="openia_model" name="openia_model">
                                    @php
                                    $models = [
                                    'gpt-4.1-mini',
                                    'gpt-4o-mini',
                                    'gpt-4o-mini-2024-07-18',
                                    'gpt-4o-2024-05-13',
                                    'gpt-4o',
                                    'gpt-4-turbo',
                                    'gpt-3.5-turbo-0125'
                                    ];
                                    @endphp
                                    <option value="">Selecione...</option>
                                    @foreach($models as $model)
                                    <option value="{{ $model }}" {{ old('openia_model', $agent->openia_model) == $model ? 'selected' : '' }}>
                                        {{ $model }}
                                    </option>
                                    @endforeach
                                </select>
                                @error('openia_model')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-12 col-lg-8">
                                <label for="audio_apikey" class="form-label">APIKEY OpenIAudio</label>
                                <div class="input-group">
                                    <input type="password" class="form-control @error('audio_apikey') is-invalid @enderror"
                                        id="audio_apikey" name="audio_apikey"
                                        value="{{ old('audio_apikey', $agent->audio_apikey) }}">
                                    <button class="btn btn-outline-secondary toggle-password" type="button" data-target="#audio_apikey">
                                        <i class='bx bx-hide'></i>
                                    </button>
                                </div>
                                @error('audio_apikey')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-12 col-lg-4">
                                <label for="voice_id" class="form-label">Modelo de Voz</label>
                                <select class="form-control @error('voice_id') is-invalid @enderror"
                                    id="voice_id" name="voice_id">
                                    @php
                                    $voices = [
                                    'ai3-pt-BR-MatildeV2',
                                    'ai3-pt-BR-Giovanna',
                                    'ai3-pt-BR-Leila',
                                    'ai1-pt-BR-Bruno',
                                    'ai3-pt-BR-Humberto',
                                    'fkYww4kK7WQsqcFFbv8U'
                                    ];
                                    @endphp
                                    <option value="">Selecione...</option>
                                    @foreach($voices as $voice)
                                    <option value="{{ $voice }}" {{ old('voice_id', $agent->voice_id) == $voice ? 'selected' : '' }}>
                                        {{ $voice }}
                                    </option>
                                    @endforeach
                                </select>
                                @error('voice_id')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-12">
                                <div class="d-flex align-items-center gap-3">
                                    <button type="button" class="btn btn-grd-info px-4 btn-previous">
                                        <i class='bx bx-left-arrow-alt me-2'></i>Anterior
                                    </button>
                                    <button type="button" class="btn btn-grd-primary px-4 btn-next">
                                        Próximo<i class='bx bx-right-arrow-alt ms-2'></i>
                                    </button>
                                    <button type="submit" class="btn btn-grd-success px-4">Salvar</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Step 3 -->
                    <div id="step3" class="content" role="tabpanel">
                        <h5 class="mb-1">Configurações de Memória</h5>
                        <p class="mb-4">Configure os parâmetros de memória do agente</p>

                        <div class="row g-3">
                            <div class="col-md-3">
                                <label for="override_databasename" class="form-label">Grupo de Memória</label>
                                <select class="form-control @error('override_databasename') is-invalid @enderror"
                                    id="override_databasename" name="override_databasename">
                                    @php
                                    $databases = [
                                    'mem_aiagents_0000',
                                    'mem_aiagents_9000',
                                    'mem_aiagents_8000'
                                    ];
                                    @endphp
                                    <option value="">Selecione...</option>
                                    @foreach($databases as $db)
                                    <option value="{{ $db }}" {{ old('override_databasename', $agent->overrideSetting->override_databasename) == $db ? 'selected' : '' }}>
                                        {{ $db }}
                                    </option>
                                    @endforeach
                                </select>
                                @error('override_databasename')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-md-3">
                                <label for="override_collectionname" class="form-label">Memoria Slot</label>
                                <input type="text" class="form-control @error('override_collectionname') is-invalid @enderror"
                                    id="override_collectionname" name="override_collectionname"
                                    value="{{ old('override_collectionname', $agent->overrideSetting->override_collectionname) }}">
                                @error('override_collectionname')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-md-3">
                                <label for="override_qdrantcollection" class="form-label">Base de Conhecimento</label>
                                <input type="text" class="form-control @error('override_qdrantcollection') is-invalid @enderror"
                                    id="override_qdrantcollection" name="override_qdrantcollection"
                                    value="{{ old('override_qdrantcollection', $agent->overrideSetting->override_qdrantcollection) }}">
                                @error('override_qdrantcollection')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-12">
                                <label for="settings" class="form-label">Parâmetros da Julia</label>
                                <textarea class="form-control @error('settings') is-invalid @enderror"
                                    id="settings" name="settings" rows="15">{{ old('settings', json_encode($agent->settings, JSON_PRETTY_PRINT)) }}</textarea>
                                <small class="text-muted">Total de Caracteres: <span id="settingCount">0</span></small>
                                @error('settings')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-12">
                                <div class="d-flex align-items-center gap-3">
                                    <button type="button" class="btn btn-grd-info px-4 btn-previous">
                                        <i class='bx bx-left-arrow-alt me-2'></i>Anterior
                                    </button>
                                    <button type="button" class="btn btn-grd-primary px-4 btn-next">
                                        Próximo<i class='bx bx-right-arrow-alt ms-2'></i>
                                    </button>
                                    <button type="submit" class="btn btn-grd-success px-4">Salvar</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Step 4 -->
                    <div id="step4" class="content" role="tabpanel">
                        <h5 class="mb-1">Configurações de Prompt</h5>
                        <p class="mb-4">Configure os prompts do agente</p>

                        <div class="row g-3">
                            <div class="col-md-12">
                                <label for="header_prompt" class="form-label">Prompt do topo da Julia</label>
                                <textarea class="form-control @error('header_prompt') is-invalid @enderror"
                                    id="header_prompt" name="header_prompt" rows="25">{{ old('header_prompt', $agent->overrideSetting->header_prompt) }}</textarea>
                                <small class="text-muted">Total de Caracteres: <span id="headerPromptCount">0</span></small>
                                @error('header_prompt')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-md-12">
                                <label for="custom_prompt" class="form-label">Prompt Customizado da Julia</label>
                                <textarea class="form-control @error('custom_prompt') is-invalid @enderror"
                                    id="custom_prompt" name="custom_prompt" rows="25">{{ old('custom_prompt', $agent->overrideSetting->custom_prompt) }}</textarea>
                                <small class="text-muted">Total de Caracteres: <span id="customPromptCount">0</span></small>
                                @error('custom_prompt')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-md-12">
                                <label for="prompt" class="form-label">Prompt da Julia</label>
                                <textarea class="form-control @error('prompt') is-invalid @enderror"
                                    id="prompt" name="prompt" rows="25">{{ old('prompt', $agent->overrideSetting->prompt) }}</textarea>
                                <small class="text-muted">Total de Caracteres: <span id="promptCount">0</span></small>
                                @error('prompt')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-12">
                                <div class="d-flex align-items-center gap-3">
                                    <button type="button" class="btn btn-grd-info px-4 btn-previous">
                                        <i class='bx bx-left-arrow-alt me-2'></i>Anterior
                                    </button>
                                    <button type="submit" class="btn btn-grd-success px-4">Salvar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@push('script')
<script src="{{ URL::asset('build/plugins/bs-stepper/js/bs-stepper.min.js') }}"></script>
<script src="{{ URL::asset('build/plugins/jquery/jquery.min.js') }}"></script>
<script>
    $(document).ready(function() {
        var stepper = new Stepper($('#stepper2')[0], {
            linear: false,
            animation: true
        });

        // Navegação entre steps
        $('.btn-next').click(function(e) {
            e.preventDefault();
            stepper.next();
        });

        $('.btn-previous').click(function(e) {
            e.preventDefault();
            stepper.previous();
        });

        // Contagem de caracteres
        function updateCharCount(element, countElement) {
            $(element).on('input', function() {
                $(countElement).text($(this).val().length);
            });
            // Atualiza contagem inicial
            $(countElement).text($(element).val().length);
        }

        updateCharCount('#settings', '#settingCount');
        updateCharCount('#header_prompt', '#headerPromptCount');
        updateCharCount('#custom_prompt', '#customPromptCount');
        updateCharCount('#prompt', '#promptCount');

        // Toggle password visibility
        $('.toggle-password').click(function() {
            const target = $($(this).data('target'));
            const type = target.attr('type') === 'password' ? 'text' : 'password';
            target.attr('type', type);
            $(this).find('i').toggleClass('bx-show bx-hide');
        });

        // Toggle status text
        $('#status').change(function() {
            const label = $(this).next('label');
            const activeText = label.find('.active-text');
            const inactiveText = label.find('.inactive-text');

            if ($(this).is(':checked')) {
                activeText.removeClass('d-none');
                inactiveText.addClass('d-none');
            } else {
                activeText.addClass('d-none');
                inactiveText.removeClass('d-none');
            }
        });

        $('#is_closer').change(function() {
            const label = $(this).next('label');
            const activeText = label.find('.active-text');
            const inactiveText = label.find('.inactive-text');

            if ($(this).is(':checked')) {
                activeText.removeClass('d-none');
                inactiveText.addClass('d-none');
            } else {
                activeText.addClass('d-none');
                inactiveText.removeClass('d-none');
            }
        });

        // Trigger initial status check
        $('#status').trigger('change');
        $('#is_closer').trigger('change');

        $('#plan').on('change', function() {
            var selectedPlan = $(this).val();
            var isCloser = selectedPlan.startsWith('CLOSER');

            $('#is_closer').prop('checked', isCloser);

            // Atualiza os textos de ativo/inativo
            if (isCloser) {
                $('#is_closer').closest('.form-check').find('.active-text').removeClass('d-none');
                $('#is_closer').closest('.form-check').find('.inactive-text').addClass('d-none');
            } else {
                $('#is_closer').closest('.form-check').find('.active-text').addClass('d-none');
                $('#is_closer').closest('.form-check').find('.inactive-text').removeClass('d-none');
            }
        });
    });
</script>
@endpush