@extends('layouts.app')
@section('title')
    FollowUP
@endsection
@push('css')
    <link rel="stylesheet" href="{{ URL::asset('build/css/extra-icons.css') }}">
    <style>
        .custom-card {
            position: relative;
            flex-grow: 1;
            min-height: 0;
        }

        /* Customização da barra de rolagem horizontal */
        ::-webkit-scrollbar {
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: #4178b8;
            border-radius: 0px;
        }

        ::-webkit-scrollbar-thumb {
            background: #0f1535;
            border-radius: 0px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #0f1535;
        }
    </style>
@endpush

@section('content')
<x-page-title title="FollowUP" subtitle="Veja seu Pipeline" />

@php
    $backgroundClasses = [
        '',
        'bg-primary',
        'bg-secondary',
        'bg-success',
        'bg-danger',
        'bg-info',
        'bg-grd-primary bg-gradient',
        'bg-grd-secondary bg-gradient',
        'bg-grd-success bg-gradient',

        'bg-grd-danger bg-gradient',
        'bg-grd-info bg-gradient'
    ];
@endphp

<div class="container-fluid">
    <div class="custom-card" style="display: flex !important;">
        <div class="row d-flex flex-nowrap">

            @if ($titleCadence)
                @foreach($titleCadence as $key => $value)
                    @php
                        $index = preg_replace('/[^0-9]/', '', $key);
                        $filteredArray = array_filter($followup, fn($item) => $item['step_number'] == $index);
                    @endphp
                    <!-- To Do Column -->
                    <div class="px-1" style="width: 340px;">
                        <div class="card">
                            <div class="card-header {{ $backgroundClasses[7] }} text-white">[{{ $index }}º] - {{ $value }} ({{ count($filteredArray) }})</div>
                            <div class="card-body">
                                <div class="kanban-list" id="{{ $key }}">

                                    @foreach($filteredArray as $valueClient)
                                        @if ($valueClient['step_number'] == $index)
                                            <div class="card shadow-none border">
                                                <div class="card-body py-0">
                                                    <p><small>Desde {{ \Carbon\Carbon::parse($valueClient['created_at'])->setTimezone('America/Sao_Paulo')->format('d/m/Y à\s H:i') }}</small></p>
                                                    <h5 class="card-title"><i class="lni lni-whatsapp"></i> {{ $valueClient['session_id'] }}</h5>
                                                    <p class="text-end"><small>Aguardando {{ diferenca_tempo($valueClient['send_date'], \Carbon\Carbon::now()->setTimezone('America/Sao_Paulo')) }}</small></p>
                                                </div>
                                            </div>
                                        @endif
                                    @endforeach
                                </div>
                            </div>
                        </div>
                    </div>
                @endforeach
            @endif
            <div class="px-1" style="width: 100px;">
            </div>
        </div>
    </div>
</div>

@endsection

@push('script')
    <script>
        // Reload page every 60 seconds (1 minute)
        setInterval(function() {
            location.reload();
        }, 60000);
    </script>
@endpush
