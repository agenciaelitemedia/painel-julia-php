@extends('layouts.app')
@section('title')
    Fullcalendar
@endsection
@push('css')
    <link href="{{ URL::asset('build/plugins/fullcalendar/css/main.min.css') }}" rel="stylesheet">
@endpush
@section('content')
    <x-page-title title="Apps" subtitle="Fullcalendar" />

    <div class="card">
        <div class="card-body">
            <div class="table-responsive">
                <div id='calendar'></div>
            </div>
        </div>
    </div>
@endsection
@push('script')
    <!--plugins-->
    <script src="{{ URL::asset('build/plugins/perfect-scrollbar/js/perfect-scrollbar.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/metismenu/metisMenu.min.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/fullcalendar/js/main.min.js') }}"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            var calendarEl = document.getElementById('calendar');
            var calendar = new FullCalendar.Calendar(calendarEl, {
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                },
                initialView: 'dayGridMonth',
                initialDate: '2020-09-12',
                navLinks: true, // can click day/week names to navigate views
                selectable: true,
                nowIndicator: true,
                dayMaxEvents: true, // allow "more" link when too many events
                editable: true,
                selectable: true,
                businessHours: true,
                dayMaxEvents: true, // allow "more" link when too many events
                events: [{
                    title: 'All Day Event',
                    start: '2020-09-01',
                }, {
                    title: 'Long Event',
                    start: '2020-09-07',
                    end: '2020-09-10'
                }, {
                    groupId: 999,
                    title: 'Repeating Event',
                    start: '2020-09-09T16:00:00'
                }, {
                    groupId: 999,
                    title: 'Repeating Event',
                    start: '2020-09-16T16:00:00'
                }, {
                    title: 'Conference',
                    start: '2020-09-11',
                    end: '2020-09-13'
                }, {
                    title: 'Meeting',
                    start: '2020-09-12T10:30:00',
                    end: '2020-09-12T12:30:00'
                }, {
                    title: 'Lunch',
                    start: '2020-09-12T12:00:00'
                }, {
                    title: 'Meeting',
                    start: '2020-09-12T14:30:00'
                }, {
                    title: 'Happy Hour',
                    start: '2020-09-12T17:30:00'
                }, {
                    title: 'Dinner',
                    start: '2020-09-12T20:00:00'
                }, {
                    title: 'Birthday Party',
                    start: '2020-09-13T07:00:00'
                }, {
                    title: 'Click for Google',
                    url: 'http://google.com/',
                    start: '2020-09-28'
                }]
            });
            calendar.render();
        });
    </script>
    <script src="{{ URL::asset('build/plugins/simplebar/js/simplebar.min.js') }}"></script>
    <script src="{{ URL::asset('build/js/main.js') }}"></script>
@endpush
