document.addEventListener('DOMContentLoaded', () => {
    const connectForm = document.getElementById('connectForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');
    const errorMessageDiv = document.getElementById('errorMessage');

    // Seleciona os elementos do novo modal
    const pairCodeModal = document.getElementById('pairCodeModal');
    const pairCodeDisplay = document.getElementById('pairCodeDisplay');
    const closeModalBtn = document.getElementById('closeModalBtn');

    connectForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        btnText.textContent = 'Processando...';
        loader.style.display = 'block';
        submitBtn.disabled = true;
        errorMessageDiv.style.display = 'none';

        const token = document.getElementById('token').value;
        const phone = document.getElementById('phone').value;

        try {
            const response = await fetch('api_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ token, phone })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Ocorreu um erro no servidor.');
            }

            if (result.error) {
                throw new Error(result.error);
            }
            
            // Verifica se o 'paircode' existe na resposta
            if (result.instance && result.instance.paircode) {
                pairCodeDisplay.textContent = result.instance.paircode; // Insere o código no elemento h3
                pairCodeModal.style.display = 'flex'; // Exibe o modal
            } else {
                throw new Error('Não foi possível obter o Código de Pareamento. Verifique o token e o telefone. Resposta: ' + JSON.stringify(result));
            }

        } catch (error) {
            errorMessageDiv.textContent = error.message;
            errorMessageDiv.style.display = 'block';
        } finally {
            btnText.textContent = 'Gerar Código de Pareamento';
            loader.style.display = 'none';
            submitBtn.disabled = false;
        }
    });

    // Fecha o modal ao clicar no botão "OK"
    closeModalBtn.addEventListener('click', () => {
        pairCodeModal.style.display = 'none';
        pairCodeDisplay.textContent = ''; // Limpa o código do display
    });
});