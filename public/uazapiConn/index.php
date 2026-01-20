<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conectar WhatsApp</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div class="container">
        <img src="https://ia.atendejulia.com.br/build/images/logo_julia.png" class="logo" alt="" height="70">
        <p>Para conectar a JulIA insira o token da sua instância e o número de telefone.</p>
        
        <form id="connectForm">
            <div class="form-group">
                <label for="token">Token da Instância</label>
                <input type="text" id="token" name="token" required placeholder="Cole seu token aqui">
            </div>
            
            <div class="form-group">
                <label for="phone">Número de Telefone (com DDI e DDD)</label>
                <input type="tel" id="phone" name="phone" required placeholder="Ex: 5511999999999">
            </div>
            
            <button type="submit" id="submitBtn">
                <span class="btn-text">Gerar Código de Pareamento</span>
                <div class="loader" style="display: none;"></div>
            </button>
        </form>
        <div id="errorMessage" class="error-message" style="display: none;"></div>
    </div>

    <!-- Modal para exibir o Código de Pareamento -->
    <div id="pairCodeModal" class="modal">
        <div class="modal-content">
            <h2>Insira o Código no WhatsApp</h2>
            <p>
                No seu celular, vá em <strong>Aparelhos conectados</strong> > 
                <strong>Conectar um aparelho</strong> e selecione 
                <strong>Conectar com número de telefone</strong>.
            </p>
            <h3 id="pairCodeDisplay" class="pair-code"></h3>
            <button id="closeModalBtn">OK</button>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>