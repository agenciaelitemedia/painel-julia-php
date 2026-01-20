@extends('layouts.app')
@section('title')
    Date/Time Picker
@endsection
@push('css')
    <link href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css" rel="stylesheet">
@endpush
@section('content')
    <x-page-title title="Form" subtitle="Date/Time Pickers" />

    <div class="row">
        <div class="col-xl-9 mx-auto">
            <h6 class="mb-0 text-uppercase">Date Time Pickers</h6>
            <hr>
            <div class="card">
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label">Pick a Date</label>
                        <input type="text" class="form-control datepicker">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Time Picker</label>
                        <input type="text" class="form-control time-picker">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Date & Time Picker</label>
                        <input type="text" class="form-control date-time">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Date Format</label>
                        <input type="text" class="form-control date-format">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Date Range</label>
                        <input type="text" class="form-control date-range">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Inline Calendar</label>
                        <input type="text" class="form-control date-inline">
                    </div>
                </div>
            </div>

        </div>
    </div>
    <!--end row-->
@endsection
@push('script')
    <!--plugins-->
    <script src="{{ URL::asset('build/plugins/perfect-scrollbar/js/perfect-scrollbar.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/metismenu/metisMenu.min.js') }}"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
    <script>
        $(".datepicker").flatpickr();

        $(".time-picker").flatpickr({
            enableTime: true,
            noCalendar: true,
            dateFormat: "Y-m-d H:i",
        });

        $(".date-time").flatpickr({
            enableTime: true,
            dateFormat: "Y-m-d H:i",
        });

        $(".date-format").flatpickr({
            altInput: true,
            altFormat: "F j, Y",
            dateFormat: "Y-m-d",
        });

        $(".date-range").flatpickr({
            mode: "range",
            altInput: true,
            altFormat: "F j, Y",
            dateFormat: "Y-m-d",
        });

        $(".date-inline").flatpickr({
            inline: true,
            altInput: true,
            altFormat: "F j, Y",
            dateFormat: "Y-m-d",
        });
    </script>
    <script src="{{ URL::asset('build/plugins/simplebar/js/simplebar.min.js') }}"></script>
    <script src="{{ URL::asset('build/js/main.js') }}"></script>
@endpush
