<?php

namespace App\Http\Middleware;

use App\Models\Agent;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CheckPaymentStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        if (Auth::user()->role != 'admin') {
            $agent = Agent::where('cod_agent', Auth::user()->cod_agent)->first();

            if ($agent) {
                if (!$agent->status) {
                    abort(401);
                } else {
                    return $next($request);
                }
            } else {
                return $next($request);
            }
        } else {
            return $next($request);
        }
    }
}
