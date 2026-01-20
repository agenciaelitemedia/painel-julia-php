   <!--start sidebar-->
   <aside class="sidebar-wrapper" data-simplebar="true">
       <div class="sidebar-header">
           <div class="logo">
               <img src="{{ URL::asset('build/images/logo_julia.png') }}" class="logo" alt="" height="70">
           </div>
           <div class="sidebar-close">
               <span class="material-icons-outlined">close</span>
           </div>
       </div>
       <div class="sidebar-nav">
           <!--navigation-->
           <ul class="metismenu" id="sidenav">

               <li>
                   <a href="{{ url('/') }}">
                       <div class="parent-icon"><i class="material-icons-outlined">widgets</i>
                       </div>
                       <div class="menu-title">Dashboard</div>
                   </a>
               </li>
               <li class="menu-label">MARKETING</li>
               @if(Auth::user()->role == 'admin')
               <li>
                   <a class="has-arrow" href="javascript:;">
                       <div class="parent-icon"><i class="material-icons-outlined">image</i>
                       </div>
                       <div class="menu-title">Criativos</div>
                   </a>
                   <ul>
                       <li> <a href="{{ route('criativos.create') }}"><i class="material-icons-outlined">arrow_right</i>Cadastro</a></li>
                       <li> <a href="{{ route('categorias.criativos.index') }}"><i class="material-icons-outlined">arrow_right</i>Categorias</a></li>
                   </ul>
               </li>
               @elseif(Auth::user()->role == 'user')
               <li>
                   <a href="{{ route('criativos.index') }}">
                       <div class="parent-icon"><i class="material-icons-outlined">image</i>
                       </div>
                       <div class="menu-title">Criativos</div>
                   </a>
               </li>
               @endif
               <li class="menu-label">ATENDIMENTOS</li>
               <li>
                   <a>
                       <div class="parent-icon" style="color:rgb(64, 65, 65)"><i class="material-icons-outlined">connect_without_contact</i>
                       </div>
                       <div class="menu-title" style="color:rgb(64, 65, 65)">Leads <small>(em breve)</small></div>
                   </a>
               </li>
               <li>
                   <a>
                       <div class="parent-icon" style="color:rgb(64, 65, 65)"><i class="material-icons-outlined">speaker_notes</i>
                       </div>
                       <div class="menu-title" style="color:rgb(64, 65, 65)">Casos <small>(em breve)</small></div>
                   </a>
               </li>
               <li class="menu-label">SEU AGENTE</li>
               @if(Auth::user()->role == 'user' || Auth::user()->role == 'admin')

               <!--       <li>
                <a href="{{ route('aiagents.personalize') }}">
                    <div class="parent-icon"><i class="material-icons-outlined">hub</i>
                    </div>
                    <div class="menu-title">Personalize</div>
                </a>
            </li> -->
               <li>
                   <a class="has-arrow" href="javascript:;">
                       <div class="parent-icon"><i class="material-icons-outlined">view_carousel</i>
                       </div>
                       <div class="menu-title">FollowUP</div>
                   </a>
                   <ul>
                       <li><a href="{{ route('settings.followup-ia.index') }}"><i class="material-icons-outlined">arrow_right</i>Configurações</a>
                       </li>
                       <li><a href="{{ route('aiagents.followup') }}"><i class="material-icons-outlined">arrow_right</i>Pipeline RAG</a>
                       </li>
                   </ul>
               </li>
               @if(Auth::user()->role == 'admin')
               <li>
                   <a href="{{ route('personalizacao.index') }}">
                       <div class="parent-icon"><i class="material-icons-outlined">edit</i>
                       </div>
                       <div class="menu-title">Personalização</span></div>
                   </a>
               </li>
               @endif
               @endif

               @if(Auth::user()->role == 'user' || Auth::user()->role == 'gestor' || Auth::user()->role == 'admin')
               <li class="menu-label">ESTRATÉGICO</li>
               <li>
                   <a href="{{ route('leads.contracts') }}">
                       <div class="parent-icon"><i class="material-icons-outlined">balance</i>
                       </div>
                       <div class="menu-title">Desempenho da <span style="color: #FFFFFF">Jul</span><span style="color: #caad09">IA</span></div>
                   </a>
               </li>
               @endif
               @if(Auth::user()->role == 'user' || Auth::user()->role == 'admin')
               <li>
                   <a href="{{ route('leads.my-contracts') }}">
                       <div class="parent-icon"><i class="material-icons-outlined">receipt_long</i>
                       </div>
                       <div class="menu-title">Contratos da <span style="color: #FFFFFF">Jul</span><span style="color: #caad09">IA</span></div>
                   </a>
               </li>
               <li>
                   <a class="has-arrow" href="javascript:;">
                       <div class="parent-icon"><i class="material-icons-outlined">campaign</i>
                       </div>
                       <div class="menu-title"><span style="color: #FFFFFF">Jul</span><span style="color: #caad09">IA</span> nas Campanhas</div>
                   </a>
                   <ul>
                       <li><a href="{{ route('leads.campaign') }}"><i class="material-icons-outlined">arrow_right</i>Leads/Campanhas</a>
                       </li>
                       <li><a href="{{ route('leads.source-stats') }}"><i class="material-icons-outlined">arrow_right</i>Análise de Campanhas</a>
                       </li>
                   </ul>
               </li>
               <li>
                   <a href="{{ route('crm') }}">
                       <div class="parent-icon"><i class="material-icons-outlined">group</i>
                       </div>
                       <div class="menu-title">CRM</span></div>
                   </a>
               </li>
               @endif

               @if(Auth::user()->role == 'admin')
               <li class="menu-label">ADMINISTRATIVO</li>
               <li>
                   <a class="has-arrow" href="javascript:;">
                       <div class="parent-icon"><i class="material-icons-outlined">smart_toy</i>
                       </div>
                       <div class="menu-title">Agentes <span style="color: #FFFFFF">Jul</span><span style="color: #caad09">IA</span></div>
                   </a>
                   <ul>
                       <li><a href="{{ route('agents.index') }}"><i class="material-icons-outlined">arrow_right</i>Lista de Agentes</a>
                       </li>
                       <li><a href="{{ route('agents.create') }}"><i class="material-icons-outlined">arrow_right</i>Novo Agente</a>
                       </li>
                   </ul>
               <li>
                   <a href="{{ route('arquivos.index') }}">
                       <div class="parent-icon">
                           <i class="material-icons-outlined">description</i>
                       </div>
                       <div class="menu-title">Arquivos</span></div>
                   </a>
               </li>

               @if(Auth::user()->role == 'admin')
               <li>
                   <a href="{{ route('produtos.index') }}">
                       <div class="parent-icon"><i class="material-icons-outlined">inventory_2</i>
                       </div>
                       <div class="menu-title">Produtos</span></div>
                   </a>
               </li>
               @endif
               @endif

               <!--            <li>
                <a class="disabled">
                    <div class="parent-icon" style="color:rgb(106, 107, 107)"><i class="material-icons-outlined">calendar_month</i>
                    </div>
                    <div class="menu-title" style="color:rgb(106, 107, 107)">Agenda <small>(em breve)</small></div>
                </a>
            </li>
            <li>
                <a>
                    <div class="parent-icon" style="color:rgb(106, 107, 107)"><i class="material-icons-outlined">picture_as_pdf</i>
                    </div>
                    <div class="menu-title" style="color:rgb(106, 107, 107)">Documentos <small>(em breve)</small></div>
                </a>
            </li>

            <li class="menu-label">Personalização</li>
            <li>
                <a>
                    <div class="parent-icon" style="color:rgb(106, 107, 107)"><i class="material-icons-outlined">home_work</i>
                    </div>
                    <div class="menu-title" style="color:rgb(106, 107, 107)">Escritório <small>(em breve)</small></div>
                </a>
            </li>
            <li>
                <a>
                    <div class="parent-icon" style="color:rgb(106, 107, 107)"><i class="material-icons-outlined">build</i>
                    </div>
                    <div class="menu-title" style="color:rgb(106, 107, 107)">Funções <small>(em breve)</small></div>
                </a>
            </li>
            <li>
                <a>
                    <div class="parent-icon" style="color:rgb(106, 107, 107)"><i class="material-icons-outlined">psychology</i>
                    </div>
                    <div class="menu-title" style="color:rgb(106, 107, 107)">Treinamento <small>(em breve)</small></div>
                </a>
            </li>

            <li class="menu-label">Administrativo</li>
            <li>
                <a>
                    <div class="parent-icon" style="color:rgb(106, 107, 107)"><i class="material-icons-outlined">hub</i>
                    </div>
                    <div class="menu-title" style="color:rgb(106, 107, 107)">Integrações</div>
                </a>
            </li>
            <li>
                <a>
                    <div class="parent-icon" style="color:rgb(106, 107, 107)"><i class="material-icons-outlined">manage_accounts</i>
                    </div>
                    <div class="menu-title" style="color:rgb(106, 107, 107)">Usuários</div>
                </a>
            </li>
            <li>
                <a>
                    <div class="parent-icon" style="color:rgb(106, 107, 107)"><i class="material-icons-outlined">payments</i>
                    </div>
                    <div class="menu-title" style="color:rgb(106, 107, 107)">Financeiro</div>
                </a>
            </li>
            <li>
                <a>
                    <div class="parent-icon" style="color:rgb(106, 107, 107)"><i class="material-icons-outlined">help_outline</i>
                    </div>
                    <div class="menu-title" style="color:rgb(106, 107, 107)">Ajuda</div>
                </a>
            </li>
            <li>
                <a>
                    <div class="parent-icon" style="color:rgb(106, 107, 107)"><i class="material-icons-outlined">support_agent</i>
                    </div>
                    <div class="menu-title" style="color:rgb(106, 107, 107)">Suporte</div>
                </a>
            </li>
-->
               <li class="menu-label">Profile</li>
               <li>
                   <p class="user-name mb-0 fw-bold">{{ Auth::user()->name }} </p>
               </li>
               <li>
                   <a class="dropdown-item d-flex align-items-center gap-2 py-2" href="javascript:void(0);" onclick="document.getElementById('logout-form').submit()"><i
                           class="material-icons-outlined">power_settings_new</i>Sair</a>
                   <form action="{{ route('logout') }}" method="POST" id="logout-form">
                       @csrf
                   </form>
               </li>


           </ul>
           <!--end navigation-->
       </div>
   </aside>
   <!--end sidebar-->

   <!--
   @if(Auth::user()->role == 'admin')
   <elevenlabs-convai agent-id="VlMBCdociAAewkBM2Kua"></elevenlabs-convai>
   <script src="https://elevenlabs.io/convai-widget/index.js" async type="text/javascript"></script>
   @endif
-->