<div class="d-flex align-items-center justify-content-between">
    <button id="menu-toggle-outside" class="d-md-none btn btn-sm" style="border: none; background: transparent;">
        <span class="material-icons-outlined">menu</span>
    </button>

    <div style="width: 100%; text-align: center;" class="d-md-none btn btn-sm">
        <img src="{{ URL::asset('build/images/logo_julia.png') }}" class="logo" alt="" height="30">
    </div>
</div>

<!-- Sidebar -->
<aside class="sidebar-wrapper" data-simplebar="true" id="sidebar">
    <div class="sidebar-header d-flex align-items-center justify-content-between px-3">
        <div class="logo d-flex align-items-center gap-2">
            <img src="{{ URL::asset('build/images/logo_julia.png') }}" class="logo" alt="" height="70">

            <!-- Botão de fechar (visível quando menu está aberto no mobile) -->
            <button id="menu-toggle-inside" class="d-md-none btn btn-sm" style="display:none; border: none; background: transparent;">
                <span class="material-icons-outlined">close</span>
            </button>
        </div>
    </div>

    <div class="sidebar-nav">
        <ul class="metismenu" id="sidenav">

            <li>
                <a href="{{ url('/') }}">
                    <div class="parent-icon"><i class="material-icons-outlined">widgets</i></div>
                    <div class="menu-title">Dashboard</div>
                </a>
            </li>

            <li class="menu-label">MARKETING</li>
            @if(Auth::user()->role == 'admin')
            <li>
                <a class="has-arrow" href="javascript:;">
                    <div class="parent-icon"><i class="material-icons-outlined">image</i></div>
                    <div class="menu-title">Criativos</div>
                </a>
                <ul>
                    <li><a href="{{ route('criativos.create') }}"><i class="material-icons-outlined">arrow_right</i>Cadastro</a></li>
                    <li><a href="{{ route('categorias.criativos.index') }}"><i class="material-icons-outlined">arrow_right</i>Categorias</a></li>
                </ul>
            </li>
            @elseif(Auth::user()->role == 'user')
            <li>
                <a href="{{ route('criativos.index') }}">
                    <div class="parent-icon"><i class="material-icons-outlined">image</i></div>
                    <div class="menu-title">Criativos</div>
                </a>
            </li>
            @endif
             <!--
            <li class="menu-label">ATENDIMENTOS</li>
           
            <a href="{{ route('aiagents.followup') }}">
                <div class="parent-icon"><i class="material-icons-outlined">speaker_notes</i></div>
                <div class="menu-title">Parou de responder</div>
            </a>
          
-->
            
            <!--
            <a href="{{ route('leads.campaign') }}">
                <div class="parent-icon"><i class="material-icons-outlined">speaker_notes</i></div>
                <div class="menu-title">Leads/Campanhas</div>
            </a>
            -->

            <!---->
            <li>
                <a href="{{ route('crm') }}">
                    <div class="parent-icon"><i class="material-icons-outlined">group</i></div>
                    <div class="menu-title">CRM</div>
                </a>
            </li>

            <!--
       <li>
                <a href="{{ route('crm') }}">
                    <div class="parent-icon"><i class="material-icons-outlined">group</i></div>
                    <div class="menu-title">CRM</div>
                </a>
            </li>
-->

            </li>
            <!--
            <li>
                <a>
                    <div class="parent-icon" style="color:rgb(64, 65, 65)"><i class="material-icons-outlined">connect_without_contact</i></div>
                    <div class="menu-title" style="color:rgb(64, 65, 65)">Leads <small>(em breve)</small></div>
                </a>
            </li>
            <li>
            <li>
                <a>
                    <div class="parent-icon" style="color:rgb(64, 65, 65)"><i class="material-icons-outlined">speaker_notes</i></div>
                    <div class="menu-title" style="color:rgb(64, 65, 65)">Casos <small>(em breve)</small></div>
                </a>
            </li>
            -->

            <li class="menu-label">SEU AGENTE</li>
            @if(Auth::user()->role == 'user' || Auth::user()->role == 'admin')
            <li>
                <a href="{{ route('settings.followup-ia.index') }}">
                    <div class="parent-icon"><i class="material-icons-outlined">view_carousel</i></div>
                    <div class="menu-title">FollowUP</div>
                </a>
            </li>
            <li>
                <a href="{{ route('personalizacao.index') }}">
                    <div class="parent-icon"><i class="material-icons-outlined">edit</i></div>
                    <div class="menu-title">Personalização</div>
                </a>
            </li>
            <li>
                <a href="{{ route('arquivos.index') }}">
                    <div class="parent-icon"><i class="material-icons-outlined">description</i></div>
                    <div class="menu-title">Arquivos</div>
                </a>
            </li>
            @endif

            @if(Auth::user()->role == 'user' || Auth::user()->role == 'gestor' || Auth::user()->role == 'admin')
            <li class="menu-label">ESTRATÉGICO</li>
            <li>
                <a href="{{ route('leads.contracts') }}">
                    <div class="parent-icon"><i class="material-icons-outlined">balance</i></div>
                    <div class="menu-title">Desempenho da <span style="color: #FFFFFF">Jul</span><span style="color: #caad09">IA</span></div>
                </a>
            </li>
            @endif
            @if(Auth::user()->role == 'user' || Auth::user()->role == 'admin')
            <li>
                <a href="{{ route('leads.my-contracts') }}">
                    <div class="parent-icon"><i class="material-icons-outlined">receipt_long</i></div>
                    <div class="menu-title">Contratos da <span style="color: #FFFFFF">Jul</span><span style="color: #caad09">IA</span></div>
                </a>
            </li>
            <!--
            <li>
                <a class="has-arrow" href="javascript:;">
                    <div class="parent-icon"><i class="material-icons-outlined">campaign</i></div>
                    <div class="menu-title"><span style="color: #FFFFFF">Jul</span><span style="color: #caad09">IA</span> nas Campanhas</div>
                </a>
                <ul>
                    <li><a href="{{ route('leads.campaign') }}"><i class="material-icons-outlined">arrow_right</i>Leads/Campanhas</a></li>
                    <li><a href="{{ route('leads.source-stats') }}"><i class="material-icons-outlined">arrow_right</i>Análise de Campanhas</a></li>
                </ul>
            </li>
            -->
            @endif

            @if(Auth::user()->role == 'admin')
            <li class="menu-label">ADMINISTRATIVO</li>
            <li>
                <a class="has-arrow" href="javascript:;">
                    <div class="parent-icon"><i class="material-icons-outlined">smart_toy</i></div>
                    <div class="menu-title">Agentes <span style="color: #FFFFFF">Jul</span><span style="color: #caad09">IA</span></div>
                </a>
                <ul>
                    <li><a href="{{ route('agents.index') }}"><i class="material-icons-outlined">arrow_right</i>Lista de Agentes</a></li>
                    <li><a href="{{ route('agents.create') }}"><i class="material-icons-outlined">arrow_right</i>Novo Agente</a></li>
                </ul>
            </li>
            <li>
                <a href="{{ route('produtos.index') }}">
                    <div class="parent-icon"><i class="material-icons-outlined">inventory_2</i></div>
                    <div class="menu-title">Produtos</div>
                </a>
            </li>
            <li>
                <a href="{{ route('personalizacao.list') }}">
                    <div class="parent-icon"><i class="material-icons-outlined">groups</i></div>
                    <div class="menu-title">Personalizações</div>
                </a>
            </li>
            <li>
                <a href="{{ route('arquivos.list') }}">
                    <div class="parent-icon"><i class="material-icons-outlined">description</i></div>
                    <div class="menu-title">Arquivos clientes</div>
                </a>
            </li>
            @endif

            <li class="menu-label">Profile</li>
            <li>
                <p class="user-name mb-0 fw-bold">{{ Auth::user()->name }}</p>
            </li>
            <li>
                <a class="dropdown-item d-flex align-items-center gap-2 py-2" href="javascript:void(0);" onclick="document.getElementById('logout-form').submit()">
                    <i class="material-icons-outlined">power_settings_new</i>Sair
                </a>
                <form action="{{ route('logout') }}" method="POST" id="logout-form">@csrf</form>
            </li>
        </ul>
    </div>
</aside>

<!-- Scripts -->
<script>
    document.addEventListener("DOMContentLoaded", function() {
        const sidebar = document.getElementById("sidebar");
        const toggleOutside = document.getElementById("menu-toggle-outside");
        const toggleInside = document.getElementById("menu-toggle-inside");

        function openSidebar() {
            sidebar.classList.add("active");
            toggleOutside.style.display = "none";
            toggleInside.style.display = "inline-block";
        }

        function closeSidebar() {
            sidebar.classList.remove("active");
            toggleOutside.style.display = "inline-block";
            toggleInside.style.display = "none";
        }

        toggleOutside.addEventListener("click", openSidebar);
        toggleInside.addEventListener("click", closeSidebar);
    });
</script>

<!-- CSS responsivo -->
<style>
    @media (max-width: 768px) {
        .sidebar-wrapper {
            position: fixed;
            top: 0;
            left: -260px;
            width: 260px;
            height: 100%;
            background: #fff;
            z-index: 999;
            transition: left 0.3s ease;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
        }

        .sidebar-wrapper.active {
            left: 0;
        }

        #menu-toggle-outside,
        #menu-toggle-inside {
            font-size: 1.8rem;
        }
    }
</style>