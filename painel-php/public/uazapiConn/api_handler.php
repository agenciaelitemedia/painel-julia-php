<?php

// Use PHP 8.3 features if needed, for now this is compatible with older versions too
// Set response header to JSON
header('Content-Type: application/json');

// Define API base URL
const API_BASE_URL = 'https://atende-julia.uazapi.com/instance/';

// Check for POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Método não permitido. Use POST.']);
    exit;
}

// Get JSON input from the request body
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($input['token']) || !isset($input['phone']) || empty(trim($input['token'])) || empty(trim($input['phone']))) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Token e telefone são obrigatórios.']);
    exit;
}

$token = trim($input['token']);
$phone = trim($input['phone']);

/**
 * Helper function to execute cURL requests.
 *
 * @param string $url The full URL to call.
 * @param string $token The instance token.
 * @param array|null $postData Data to be sent in the request body.
 * @return array The decoded JSON response and HTTP status code.
 */
function executeCurl(string $url, string $token, ?array $postData = null): array
{
    $ch = curl_init($url);

    $headers = [
        'Accept: application/json',
        'token: ' . $token
    ];

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30); // 30-second timeout

    if ($postData !== null) {
        $payload = json_encode($postData);
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    }
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);

    if ($error) {
        return ['body' => null, 'http_code' => 500, 'error' => "cURL Error: " . $error];
    }

    return ['body' => json_decode($response, true), 'http_code' => $httpCode, 'error' => null];
}

// --- PASSO 1: Tentar desconectar (ignorar erros, como solicitado) ---
// "Fire and forget" - we call it but don't stop if it fails.
executeCurl(API_BASE_URL . 'disconnect', $token);

// --- PASSO 2: Conectar e obter o código ---
$connectData = ['phone' => $phone];
$connectResult = executeCurl(API_BASE_URL . 'connect', $token, $connectData);

// Check for cURL transport errors during connect
if ($connectResult['error']) {
    http_response_code(500);
    echo json_encode(['error' => $connectResult['error']]);
    exit;
}

// Pass the API's response code and body back to the frontend
http_response_code($connectResult['http_code']);
echo json_encode($connectResult['body']);