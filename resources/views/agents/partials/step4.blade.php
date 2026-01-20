<div id="step4" class="content" role="tabpanel">
    <h5 class="mb-1">Configurações de Prompt</h5>
    <p class="mb-4">Configure os prompts do agente</p>

    <div class="row g-3">


        <div class="col-md-12">
            <label for="header_prompt" class="form-label">Prompt do topo da Julia</label>
            <textarea class="form-control" id="header_prompt" name="header_prompt" rows="25">---</textarea>
            <small class="text-muted">Total de Caracteres: <span id="messageCount">0</span></small>
            @error('header_prompt')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-md-12">
            <label for="custom_prompt" class="form-label">Prompt Customizado da Julia</label>
            <textarea class="form-control" id="custom_prompt" name="custom_prompt" rows="25">---</textarea>
            <small class="text-muted">Total de Caracteres: <span id="messageCount">0</span></small>
            @error('custom_prompt')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-md-12">
            <label for="prompt" class="form-label">Prompt da Julia</label>
            <textarea class="form-control" id="prompt" name="prompt" rows="25">---</textarea>
            <small class="text-muted">Total de Caracteres: <span id="messageCount">0</span></small>
            @error('prompt')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-12">
            <div class="d-flex align-items-center gap-3">
                <button type="button" class="btn btn-grd-info px-4 btn-previous"><i class='bx bx-left-arrow-alt me-2'></i>Anterior</button>
                <button type="submit" class="btn btn-grd-success px-4">Salvar</button>
            </div>
        </div>
    </div>
</div>
