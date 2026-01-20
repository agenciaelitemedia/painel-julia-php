<div id="step2" class="content" role="tabpanel">
    <h5 class="mb-1">Configurações da IA</h5>
    <p class="mb-4">Configure os parâmetros da Inteligência Artificial</p>

    <div class="row g-3">
        <div class="col-12 col-lg-8">
            <label for="openia_apikey" class="form-label">APIKEY OpenIA</label>
            <div class="input-group">
                <input type="password" class="form-control" id="openia_apikey" name="openia_apikey" value="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">
                <button class="btn btn-outline-secondary toggle-password" type="button" data-target="#openia_apikey">
                    <i class='bx bx-hide'></i>
                </button>
            </div>
            @error('openia_apikey')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-12 col-lg-3">
            <label for="openia_model" class="form-label">Modelo OpenIA</label>
            <select class="form-control" id="openia_model" name="openia_model">
                <option value="" selected>Selecione...</option>
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="gpt-4o-mini-2024-07-18">gpt-4o-mini-2024-07-18</option>
                <option value="gpt-4o-2024-05-13">gpt-4o-2024-05-13</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4-turbo">gpt-4-turbo</option>
                <option value="gpt-3.5-turbo-0125">gpt-3.5-turbo-0125</option>
            </select>
            @error('openia_model')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-12 col-lg-8">
            <label for="audio_apikey" class="form-label">APIKEY OpenIAudio</label>
            <div class="input-group">
                <input type="password" class="form-control" id="audio_apikey" name="audio_apikey" value="Bearer 7feaf170-9692-11ef-90ff-d3445512321b">
                <button class="btn btn-outline-secondary toggle-password" type="button" data-target="#audio_apikey">
                    <i class='bx bx-hide'></i>
                </button>
            </div>
            @error('audio_apikey')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-12 col-lg-3">
            <label for="voice_id" class="form-label">Modelo de Voz</label>
            <select class="form-control" id="voice_id" name="voice_id">
                <option value="" selected>Selecione...</option>
                <option value="ai3-pt-BR-MatildeV2">ai3-pt-BR-MatildeV2</option>
                <option value="ai3-pt-BR-Giovanna">ai3-pt-BR-Giovanna</option>
                <option value="ai3-pt-BR-Leila" selected>ai3-pt-BR-Leila</option>
            </select>
            @error('voice_id')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>


        <div class="col-12">
            <div class="d-flex align-items-center gap-3">
                <button type="button" class="btn btn-grd-info px-4 btn-previous"><i class='bx bx-left-arrow-alt me-2'></i>Anterior</button>
                <button type="button" class="btn btn-grd-primary px-4 btn-next">Próximo<i class='bx bx-right-arrow-alt ms-2'></i></button>
            </div>
        </div>
    </div>
</div>
