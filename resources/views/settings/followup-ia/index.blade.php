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
<x-page-title title="SETTINGS" subtitle="Follow-up IA" />

<div class="container-fluid">
    <form id="followupForm">
        @csrf
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Configurações do Follow-up RAG</h3>
            </div>

            <div class="card-body">

                    <div class="row mb-3">
                        <div class="col-12 text-end">
                            <button type="button" class="btn btn-secondary" onclick="addFollowupRow()">
                                <i class="material-icons-outlined align-middle me-1">add_circle_outline</i>
                                Adicionar Follow-up
                            </button>
                        </div>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-4">
                            <div class="form-check form-switch form-check-success">
                                <input class="form-check-input" type="checkbox" role="switch" id="auto_message" name="auto_message"
                                    {{ $config?->auto_message ? 'checked' : '' }} onchange="toggleMessageFields(this)">
                                <label class="form-check-label" for="auto_message">
                                    Mensagens Follow-up (Parou de responder)
                                </label>
                                <span class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top"
                                    data-bs-original-title="A geração aumentada de recuperação (RAG) garante que o seu <span style='color: #FFFFFF'>Jul</span><span style='color: #caad09'>IA</span> possa acessar os fatos mais recentes e atualizados e as informações relevantes do cliente para gerar as mensagens do follow-up.">contact_support</span>
                            </div>
                        </div>

                        <div class="col-md-4">
                            <div class="form-group">
                                <label>Horário de Envio <span class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top"
                                    data-bs-original-title="Para evitar que a mensagem seja enviada fora do horário comercial, você pode definir um horário de início e fim para o envio das mensagens. Essa configuração será aplicada a todas as mensagens do follow-up maiores que 1h.">contact_support</span></label>
                                <div class="input-group">
                                    <select class="form-control" name="start_hours">
                                        @for($i = 0; $i <= 23; $i++)
                                            <option value="{{ $i }}" {{ $config?->start_hours == $i ? 'selected' : '' }}>
                                                {{ str_pad($i, 2, '0', STR_PAD_LEFT) }}:00
                                            </option>
                                        @endfor
                                    </select>
                                    <span class="input-group-text">até</span>
                                    <select class="form-control" name="end_hours">
                                        @for($i = 0; $i <= 23; $i++)
                                            <option value="{{ $i }}" {{ $config?->end_hours == $i ? 'selected' : '' }}>
                                                {{ str_pad($i, 2, '0', STR_PAD_LEFT) }}:00
                                            </option>
                                        @endfor
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group">
                                <label>Follow-up Infinito</label>
                                <div class="input-group">
                                    <select class="form-control" name="followup_from" id="followupFrom">
                                        <option value="">Selecione</option>
                                        @if($config && $config->title_cadence)
                                            @foreach($config->title_cadence as $key => $title)
                                                <option value="{{ $loop->index + 1 }}">{{ $title }}</option>
                                            @endforeach
                                        @endif
                                    </select>
                                    <span class="input-group-text">retorno para</span>
                                    <select class="form-control" name="followup_to" id="followupTo">
                                        <option value="">Selecione</option>
                                        @if($config && $config->title_cadence)
                                            @foreach($config->title_cadence as $key => $title)
                                                <option value="{{ $loop->index + 1 }}">{{ $title }}</option>
                                            @endforeach
                                        @endif
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="followupRows">
                        @if($config)
                            @foreach($config->step_cadence as $key => $value)
                                @include('settings.followup-ia.followup_row', [
                                    'index' => $loop->index,
                                    'title' => $config->title_cadence[$key] ?? '',
                                    'step' => $value,
                                    'message' => $config->msg_cadence[$key] ?? ''
                                ])
                            @endforeach
                        @else
                            @include('settings.followup-ia.followup_row', ['index' => 0])
                        @endif
                    </div>

                    <div class="row mt-3">

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
</div>
@endsection

@push('script')
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script>
        $(function() {
            $('[data-bs-toggle="tooltip"]').tooltip({
                html: true
            });

            // Event handlers
            $('#auto_message').on('change', function() {
                toggleMessageFields($(this));
            });

            $('#followupForm').on('submit', function(e) {
                e.preventDefault();
                handleFormSubmit($(this));
            });

            // Initial setup
            if ($('#auto_message').is(':checked')) {
                toggleMessageFields($('#auto_message'));
            }

            // Define os valores iniciais do banco
            const initialFrom = '{{ $config?->followup_from }}';
            const initialTo = '{{ $config?->followup_to }}';

            if (initialFrom) $('#followupFrom').val(initialFrom);
            if (initialTo) $('#followupTo').val(initialTo);

           // updateFollowupSelects();
        });

        function confirmDeleteFollowup(button) {
            Swal.fire({
                title: 'Confirmar exclusão',
                text: 'Deseja realmente excluir este follow-up?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sim, excluir',
                cancelButtonText: 'Cancelar',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    const $row = $(button).closest('.followup-row');
                    if ($('.followup-row').length > 1) {
                        $row.remove();
                        Swal.fire(
                            'Excluído!',
                            'O follow-up foi excluído com sucesso.',
                            'success'
                        );
                    } else {
                        Swal.fire(
                            'Atenção',
                            'É necessário manter pelo menos um registro de follow-up.',
                            'warning'
                        );
                    }
                }
            });
        }

        function updateMessageFields(isAutoMessage) {
            $('.followup-row').each(function() {
                const $msgContainer = $(this).find('[name="msg_cadence[]"]').closest('.form-group');

                if (isAutoMessage) {
                    $msgContainer.find('.auto-message-label').removeClass('d-none');
                    $msgContainer.find('.manual-message-label').addClass('d-none');
                } else {
                    $msgContainer.find('.auto-message-label').addClass('d-none');
                    $msgContainer.find('.manual-message-label').removeClass('d-none');
                }
            });
        }

        function toggleMessageFields($checkbox) {
            const isChecked = $checkbox.is(':checked');
            $('.msg-cadence-field').toggle(!isChecked);
            $('.julia-message').toggle(isChecked);
        }

        function addFollowupRow() {
            // Verifica se já atingiu o limite de 3 follow-ups
            if ($('.followup-row').length >= 20) {
                Swal.fire({
                    title: 'Limite atingido',
                    text: 'O máximo de follow-ups permitido é 20.',
                    icon: 'warning',
                    confirmButtonColor: '#6c757d'
                });
                return;
            }

            const $template = $('.followup-row').first().clone();
            $template.find('input:not([type="checkbox"]), textarea').val('');

            const autoMessage = $('#auto_message').is(':checked');
            const $msgField = $template.find('.msg-cadence-field');
            const $juliaMessage = $template.find('.julia-message');

            if (autoMessage) {
                $msgField.hide();
                $juliaMessage.show();
            } else {
                $msgField.show();
                $juliaMessage.hide();
            }

            $('#followupRows').append($template);
            //$('#followupRows').on('input', '[name="title_cadence[]"]', updateFollowupSelects);
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

            $('.card-body').prepend(alertHtml);
        }

        async function handleFormSubmit($form) {
            $('.alert').remove();

            let hasError = false;
            let errorMessage = '';

            // Validate titles
            $('[name="title_cadence[]"]').each(function() {
                if (!$(this).val().trim()) {
                    $(this).addClass('is-invalid');
                    hasError = true;
                    errorMessage = 'Por favor, preencha todos os títulos.';
                } else {
                    $(this).removeClass('is-invalid');
                }
            });

            // Validate intervals
            $('[name="step_value[]"]').each(function(index) {
                const value = parseInt($(this).val());
                const unit = $('[name="step_unit[]"]').eq(index).val();

                $(this).removeClass('is-invalid');

                if (!value || value <= 0) {
                    $(this).addClass('is-invalid');
                    hasError = true;
                    errorMessage = 'Por favor, preencha todos os intervalos mínimo de 1.';
                } else if (unit === 'minutes' && value < 5) {
                    $(this).addClass('is-invalid');
                    hasError = true;
                    errorMessage = 'O intervalo mínimo para minutos é de 5 minutos.';
                }
            });

            // Validate hours
            const startHours = parseInt($('[name="start_hours"]').val());
            const endHours = parseInt($('[name="end_hours"]').val());

            if (startHours >= endHours) {
                $('[name="start_hours"], [name="end_hours"]').addClass('is-invalid');
                hasError = true;
                errorMessage = 'A hora final deve ser maior que a hora inicial.';
            } else {
                $('[name="start_hours"], [name="end_hours"]').removeClass('is-invalid');
            }

            if (hasError) {
                showAlert('danger', errorMessage);
                return;
            }

            const $button = $('#saveButton');
            const $spinner = $button.find('.spinner-border');

            $button.prop('disabled', true);
            const buttonText = $button.find('.button-text');
            buttonText.text('Processando...');
            $spinner.removeClass('d-none');

            try {
                const formData = new FormData($form[0]);
                const response = await $.ajax({
                    url: '/settings/followup-ia',
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': formData.get('_token'),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    data: JSON.stringify({
                        auto_message: formData.get('auto_message') === 'on',
                        start_hours: formData.get('start_hours'),
                        end_hours: formData.get('end_hours'),
                        step_cadence: prepareStepCadence(formData),
                        title_cadence: prepareTitleCadence(formData),
                        msg_cadence: prepareMsgCadence(formData),
                        followup_from: formData.get('followup_from'),
                        followup_to: formData.get('followup_to')
                    })
                });
                updateFollowupSelects();
                showAlert('success', response.message);
            } catch (error) {
                showAlert('danger', error.responseJSON?.message || 'Erro ao salvar configurações.');
            } finally {
                $button.prop('disabled', false);
                buttonText.text('Salvar');
                $spinner.addClass('d-none');
            }
        }

        // Helper functions
        function prepareStepCadence(formData) {
            const stepValues = [...formData.getAll('step_value[]')];
            const stepUnits = [...formData.getAll('step_unit[]')];
            const stepCadence = {};
            stepValues.forEach((value, index) => {
                stepCadence[`cadence_${index + 1}`] = `${value} ${stepUnits[index]}`;
            });
            return stepCadence;
        }

        function prepareTitleCadence(formData) {
            const titles = [...formData.getAll('title_cadence[]')];
            const titleCadence = {};
            titles.forEach((value, index) => {
                titleCadence[`cadence_${index + 1}`] = value;
            });
            return titleCadence;
        }

        function prepareMsgCadence(formData) {
            const messages = [...formData.getAll('msg_cadence[]')];
            const msgCadence = {};
            messages.forEach((value, index) => {
                msgCadence[`cadence_${index + 1}`] = value;
            });
            return msgCadence;
        }

        function updateFollowupSelects() {
            const $fromSelect = $('#followupFrom');
            const $toSelect = $('#followupTo');
            const titles = [];

            // Guarda os valores selecionados atuais
            const selectedFrom = $fromSelect.val();
            const selectedTo = $toSelect.val();

            $('[name="title_cadence[]"]').each(function(index) {
                titles.push({
                    value: index,
                    text: $(this).val() || `Follow-up ${index + 1}`
                });
            });

            $fromSelect.empty();
            $toSelect.empty();

            // Adiciona a opção "Selecione..."
            $fromSelect.append(new Option('Selecione...', ''));
            $toSelect.append(new Option('Selecione...', ''));

            // Adiciona as opções e mantém a seleção
            titles.forEach(item => {
                const fromOption = new Option(item.text, parseInt(item.value+1), false, parseInt(item.value+1) === parseInt(selectedFrom));
                const toOption = new Option(item.text, parseInt(item.value+1), false, parseInt(item.value+1) === parseInt(selectedTo));

                $fromSelect.append(fromOption);
                $toSelect.append(toOption);
            });
        }
    </script>
@endpush
