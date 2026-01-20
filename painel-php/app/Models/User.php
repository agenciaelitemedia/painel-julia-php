<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use  HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'cod_agent',
        'evo_url',
        'evo_instance',
        'evo_apikey',
        'data_mask',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'data_mask' => 'boolean',
        'cod_agent' => 'integer',
    ];

    /**
     * The default values for attributes.
     *
     * @var array
     */
    protected $attributes = [
        'role' => 'user',
        'data_mask' => false,
        'evo_url' => 'evo001.atendejulia.com.br'
    ];

    /**
     * Check if user is admin
     *
     * @return bool
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user has agent code
     *
     * @return bool
     */
    public function hasAgent(): bool
    {
        return !is_null($this->cod_agent);
    }

    /**
     * Check if user has EVO integration configured
     *
     * @return bool
     */
    public function hasEvoIntegration(): bool
    {
        return !is_null($this->evo_url) &&
            !is_null($this->evo_instance) &&
            !is_null($this->evo_apikey);
    }

    public function produtosCliente()
    {
        return $this->hasMany(ProdutoCliente::class);
    }

    public function personalizacao()
    {
        return $this->hasMany(PersonalizacaoAgente::class);
    }

    public function Arquivos()
    {
        return $this->hasMany(Arquivo::class);
    }
}
