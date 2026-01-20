<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-bs-theme="light-theme">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title') | Jul.IA - Integração MasterChat</title>
    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" href="{{ URL::asset('build/images/favicon-32x32.png') }}" type="image/png">

    @include('layouts.head-css')
    <style>
        .main-wrapper {
            margin-top: 70px;
            padding-bottom: 20px;
            margin-left: 0px;
            transition: ease-out .3s;
        }
        .top-header .navbar {
            background-color: #fff;
            height: 70px;
            position: fixed;
            left: 0px;
            right: 0;
            top: 0;
            padding: 0 1.5rem;
            z-index: 10;
            transition: ease-out .3s;
            box-shadow: 0 2px 6px #0000000b, 0 2px 6px #0000000c;
        }
    </style>
</head>

<body>

    @include('layouts.topbar-masterchat')

    <!--start main wrapper-->
    <main class="main-wrapper">
        <div class="main-content">
            @yield('content')
        </div>
    </main>

    <!--start overlay-->
    <div class="overlay btn-toggle"></div>
    <!--end overlay-->

    @include('layouts.common-scripts')
</body>

</html>
