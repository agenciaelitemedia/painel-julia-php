<div class="row mb-3 followup-row">
    <div class="col-md-4">
        <div class="form-group">
            <label>Apelido do Follow-Up <span class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top"
                data-bs-original-title="Nome de referência para o follow-up. Útil para identificar o follow-up de forma mais fácil. ex.: 'Follow-up 1', 'Follow-up 2', 'Dias 1', 'Dias 2',  etc.">contact_support</span></label>
            <input type="text" class="form-control" name="title_cadence[]" value="{{ $title ?? '' }}">
        </div>
    </div>

    <div class="col-md-3">
        <div class="form-group">
            <label>Intervalo <span class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top"
                data-bs-original-title="Frequeência de envio do follow-up em relação ao último envio. ex.: 5 minutos, 1 hora, 2 dias, etc.">contact_support</span></label>
            <div class="input-group">
                <input type="number" class="form-control" name="step_value[]" value="{{ explode(' ', $step ?? '5 minutes')[0] }}">
                <select class="form-control" name="step_unit[]">
                    <option value="minutes" {{ isset($step) && strpos($step, 'minutes') !== false ? 'selected' : '' }}>Minutos</option>
                    <option value="hours" {{ isset($step) && strpos($step, 'hours') !== false ? 'selected' : '' }}>Horas</option>
                    <option value="days" {{ isset($step) && strpos($step, 'days') !== false ? 'selected' : '' }}>Dias</option>
                </select>
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="form-group">
            <label>Mensagem de Envio</label>
            <textarea class="form-control msg-cadence-field" name="msg_cadence[]" rows="1"
                {{ $config?->auto_message ? 'style=display:none' : '' }}>{{ $message ?? '' }}</textarea>
            <div class="julia-message" {{ !$config?->auto_message ? 'style=display:none' : '' }}>
                <span>Será gerada automaticamente pela <span style="color: #FFFFFF">Jul</span><span style="color: #caad09">IA</span> analisando o contexto da conversa.</span>
            </div>
        </div>
    </div>

    <div class="col-md-1 d-flex align-items-center">
        <button type="button" class="btn btn-link text-danger delete-row" onclick="confirmDeleteFollowup(this)">
            <i class="material-icons-outlined">delete_forever</i>
        </button>
    </div>
</div>
