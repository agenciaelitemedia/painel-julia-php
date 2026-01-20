@extends('layouts.app')
@section('title')
    Upload de Arquivo XLS
@endsection
@section('content')

<x-page-title title="Upload de Arquivo XLS" subtitle="Envie seu arquivo aqui" />

<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <form action="" method="POST" enctype="multipart/form-data">
                    @csrf
                    <div class="form-group">
                        <label for="xlsFile">Escolha um arquivo XLS:</label>
                        <input type="file" class="form-control" id="xlsFile" name="xlsFile" accept=".xls,.xlsx" required>
                    </div>
                    <button type="submit" class="btn btn-primary mt-3">Enviar</button>
                </form>
            </div>
        </div>
    </div>
</div>

@endsection
