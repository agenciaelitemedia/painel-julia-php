@extends('layouts.app')
@section('title')
    Criar Agente
@endsection
@push('css')
    <link href="{{ URL::asset('build/plugins/bs-stepper/css/bs-stepper.css') }}" rel="stylesheet">
@endpush

@section('content')
    <x-page-title title="Agentes" subtitle="Criar Novo" />



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
                <form id="agentForm" action="{{ route('agents.store') }}" method="POST">
                    @csrf
                    <div class="bs-stepper-content">
                        @include('agents.partials.step1')
                        @include('agents.partials.step2')
                        @include('agents.partials.step3')
                        @include('agents.partials.step4')
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



            // Máscara para o campo OpenAI Key
            $('#openia_apikey').on('input', function() {
                var value = $(this).val();
                if (!value.startsWith('sk-')) {
                    $(this).val('sk-' + value);
                }
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

            // Contagem de caracteres para os campos de texto
            $('#setting, #override_systemmessage').on('input', function() {
                const id = $(this).attr('id');
                const count = $(this).val().length;

                if(id === 'setting') {
                    $('#settingCount').text(count);
                } else {
                    $('#messageCount').text(count);
                }
            });

            // Validação da API Key
            $('#openia_apikey').on('input', function() {
                let value = $(this).val();
                if (!value.startsWith('sk-')) {
                    value = 'sk-' + value.replace('sk-', '');
                }
                $(this).val(value);
            });

            // Validação do dia de vencimento
            $('#due_date').on('input', function() {
                let value = parseInt($(this).val());
                if (value < 1) $(this).val(1);
                if (value > 31) $(this).val(31);
            });

            // Validação do limite
            $('#limit').on('input', function() {
                let value = parseInt($(this).val());
                if (value < 0) $(this).val(0);
            });

            $('.toggle-password').on('click', function() {
                const input = $($(this).data('target'));
                const type = input.attr('type') === 'password' ? 'text' : 'password';
                input.attr('type', type);
                $(this).find('i').toggleClass('bx-show bx-hide');
            });

            // Função para atualizar o valor do override_qdrantcollection
            function updateQdrantCollection() {
                var codClient = $('#cod_client').val();
                if (codClient) {
                    $('#override_collectionname').val('v7-' + codClient);
                }
            }

            // Atualiza quando o cod_client mudar
            $('#cod_client').on('input', function() {
                updateQdrantCollection();
            });

            // Atualiza na carga inicial se já houver um valor
            updateQdrantCollection();

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
