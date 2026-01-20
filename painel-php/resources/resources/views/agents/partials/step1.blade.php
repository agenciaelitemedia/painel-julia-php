<div id="step1" class="content" role="tabpanel">
    <h5 class="mb-1">Informações Básicas do Cliente</h5>
    <p class="mb-4">Preencha as informações básicas do cliente</p>

    <div class="row g-3">
        <div class="col-12 col-lg-2">
            <label for="cod_client" class="form-label">Código do Cliente</label>
            <input type="text" class="form-control" id="cod_client" name="cod_client">
            @error('cod_client')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-12 col-lg-4">
            <label for="name" class="form-label">Nome</label>
            <input type="text" class="form-control" id="name" name="name">
            @error('name')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-12 col-lg-6">
            <label for="business_name" class="form-label">Escritório</label>
            <input type="text" class="form-control" id="business_name" name="business_name">
            @error('business_name')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-12 col-lg-2">
            <label for="cpf_cnpj" class="form-label">CPF/CNPJ</label>
            <input type="text" class="form-control" id="cpf_cnpj" name="cpf_cnpj">
            @error('cpf_cnpj')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-12 col-lg-4">
            <label for="email" class="form-label">Email</label>
            <input type="email" class="form-control" id="email" name="email">
            @error('email')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-12 col-lg-2">
            <label for="plan" class="form-label">Plano Cliente</label>
            <select class="form-control" id="plan" name="plan">
                <option value="" selected>Selecione...</option>
                <option value="SDR Start">SDR Start</option>
                <option value="SDR Pro">SDR Pro</option>
                <option value="SDR Ultra">SDR Ultra</option>
                <option value="CLOSER Start">CLOSER Start</option>
                <option value="CLOSER Pro">CLOSER Pro</option>
                <option value="CLOSER Ultra">CLOSER Ultra</option>
            </select>
            @error('plan')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-12 col-lg-2">
            <label for="due_date" class="form-label">Dia Vencimento</label>
            <input type="number" class="form-control" id="due_date" name="due_date" min="1" max="31">
            @error('due_date')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-12 col-lg-2">
            <label for="limit" class="form-label">Limite Leads</label>
            <input type="number" class="form-control" id="limit" name="limit" min="0">
            @error('limit')<div class="invalid-feedback">{{ $message }}</div>@enderror
        </div>

        <div class="col-12 col-lg-2">
            <label class="form-label d-block">É Closer?</label>
            <div class="form-check form-switch form-check-success ">
                <input class="form-check-input" type="checkbox" id="is_closer" name="is_closer" value="1" >
                <label class="form-check-label" for="is_closer">
                    <span class="text-success active-text">Ativo</span>
                    <span class="text-danger inactive-text d-none">Inativo</span>
                </label>
            </div>
        </div>
        <div class="col-12 col-lg-2">
            <label class="form-label d-block">Status</label>
            <div class="form-check form-switch form-check-success ">
                <input class="form-check-input" type="checkbox" id="status" name="status" value="1" checked>
                <label class="form-check-label" for="status">
                    <span class="text-success active-text">Ativo</span>
                    <span class="text-danger inactive-text d-none">Inativo</span>
                </label>
            </div>
        </div>

        <div class="col-12">
            <button type="button" class="btn btn-grd-primary px-4 btn-next">Próximo<i class='bx bx-right-arrow-alt ms-2'></i></button>
        </div>
    </div>
</div>
