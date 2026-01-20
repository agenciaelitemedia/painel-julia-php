@extends('layouts.app')
@section('title')
    Dashboard
@endsection

@push('css')
<style>
.tooltip-inner {
  background-color: #0c5466 !important;
  /*!important is not necessary if you place custom.css at the end of your css calls. For the purpose of this demo, it seems to be required in SO snippet*/
  color: #fff;
}

.tooltip.top .tooltip-arrow {
  border-top-color: #00acd6;
}

.tooltip.right .tooltip-arrow {
  border-right-color: #00acd6;
}

.tooltip.bottom .tooltip-arrow {
  border-bottom-color: #00acd6;
}

.tooltip.left .tooltip-arrow {
  border-left-color: #00acd6;
}
</style>

@endpush

@section('content')

    <x-page-title title="Dashboard" subtitle="Painel Principal [{{ $user->cod_agent }}]" />

    <div class="row">
        <div class="col-xxl-8 d-flex align-items-stretch">
            <div class="card w-100 overflow-hidden rounded-4">
                <div class="card-body position-relative p-4">
                    <div class="row">
                        <div class="col-12 col-sm-7">
                            <div class="d-flex align-items-center gap-3 mb-5">
                                <img src="{{ $statusWhatsApp['profilePictureUrl'] }}" class="rounded-circle bg-grd-info p-1"
                                    width="100" height="100" alt="user">
                                <div class="">
                                    @php
                                        $statusConnect = ( $statusWhatsApp['profileStatus'] === 'open') ? '<p class="dash-lable mb-0 bg-success bg-opacity-10 text-success rounded-2">CONECTADO</p>'
                                                                            : '<p class="dash-lable mb-0 bg-danger bg-opacity-10 text-danger rounded-2">DESCONECTADO</p>';

                                        $profileName =  ( $statusWhatsApp['profileStatus'] === 'open')  ? '<h4 class="fw-semibold fs-4 mb-0">'.$statusWhatsApp['profileName'].'</h4>'
                                                                            : '<a href="'.route('aiagents.qrcode').'" class="btn btn-success">Conectar WhatsApp</a>';
                                    @endphp
                                    {!! $statusConnect !!}
                                    {!! $profileName !!}

                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="form-check form-switch form-check-success">
                                    <label for="USING_AUDIO" class="form-label"> </label>
                                    <div class="position-relative input-icon">
                                        <input class="form-check-input" type="checkbox" role="switch" id="data_mask" name="data_mask" {{ auth()->user()->data_mask ? 'checked' : '' }}>
                                        <label class="form-check-label" for="data_mask">
                                            Proteger Dados Sensíveis <i
                                            class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Ativa/Desativa a proteção de dados sensíveis. Quando ativo, os dados sensíveis serão mascarados.">contact_support</i>
                                        </label>
                                    </div>
                                    <div id="alert-container"></div>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 col-sm-5">
                            <div class="welcome-back-img pt-4">
                                <img src="{{ URL::asset('build/images/gallery/4.png') }}" height="250" alt="">
                            </div>
                        </div>
                    </div><!--end row-->
                </div>
            </div>
        </div>

        <div class="col-xl-6 col-xxl-2 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between mb-1">
                        <div class="">
                            <h5 class="mb-0">{{ $client->used }} / {{ $client->limit }}</h5>
                            <p class="mb-0">Leads Atendidos</p>
                        </div>
                    </div>
                    <div class="chart-container2">
                        <div id="usedLeads"></div>
                    </div>
                    <div class="text-center">
                       <!-- <p class="mb-0 font-12">{{ $client->last_used }} por JulIA no mês anterior </p> -->
                    </div>
                </div>
            </div>
        </div>

        <div class="col-xl-6 col-xxl-2 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between mb-3">
                        <div class="">
                            <h5 class="mb-0">{{ $viewTotalCiclo?->total ? $viewTotalCiclo->total : 0 }}</h5>
                            <p class="mb-0">Mensagens Enviadas</p>
                        </div>
                    </div>
                    <div class="chart-container2">
                        <div id="messagesTotal"></div>
                    </div>
                    <div class="text-center">
                        @php
                            $varTotalCicloMeses = $viewTotalCicloMeses[2]['total'] ?? 0;
                        @endphp
                        <!--<p class="mb-0 font-12"><span class="text-success me-1">{{ $varTotalCicloMeses }}</span> envidos no último mês.</p>-->
                    </div>
                </div>
            </div>
        </div>
 <!--
        <div class="col-xl-6 col-xxl-2 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between mb-1">
                        <div class="">
                            <h5 class="mb-0">42.5K</h5>
                            <p class="mb-0">Active Users</p>
                        </div>
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
                    <div class="chart-container2">
                        <div id="chart1"></div>
                    </div>
                    <div class="text-center">
                        <p class="mb-0 font-12">24K users increased from last month</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-6 col-xxl-2 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between mb-3">
                        <div class="">
                            <h5 class="mb-0">97.4K</h5>
                            <p class="mb-0">Total Users</p>
                        </div>
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
                    <div class="chart-container2">
                        <div id="chart2"></div>
                    </div>
                    <div class="text-center">
                        <p class="mb-0 font-12"><span class="text-success me-1">12.5%</span> from last month</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-6 col-xxl-2 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between mb-1">
                        <div class="">
                            <h5 class="mb-0">82.7K</h5>
                            <p class="mb-0">Total Clicks</p>
                        </div>
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
                    <div class="chart-container2">
                        <div id="chart3"></div>
                    </div>
                    <div class="text-center">
                        <p class="mb-0 font-12"><span class="text-success me-1">12.5%</span> from last month</p>
                    </div>
                </div>
            </div>
        </div>
    -->
    </div>
    <div class="row">
        <div class="col-xxl-12 d-flex align-items-stretch">
            <div class="card w-100 overflow-hidden rounded-4">
                <div class="card-body position-relative p-4">
                    <div class="row">
                        <div class="col-12 col-sm-5">
                            <div class="align-items-center pt-4">
                                <img src="{{ URL::asset('build/images/bg_julia.png') }}"  alt="">
                            </div>
                        </div>
                    </div><!--end row-->
                </div>
            </div>
        </div>
    </div>



@endsection
@push('script')
    <!--plugins-->
    <script src="{{ URL::asset('build/plugins/perfect-scrollbar/js/perfect-scrollbar.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/metismenu/metisMenu.min.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/apexchart/apexcharts.min.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/simplebar/js/simplebar.min.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/peity/jquery.peity.min.js') }}"></script>
    <script>
        $(".data-attributes span").peity("donut")
    </script>
    <script src="{{ URL::asset('build/js/main.js') }}"></script>
    <script src="{{ URL::asset('build/js/dashboard1.js') }}"></script>
    <script>
        new PerfectScrollbar(".user-list")
    </script>

<script>
    /* Create Repeater */
    $("#repeater").createRepeater({
        showFirstItemToDefault: true,
    });
</script>
<script>
    $(".data-attributes span").peity("donut")
</script>

<script>
    $(document).ready(function() {

        $('#btnAtivaCampanhas').click(function(){
            var ativaCampanhasContent = $('#ATIVA_CAMPANHAS').val();
            $('#START_CAMPAIGN').val(ativaCampanhasContent);

            var $btn = $(this);
            $btn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...');
            $btn.prop('disabled', true);

            $('#frmUpdateSettings').submit();
        });

        $('#frmCampanhas').modal({
                backdrop: 'static',
                keyboard: false
        });

        $('#MASTERCHAT').change(function() {
            if($(this).is(':checked')) {
                $('#MASTERCHAT_TRANSFER_QUEUEID').removeClass('d-none');
            } else {
                $('#MASTERCHAT_TRANSFER_QUEUEID').addClass('d-none');
            }
        });

        $('#ONLY_CAMPAIGN').change(function() {
            if($(this).is(':checked')) {
                $('#ONLY_CAMPAIGN_CONFIG').removeClass('d-none');
            } else {
                $('#ONLY_CAMPAIGN_CONFIG').addClass('d-none');
            }
        });

        $('#NOTIFY_RESUME').change(function() {
            if($(this).is(':checked')) {
                $('#NOTIFY_RESUME_NUMERO').removeClass('d-none');
            } else {
                $('#NOTIFY_RESUME_NUMERO').addClass('d-none');
            }
        });
    });
</script>

<script src="{{ URL::asset('build/js/main.js') }}"></script>
<script src="{{ URL::asset('build/js/dashboard1.js') }}"></script>
<script>
    new PerfectScrollbar(".user-list")
</script>


<script>
    var options = {
        series: [{{ number_format(($client->used * 100) / $client->limit, 1) }}],
        chart: {
            height: 180,
            type: 'radialBar',
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            radialBar: {
                startAngle: -115,
                endAngle: 115,
                hollow: {
                    margin: 0,
                    size: '80%',
                    background: 'transparent',
                    image: undefined,
                    imageOffsetX: 0,
                    imageOffsetY: 0,
                    position: 'front',
                    dropShadow: {
                        enabled: false,
                        top: 3,
                        left: 0,
                        blur: 4,
                        opacity: 0.24
                    }
                },
                track: {
                    background: 'rgba(0, 0, 0, 0.1)',
                    strokeWidth: '67%',
                    margin: 0, // margin is in pixels
                    dropShadow: {
                        enabled: false,
                        top: -3,
                        left: 0,
                        blur: 4,
                        opacity: 0.35
                    }
                },

                dataLabels: {
                    show: true,
                    name: {
                        offsetY: -10,
                        show: false,
                        color: '#888',
                        fontSize: '17px'
                    },
                    value: {
                        offsetY: 10,
                        color: '#111',
                        fontSize: '24px',
                        show: true,
                    }
                }
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'horizontal',
                shadeIntensity: 0.5,
                gradientToColors: ['#ffd200'],
                inverseColors: true,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100]
            }
        },
        colors: ["#ee0979"],
        stroke: {
            lineCap: 'round'
        },
        labels: ['Total Orders'],
    };

    var chart = new ApexCharts(document.querySelector("#usedLeads"), options);
    chart.render();


    // chart 2

    var options = {
        series: [{
            name: "Net Sales",
            data: [150, 450, 380, 320]
        }],
        chart: {
            //width:150,
            height: 105,
            type: 'area',
            sparkline: {
                enabled: !0
            },
            zoom: {
                enabled: false
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            width: 3,
            curve: 'smooth'
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                gradientToColors: ['#0866ff'],
                shadeIntensity: 1,
                type: 'vertical',
                opacityFrom: 0.5,
                opacityTo: 0.0,
                //stops: [0, 100, 100, 100]
            },
        },

        colors: ["#02c27a"],
        tooltip: {
            theme: "dark",
            fixed: {
                enabled: !1
            },
            x: {
                show: !1
            },
            y: {
                title: {
                    formatter: function (e) {
                        return ""
                    }
                }
            },
            marker: {
                show: !1
            }
        },
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        }
    };

    var chart = new ApexCharts(document.querySelector("#messagesTotal"), options);
    chart.render();


</script>

<script>
    $(document).ready(function() {
        $('#data_mask').change(function() {
            var $checkbox = $(this);
            var originalState = $checkbox.prop('checked');

            // Add spinner to label
            var $label = $checkbox.next('label');
            var originalLabel = $label.html();
            $label.html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Salvando...');

            // Disable checkbox while saving
            $checkbox.prop('disabled', true);

            $.ajax({
                url: '{{ route("julia.update-data-mask") }}',
                type: 'POST',
                data: {
                    data_mask: this.checked,
                    _token: '{{ csrf_token() }}'
                },
                success: function(response) {
                    $('#alert-container').html(`
                        <div class="alert alert-success border-0 bg-success alert-dismissible fade show mt-3">
                            <div class="text-white">${response.message}</div>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    `);
                },
                error: function() {
                    // Revert checkbox state on error
                    $checkbox.prop('checked', originalState);
                    $('#alert-container').html(`
                        <div class="alert alert-danger border-0 bg-danger alert-dismissible fade show mt-3">
                            <div class="text-white">Erro ao salvar os dados</div>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    `);
                },
                complete: function() {
                    // Restore original label and enable checkbox
                    $label.html(originalLabel);
                    $checkbox.prop('disabled', false);
                }
            });
        });
    });
</script>

<script>
    $(function() {
        $('[data-bs-toggle="tooltip"]').tooltip();
    })
</script>
@endpush
