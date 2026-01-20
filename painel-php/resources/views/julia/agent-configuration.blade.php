@extends('layouts.app')
@section('title')
    Configuração
@endsection
@section('content')

    <x-page-title title="Configuração" subtitle="Personalize seu Agente [{{ $user->cod_agent }}]" />

    <form action="{{ route('aiagents.personalize.update') }}" method="POST" class="row g-3">
        @csrf
        @method('PUT')


        <div class="row">
            <div class="col-12 col-xl-12">
                <div class="card">
                    <div class="card-body">
                        <figure class="text-center">
                            <blockquote class="blockquote">
                                <p>Informações Básica</p>
                            </blockquote>
                            <figcaption class="blockquote-footer">Personalização básica da sua Assistente Jurídica para o seu Escritório.
                            </figcaption>
                        </figure>
                        <hr>
                        <div class="row">
                            @if(isset($settings['AGENT_NAME']))
                            <div class="col-md-4 pb-4">
                                <label for="AGENT_NAME" class="form-label">Nome do Agente <i
                                    class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Nome para sua agente de IA. O nome padrão é Julia">contact_support</i></label>
                                <div class="position-relative input-icon">
                                    <input type="text" class="form-control" id="AGENT_NAME" name="AGENT_NAME" value="{{ $settings['AGENT_NAME'] }}" placeholder="Julia">
                                    <span class="position-absolute top-50 translate-middle-y"><i
                                            class="material-icons-outlined fs-5">person_outline</i></span>
                                </div>
                                @error('AGENT_NAME')
                                    <div class="alert alert-danger">{{ $message }}</div>
                                @enderror
                            </div>
                            @endif
                            @if(isset($settings['AGENT_WELCOME']))
                            <div class="col-md-4 pb-4">
                                <label for="AGENT_WELCOME" class="form-label">Mensagem de Boas-Vindas <i
                                    class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Como seu agente irá recepcionar seus novos clientes. Capriche na sua mensagem de boas-vindas.">contact_support</i></label>
                                <textarea class="form-control" id="AGENT_WELCOME" name="AGENT_WELCOME" placeholder="Sua mensagem de boas-vidas ..." rows="3">{{ $settings['AGENT_WELCOME'] }}</textarea>
                                @error('AGENT_WELCOME')
                                    <div class="alert alert-danger">{{ $message }}</div>
                                @enderror
                            </div>
                            @endif
                            @if(isset($settings['AGENT_TRANFER']))
                            <div class="col-md-4 pb-4">
                                <label for="AGENT_TRANFER" class="form-label">Mensagem de Finalização <i
                                    class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Mensagem que será enviada no final da conversa da sua assistente com o seu lead.">contact_support</i></label>
                                    <textarea class="form-control" id="AGENT_TRANFER" name="AGENT_TRANFER" placeholder="Informações do endereço..." rows="3">{{ $settings['AGENT_TRANFER'] }}</textarea>
                                @error('AGENT_TRANFER')
                                    <div class="alert alert-danger">{{ $message }}</div>
                                @enderror
                            </div>
                            @endif
                            @if(isset($settings['USING_AUDIO']))
                            <div class="col-md-4 pb-4">
                                <div class="form-check form-switch form-check-success pb-4">
                                    <label for="USING_AUDIO" class="form-label"> </label>
                                    <div class="position-relative input-icon">
                                        <input class="form-check-input" type="checkbox" role="switch" id="USING_AUDIO" name="USING_AUDIO" {{ $settings['USING_AUDIO'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="USING_AUDIO">
                                            Responder Áudio <i
                                            class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Ativa/Desativa  a utilização de voz pela sua assistente jurídica. Se receber mensagem em áudio ela responderá com áudio.">contact_support</i>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            @endif
                            @if(isset($settings['AGENT_SOCIALMEDIA']))
                            <div class="col-md-4 pb-4">
                                <label for="AGENT_SOCIALMEDIA" class="form-label">Dados de Redes Sociais <i
                                    class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Dê informações sobre suas redes sociais.">contact_support</i></label>
                                    <textarea class="form-control" id="AGENT_SOCIALMEDIA" name="AGENT_SOCIALMEDIA" placeholder="Informações do endereço..." rows="3">{{ $settings['AGENT_SOCIALMEDIA'] }}</textarea>
                                @error('AGENT_SOCIALMEDIA')
                                    <div class="alert alert-danger">{{ $message }}</div>
                                @enderror
                            </div>
                            @endif
                            @if(isset($settings['AGENT_ADDRESS']))
                            <div class="col-md-4 pb-4">
                                <label for="AGENT_ADDRESS" class="form-label">Endereço do Escritório <i
                                    class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Informe como a IA informará o endereço do seu escritório.">contact_support</i></label>
                                    <textarea class="form-control" id="AGENT_ADDRESS" name="AGENT_ADDRESS" placeholder="Informações do endereço..." rows="3">{{ $settings['AGENT_ADDRESS'] }}</textarea>
                                @error('AGENT_ADDRESS')
                                    <div class="alert alert-danger">{{ $message }}</div>
                                @enderror
                            </div>
                            @endif
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-body">
                        <figure class="text-center">
                            <blockquote class="blockquote">
                                <p>Recuperação de Leads - FollowUp</p>
                            </blockquote>
                            <figcaption class="blockquote-footer">
                                Sua Assistente Jurídica irá tentar retornar a conversa com seu Lead sempre que ele deixar de responder.
                            </figcaption>
                        </figure>
                        <hr>
                        <div class="row">
                            @if(isset($settings['FOLLOWUP_5MIN_CHECK']))
                            <div class="col-md-4">
                                <div class="form-check form-switch form-check-success pb-4">
                                    <label for="FOLLOWUP_5MIN_CHECK" class="form-label"> </label>
                                    <div class="position-relative input-icon">
                                        <input class="form-check-input" type="checkbox" role="switch" id="FOLLOWUP_5MIN_CHECK" name="FOLLOWUP_5MIN_CHECK" {{ $settings['FOLLOWUP_5MIN_CHECK'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="FOLLOWUP_5MIN_CHECK">
                                            Habilitar Mensagem 01 <i
                                            class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Ativa/Desativa  a primeira mensagem de recuperação do lead após tempo de inatividade definido.">contact_support</i>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-12 pb-4 {{ $settings['FOLLOWUP_5MIN_CHECK'] ? '' : 'd-none' }} FOLLOWUP_5MIN_DIV">
                                    <label for="input13" class="form-label">
                                        Tempo de Inativiade <i
                                        class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Tempo de inatividade do lead, em minutos, para envio da primeira mensagem de FollowUp">contact_support</i></label>
                                    <div class="position-relative input-icon">
                                        <input type="number" class="form-control" id="FOLLOWUP_5MIN_TIME" name="FOLLOWUP_5MIN_TIME" value="{{ $settings['FOLLOWUP_5MIN_TIME'] }}" placeholder="5" style="width: 150px">
                                        <span class="position-absolute top-50 translate-middle-y"><i
                                                class="material-icons-outlined fs-5">watch_later</i></span>
                                    </div>
                                    @error('FOLLOWUP_5MIN_TIME')
                                        <div class="alert alert-danger">{{ $message }}</div>
                                    @enderror
                                </div>
                                <div class="col-md-12 pb-4 {{ $settings['FOLLOWUP_5MIN_CHECK'] ? '' : 'd-none' }} FOLLOWUP_5MIN_DIV">
                                    <label for="{{ $settings['FOLLOWUP_5MIN'] }}" class="form-label">Primeira Mensagem de FollowUp <i
                                        class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Defina a mensagem que a ser enviada no primeiro followup da sua Assistente Jurídica.">contact_support</i></label>
                                        <textarea class="form-control text-left" id="{{ $settings['FOLLOWUP_5MIN'] }}" name="FOLLOWUP_5MIN" placeholder="Mensagem de followup..." rows="3">{{ $settings['FOLLOWUP_5MIN'] }}</textarea>
                                    @error('FOLLOWUP_5MIN')
                                        <div class="alert alert-danger">{{ $message }}</div>
                                    @enderror
                                </div>
                                <div class="form-check form-switch form-check-success pb-4 {{ $settings['FOLLOWUP_5MIN_CHECK'] ? '' : 'd-none' }} FOLLOWUP_5MIN_DIV">
                                    <label for="FOLLOWUP_5MIN_CALL" class="form-label"> </label>
                                    <div class="position-relative input-icon">
                                        <input class="form-check-input" type="checkbox" role="switch" id="FOLLOWUP_5MIN_CALL" name="FOLLOWUP_5MIN_CALL" {{ $settings['FOLLOWUP_5MIN_CALL'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="FOLLOWUP_5MIN_CALL">
                                            1ª Ligação de FollowUp <i
                                            class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Ativa/Desativa  a primeira ligação de recuperação do lead após tempo de inatividade definido.">contact_support</i>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            @endif

                            @if(isset($settings['FOLLOWUP_15MIN_CHECK']))
                            <div class="col-md-4">
                                <div class="form-check form-switch form-check-success pb-4">
                                    <label for="FOLLOWUP_15MIN_CHECK" class="form-label"> </label>
                                    <div class="position-relative input-icon">
                                        <input class="form-check-input" type="checkbox" role="switch" id="FOLLOWUP_15MIN_CHECK" name="FOLLOWUP_15MIN_CHECK" {{ $settings['FOLLOWUP_15MIN_CHECK'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="FOLLOWUP_5MIN_CHECK">
                                            Habilitar Mensagem 02 <i
                                            class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Ativa/Desativa  a segunda mensagem de recuperação do lead após tempo de inatividade definido.">contact_support</i>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-12 pb-4 {{ $settings['FOLLOWUP_15MIN_CHECK'] ? '' : 'd-none' }} FOLLOWUP_15MIN_DIV">
                                    <label for="input13" class="form-label">
                                        Tempo de Inatividade <i
                                        class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Tempo de inatividade do lead, em minutos, para envio da segunda mensagem de FollowUp">contact_support</i></label>
                                    <div class="position-relative input-icon">
                                        <input type="number" class="form-control" id="FOLLOWUP_15MIN_TIME" name="FOLLOWUP_15MIN_TIME" value="{{ $settings['FOLLOWUP_15MIN_TIME'] }}" placeholder="15" style="width: 150px">
                                        <span class="position-absolute top-50 translate-middle-y"><i
                                                class="material-icons-outlined fs-5">watch_later</i></span>
                                    </div>
                                    @error('FOLLOWUP_15MIN_TIME')
                                        <div class="alert alert-danger">{{ $message }}</div>
                                    @enderror
                                </div>
                                <div class="col-md-12 pb-4 {{ $settings['FOLLOWUP_15MIN_CHECK'] ? '' : 'd-none' }} FOLLOWUP_15MIN_DIV">
                                    <label for="{{ $settings['FOLLOWUP_15MIN'] }}" class="form-label">Segunda Mensagem de FollowUp <i
                                        class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Defina a mensagem que a ser enviada no segunda followup da sua Assistente Jurídica.">contact_support</i></label>
                                        <textarea class="form-control" id="{{ $settings['FOLLOWUP_15MIN'] }}" name="FOLLOWUP_15MIN" placeholder="Mensagem de followup..." rows="3">{{ $settings['FOLLOWUP_15MIN'] }}</textarea>
                                    @error('FOLLOWUP_15MIN')
                                        <div class="alert alert-danger">{{ $message }}</div>
                                    @enderror
                                </div>
                                <div class="form-check form-switch form-check-success pb-4 {{ $settings['FOLLOWUP_15MIN_CHECK'] ? '' : 'd-none' }} FOLLOWUP_15MIN_DIV">
                                    <label for="FOLLOWUP_15MIN_CALL" class="form-label"> </label>
                                    <div class="position-relative input-icon">
                                        <input class="form-check-input" type="checkbox" role="switch" id="FOLLOWUP_15MIN_CALL" name="FOLLOWUP_15MIN_CALL" {{ $settings['FOLLOWUP_15MIN_CALL'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="FOLLOWUP_5MIN_CHECK">
                                            2ª Ligação de FollowUp <i
                                            class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Ativa/Desativa  a segunda ligação de recuperação do lead após tempo de inatividade definido.">contact_support</i>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            @endif

                            @if(isset($settings['FOLLOWUP_30MIN_CHECK']))
                            <div class="col-md-4">
                                <div class="form-check form-switch form-check-success pb-4">
                                    <label for="FOLLOWUP_30MIN_CHECK" class="form-label"> </label>
                                    <div class="position-relative input-icon">
                                        <input class="form-check-input" type="checkbox" role="switch" id="FOLLOWUP_30MIN_CHECK" name="FOLLOWUP_30MIN_CHECK" {{ $settings['FOLLOWUP_30MIN_CHECK'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="FOLLOWUP_30MIN_CHECK">
                                            Habilitar Mensagem 03 <i
                                            class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Ativa/Desativa  a terceira mensagem de recuperação do lead após tempo de inatividade definido.">contact_support</i>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-12 pb-4 {{ $settings['FOLLOWUP_30MIN_CHECK'] ? '' : 'd-none' }} FOLLOWUP_30MIN_DIV">
                                    <label for="input13" class="form-label">
                                        Tempo de Inatividade <i
                                        class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Tempo de inatividade do lead, em minutos, para envio da terceira mensagem de FollowUp">contact_support</i></label>
                                    <div class="position-relative input-icon">
                                        <input type="number" class="form-control" id="FOLLOWUP_30MIN_TIME" name="FOLLOWUP_30MIN_TIME" value="{{ $settings['FOLLOWUP_30MIN_TIME'] }}" placeholder="30" style="width: 150px">
                                        <span class="position-absolute top-50 translate-middle-y"><i
                                                class="material-icons-outlined fs-5">watch_later</i></span>
                                    </div>
                                    @error('FOLLOWUP_30MIN_TIME')
                                        <div class="alert alert-danger">{{ $message }}</div>
                                    @enderror
                                </div>
                                <div class="col-md-12 pb-4 {{ $settings['FOLLOWUP_30MIN_CHECK'] ? '' : 'd-none' }} FOLLOWUP_30MIN_DIV">
                                    <label for="{{ $settings['FOLLOWUP_30MIN'] }}" class="form-label">Terceira Mensagem de FollowUp <i
                                        class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Defina a mensagem que a ser enviada no terceiro followup da sua Assistente Jurídica.">contact_support</i></label>
                                        <textarea class="form-control" id="{{ $settings['FOLLOWUP_30MIN'] }}" name="FOLLOWUP_30MIN" placeholder="Mensagem de followup..." rows="3">{{ $settings['FOLLOWUP_30MIN'] }}</textarea>
                                    @error('FOLLOWUP_30MIN')
                                        <div class="alert alert-danger">{{ $message }}</div>
                                    @enderror
                                </div>
                                <div class="form-check form-switch form-check-success pb-4 {{ $settings['FOLLOWUP_30MIN_CHECK'] ? '' : 'd-none' }} FOLLOWUP_30MIN_DIV">
                                    <label for="FOLLOWUP_30MIN_CALL" class="form-label"> </label>
                                    <div class="position-relative input-icon">
                                        <input class="form-check-input" type="checkbox" role="switch" id="FOLLOWUP_30MIN_CALL" name="FOLLOWUP_30MIN_CALL" {{ $settings['FOLLOWUP_30MIN_CALL'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="FOLLOWUP_30MIN_CALL">
                                            3ª Ligação de FollowUp <i
                                            class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Ativa/Desativa  a terceira ligação de recuperação do lead após tempo de inatividade definido.">contact_support</i>
                                        </label>
                                    </div>
                                </div>
                            </div>


                            @endif

                        </div>
                    </div>
                </div>



                <div class="card">
                    <div class="card-body">
                        <figure class="text-center">
                            <blockquote class="blockquote">
                                <p>Notifica Advogado de Contratos</p>
                            </blockquote>
                            <figcaption class="blockquote-footer">
                                Sua Assistente Jurídica irá notificar o advogado sempre que contratos forem gerados, assinados ou excluídos de leads atendidos por ela.
                            </figcaption>
                        </figure>
                        <hr>
                        <div class="row">
                            @if(isset($settings['NOTIFY_DOC_CREATED_CHECK']))
                            <div class="col-md-4">
                                <div class="form-check form-switch form-check-success pb-4">
                                    <label for="NOTIFY_DOC_CREATED_CHECK" class="form-label"> </label>
                                    <div class="position-relative input-icon">
                                        <input class="form-check-input" type="checkbox" role="switch" id="NOTIFY_DOC_CREATED_CHECK" name="NOTIFY_DOC_CREATED_CHECK" {{ $settings['NOTIFY_DOC_CREATED_CHECK'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="NOTIFY_DOC_CREATED_CHECK">
                                            Contrato Gerado <i
                                            class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Ativa/Desativa  a notificação de contratos gerados pela sua assistente jurídica.">contact_support</i>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-8 pb-4 {{ $settings['NOTIFY_DOC_CREATED_CHECK'] ? '' : 'd-none' }} NOTIFY_5MIN_DIV">
                                    <label for="input13" class="form-label">
                                        Número WhatsApp <i
                                        class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Número do WhatsApp que receberá a notificação.">contact_support</i></label>
                                    <div class="position-relative input-icon">
                                        <input type="number" class="form-control" id="NOTIFY_DOC_CREATED" name="NOTIFY_DOC_CREATED" value="{{ $settings['NOTIFY_DOC_CREATED'] }}" placeholder="55+DDD+WhatsApp">
                                        <span class="position-absolute top-50 translate-middle-y"><i
                                                class="material-icons-outlined fs-5">smartphone</i></span>
                                    </div>
                                    @error('NOTIFY_DOC_CREATED')
                                        <div class="alert alert-danger">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            @endif

                            @if(isset($settings['NOTIFY_DOC_SIGNED_CHECK']))
                            <div class="col-md-4">
                                <div class="form-check form-switch form-check-success pb-4">
                                    <label for="NOTIFY_DOC_SIGNED_CHECK" class="form-label"> </label>
                                    <div class="position-relative input-icon">
                                        <input class="form-check-input" type="checkbox" role="switch" id="NOTIFY_DOC_SIGNED_CHECK" name="NOTIFY_DOC_SIGNED_CHECK" {{ $settings['NOTIFY_DOC_SIGNED_CHECK'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="NOTIFY_DOC_SIGNED_CHECK">
                                            Contrato Assinado <i
                                            class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Ativa/Desativa  a notificação de contratos assinado de leads atendidos pela sua assistente jurídica.">contact_support</i>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-8 pb-4 {{ $settings['NOTIFY_DOC_SIGNED_CHECK'] ? '' : 'd-none' }} NOTIFY_15MIN_DIV">
                                    <label for="input13" class="form-label">
                                        Número WhatsApp <i
                                        class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Número do WhatsApp que receberá a notificação.">contact_support</i></label>
                                    <div class="position-relative input-icon">
                                        <input type="number" class="form-control" id="NOTIFY_DOC_SIGNED" name="NOTIFY_DOC_SIGNED" value="{{ $settings['NOTIFY_DOC_SIGNED'] }}" placeholder="55+DDD+WhatsApp">
                                        <span class="position-absolute top-50 translate-middle-y"><i
                                                class="material-icons-outlined fs-5">smartphone</i></span>
                                    </div>
                                    @error('NOTIFY_DOC_SIGNED')
                                        <div class="alert alert-danger">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            @endif
                            @if(isset($settings['NOTIFY_DOC_DELETED_CHECK']))
                            <div class="col-md-4">
                                <div class="form-check form-switch form-check-success pb-4">
                                    <label for="NOTIFY_DOC_DELETED_CHECK" class="form-label"> </label>
                                    <div class="position-relative input-icon">
                                        <input class="form-check-input" type="checkbox" role="switch" id="NOTIFY_DOC_DELETED_CHECK" name="NOTIFY_DOC_DELETED_CHECK" {{ $settings['NOTIFY_DOC_DELETED_CHECK'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="NOTIFY_DOC_DELETED_CHECK">
                                            Contrato Excluído <i
                                            class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Ativa/Desativa  a notificação de contratos deletados de leads atendidos pela sua assistente jurídica.">contact_support</i>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-8 pb-4 {{ $settings['NOTIFY_DOC_DELETED_CHECK'] ? '' : 'd-none' }} NOTIFY_30MIN_DIV">
                                    <label for="input13" class="form-label">
                                        Número WhatsApp <i
                                        class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Número do WhatsApp que receberá a notificação.">contact_support</i></label>
                                    <div class="position-relative input-icon">
                                        <input type="number" class="form-control" id="NOTIFY_DOC_DELETED" name="NOTIFY_DOC_DELETED" value="{{ $settings['NOTIFY_DOC_DELETED'] }}" placeholder="55+DDD+WhatsApp">
                                        <span class="position-absolute top-50 translate-middle-y"><i
                                                class="material-icons-outlined fs-5">smartphone</i></span>
                                    </div>
                                    @error('NOTIFY_DOC_DELETED')
                                        <div class="alert alert-danger">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            @endif

                        </div>
                    </div>
                </div>


                <div class="card">
                    <div class="card-body">
                        <figure class="text-center">
                            <blockquote class="blockquote">
                                <p>Resumos de Atendimentos</p>
                            </blockquote>
                            <figcaption class="blockquote-footer">
                                Sua Assistente Jurídica irá enviar resumo ao final da sua conversa, configure onde quer receber os resumos.
                            </figcaption>
                        </figure>
                        <hr>
                        <div class="row">
                            @if(isset($settings['CHAT_RESUME']))
                            <div class="col-md-3">
                                <div class="form-check form-switch form-check-success">
                                    <label for="CHAT_RESUME" class="form-label"> </label>
                                    <div class="position-relative input-icon">
                                        <input class="form-check-input" type="checkbox" role="switch" id="CHAT_RESUME" name="CHAT_RESUME" {{ $settings['CHAT_RESUME'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="CHAT_RESUME">
                                            <strong>Resumo no Chat</strong> <i
                                            class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Sua assistente irá fazer um resumo que será enviado na própria conversa com seu LEAD.">contact_support</i>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            @endif

                            @if(isset($settings['ONLY_ME_RESUME']))
                            <div class="col-md-3">
                                <div class="form-check form-switch form-check-success">
                                    <label for="ONLY_ME_RESUME" class="form-label"> </label>
                                    <div class="position-relative input-icon">
                                        <input class="form-check-input" type="checkbox" role="switch" id="ONLY_ME_RESUME" name="ONLY_ME_RESUME" {{ $settings['ONLY_ME_RESUME'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="ONLY_ME_RESUME">
                                            <strong>Resumo Privado</strong> <i
                                            class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Sua assistente irá fazer um resumo que será enviado para seu próprio número, mantedo o resumo privado a quem tem acesso as conversa da sua assistente.">contact_support</i>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            @endif

                            @if(isset($settings['NOTIFY_RESUME']))
                            <div class="col-md-3">
                                <div class="form-check form-switch form-check-success pb-4">
                                    <label for="NOTIFY_RESUME" class="form-label"> </label>
                                    <div class="position-relative input-icon">
                                        <input class="form-check-input" type="checkbox" role="switch" id="NOTIFY_RESUME" name="NOTIFY_RESUME" {{ $settings['NOTIFY_RESUME'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="NOTIFY_RESUME">
                                            Resumo de Notificação <i
                                            class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Sua assistente irá fazer um resumo que será enviado para um número de alguém que precise acompanhar o que a sua assistente está atendendo.">contact_support</i>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-10 pb-4 {{ $settings['NOTIFY_RESUME'] ? '' : 'd-none' }} NOTIFY_RESUME_DIV">
                                    <label for="input13" class="form-label">
                                        Número WhatsApp <i
                                        class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Número do WhatsApp que receberá a notificação.">contact_support</i></label>
                                    <div class="position-relative input-icon">
                                        <input type="number" class="form-control" id="NOTIFY_RESUME_NUMERO" name="NOTIFY_RESUME_NUMERO" value="{{ $settings['NOTIFY_RESUME'] }}" placeholder="55+DDD+WhatsApp">
                                        <span class="position-absolute top-50 translate-middle-y"><i
                                                class="material-icons-outlined fs-5">smartphone</i></span>
                                    </div>
                                    @error('NOTIFY_RESUME')
                                        <div class="alert alert-danger">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            @endif

                            
                            <div class="col-md-3">
                                <div class="form-check form-switch form-check-success pb-4">
                                    <label for="NOTIFY_RESUME" class="form-label"> </label>
                                    <div class="position-relative input-icon">
                                        <input class="form-check-input" type="checkbox" role="switch" id="NOTIFY_GROUP" name="NOTIFY_GROUP" {{ $settings['NOTIFY_GROUP'] ? 'checked' : '' }}>
                                        <label class="form-check-label" for="NOTIFY_GROUP">
                                            Resumo no Grupo <i
                                            class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Sua assistente irá fazer um resumo que será enviado para um grupo de WhatsApp.">contact_support</i>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-10 pb-4 {{ $settings['NOTIFY_GROUP'] ? '' : 'd-none' }} NOTIFY_GROUP_DIV">
                                    <label for="input13" class="form-label">
                                        Grupo WhatsApp <i
                                        class="material-icons-outlined fs-5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Grupo do WhatsApp que receberá a notificação.">contact_support</i></label>
                                    <div class="position-relative input-icon">
                                        <select class="form-control" id="NOTIFY_GROUP_NUMERO" name="NOTIFY_GROUP_NUMERO">
                                            <option value="">Selecione um grupo</option>
                                            @foreach($dataGroups as $group)
                                                <option value="{{ $group['id'] }}" {{ $settings['NOTIFY_GROUP'] == $group['id'] ? 'selected' : '' }}>{{ $group['subject'] }}</option>
                                            @endforeach
                                        </select>
                                        <span class="position-absolute top-50 translate-middle-y"><i
                                                class="material-icons-outlined fs-5">group</i></span>
                                    </div>
                                    @error('NOTIFY_GROUP')
                                        <div class="alert alert-danger">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                           

                        </div>
                    </div>
                </div>


            </div>
        </div>

        <div class="row">
                <div class="card ">
                    <div class="card-body text-center">
                            @if(session('success'))
                                <div class="alert alert-success border-0 bg-success alert-dismissible fade show">
                                    <div class="d-flex align-items-center">
                                        <div class="font-35 text-white">
                                            <span class="material-icons-outlined fs-2">check_circle</span>
                                        </div>
                                        <div class="ms-3">
                                            <h6 class="mb-0 text-white">Sucesso</h6>
                                            <div class="text-white">{{ session('success') }}</div>
                                        </div>
                                    </div>
                                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                </div>
                            @endif

                            @if(session('error'))
                                <div class="alert alert-danger">{{ session('error') }}</div>
                                <div class="alert alert-danger border-0 bg-danger alert-dismissible fade show">
                                    <div class="d-flex align-items-center">
                                        <div class="font-35 text-white">
                                            <span class="material-icons-outlined fs-2">report_gmailerrorred</span>
                                        </div>
                                        <div class="ms-3">
                                            <h6 class="mb-0 text-white">Erro</h6>
                                            <div class="text-white">{{ session('error') }}</div>
                                        </div>
                                    </div>
                                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                </div>
                            @endif


                                <button type="submit" class="btn btn-primary px-4 raised d-flex gap-2" id="submitBtn">
                                    <i class="material-icons-outlined">save</i>
                                    <span class="btn-text">Salvar Configurações</span>
                                </button>
                    </div>
                </div>

        </div>
    </form>



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

.spinning {
    animation: spin 1s infinite linear;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>

@endpush

@push('script')

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


        // FOLLOWUP_5MIN_CHECK
        $('#FOLLOWUP_5MIN_CHECK').change(function() {
            if($(this).is(':checked')) {
                $('.FOLLOWUP_5MIN_DIV').removeClass('d-none');
                // Permitir ativar FOLLOWUP_15MIN_CHECK quando FOLLOWUP_5MIN_CHECK está ativo
                $('#FOLLOWUP_15MIN_CHECK').prop('disabled', false);
            } else {
                $('.FOLLOWUP_5MIN_DIV').addClass('d-none');
                // Desativar e ocultar FOLLOWUP_15MIN_CHECK e FOLLOWUP_30MIN_CHECK se FOLLOWUP_5MIN_CHECK for desativado
                $('#FOLLOWUP_15MIN_CHECK').prop('checked', false).prop('disabled', true).change();
                $('#FOLLOWUP_30MIN_CHECK').prop('checked', false).prop('disabled', true).change();
            }
        });

        // FOLLOWUP_15MIN_CHECK
        $('#FOLLOWUP_15MIN_CHECK').change(function() {
            if($(this).is(':checked')) {
                $('.FOLLOWUP_15MIN_DIV').removeClass('d-none');
                // Permitir ativar FOLLOWUP_30MIN_CHECK quando FOLLOWUP_15MIN_CHECK e FOLLOWUP_5MIN_CHECK estão ativos
                if($('#FOLLOWUP_5MIN_CHECK').is(':checked')) {
                    $('#FOLLOWUP_30MIN_CHECK').prop('disabled', false);
                }
            } else {
                $('.FOLLOWUP_15MIN_DIV').addClass('d-none');
                // Desativar e ocultar FOLLOWUP_30MIN_CHECK se FOLLOWUP_15MIN_CHECK for desativado
                $('#FOLLOWUP_30MIN_CHECK').prop('checked', false).prop('disabled', true).change();
            }
        });

        // FOLLOWUP_30MIN_CHECK
        $('#FOLLOWUP_30MIN_CHECK').change(function() {
            if($(this).is(':checked')) {
                $('.FOLLOWUP_30MIN_DIV').removeClass('d-none');
            } else {
                $('.FOLLOWUP_30MIN_DIV').addClass('d-none');
            }
        });

        // Inicialização: Garantir que FOLLOWUP_15MIN_CHECK e FOLLOWUP_30MIN_CHECK estejam desativados no carregamento
        $(document).ready(function() {
            if (!$('#FOLLOWUP_5MIN_CHECK').is(':checked')) {
                $('#FOLLOWUP_15MIN_CHECK').prop('disabled', true);
                $('#FOLLOWUP_30MIN_CHECK').prop('disabled', true);
            } else if (!$('#FOLLOWUP_15MIN_CHECK').is(':checked')) {
                $('#FOLLOWUP_30MIN_CHECK').prop('disabled', true);
            }
        });



        // NOTIFY_DOC_CREATED_CHECK
        $('#NOTIFY_DOC_CREATED_CHECK').change(function() {
            if($(this).is(':checked')) {
                $('.NOTIFY_5MIN_DIV').removeClass('d-none');
            } else {
                $('.NOTIFY_5MIN_DIV').addClass('d-none');
            }
        });

        // NOTIFY_DOC_SIGNED_CHECK
        $('#NOTIFY_DOC_SIGNED_CHECK').change(function() {
            if($(this).is(':checked')) {
                $('.NOTIFY_15MIN_DIV').removeClass('d-none');
            } else {
                $('.NOTIFY_15MIN_DIV').addClass('d-none');
            }
        });

        // NOTIFY_DOC_DELETED_CHECK
        $('#NOTIFY_DOC_DELETED_CHECK').change(function() {
            if($(this).is(':checked')) {
                $('.NOTIFY_30MIN_DIV').removeClass('d-none');
            } else {
                $('.NOTIFY_30MIN_DIV').addClass('d-none');
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
                $('.NOTIFY_RESUME_DIV').removeClass('d-none');
            } else {
                $('.NOTIFY_RESUME_DIV').addClass('d-none');
            }
        });


        $('#NOTIFY_GROUP').change(function() {
            if($(this).is(':checked')) {
                $('.NOTIFY_GROUP_DIV').removeClass('d-none');
            } else {
                $('.NOTIFY_GROUP_DIV').addClass('d-none');
            }
        });

        // Form submission handler
        $('form').on('submit', function() {
            const $btn = $('#submitBtn');
            const $icon = $btn.find('i');
            const $text = $btn.find('.btn-text');

            // Store original content
            $btn.data('original-icon', $icon.text());
            $btn.data('original-text', $text.text());

            // Disable button and show spinner
            $btn.prop('disabled', true);
            $icon.text('sync');
            $icon.addClass('spinning');
            $text.text('Salvando...');

            return true; // Allow form submission to continue
        });
    });

    $(function() {
        $('[data-bs-toggle="tooltip"]').tooltip();
    })

</script>


@endpush
