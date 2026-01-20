<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VoiceCallController;

Route::any('/make-call', [VoiceCallController::class, 'makeCall']);
