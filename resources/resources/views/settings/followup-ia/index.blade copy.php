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
                                    Mensagens Follow-up RAG
                                </label>
                                <span class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true"
                                    data-bs-original-title="<span style='color: #FFFFFF'>A geração aumentada de recuperação (RAG) garante que a sua Jul<span style='color: #caad09 !important'>IA</span> possa acessar os fatos mais recentes e atualizados e as informações relevantes do cliente para gerar as mensagens do follow-up.</span>">contact_support</span>
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
                        Salvar
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
            $('[data-bs-toggle="tooltip"]').tooltip();
        })

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
                    const row = button.closest('.followup-row');
                    if (document.querySelectorAll('.followup-row').length > 1) {
                        row.remove();
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
            document.querySelectorAll('.followup-row').forEach(row => {
                const msgTextarea = row.querySelector('[name="msg_cadence[]"]');
                const msgContainer = msgTextarea.closest('.form-group');

                if (isAutoMessage) {
                    msgContainer.querySelector('.auto-message-label').classList.remove('d-none');
                    msgContainer.querySelector('.manual-message-label').classList.add('d-none');
                } else {
                    msgContainer.querySelector('.auto-message-label').classList.add('d-none');
                    msgContainer.querySelector('.manual-message-label').classList.remove('d-none');
                }
            });
        }

        document.getElementById('auto_message').addEventListener('change', function() {
            updateMessageFields(this.checked);
        });

        function toggleMessageFields(checkbox) {
            const msgFields = document.querySelectorAll('.msg-cadence-field');
            const juliaMessages = document.querySelectorAll('.julia-message');

            msgFields.forEach(field => {
                field.style.display = checkbox.checked ? 'none' : 'block';
            });

            juliaMessages.forEach(msg => {
                msg.style.display = checkbox.checked ? 'block' : 'none';
            });
        }

        function addFollowupRow() {
            const template = document.querySelector('.followup-row').cloneNode(true);
            template.querySelectorAll('input:not([type="checkbox"]), textarea').forEach(input => input.value = '');

            const autoMessage = document.getElementById('auto_message').checked;
            const msgField = template.querySelector('.msg-cadence-field');
            const juliaMessage = template.querySelector('.julia-message');

            if (autoMessage) {
                msgField.style.display = 'none';
                juliaMessage.style.display = 'block';
            } else {
                msgField.style.display = 'block';
                juliaMessage.style.display = 'none';
            }

            document.getElementById('followupRows').appendChild(template);
        }

        document.addEventListener('DOMContentLoaded', function() {
            const checkbox = document.getElementById('auto_message');
            if (checkbox.checked) {
                toggleMessageFields(checkbox);
            }
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

            // Inserir o alert no topo do card
            const cardBody = document.querySelector('.card-body');
            cardBody.insertAdjacentHTML('afterbegin', alertHtml);
        }

        document.getElementById('followupForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            // Remover alerts anteriores
            document.querySelectorAll('.alert').forEach(alert => alert.remove());

            // Validar campos obrigatórios
            let hasError = false;
            let errorMessage = '';

            // Validar títulos
            document.querySelectorAll('[name="title_cadence[]"]').forEach(input => {
                if (!input.value.trim()) {
                    input.classList.add('is-invalid');
                    hasError = true;
                    errorMessage = 'Por favor, preencha todos os títulos.';
                } else {
                    input.classList.remove('is-invalid');
                }
            });

            // Validar intervalos
            const stepValues = document.querySelectorAll('[name="step_value[]"]');
            const stepUnits = document.querySelectorAll('[name="step_unit[]"]');

            stepValues.forEach((input, index) => {
                const value = parseInt(input.value);
                const unit = stepUnits[index].value;

                input.classList.remove('is-invalid');

                if (!value || value <= 0) {
                    input.classList.add('is-invalid');
                    hasError = true;
                    errorMessage = 'Por favor, preencha todos os intervalos mínimo de 1.';
                } else if (unit === 'minutes' && value < 5) {
                    input.classList.add('is-invalid');
                    hasError = true;
                    errorMessage = 'O intervalo mínimo para minutos é de 5 minutos.';
                }
            });

            // Validar horários
            const startHours = parseInt(document.querySelector('[name="start_hours"]').value);
            const endHours = parseInt(document.querySelector('[name="end_hours"]').value);

            if (startHours >= endHours) {
                document.querySelector('[name="start_hours"]').classList.add('is-invalid');
                document.querySelector('[name="end_hours"]').classList.add('is-invalid');
                hasError = true;
                errorMessage = 'A hora final deve ser maior que a hora inicial.';
            } else {
                document.querySelector('[name="start_hours"]').classList.remove('is-invalid');
                document.querySelector('[name="end_hours"]').classList.remove('is-invalid');
            }

            if (hasError) {
                showAlert('danger', errorMessage);
                return;
            }

            const button = document.getElementById('saveButton');
            const spinner = button.querySelector('.spinner-border');

            button.disabled = true;
            spinner.classList.remove('d-none');

            try {
                const formData = new FormData(this);
                const response = await fetch('/settings/followup-ia', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': formData.get('_token'),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        auto_message: formData.get('auto_message') === 'on',
                        start_hours: formData.get('start_hours'),
                        end_hours: formData.get('end_hours'),
                        step_cadence: prepareStepCadence(formData),
                        title_cadence: prepareTitleCadence(formData),
                        msg_cadence: prepareMsgCadence(formData)
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    showAlert('success', data.message);
                } else {
                    throw new Error(data.message || 'Erro ao salvar configurações.');
                }
            } catch (error) {
                showAlert('danger', error.message);
            } finally {
                button.disabled = false;
                spinner.classList.add('d-none');
            }
        });

        // Funções auxiliares para preparar os dados
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


    </script>
@endpush
