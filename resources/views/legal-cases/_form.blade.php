<div class="row g-3">
    <div class="col-md-6">
        <label for="type" class="form-label">Tipo</label>
        <select name="type" id="type" class="form-select @error('type') is-invalid @enderror" required>
            <option value="">Selecione...</option>
            @foreach($types as $type)
                <option value="{{ $type }}" {{ (old('type', $legalCase->type ?? '') == $type) ? 'selected' : '' }}>
                    {{ $type }}
                </option>
            @endforeach
        </select>
        @error('type')
            <div class="invalid-feedback">{{ $message }}</div>
        @enderror
    </div>

    <div class="col-md-6">
        <label for="name" class="form-label">Nome</label>
        <input type="text" class="form-control @error('name') is-invalid @enderror"
               id="name" name="name" value="{{ old('name', $legalCase->name ?? '') }}" required>
        @error('name')
            <div class="invalid-feedback">{{ $message }}</div>
        @enderror
    </div>

    <div class="col-12">
        <label for="questions" class="form-label">Questões</label>
        <textarea class="form-control @error('questions') is-invalid @enderror"
                  id="questions" name="questions" rows="10" required>{{ old('questions', $legalCase->questions ?? '') }}</textarea>
        @error('questions')
            <div class="invalid-feedback">{{ $message }}</div>
        @enderror
    </div>

    <div class="col-12">
        <button type="submit" class="btn btn-primary">Salvar</button>
        <a href="{{ route('legal-cases.index') }}" class="btn btn-secondary">Cancelar</a>
    </div>
</div>
