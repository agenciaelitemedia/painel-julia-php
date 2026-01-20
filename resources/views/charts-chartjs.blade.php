@extends('layouts.app')
@section('title')
    Chart Js
@endsection
@section('content')
    <x-page-title title="Chart" subtitle="Chart Js" />

    <div class="row">
        <div class="col-12 col-xl-12">
            <div class="card rounded-4">
                <div class="card-header py-3">
                    <div class="d-flex align-items-center justify-content-between">
                        <h5 class="mb-0">Line Chart</h5>
                        <div class="dropdown">
                            <a href="javascript:;" class="dropdown-toggle-nocaret options dropdown-toggle"
                                data-bs-toggle="dropdown">
                                <span class="material-icons-outlined fs-5">more_vert</span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="javascript:;">Action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Another action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Something else here</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="chart-container1">
                        <canvas id="chart1"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-12 col-xl-12">
            <div class="card">
                <div class="card-header py-3">
                    <div class="d-flex align-items-center justify-content-between">
                        <h5 class="mb-0">Bar Chart</h5>
                        <div class="dropdown">
                            <a href="javascript:;" class="dropdown-toggle-nocaret options dropdown-toggle"
                                data-bs-toggle="dropdown">
                                <span class="material-icons-outlined fs-5">more_vert</span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="javascript:;">Action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Another action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Something else here</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="chart-container1">
                        <canvas id="chart2"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-12 col-xl-12">
            <div class="card">
                <div class="card-header py-3">
                    <div class="d-flex align-items-center justify-content-between">
                        <h5 class="mb-0">Pie Chart</h5>
                        <div class="dropdown">
                            <a href="javascript:;" class="dropdown-toggle-nocaret options dropdown-toggle"
                                data-bs-toggle="dropdown">
                                <span class="material-icons-outlined fs-5">more_vert</span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="javascript:;">Action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Another action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Something else here</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="chart-container1">
                        <canvas id="chart3"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-12 col-xl-12">
            <div class="card">
                <div class="card-header py-3">
                    <div class="d-flex align-items-center justify-content-between">
                        <h5 class="mb-0">Donut Chart</h5>
                        <div class="dropdown">
                            <a href="javascript:;" class="dropdown-toggle-nocaret options dropdown-toggle"
                                data-bs-toggle="dropdown">
                                <span class="material-icons-outlined fs-5">more_vert</span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="javascript:;">Action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Another action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Something else here</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="chart-container1">
                        <canvas id="chart4"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-12 col-xl-12">
            <div class="card">
                <div class="card-header py-3">
                    <div class="d-flex align-items-center justify-content-between">
                        <h5 class="mb-0">Radar Chart</h5>
                        <div class="dropdown">
                            <a href="javascript:;" class="dropdown-toggle-nocaret options dropdown-toggle"
                                data-bs-toggle="dropdown">
                                <span class="material-icons-outlined fs-5">more_vert</span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="javascript:;">Action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Another action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Something else here</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="chart-container1">
                        <canvas id="chart5"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-12 col-xl-12">
            <div class="card">
                <div class="card-header py-3">
                    <div class="d-flex align-items-center justify-content-between">
                        <h5 class="mb-0">Radar Donut Chart</h5>
                        <div class="dropdown">
                            <a href="javascript:;" class="dropdown-toggle-nocaret options dropdown-toggle"
                                data-bs-toggle="dropdown">
                                <span class="material-icons-outlined fs-5">more_vert</span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="javascript:;">Action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Another action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Something else here</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="chart-container1">
                        <canvas id="chart6"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-12 col-xl-12">
            <div class="card">
                <div class="card-header py-3">
                    <div class="d-flex align-items-center justify-content-between">
                        <h5 class="mb-0">Horizontal Bar Chart</h5>
                        <div class="dropdown">
                            <a href="javascript:;" class="dropdown-toggle-nocaret options dropdown-toggle"
                                data-bs-toggle="dropdown">
                                <span class="material-icons-outlined fs-5">more_vert</span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="javascript:;">Action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Another action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Something else here</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="chart-container1">
                        <canvas id="chart7"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-12 col-xl-12">
            <div class="card">
                <div class="card-header py-3">
                    <div class="d-flex align-items-center justify-content-between">
                        <h5 class="mb-0">Mixed Chart</h5>
                        <div class="dropdown">
                            <a href="javascript:;" class="dropdown-toggle-nocaret options dropdown-toggle"
                                data-bs-toggle="dropdown">
                                <span class="material-icons-outlined fs-5">more_vert</span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="javascript:;">Action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Another action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Something else here</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="chart-container1">
                        <canvas id="chart8"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-12 col-xl-12">
            <div class="card">
                <div class="card-header py-3">
                    <div class="d-flex align-items-center justify-content-between">
                        <h5 class="mb-0">Area Chart</h5>
                        <div class="dropdown">
                            <a href="javascript:;" class="dropdown-toggle-nocaret options dropdown-toggle"
                                data-bs-toggle="dropdown">
                                <span class="material-icons-outlined fs-5">more_vert</span>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="javascript:;">Action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Another action</a></li>
                                <li><a class="dropdown-item" href="javascript:;">Something else here</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="chart-container1">
                        <canvas id="chart9"></canvas>
                    </div>
                </div>
            </div>
        </div>

    </div><!--end row-->
    
@endsection
@push('script')
    <!--plugins-->
    <script src="{{ URL::asset('build/plugins/perfect-scrollbar/js/perfect-scrollbar.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/metismenu/metisMenu.min.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/chartjs/js/chart.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/chartjs/js/chartjs-custom.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/simplebar/js/simplebar.min.js') }}"></script>
    <script src="{{ URL::asset('build/js/main.js') }}"></script>
@endpush
