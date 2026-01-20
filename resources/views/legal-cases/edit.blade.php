@extends('layouts.app')
@section('title', 'Editar Caso Legal')

@section('content')
    <x-page-title title="Casos Legais" subtitle="Editar Caso" />

    <div class="card">
        <div class="card-body">
            <form action="{{ route('legal-cases.update', $legalCase) }}" method="POST">
                @csrf
                @method('PUT')
                @include('legal-cases._form')
            </form>
        </div>
    </div>
@endsection
