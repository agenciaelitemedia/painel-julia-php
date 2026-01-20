@extends('layouts.app')
@section('title')
    Análise de Leads - {{ $escritorio }}
@endsection
@section('content')

<x-page-title title="Análise de Leads" subtitle="Visualização mensal de leads e conversões - {{ $escritorio }}" />

<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <canvas id="leadsChart" height="100"></canvas>
            </div>
        </div>
    </div>
</div>

<div class="row mt-4">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <canvas id="taxasChart" height="80"></canvas>
            </div>
        </div>
    </div>
</div>

<div class="row mt-4">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <canvas id="funnelChart" width="400" height="400"></canvas>
            </div>
        </div>
    </div>
</div>

@endsection

@push('script')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-funnel"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    const chartData = @json($chartData);
    const labels = Object.keys(chartData).map(date => {
        const [year, month] = date.split('-');
        return new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    });

    // Gráfico de Barras - Totais
    new Chart(document.getElementById('leadsChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total de Leads',
                    data: Object.values(chartData).map(item => item.total_leads),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Contratos Gerados',
                    data: Object.values(chartData).map(item => item.total_gerados),
                    backgroundColor: 'rgba(255, 206, 86, 0.5)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Contratos Assinados',
                    data: Object.values(chartData).map(item => item.total_assinados),
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Evolução de Leads e Contratos por Mês'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });

    // Gráfico de Linhas - Taxas
    new Chart(document.getElementById('taxasChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Taxa Leads → Gerados',
                    data: Object.values(chartData).map(item => item.taxa_leads_gerados),
                    borderColor: 'rgba(54, 162, 235, 1)',
                    tension: 0.1
                },
                {
                    label: 'Taxa Leads → Assinados',
                    data: Object.values(chartData).map(item => item.taxa_leads_assinados),
                    borderColor: 'rgba(255, 206, 86, 1)',
                    tension: 0.1
                },
                {
                    label: 'Taxa Gerados → Assinados',
                    data: Object.values(chartData).map(item => item.taxa_gerados_assinados),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Taxas de Conversão (%)'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });

    // Gráfico de Funil - Etapas
    var ctx = document.getElementById('funnelChart').getContext('2d');
    var funnelChart = new Chart(ctx, {
        type: 'funnel',
        data: {
            labels: ['Leads', 'Contratos Gerados', 'Contratos Assinados'],
            datasets: [{
                label: 'Quantidade',
                data: [
                    Object.values(chartData).reduce((sum, item) => sum + item.total_leads, 0),
                    Object.values(chartData).reduce((sum, item) => sum + item.total_gerados, 0),
                    Object.values(chartData).reduce((sum, item) => sum + item.total_assinados, 0)
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(75, 192, 192, 0.5)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Funil de Conversão'
                }
            }
        }
    });
});
</script>
@endpush
