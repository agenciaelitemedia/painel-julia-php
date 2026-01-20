<div id="step3" class="content" role="tabpanel">
    <h5 class="mb-1">Configurações de Memória</h5>
    <p class="mb-4">Configure os parâmetros de memória do agente</p>

    <div class="row g-3">
        <div class="col-md-3">
            <label for="override_databasename" class="form-label">Grupo de Memória</label>
            <select class="form-control" id="override_databasename" name="override_databasename">
                <option value="" selected>Selecione...</option>
                <option value="mem_aiagents_0000" selected>mem_aiagents_0000</option>
                <option value="mem_aiagents_9000">mem_aiagents_9000</option>
                <option value="mem_aiagents_8000">mem_aiagents_8000</option>
            </select>
            @error('override_databasename')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-md-3">
            <label for="override_collectionname" class="form-label">Memoria Slot</label>
            <input type="text" class="form-control" id="override_collectionname" name="override_collectionname" value="">
            @error('override_collectionname')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-md-3">
            <label for="override_qdrantcollection" class="form-label">Base de Conhecimento</label>
            <input type="text" class="form-control" id="override_qdrantcollection" name="override_qdrantcollection" value="IA-SAAS-GLOBAL-v5">
            @error('override_qdrantcollection')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-12">
            <label for="settings"    hb6class="form-label">Parâmetros da Julia</label>
            <textarea class="form-control" id="settings" name="settings" rows="15">{}</textarea>
            <small class="text-muted">Total de Caracteres: <span id="settingCount">0</span></small>
            @error('settings')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

<!--
        <div class="col-md-12">
            <label for="override_systemmessage" class="form-label">Prompt da Julia</label>
            <textarea class="form-control" id="override_systemmessage" name="override_systemmessage" rows="25"></textarea>
            <small class="text-muted">Total de Caracteres: <span id="messageCount">0</span></small>
            @error('override_systemmessage')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>
    -->
        <div class="col-12">
            <div class="d-flex align-items-center gap-3">
                <button type="button" class="btn btn-grd-info px-4 btn-previous"><i class='bx bx-left-arrow-alt me-2'></i>Anterior</button>
                <button type="button" class="btn btn-grd-primary px-4 btn-next">Próximo<i class='bx bx-right-arrow-alt ms-2'></i></button>
            </div>
        </div>
    </div>
</div>
