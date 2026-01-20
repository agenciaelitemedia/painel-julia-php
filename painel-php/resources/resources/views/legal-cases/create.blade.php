@extends('layouts.app')
@section('title', 'Novo Caso Legal')

@section('content')
    <x-page-title title="Casos Legais" subtitle="Novo Caso" />

    <div class="card">
        <div class="card-body">
            <form action="{{ route('legal-cases.store') }}" method="POST">
                @csrf
                @include('legal-cases._form')
            </form>
        </div>
    </div>
@endsection
